'use client';

import { useState, useEffect } from 'react';
import { getKeycloakToken } from '@/lib/keycloak';
import { getToken } from '@/lib/auth';

export default function KeycloakStatus() {
  const [keycloakToken, setKeycloakToken] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for tokens
    const kcToken = getKeycloakToken();
    const curToken = getToken();
    
    setKeycloakToken(kcToken);
    setCurrentToken(curToken);
    
    // Set up interval to check token status
    const intervalId = setInterval(() => {
      setKeycloakToken(getKeycloakToken());
      setCurrentToken(getToken());
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Format token for display (show first and last 10 chars)
  const formatToken = (token: string | null): string => {
    if (!token) return 'No token found';
    if (token.length <= 25) return token;
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Token Status</h2>
      
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
        
        <div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${currentToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Current System Token:</span>
          </div>
          <div className="mt-1 text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded overflow-x-auto">
            {formatToken(currentToken)}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Authentication status: 
          <span className={`font-semibold ${keycloakToken || currentToken ? 'text-green-600' : 'text-red-600'}`}>
            {keycloakToken || currentToken ? ' Authenticated' : ' Not authenticated'}
          </span>
        </p>
        <p className="mt-1">
          Both tokens required for full functionality. Showing partial data for security.
        </p>
      </div>
    </div>
  );
}
