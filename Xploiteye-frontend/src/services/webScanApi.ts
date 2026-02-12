/**
 * Web Application Scanner API Service
 * Handles communication with the backend Web Scanner endpoints
 */

export interface WebVulnerability {
    category: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    title: string
    cve_id: string
    component: string
    detected_version: string
    description: string
    red_agent_action?: string
}

export interface WebScanResult {
    scan_id: string
    target: string
    status: string
    scan_duration_sec: number
    recon_data: any
    network_ports: any
    ssl_info: any
    technologies: Record<string, string>
    findings: WebVulnerability[]
    started_at: string
    completed_at?: string
}

export interface WebScanResponse {
    scan_id: string
    message: string
}

class WebScanApiService {
    private baseUrl = '/web-scanning'
    private apiCall: any = null

    setApiCall(apiCall: any) {
        this.apiCall = apiCall
    }

    /**
     * Start a live web application scan
     */
    async startWebScan(url: string, email?: string): Promise<WebScanResponse> {
        try {
            if (!this.apiCall) {
                throw new Error('API call method not initialized. Please call setApiCall first.')
            }

            console.log(`🔍 [WebScan] Starting scan on target: ${url}`)

            const response = await this.apiCall(`${this.baseUrl}/start`, {
                method: 'POST',
                body: JSON.stringify({
                    url,
                    email
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Web scan failed with status ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`❌ [WebScan] Error starting scan:`, error)
            throw error
        }
    }

    /**
     * Get web scan status and results
     */
    async getWebScanStatus(scan_id: string): Promise<WebScanResult> {
        try {
            if (!this.apiCall) {
                throw new Error('API call method not initialized. Please call setApiCall first.')
            }

            const response = await this.apiCall(`${this.baseUrl}/status/${scan_id}`, {
                method: 'GET'
            })

            if (!response.ok) {
                throw new Error(`Status check failed with status ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`❌ [WebScan] Error checking status:`, error)
            throw error
        }
    }
}

export const webScanApi = new WebScanApiService()
