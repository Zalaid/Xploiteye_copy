interface ScannedService {
  ip: string;
  port: number;
  service: string;
  version?: string;
  cves?: string[];
  severity?: string;
  description?: string;
  impact?: string;
  cve_id?: string;
  cvss_score?: number;
}

interface StartExploitationRequest {
  target: string;
  port: number;
  service: string;
  version: string;
  cve_ids?: string[];
}

interface StartExploitationResponse {
  status: string;
  exploitation_id: string;
  message: string;
  target?: string;
  port?: number;
  service?: string;
}

/**
 * Start exploitation on a service via backend API
 */
export async function startExploitation(
  service: ScannedService
): Promise<StartExploitationResponse> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    const error = '❌ No authentication token found - Please log in first';
    console.error('[RED-AGENT API]', error);
    throw new Error(error);
  }

  const request: StartExploitationRequest = {
    target: service.ip,
    port: service.port,
    service: service.service,
    version: service.version || 'Unknown',
    cve_ids: service.cves || []
  };

  // Use test endpoint if no valid token, otherwise use authenticated endpoint
  const useTestEndpoint = !token || token.length < 10;
  const endpoint = useTestEndpoint ? '/api/red-agent/test-start' : '/api/red-agent/start';
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  if (useTestEndpoint) {
    console.warn('⚠️ [RED-AGENT API] Using TEST endpoint (no valid token)');
  }

  console.log('🚀 [RED-AGENT API] Starting exploitation');
  console.log('📡 API URL:', apiUrl);
  console.log('📡 Token exists:', !!token);
  console.log('📡 Request payload:', JSON.stringify(request, null, 2));

  try {
    console.log('📡 Sending request to:', apiUrl);

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Only add auth header if using authenticated endpoint
    if (!useTestEndpoint && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('📡 Fetch headers:', headers);
    console.log('📡 Fetch body:', JSON.stringify(request));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    console.log('📡 Fetch completed, response object exists:', !!response);

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      }
    });

    let responseData: any;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.warn('Response is not JSON:', text);
        responseData = text;
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      const fallbackText = await response.text();
      console.log('Fallback response text:', fallbackText);
      throw new Error(`Failed to parse API response: ${parseError}`);
    }

    console.log('📡 Response data type:', typeof responseData);
    console.log('📡 Response data:', JSON.stringify(responseData));

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      if (typeof responseData === 'object' && responseData?.detail) {
        errorMsg = responseData.detail;
      } else if (typeof responseData === 'string') {
        errorMsg = responseData;
      }
      throw new Error(`API returned ${response.status}: ${errorMsg}`);
    }

    if (!responseData) {
      throw new Error('Server returned empty response');
    }

    // Make sure it's a valid object
    if (typeof responseData !== 'object') {
      throw new Error(`Invalid response type: expected object, got ${typeof responseData}`);
    }

    console.log('✅ [RED-AGENT API] Success! Exploitation ID:', responseData.exploitation_id);
    return responseData as StartExploitationResponse;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ [RED-AGENT API] Complete error:', {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      apiUrl,
      token: token ? 'present' : 'missing'
    });
    throw error;
  }
}

/**
 * Get exploitation status
 */
export async function getExploitationStatus(exploitationId: string): Promise<any> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/red-agent/status/${exploitationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ [RED-AGENT API] Error getting status:', error);
    throw error;
  }
}

/**
 * Stop exploitation
 */
export async function stopExploitation(exploitationId: string): Promise<any> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/red-agent/stop/${exploitationId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ [RED-AGENT API] Error stopping exploitation:', error);
    throw error;
  }
}
