"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MfaLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
  userEmail: string
  tempToken: string
}

export function MfaLoginModal({ 
  isOpen, 
  onClose, 
  onVerified,
  userEmail,
  tempToken 
}: MfaLoginModalProps) {
  const [mfaCode, setMfaCode] = useState('')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMfaCode('')
      setUseRecoveryCode(false)
      setError('')
    }
  }, [isOpen])

  const verifyMfaCode = async () => {
    if (!mfaCode || (useRecoveryCode ? mfaCode.length < 8 : mfaCode.length !== 6)) {
      setError(useRecoveryCode ? 'Please enter a valid recovery code' : 'Please enter a 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const payload = {
        temp_token: tempToken,
        ...(useRecoveryCode 
          ? { recovery_code: mfaCode }
          : { totp_code: mfaCode })
      }

      const response = await fetch('http://localhost:8000/mfa/login/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        // Store the real JWT token
        localStorage.setItem('access_token', result.access_token)
        
        // Close modal first
        onClose()
        
        // Call onVerified to trigger redirect
        onVerified()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Invalid verification code')
        setMfaCode('') // Clear the code on error
      }
    } catch (error) {
      setError('Network error. Please try again.')
      setMfaCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mfaCode.length >= (useRecoveryCode ? 8 : 6) && !loading) {
      verifyMfaCode()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Two-Factor Authentication</h2>
          <p className="text-gray-400 text-sm">
            Your account requires additional verification to sign in
          </p>
          <p className="text-green-400 text-xs mt-1 font-mono">
            {userEmail}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {useRecoveryCode ? 'Recovery Code' : 'Authenticator Code'}
            </label>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => {
                const value = useRecoveryCode 
                  ? e.target.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase()
                  : e.target.value.replace(/\D/g, '').slice(0, 6)
                setMfaCode(value)
                if (error) setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder={useRecoveryCode ? "XXXX-XXXX" : "000000"}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-lg font-mono focus:border-yellow-500 focus:outline-none"
              maxLength={useRecoveryCode ? 9 : 6}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              {useRecoveryCode 
                ? 'Enter one of your backup recovery codes' 
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={verifyMfaCode}
              disabled={loading || (useRecoveryCode ? mfaCode.length < 8 : mfaCode.length !== 6)}
              className="flex-1 px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode)
                setMfaCode('')
                setError('')
              }}
              className="text-green-400 hover:text-green-300 text-sm underline"
            >
              {useRecoveryCode 
                ? 'Use authenticator app instead' 
                : 'Lost your device? Use recovery code'
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}