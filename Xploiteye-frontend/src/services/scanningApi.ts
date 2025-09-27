// Scanning API service for direct result fetching
import { useAuth } from '@/auth/AuthContext'

export interface DirectScanResult {
  status: 'success' | 'pending' | 'error'
  message: string
  json_ready: boolean
  scan_id: string
  file_path?: string
  file_size?: number
  created_at?: string
  modified_at?: string
  results?: any
  patterns_searched?: string[]
}

class ScanningApiService {
  private baseUrl = '/scanning'  // Use relative URL since AuthContext handles base URL
  private apiCall: any = null

  // Set the apiCall method from AuthContext
  setApiCall(apiCall: any) {
    this.apiCall = apiCall
  }

  /**
   * Fetch scan results directly from JSON file - bypasses database for immediate results
   * This is much faster than waiting for database status updates
   */
  async getResultsDirect(scanId: string): Promise<DirectScanResult> {
    try {
      if (!this.apiCall) {
        throw new Error('API call method not initialized. Please call setApiCall first.')
      }

      console.log(`🚀 [DIRECT API] Fetching results directly for scan: ${scanId}`)

      const response = await this.apiCall(`${this.baseUrl}/results-direct/${scanId}`, {
        method: 'GET'
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 'pending',
            message: 'Scan results not yet available',
            json_ready: false,
            scan_id: scanId
          }
        }

        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ [DIRECT API] Successfully fetched results for scan: ${scanId}`, {
        status: data.status,
        json_ready: data.json_ready,
        file_size: data.file_size,
        has_results: !!data.results
      })

      return data

    } catch (error) {
      console.error(`❌ [DIRECT API] Error fetching direct results for scan ${scanId}:`, error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        json_ready: false,
        scan_id: scanId
      }
    }
  }

  /**
   * Alternative method using direct fetch (fallback if apiCall fails)
   */
  async getResultsDirectFallback(scanId: string): Promise<DirectScanResult> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log(`🔄 [DIRECT FALLBACK] Using direct fetch for scan: ${scanId}`)

      const response = await fetch(`http://localhost:8000/scanning/results-direct/${scanId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`❌ [DIRECT FALLBACK] HTTP Error ${response.status} for scan ${scanId}`)

        if (response.status === 404) {
          console.log(`📍 [DIRECT FALLBACK] 404 - Results not yet available for scan ${scanId}`)
          return {
            status: 'pending',
            message: 'Scan results not yet available',
            json_ready: false,
            scan_id: scanId
          }
        }

        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
          console.error(`❌ [DIRECT FALLBACK] Error details:`, errorData)
        } catch (jsonError) {
          console.error(`❌ [DIRECT FALLBACK] Could not parse error response as JSON:`, jsonError)
          const textResponse = await response.text().catch(() => 'Unknown error')
          console.error(`❌ [DIRECT FALLBACK] Raw error response:`, textResponse)
          errorMessage = textResponse || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log(`✅ [DIRECT FALLBACK] Successfully fetched results for scan: ${scanId}`)

      return data

    } catch (error) {
      console.error(`❌ [DIRECT FALLBACK] Error fetching direct results for scan ${scanId}:`, error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        json_ready: false,
        scan_id: scanId
      }
    }
  }
}

// Create singleton instance
const scanningApiService = new ScanningApiService()

// Hook to get the API service with proper initialization
export const useScanningApi = () => {
  const { apiCall } = useAuth()

  // Initialize the API service with the apiCall method
  scanningApiService.setApiCall(apiCall)

  return scanningApiService
}

// Export the service instance for direct use
export { scanningApiService }