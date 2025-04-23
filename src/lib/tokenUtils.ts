/**
 * Utility functions for handling token-related operations
 */
import { getToken } from './auth';
import { getKeycloakToken, refreshKeycloakToken } from './keycloak';

/**
 * Checks if the API response indicates a token issue and sets the global flag
 * @param response - The API response object
 * @returns true if there's a token issue, false otherwise
 */
export function checkTokenIssue(response: any): boolean {
  // Check for common token error patterns in API responses
  const hasTokenIssue = 
    (response?.error?.code === 401) || 
    (response?.error?.message?.toLowerCase().includes('token')) ||
    (response?.status === 401) ||
    (response?.message?.toLowerCase().includes('unauthorized')) ||
    (response?.message?.toLowerCase().includes('token'));

  // If there's a token issue, set the global flag
  if (hasTokenIssue && typeof window !== 'undefined') {
    window.tokenHasIssues = true;
    
    // Check if we need to attempt refreshing the Keycloak token
    const currentToken = getToken();
    const keycloakToken = getKeycloakToken();
    
    if (keycloakToken) {
      console.log('Token issue detected, attempting to refresh Keycloak token');
      // Attempt to refresh the token in the background
      refreshKeycloakToken().catch(e => {
        console.error('Failed to refresh Keycloak token:', e);
      });
    }
  }

  return hasTokenIssue;
}

/**
 * Resets the token issue flag
 */
export function resetTokenIssue(): void {
  if (typeof window !== 'undefined') {
    window.tokenHasIssues = false;
  }
}

/**
 * Example of how to use the token check in API calls
 * @param url - The API endpoint URL
 * @returns The API response
 */
export async function fetchWithTokenCheck(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if the response indicates a token issue
    checkTokenIssue(data);
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Check if the error indicates a token issue
    if (error instanceof Error) {
      checkTokenIssue({ message: error.message });
    }
    
    throw error;
  }
}
