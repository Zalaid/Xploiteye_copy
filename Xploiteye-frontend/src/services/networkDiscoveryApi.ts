/**
 * Network Discovery API Service
 * Handles communication with the backend network discovery endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface NetworkDiscoveryRequest {
  network_range?: string // e.g., "192.168.1.0/24" or auto-detect
}

export interface Device {
  ip: string
  mac: string | null
  status: string
  hostname: string | null
  vendor: string
  discovery_method: string
}

export interface NetworkDiscoveryData {
  network_range: string
  timestamp: string
  scan_status: string
  devices: Device[]
  summary: {
    total_devices: number
    online_devices: number
    discovery_methods: string[]
  }
}

export interface NetworkDiscoveryResponse {
  status: string
  message: string
  data: NetworkDiscoveryData
  json_result: any // GPT analysis results
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

/**
 * Start network discovery scan
 */
export async function startNetworkDiscovery(
  networkRange?: string
): Promise<NetworkDiscoveryResponse> {
  const token = getAuthToken()

  if (!token) {
    // Continue without token for network discovery (no authentication required)
  }

  const requestBody: NetworkDiscoveryRequest = {}
  if (networkRange) {
    requestBody.network_range = networkRange
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/scanning/network-discovery`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    const data: NetworkDiscoveryResponse = await response.json()
    return data
  } catch (error) {
    console.error('Network discovery API error:', error)
    throw error
  }
}

/**
 * Check if target IP is reachable (existing functionality)
 */
export async function checkIPReachability(target: string): Promise<{
  is_reachable: boolean
  target: string
  message: string
}> {
  const token = getAuthToken()

  if (!token) {
    throw new Error('No authentication token found')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scanning/check-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ target }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('IP check API error:', error)
    throw error
  }
}