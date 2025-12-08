import { useState } from 'react';

/**
 * Backend Communication Test Component
 * Tests if frontend can communicate with backend API
 */
export const BackendTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setResult('Testing connection...');

    try {
      // Test 1: Check if backend is accessible
      const backendCheck = await fetch('http://localhost:8000/api/products/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (backendCheck.ok) {
        setResult('✅ Backend is connected and responding!\n\nBackend URL: http://localhost:8000\nFrontend URL: http://localhost:8081 (or 5173)');
      } else {
        setResult(`❌ Backend responded with status: ${backendCheck.status}`);
      }
    } catch (error) {
      setResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure:\n1. Backend is running: python manage.py runserver\n2. Port 8000 is not blocked\n3. CORS is enabled in settings.py`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Backend Communication Test</h2>
      <button 
        onClick={testBackendConnection} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      <pre style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}>
        {result}
      </pre>
    </div>
  );
};

export default BackendTest;
