"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield,
  Smartphone,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react'

interface MfaSetupModalProps {
  isOpen: boolean
  onClose: () => void
  mfaStatus: {
    enabled: boolean
    setupComplete: boolean
    recoveryCodes: number
    loading: boolean
  }
  onMfaStatusChange: (status: any) => void
}

interface MfaSetupData {
  qr_code: string
  secret: string
  backup_url: string
  recovery_codes: string[]
}

export function MfaSetupModal({ 
  isOpen, 
  onClose, 
  mfaStatus, 
  onMfaStatusChange 
}: MfaSetupModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'init' | 'setup' | 'verify' | 'complete' | 'manage'>('init')
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disableTotpCode, setDisableTotpCode] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(mfaStatus.enabled ? 'manage' : 'init')
      setSetupData(null)
      setVerificationCode('')
      setSecretCopied(false)
      setRecoveryCodesCopied(false)
      setShowRegenerateConfirm(false)
      setShowDisableConfirm(false)
      setDisableTotpCode('')
    }
  }, [isOpen, mfaStatus.enabled])

  // Ensure only one confirmation dialog is open at a time
  useEffect(() => {
    if (showDisableConfirm) {
      setShowRegenerateConfirm(false)
    }
  }, [showDisableConfirm])

  useEffect(() => {
    if (showRegenerateConfirm) {
      setShowDisableConfirm(false)
    }
  }, [showRegenerateConfirm])

  const initiateMfaSetup = async () => {
    setLoading(true)
    try {
      // Check both token keys for compatibility
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      console.log('Token found:', token ? 'Yes' : 'No')

      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to enable Two-Factor Authentication',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      console.log('Initiating MFA setup...')
      const response = await fetch('http://localhost:8000/mfa/setup/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Setup data received successfully')
        setSetupData(data)
        setStep('setup')
      } else {
        const error = await response.json()
        console.error('Setup failed:', error)

        if (response.status === 401) {
          toast({
            title: 'Session Expired',
            description: 'Please log out and log in again',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Setup Failed',
            description: error.detail || 'Failed to initiate MFA setup',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Network error:', error)
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const completeMfaSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/mfa/setup/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          totp_code: verificationCode
        })
      })

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Two-Factor Authentication enabled successfully',
        })
        setStep('complete')
        // Update parent component's MFA status
        onMfaStatusChange({
          enabled: true,
          setupComplete: true,
          recoveryCodes: setupData?.recovery_codes?.length || 0,
          loading: false
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Verification Failed',
          description: error.detail || 'Invalid verification code',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const disableMfa = async () => {
    if (!disableTotpCode || disableTotpCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit verification code',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          totp_code: disableTotpCode
        })
      })

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Two-Factor Authentication has been disabled',
        })
        // Update parent component's MFA status
        onMfaStatusChange({
          enabled: false,
          setupComplete: false,
          recoveryCodes: 0,
          loading: false
        })
        setShowDisableConfirm(false)
        setDisableTotpCode('')
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: 'Disable Failed',
          description: error.detail || 'Invalid verification code. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const regenerateRecoveryCodes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/mfa/recovery/regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSetupData(prev => ({
          ...prev!,
          recovery_codes: data.recovery_codes
        }))
        toast({
          title: 'Success',
          description: 'Recovery codes regenerated successfully',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.detail || 'Failed to regenerate recovery codes',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setSecretCopied(true)
        setTimeout(() => setSecretCopied(false), 2000)
      } else {
        setRecoveryCodesCopied(true)
        setTimeout(() => setRecoveryCodesCopied(false), 2000)
      }
      toast({
        title: 'Copied!',
        description: `${type === 'secret' ? 'Secret key' : 'Recovery codes'} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const downloadRecoveryCodes = (format: 'txt' | 'json' = 'txt') => {
    if (!setupData?.recovery_codes) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      const codesData = {
        account: 'XploitEye Security Account',
        generated_at: new Date().toISOString(),
        recovery_codes: setupData.recovery_codes,
        instructions: 'Each code can only be used once. Store these codes in a secure location.',
        support_email: 'support@xploiteye.com'
      }
      content = JSON.stringify(codesData, null, 2)
      filename = 'xploiteye-recovery-codes.json'
      mimeType = 'application/json'
    } else {
      const header = `XploitEye Account Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\nIMPORTANT: Each code can only be used once. Store in a secure location.\n\nRecovery Codes:\n`
      const codesText = setupData.recovery_codes.map((code, index) => `${index + 1}. ${code}`).join('\n')
      const footer = `\n${'='.repeat(50)}\nFor support: support@xploiteye.com`
      content = header + codesText + footer
      filename = 'xploiteye-recovery-codes.txt'
      mimeType = 'text/plain'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: `Recovery codes saved as ${format.toUpperCase()} to your Downloads folder`,
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700"
          style={{
            visibility: (showDisableConfirm || showRegenerateConfirm) ? 'hidden' : 'visible'
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-400">
              <Shield className="w-5 h-5" />
              <span>Two-Factor Authentication</span>
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {step === 'manage' ? 'Manage your 2FA settings' : 'Secure your account with 2FA'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
          {/* Initial Setup Step */}
          {step === 'init' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enable Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add an extra layer of security to your XploitEye account using Google Authenticator or any compatible TOTP app.
                </p>
                <div className="text-xs text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                  <strong>Why enable 2FA?</strong>
                  <br />
                  • Protects against unauthorized access
                  <br />
                  • Required for sensitive operations
                  <br />
                  • Industry security best practice
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={initiateMfaSetup}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Start Setup'}
              </Button>
            </motion.div>
          )}

          {/* Setup Step - Show QR Code */}
          {step === 'setup' && setupData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Scan this QR code with Google Authenticator or any compatible TOTP app
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={setupData.qr_code} 
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Or enter this secret key manually:</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={setupData.secret}
                    readOnly
                    className="font-mono text-sm bg-gray-800"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    className="flex-shrink-0"
                  >
                    {secretCopied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setStep('verify')}
              >
                I've Added the Account
              </Button>
            </motion.div>
          )}

          {/* Verification Step */}
          {step === 'verify' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Verify Setup</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Enter the 6-digit code from your authenticator app to complete setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('setup')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={completeMfaSetup}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Complete Setup'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Complete Step - Show Recovery Codes */}
          {step === 'complete' && setupData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">Setup Complete!</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Two-Factor Authentication is now enabled. Save these recovery codes in a safe place.
                </p>
              </div>

              {/* Recovery Codes */}
              <Card className="bg-gray-800 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Recovery Codes</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Use these codes to access your account if you lose your device. Each code can only be used once.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-900 p-3 rounded border">
                    {setupData.recovery_codes.map((code, index) => (
                      <div key={index} className="text-green-400">
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(setupData.recovery_codes.join('\n'), 'codes')}
                      className="w-full"
                    >
                      {recoveryCodesCopied ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy to Clipboard
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadRecoveryCodes('txt')}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download TXT
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadRecoveryCodes('json')}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download JSON
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={onClose}
              >
                I've Saved My Recovery Codes
              </Button>
            </motion.div>
          )}

          {/* Manage Step - For already enabled MFA */}
          {step === 'manage' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">2FA is Enabled</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Your account is protected with Two-Factor Authentication
                </p>
                <Badge className="bg-green-500/20 text-green-400 mb-4">
                  {mfaStatus.recoveryCodes} of 10 recovery codes remaining
                </Badge>
              </div>

              {/* Show new recovery codes if they were just regenerated */}
              {setupData?.recovery_codes && (
                <Card className="bg-gray-800 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-400">New Recovery Codes Generated</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Your old recovery codes are no longer valid. Save these new codes in a secure location.
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-900 p-3 rounded border">
                      {setupData.recovery_codes.map((code, index) => (
                        <div key={index} className="text-green-400">
                          {code}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(setupData.recovery_codes.join('\n'), 'codes')}
                        className="w-full"
                      >
                        {recoveryCodesCopied ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy to Clipboard
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadRecoveryCodes('txt')}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download TXT
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadRecoveryCodes('json')}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download JSON
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    console.log('Regenerate button clicked')
                    setShowRegenerateConfirm(true)
                  }}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Get New Recovery Codes
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    console.log('Disable button clicked')
                    setShowDisableConfirm(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>

      {/* Regeneration Confirmation Dialog - Rendered outside Dialog using Portal */}
      {showRegenerateConfirm && !showDisableConfirm && typeof window !== 'undefined' && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowRegenerateConfirm(false)
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/40 rounded-xl shadow-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-yellow-500/10">
                    <RefreshCw className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Get New Recovery Codes</h3>
                  <p className="text-sm text-gray-400">
                    Generate a fresh set of 10 backup codes
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-yellow-300">What happens:</p>
                      <ul className="text-xs text-yellow-200/80 space-y-1 list-disc list-inside">
                        <li>You'll get 10 brand new recovery codes</li>
                        <li>Your old codes will stop working immediately</li>
                        <li>Download and save the new codes safely</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                  <p className="text-xs text-blue-200/80">
                    <strong className="text-blue-300">💡 When to use:</strong> If you've used up codes or think they're compromised
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenerateConfirm(false)}
                    className="flex-1 border-gray-700 hover:bg-gray-800"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRegenerateConfirm(false)
                      regenerateRecoveryCodes()
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold shadow-lg shadow-yellow-500/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate New Codes'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>,
        document.body
      )}

      {/* Disable MFA Confirmation Dialog - Rendered outside Dialog using Portal */}
      {showDisableConfirm && typeof window !== 'undefined' && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                e.stopPropagation()
                if (e.target === e.currentTarget) {
                  setShowDisableConfirm(false)
                  setDisableTotpCode('')
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-xl shadow-2xl p-6 max-w-md w-full relative"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header with Icon */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-500/10">
                    <Shield className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Disable 2FA</h3>
                  <p className="text-sm text-gray-400">
                    Enter your authenticator code to confirm
                  </p>
                </div>

                {/* Warning Card */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-300">Security Warning</p>
                      <p className="text-xs text-red-200/80">
                        Disabling 2FA will remove extra protection from your account and delete all recovery codes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Code Input */}
                <div className="space-y-3 mb-6">
                  <Label htmlFor="disable-totp-code" className="text-sm font-medium text-gray-300">
                    Authenticator Code
                  </Label>
                  <Input
                    id="disable-totp-code"
                    type="text"
                    value={disableTotpCode}
                    onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="000000"
                    className="text-center text-3xl font-mono tracking-[0.5em] bg-gray-900/50 border-gray-700 focus:border-red-500 focus:ring-red-500/20 h-14"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisableConfirm(false)
                      setDisableTotpCode('')
                    }}
                    className="flex-1 border-gray-700 hover:bg-gray-800"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={disableMfa}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/20"
                    disabled={loading || disableTotpCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Disabling...
                      </>
                    ) : (
                      'Disable 2FA'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>,
        document.body
      )}
    </>
  )
}