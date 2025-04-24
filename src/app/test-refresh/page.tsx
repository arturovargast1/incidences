'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { getKeycloakToken, decodeJwtToken, refreshKeycloakToken } from '@/lib/keycloak';
import { getToken } from '@/lib/auth';
import { manualRefreshTokens } from '@/lib/tokenRefreshManager';

export default function TestTokenRefresh() {
  const [keycloakToken, setKeycloakToken] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [keycloakDecodedToken, setKeycloakDecodedToken] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const router = useRouter();
  
  // Get token expiration info
  const [expirationInfo, setExpirationInfo] = useState<{
    expiresAt: number | null;
    remainingTime: number | null;
  }>({
    expiresAt: null,
    remainingTime: null,
  });

  // Update tokens and expiration data
  const updateTokens = () => {
    const kcToken = getKeycloakToken();
    const curToken = getToken();
    setKeycloakToken(kcToken);
    setCurrentToken(curToken);
    
    // If we have a Keycloak token, decode it
    if (kcToken) {
      try {
        const decoded = decodeJwtToken(kcToken);
        setKeycloakDecodedToken(decoded);
      } catch (err) {
        console.error('Failed to decode token:', err);
        setKeycloakDecodedToken(null);
      }
    } else {
      setKeycloakDecodedToken(null);
    }
    
    // Get expiration info
    const expiresAtStr = localStorage.getItem('keycloak_token_expires_at');
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      const remainingTime = Math.max(0, expiresAt - now);
      
      setExpirationInfo({
        expiresAt,
        remainingTime,
      });
    } else {
      setExpirationInfo({
        expiresAt: null,
        remainingTime: null,
      });
    }
  };
  
  // Set up interval to update tokens and expiration data
  useEffect(() => {
    // Initial update
    updateTokens();
    
    // Update every second to show countdown
    const intervalId = setInterval(() => {
      updateTokens();
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Format token for display (show first and last 10 chars)
  const formatToken = (token: string | null): string => {
    if (!token) return 'No token found';
    if (token.length <= 25) return token;
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  };
  
  // Format remaining time as mm:ss
  const formatRemainingTime = (ms: number | null): string => {
    if (ms === null) return '00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format date
  const formatDate = (timestamp: number | null): string => {
    if (timestamp === null) return 'No expiration time';
    return new Date(timestamp).toLocaleString();
  };
  
  // Handle manual token refresh
  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);
    
    try {
      // Using the manual refresh function from tokenRefreshManager
      await manualRefreshTokens.keycloak();
      setRefreshResult('Token refreshed successfully');
      
      // Update tokens
      updateTokens();
    } catch (error) {
      setRefreshResult(`Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Token Refresh Test</h1>
          
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Keycloak Token Status</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${keycloakToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">Keycloak Token:</span>
                </div>
                <div className="mt-1 text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                  {formatToken(keycloakToken)}
                </div>
              </div>
              
              {keycloakToken && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Expires At:</p>
                      <p className="text-sm text-gray-600">{formatDate(expirationInfo.expiresAt)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Time Remaining:</p>
                      <p className={`text-xl font-mono ${
                        expirationInfo.remainingTime && expirationInfo.remainingTime < 60000 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatRemainingTime(expirationInfo.remainingTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">Token Information:</p>
                    <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 rounded font-mono text-xs">
                      <pre>{JSON.stringify(keycloakDecodedToken, null, 2)}</pre>
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <button
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    isRefreshing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRefreshing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    'Manually Refresh Token'
                  )}
                </button>
                
                {refreshResult && (
                  <div className={`mt-3 p-2 rounded ${
                    refreshResult.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {refreshResult}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">How Token Refresh Works</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                This implementation uses multiple strategies to keep the Keycloak token valid:
              </p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <span className="font-medium">Proactive Refresh:</span> The system automatically refreshes tokens 60 seconds before they expire.
                </li>
                <li>
                  <span className="font-medium">Reactive Refresh:</span> If an API call detects an expired token, it triggers a refresh.
                </li>
                <li>
                  <span className="font-medium">Resume Detection:</span> When the application regains focus or visibility, it checks token validity.
                </li>
                <li>
                  <span className="font-medium">Background Timer:</span> A periodic check runs every 30 seconds as a safety measure.
                </li>
              </ol>
              
              <p>
                The refresh token (30-minute lifespan) is used to obtain new access tokens (5-minute lifespan) without requiring the user to re-enter credentials.
              </p>
              
              <p className="bg-yellow-100 p-3 rounded text-yellow-800 border border-yellow-200">
                <strong>Note:</strong> If the 30-minute refresh token expires, the user will need to log in again. The system doesn&apos;t currently implement automatic re-login.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
