/**
 * Token Refresh Manager
 * 
 * This module handles automatic token refreshing to ensure tokens don't expire
 * during active application use.
 */

import { refreshKeycloakToken, getKeycloakToken } from './keycloak';

// Timer Ids
let keycloakRefreshTimerId: number | null = null;

// Configuration
const TOKEN_REFRESH_SAFETY_MARGIN = 60; // Refresh token 60 seconds before expiry
const MIN_CHECK_INTERVAL = 30000; // Check token status every 30 seconds at minimum

/**
 * Start the token refresh manager
 * This sets up periodic token checks and refreshes them before expiry
 */
export function startTokenRefreshManager(): void {
  console.log('Starting token refresh manager...');
  // Stop any existing refresh cycles
  stopTokenRefreshManager();
  
  // Start the refresh cycles
  scheduleKeycloakRefresh();
  
  // Set a periodic check just to be safe
  setInterval(checkAndRefreshTokens, MIN_CHECK_INTERVAL);
}

/**
 * Stop all token refresh timers
 */
export function stopTokenRefreshManager(): void {
  if (keycloakRefreshTimerId !== null) {
    clearTimeout(keycloakRefreshTimerId);
    keycloakRefreshTimerId = null;
  }
}

/**
 * Schedule the next Keycloak token refresh based on token expiration
 */
function scheduleKeycloakRefresh(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if we have a token to refresh
    if (!getKeycloakToken()) return;
    
    const expiresAtStr = localStorage.getItem('keycloak_token_expires_at');
    if (!expiresAtStr) return;
    
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    
    // Calculate when to refresh (token expiry minus safety margin)
    const refreshAt = expiresAt - (TOKEN_REFRESH_SAFETY_MARGIN * 1000);
    const timeUntilRefresh = Math.max(refreshAt - now, 0);
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or close to expiry - refresh immediately
      refreshKeycloakTokenAndReschedule();
    } else if (timeUntilRefresh < MIN_CHECK_INTERVAL) {
      // If it's very close to expiry, refresh within the minimum interval
      console.log(`Keycloak token will be refreshed in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      keycloakRefreshTimerId = window.setTimeout(refreshKeycloakTokenAndReschedule, timeUntilRefresh);
    } else {
      // Schedule refresh at the appropriate time
      console.log(`Keycloak token will be refreshed in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      keycloakRefreshTimerId = window.setTimeout(refreshKeycloakTokenAndReschedule, timeUntilRefresh);
    }
  } catch (error) {
    console.error('Error scheduling Keycloak token refresh:', error);
  }
}

/**
 * Refresh the Keycloak token and schedule the next refresh
 */
async function refreshKeycloakTokenAndReschedule(): Promise<void> {
  try {
    console.log('Proactively refreshing Keycloak token...');
    const newToken = await refreshKeycloakToken();
    
    if (newToken) {
      console.log('Keycloak token refreshed successfully');
    } else {
      console.warn('Failed to refresh Keycloak token');
    }
  } catch (error) {
    console.error('Error refreshing Keycloak token:', error);
  } finally {
    // Schedule the next refresh regardless of success/failure
    scheduleKeycloakRefresh();
  }
}

/**
 * Check token status and refresh if needed
 */
function checkAndRefreshTokens(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Check Keycloak token
    const expiresAtStr = localStorage.getItem('keycloak_token_expires_at');
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      
      // If token expires soon, refresh it
      if (expiresAt - now < (TOKEN_REFRESH_SAFETY_MARGIN * 1000)) {
        console.log('Token expires soon, refreshing...');
        refreshKeycloakTokenAndReschedule();
      }
    }
  } catch (error) {
    console.error('Error in token check cycle:', error);
  }
}

/**
 * Check if tokens need refresh and trigger refresh if needed
 * Call this when returning from background/sleep
 */
export function checkTokensOnResume(): void {
  console.log('App resumed, checking token status...');
  checkAndRefreshTokens();
}

// Expose a way to manually trigger token refresh when needed
export const manualRefreshTokens = {
  keycloak: refreshKeycloakTokenAndReschedule
};
