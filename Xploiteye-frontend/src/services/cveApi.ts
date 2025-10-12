// CVE API service for interacting with backend CVE endpoints
import { useAuth } from '@/auth/AuthContext'

export interface CVE {
  id: string
  cve_id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  cvss_score?: number
  description: string
  impact?: string
  exploitable: boolean
  remediated: boolean
  privilege_escalation: boolean
  port?: string
  service?: string
  target: string
  discovered_at: string
}

export interface CVEUpdate {
  remediated?: boolean
  exploitable?: boolean
}

class CVEApiService {
  private baseUrl = '/cve'  // Use relative URL since AuthContext handles base URL
  private apiCall: any = null

  // Set the apiCall method from AuthContext
  setApiCall(apiCall: any) {
    this.apiCall = apiCall
  }

  async getUserCVEs(target?: string): Promise<CVE[]> {
    try {
      if (!this.apiCall) {
        console.error('CVE API not initialized with AuthContext')
        return []
      }

      const url = target ? `${this.baseUrl}/list?target=${encodeURIComponent(target)}` : `${this.baseUrl}/list`
      const response = await this.apiCall(url, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CVEs: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching CVEs:', error)
      return []
    }
  }

  async getCVE(cveId: string): Promise<CVE | null> {
    try {
      if (!this.apiCall) {
        console.error('CVE API not initialized with AuthContext')
        return null
      }

      const response = await this.apiCall(`${this.baseUrl}/${cveId}`, {
        method: 'GET'
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch CVE: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching CVE:', error)
      return null
    }
  }

  async updateCVE(cveId: string, updateData: CVEUpdate): Promise<boolean> {
    try {
      if (!this.apiCall) {
        console.error('CVE API not initialized with AuthContext')
        return false
      }

      const response = await this.apiCall(`${this.baseUrl}/${cveId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update CVE: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Error updating CVE:', error)
      return false
    }
  }

  async deleteCVE(cveId: string): Promise<boolean> {
    try {
      if (!this.apiCall) {
        console.error('CVE API not initialized with AuthContext')
        return false
      }

      const response = await this.apiCall(`${this.baseUrl}/${cveId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete CVE: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting CVE:', error)
      return false
    }
  }
}

export const cveApi = new CVEApiService()