/**
 * Port Discovery API Service
 * Handles communication with the backend port discovery endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PortDiscoveryRequest {
  target: string
  port: number
}

export interface CVEInfo {
  cve_id: string
  summary: string
  severity: string
  cvss_score?: number
  published: string
  modified: string
  source: string
}

export interface PortResults {
  port_state: string
  service_name: string
  service_version: string
  service_product: string
  service_extrainfo: string
  port_info: any
  cves: CVEInfo[]
}

export interface PortDiscoveryData {
  target: string
  port: number
  timestamp: string
  scan_status: string
  results: PortResults
  error?: string
}

export interface SecurityAssessment {
  risk_level: string
  vulnerabilities_found: number
  exploitable: boolean
  recommendations: string[]
}

export interface CVESummary {
  cve_id: string
  severity: string
  description: string
  exploitable: boolean
}

export interface TechnicalDetails {
  port: number
  protocol: string
  service: string
  version: string
}

export interface GPTAnalysis {
  port_status: string
  service_detected: string
  security_assessment: SecurityAssessment
  cve_summary: CVESummary[]
  technical_details: TechnicalDetails
  next_steps: string[]
  analysis_timestamp: string
  status: string
  message?: string
  raw_response?: string
  fallback_analysis?: any
}

export interface PortDiscoveryResponse {
  status: string
  message: string
  data: PortDiscoveryData
  json_result: GPTAnalysis
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

/**
 * Start port discovery scan
 */
export async function startPortDiscovery(
  target: string,
  port: number
): Promise<PortDiscoveryResponse> {
  const token = getAuthToken()

  if (!token) {
    // Continue without token for port discovery (no authentication required)
  }

  const requestBody: PortDiscoveryRequest = {
    target,
    port
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/scanning/port-discovery`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    const data: PortDiscoveryResponse = await response.json()
    return data
  } catch (error) {
    console.error('Port discovery API error:', error)
    throw error
  }
}