"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import { 
  Shield, 
  AlertTriangle,
  Smartphone
} from 'lucide-react'

interface MfaVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
  title?: string
  description?: string
  action?: string
}

export function MfaVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified,
  title = "Verify Your Identity",
  description = "This action requires two-factor authentication verification.",
  action = "Continue"
}: MfaVerificationModalProps) {
  const { toast } = useToast()
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setVerificationCode('')
    }
  }, [isOpen])

  const verifyMfaCode = async () => {
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
      const token = localStorage.getItem('access_token') || localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please login again',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('http://localhost:8000/api/mfa/verify', {
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
          title: 'Verified!',
          description: 'Identity verification successful',
        })
        onVerified()
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: 'Verification Failed',
          description: error.detail || 'Invalid verification code',
          variant: 'destructive'
        })
        setVerificationCode('') // Clear the code on error
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
      setVerificationCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !loading) {
      verifyMfaCode()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-yellow-400">
            <Shield className="w-5 h-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Enter the 6-digit code from your authenticator app to proceed with this secure operation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mfa-verification-code" className="text-gray-300">
              Verification Code
            </Label>
            <Input
              id="mfa-verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest bg-gray-800 border-gray-600 focus:border-yellow-500"
              maxLength={6}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Code expires in 30 seconds. Generate a new one if needed.
            </p>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-200">
              <strong>Security Notice:</strong> This verification is required for sensitive operations to protect your account.
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              onClick={verifyMfaCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : action}
            </Button>
          </div>

          {/* Recovery Option */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Lost your device?{' '}
              <button 
                className="text-green-400 hover:text-green-300 underline"
                onClick={() => {
                  toast({
                    title: 'Recovery Options',
                    description: 'Use your recovery codes or contact support for account recovery',
                  })
                }}
              >
                Use recovery code
              </button>
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}