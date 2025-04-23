'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import KeycloakStatus from '@/components/KeycloakStatus';
import { testKeycloakIntegration } from '@/lib/api';
import { getKeycloakToken } from '@/lib/keycloak';
import { getToken } from '@/lib/auth';

export default function TestKeycloakIntegration() {
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const router = useRouter();

  // Check if we have both tokens
  const [tokensAvailable, setTokensAvailable] = useState<{
    current: boolean;
    keycloak: boolean;
  }>({
    current: false,
    keycloak: false,
  });

  useEffect(() => {
    // Check if both tokens are available
    const currentToken = getToken();
    const keycloakToken = getKeycloakToken();
    
    setTokensAvailable({
      current: !!currentToken,
      keycloak: !!keycloakToken,
    });
  }, []);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      const results = await testKeycloakIntegration();
      setTestResults(results);
      setHasRun(true);
    } catch (err: any) {
      console.error('Test failed:', err);
      setError(err.message || 'Test failed with unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Format JSON for display
  const formatJson = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Keycloak Integration Test</h1>
          
          {/* Current Authentication Status */}
          <div className="mb-8">
            <KeycloakStatus />
          </div>
          
          {/* Test Actions */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Endpoint with Dual Authentication</h2>
            <p className="mb-4">
              This test will make a request to the <code className="px-2 py-1 bg-gray-100 rounded">/incidence/cardsadmin</code> endpoint 
              with both authentication tokens:
            </p>
            <ul className="list-disc list-inside mb-6 ml-4">
              <li className="mb-2">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${tokensAvailable.current ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-semibold">Current Token:</span> {tokensAvailable.current ? 'Available' : 'Missing'}
              </li>
              <li>
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${tokensAvailable.keycloak ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-semibold">Keycloak Token:</span> {tokensAvailable.keycloak ? 'Available' : 'Missing'}
              </li>
            </ul>
            
            <button
              onClick={runTest}
              disabled={loading || (!tokensAvailable.current || !tokensAvailable.keycloak)}
              className={`px-4 py-2 rounded-lg font-medium text-white flex items-center ${
                (!tokensAvailable.current || !tokensAvailable.keycloak)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Test...
                </>
              ) : (
                'Run Integration Test'
              )}
            </button>
            
            {!tokensAvailable.current || !tokensAvailable.keycloak ? (
              <p className="mt-4 text-red-600">
                {!tokensAvailable.current && !tokensAvailable.keycloak
                  ? 'Both authentication tokens are missing. Please log in first.'
                  : !tokensAvailable.current
                  ? 'Current token is missing. Please log in first.'
                  : 'Keycloak token is missing. Please log in first.'}
              </p>
            ) : null}
          </div>
          
          {/* Test Results */}
          {hasRun && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              
              {error ? (
                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium">Test failed: {error}</span>
                  </div>
                </div>
              ) : testResults && (
                <div>
                  <div className={`p-4 mb-4 rounded-lg ${testResults.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        {testResults.success ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        ) : (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                        )}
                      </svg>
                      <span className="font-medium">{testResults.message}</span>
                    </div>
                  </div>
                  
                  {testResults.data && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Response:</h3>
                      <pre className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-96 text-sm">{formatJson(testResults.data)}</pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={runTest}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 mr-4"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    'Run Test Again'
                  )}
                </button>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
          
          {/* Request Documentation */}
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">CURL Equivalent</h2>
            <p className="mb-4">
              This test is equivalent to the following CURL command:
            </p>
            <pre className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm">
{`curl --location 'https://apiv2.dev.t1envios.com/incidence/cardsadmin' \\
--header 'token: ${tokensAvailable.keycloak ? "KEYCLOAK_TOKEN" : "<missing>"}' \\
--header 'Authorization: Bearer ${tokensAvailable.current ? "CURRENT_TOKEN" : "<missing>"}'`}
            </pre>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
