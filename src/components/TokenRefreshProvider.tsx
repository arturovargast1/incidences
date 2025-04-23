'use client';

import { useEffect } from 'react';
import { startTokenRefreshManager, checkTokensOnResume } from '@/lib/tokenRefreshManager';

/**
 * Provider component that initializes and manages the token refresh system
 * This should be mounted once at the application root level
 */
export default function TokenRefreshProvider() {
  useEffect(() => {
    // Initialize token refresh manager
    startTokenRefreshManager();
    
    // Add event listeners for app visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App visibility changed to visible, checking tokens...');
        checkTokensOnResume();
      }
    };
    
    // Check tokens when window regains focus
    const handleFocus = () => {
      console.log('Window focus gained, checking tokens...');
      checkTokensOnResume();
    };
    
    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
