/**
 * DVWA Scanner API Service
 * Handles communication with the backend DVWA scanner endpoint
 */

export interface DVWAVulnerability {
  name: string
  path: string
  type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  status: string
}

export interface SeverityBreakdown {
  CRITICAL: number
  HIGH: number
  MEDIUM: number
  LOW: number
}

export interface DVWAScanResult {
  scan_id: string
  target: string
  timestamp: string
  total_vulnerabilities: number
  vulnerabilities: DVWAVulnerability[]
  severity_breakdown: SeverityBreakdown
  scan_duration: number
  status: string
}

export interface DVWAScanResponse {
  scan_id: string
  status: string
  message: string
  data: DVWAScanResult | null
}

export interface DVWAHealthResponse {
  target: string
  accessible: boolean
  status_code: number | null
  message: string
}

class DVWAApiService {
  private baseUrl = '/api/dvwa'
  private apiCall: any = null

  setApiCall(apiCall: any) {
    this.apiCall = apiCall
  }

  /**
   * Start a DVWA scan
   */
  async startDVWAScan(
    target: string = 'http://192.168.0.176/dvwa',
    labEnvironment: string = 'dvwa'
  ): Promise<DVWAScanResponse> {
    try {
      if (!this.apiCall) {
        throw new Error('API call method not initialized. Please call setApiCall first.')
      }

      console.log(`🔍 [DVWA] Starting scan on target: ${target}`)

      const response = await this.apiCall(`${this.baseUrl}/scan`, {
        method: 'POST',
        body: JSON.stringify({
          target,
          lab_environment: labEnvironment
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `DVWA scan failed with status ${response.status}`)
      }

      const data: DVWAScanResponse = await response.json()
      console.log(`✅ [DVWA] Scan completed:`, data)

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [DVWA] Error starting scan:`, errorMessage)
      throw error
    }
  }

  /**
   * Check if DVWA target is accessible
   */
  async checkDVWAHealth(target: string = 'http://192.168.0.176/dvwa'): Promise<DVWAHealthResponse> {
    try {
      if (!this.apiCall) {
        throw new Error('API call method not initialized. Please call setApiCall first.')
      }

      console.log(`🔍 [DVWA] Checking health of target: ${target}`)

      const response = await this.apiCall(`${this.baseUrl}/health?target=${encodeURIComponent(target)}`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`)
      }

      const data: DVWAHealthResponse = await response.json()
      console.log(`✅ [DVWA] Health check result:`, data)

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [DVWA] Error checking health:`, errorMessage)
      throw error
    }
  }
}

// Export singleton instance
export const dvwaApi = new DVWAApiService()
