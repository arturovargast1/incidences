/**
 * Utility functions for Keycloak authentication integration
 */

// Keycloak server URL and realm configuration
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://incidencias-kc.dev.t1envios.com';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'incidencias';
const KEYCLOAK_ADMIN_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_ADMIN_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'back-service-incidents';
const KEYCLOAK_CLIENT_SECRET = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || 'MUBVY1TDs12thaZvyWSO4pqBE5A2K5rb';

// Types for Keycloak responses
interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

interface KeycloakUserCredential {
  type: string;
  value: string;
  temporary: boolean;
}

interface KeycloakUserRequest {
  username: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  credentials: KeycloakUserCredential[];
}

/**
 * Gets an admin token for Keycloak administration operations
 * @returns Admin token for Keycloak operations
 */
export async function getKeycloakAdminToken(): Promise<string> {
  try {
    const adminTokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_ADMIN_REALM}/protocol/openid-connect/token`;
    
    const formData = new URLSearchParams();
    formData.append('client_id', 'admin-cli');
    formData.append('username', 'desarrollo@t1envios.com');
    formData.append('password', 'T1envios#2024');
    formData.append('grant_type', 'password');
    
    const response = await fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get Keycloak admin token:', errorText);
      throw new Error(`Error obtaining Keycloak admin token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as KeycloakTokenResponse;
    return data.access_token;
  } catch (error) {
    console.error('Error in getKeycloakAdminToken:', error);
    throw error;
  }
}

/**
 * Creates a user in Keycloak
 * @param email User email (also used as username)
 * @param password User password
 * @param firstName User's first name
 * @param lastName User's last name
 * @returns True if user was created successfully
 */
export async function createKeycloakUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  try {
    // Get admin token first
    const adminToken = await getKeycloakAdminToken();
    
    const createUserUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`;
    
    const userData: KeycloakUserRequest = {
      username: email,
      email: email,
      enabled: true,
      emailVerified: true,
      firstName: firstName,
      lastName: lastName,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false
        }
      ]
    };
    
    const response = await fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      // If it's a 409 Conflict, the user might already exist - we can consider this success
      if (response.status === 409) {
        console.warn('User already exists in Keycloak:', email);
        return true;
      }
      
      const errorText = await response.text();
      console.error('Failed to create Keycloak user:', errorText);
      throw new Error(`Error creating Keycloak user: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error in createKeycloakUser:', error);
    throw error;
  }
}

/**
 * Logs in with Keycloak and returns tokens
 * @param email User email
 * @param password User password
 * @returns Keycloak token response
 */
export async function keycloakLogin(email: string, password: string): Promise<KeycloakTokenResponse> {
  try {
    console.log(`Attempting Keycloak login for: ${email} with provided password`);
    const loginUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('client_id', KEYCLOAK_CLIENT_ID);
    formData.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    formData.append('username', email);
    formData.append('password', password); // Using the user-provided password directly
    formData.append('grant_type', 'password');
    
    console.log('Login request URL:', loginUrl);
    console.log('Login parameters (without password):', 
      `client_id=${KEYCLOAK_CLIENT_ID}, client_secret=***, username=${email}, grant_type=password`);
    
    // Debug: Show the exact form data being sent (without the password)
    const debugFormData = new URLSearchParams();
    debugFormData.append('client_id', KEYCLOAK_CLIENT_ID);
    debugFormData.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    debugFormData.append('username', email);
    debugFormData.append('password', '***HIDDEN***');
    debugFormData.append('grant_type', 'password');
    console.log('Form data string being sent:', debugFormData.toString());
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to login with Keycloak:', errorText);
      
      // Try to parse the error response
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error === 'invalid_grant' && errorData.error_description === 'Invalid user credentials') {
          throw new Error(`Error logging in with Keycloak: Invalid username or password. Please check your credentials and try again.`);
        }
      } catch (parseError) {
        // If we can't parse the error, just use the original text
      }
      
      throw new Error(`Error logging in with Keycloak: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as KeycloakTokenResponse;
    console.log('Keycloak login successful, token received');
    
    // Store the Keycloak token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('keycloak_token', data.access_token);
      localStorage.setItem('keycloak_refresh_token', data.refresh_token);
      
      // Store token expiration time
      const expiresAt = Date.now() + (data.expires_in * 1000);
      localStorage.setItem('keycloak_token_expires_at', expiresAt.toString());
    }
    
    return data;
  } catch (error) {
    console.error('Error in keycloakLogin:', error);
    throw error;
  }
}

/**
 * Gets the current Keycloak token from localStorage
 * @returns Keycloak token or null if not authenticated
 */
export function getKeycloakToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('keycloak_token');
    
    // Check if token exists and is not expired
    if (token) {
      const expiresAtStr = localStorage.getItem('keycloak_token_expires_at');
      if (expiresAtStr) {
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Date.now() >= expiresAt) {
          // Token expired, should trigger refresh
          console.warn('Keycloak token expired');
          
          // Attempt to refresh the token in the background
          // Note: We don't return the refreshed token directly to avoid
          // blocking the current operation
          refreshKeycloakToken().catch(e => {
            console.error('Failed to refresh expired Keycloak token:', e);
          });
          
          // Remove the expired token
          localStorage.removeItem('keycloak_token');
          return null;
        }
      }
      
      return token;
    }
  }
  
  return null;
}

/**
 * Decodes a JWT token and returns payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwtToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Refreshes the Keycloak token if needed
 * @returns Fresh Keycloak token or null if refresh failed
 */
export async function refreshKeycloakToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem('keycloak_refresh_token');
  if (!refreshToken) return null;

  try {
    const refreshUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
    
    const formData = new URLSearchParams();
    formData.append('client_id', KEYCLOAK_CLIENT_ID);
    formData.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      // If refresh fails, clear tokens and return null
      localStorage.removeItem('keycloak_token');
      localStorage.removeItem('keycloak_refresh_token');
      localStorage.removeItem('keycloak_token_expires_at');
      return null;
    }

    const data = await response.json() as KeycloakTokenResponse;
    
    // Update stored tokens
    localStorage.setItem('keycloak_token', data.access_token);
    localStorage.setItem('keycloak_refresh_token', data.refresh_token);
    
    // Update expiration time
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem('keycloak_token_expires_at', expiresAt.toString());
    
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Keycloak token:', error);
    return null;
  }
}

/**
 * Converts Keycloak user profile to application User format
 * @param keycloakProfile Keycloak user profile
 * @returns User object in application format
 */
export function mapKeycloakUserToAppUser(keycloakProfile: any): any {
  return {
    user_id: keycloakProfile.sub,
    email: keycloakProfile.email || '',
    first_name: keycloakProfile.given_name || '',
    last_name: keycloakProfile.family_name || '',
    job_position: keycloakProfile.job_position || '',
    company: keycloakProfile.company || '',
    role: keycloakProfile.realm_access?.roles?.includes('admin') ? 'admin' : 'standard',
    created_at: '',
    active: true
  };
}
