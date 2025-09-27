"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import type ReactType from "react"

import { useState, useEffect } from "react"
import { useAuth } from '@/auth/AuthContext'
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useCallback } from "react"
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Globe,
  Moon,
  Sun,
  Camera,
  Save,
  Check,
  Crown,
  Zap,
  Star,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MfaSetupModal } from "@/components/MfaSetupModal"
import { MfaVerificationModal } from "@/components/MfaVerificationModal"

const subscriptionPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Shield,
    features: ["5 scans per month", "Basic vulnerability detection", "Standard reports", "Community support"],
    current: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    icon: Zap,
    features: [
      "Unlimited scans",
      "Advanced vulnerability analysis",
      "AI-powered threat intelligence",
      "Custom reports",
      "Priority support",
      "API access",
    ],
    current: true,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    icon: Crown,
    features: [
      "Everything in Professional",
      "Multi-tenant management",
      "Advanced compliance reports",
      "Custom integrations",
      "Dedicated support",
      "On-premise deployment",
    ],
    current: false,
  },
]

export function SettingsPage() {
  const { user, logout, checkUsernameAvailability: authCheckUsername, checkAuthStatus } = useAuth()
  const { toast } = useToast()
  const [profileImage, setProfileImage] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || '',
    displayName: user?.display_name || user?.name || '',
    email: user?.email || '',
    bio: `${user?.role === 'admin' ? 'System Administrator' : user?.role === 'analyst' ? 'Security Analyst' : 'Security Enthusiast'} using XploitEye platform for cybersecurity operations.`
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    setupComplete: false,
    recoveryCodes: 0,
    loading: true
  })
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [showMfaVerification, setShowMfaVerification] = useState(false)
  const [pendingPasswordChange, setPendingPasswordChange] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[]
  })
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Check username availability (only if different from current username)
  const checkUsernameAvailability = useCallback(async (username: string) => {
    // Don't check if it's the same as current username
    if (username === user?.username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const result = await authCheckUsername(username);
      
      if (result.success) {
        setUsernameAvailable(result.available);
      } else {
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, [authCheckUsername, user?.username]);

  // Debounced username check for settings
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.trim() && formData.username !== user?.username) {
        checkUsernameAvailability(formData.username.trim());
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability, user?.username]);

  // Password validation function
  const validatePassword = (password: string) => {
    const errors = []
    let isValid = true

    if (password.length < 8) {
      errors.push('At least 8 characters long')
      isValid = false
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter')
      isValid = false
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter')
      isValid = false
    }
    if (!/\d/.test(password)) {
      errors.push('One number')
      isValid = false
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('One special character')
      isValid = false
    }

    setPasswordValidation({ isValid, errors })
    return isValid
  }

  // Validate password in real-time
  useEffect(() => {
    if (passwordData.newPassword) {
      validatePassword(passwordData.newPassword)
    } else {
      setPasswordValidation({ isValid: false, errors: [] })
    }
  }, [passwordData.newPassword])

  // Load user's profile image on component mount
  useEffect(() => {
    if (user?.id) {
      setProfileImage(`http://localhost:8000/auth/profile-image/${user.id}`)
    }
  }, [user?.id])

  // Load MFA status on component mount
  useEffect(() => {
    const loadMfaStatus = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return

        const response = await fetch('http://localhost:8000/mfa/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const status = await response.json()
          setMfaStatus({
            enabled: status.mfa_enabled,
            setupComplete: status.setup_complete,
            recoveryCodes: status.recovery_codes_remaining,
            loading: false
          })
        } else {
          setMfaStatus(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Failed to load MFA status:', error)
        setMfaStatus(prev => ({ ...prev, loading: false }))
      }
    }

    if (user?.id) {
      loadMfaStatus()
    }
  }, [user?.id])
  const [notifications, setNotifications] = useState({
    scanComplete: true,
    vulnerabilityFound: true,
    weeklyReport: false,
    securityAlerts: true,
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        })
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error", 
          description: "Only JPG, PNG, and GIF files are allowed",
          variant: "destructive"
        })
        return
      }

      // Store selected file for later upload
      setSelectedImageFile(file)
      
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileImage(result)
      }
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Error reading file",
          variant: "destructive"
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToBackend = async (file: File): Promise<boolean> => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: "Error",
          description: "Please login again",
          variant: "destructive"
        })
        return false
      }

      const formData = new FormData()
      formData.append('image', file)
      // Send custom filename based on username
      const fileExtension = file.name.split('.').pop()
      formData.append('filename', `${user?.username}.${fileExtension}`)

      const response = await fetch('http://localhost:8000/auth/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        // Update profile image URL to the backend URL
        toast({
          title: "Success",
          description: "Profile image updated successfully!"
        })
        
        // Clear the image first, then set new URL to force refresh
        setProfileImage('')
        setTimeout(() => {
          const newImageUrl = `http://localhost:8000/auth/profile-image/${user?.id}?t=${Date.now()}`
          setProfileImage(newImageUrl)
        }, 200)
        
        return true
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: `Failed to upload image: ${error.detail || 'Unknown error'}`,
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
      return false
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: "Error",
          description: "Please login again",
          variant: "destructive"
        })
        return
      }

      // First upload image if a new one was selected
      if (selectedImageFile) {
        const imageUploaded = await uploadImageToBackend(selectedImageFile)
        if (!imageUploaded) {
          setIsLoading(false)
          return
        }
        // Clear the selected file after successful upload
        setSelectedImageFile(null)
      }

      // Check if there are any profile data changes to update
      const updateData = {
        username: formData.username,
        name: formData.name,
        display_name: formData.displayName,
        email: formData.email,
        bio: formData.bio
      }

      // Check if any profile data has actually changed
      const hasProfileChanges = (
        formData.username !== user?.username ||
        formData.name !== user?.name ||
        formData.displayName !== user?.display_name ||
        formData.email !== user?.email ||
        formData.bio !== (user?.bio || `${user?.role === 'admin' ? 'System Administrator' : user?.role === 'analyst' ? 'Security Analyst' : 'Security Enthusiast'} using XploitEye platform for cybersecurity operations.`)
      )

      // Only update profile data if there are actual changes
      if (hasProfileChanges) {
        const response = await fetch('http://localhost:8000/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: selectedImageFile ? "Profile and image updated successfully!" : "Profile updated successfully!"
          })
          
          // Refresh user data and reload page for consistency across the app
          await checkAuthStatus();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
        } else {
          const error = await response.json()
          toast({
            title: "Error",
            description: `Failed to update profile: ${error.detail || 'Unknown error'}`,
            variant: "destructive"
          })
        }
      } else if (selectedImageFile) {
        // Only image was uploaded, no profile changes
        toast({
          title: "Success", 
          description: "Profile image updated successfully!"
        })
        
        // Refresh user data and reload page for profile image to show everywhere
        await checkAuthStatus();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        // No changes at all
        toast({
          title: "Info",
          description: "No changes to save"
        })
      }

    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    // Check if OAuth user needs current password
    const isOAuthUser = user?.is_oauth_user;
    const hasCustomPassword = user?.has_custom_password;
    const requiresCurrentPassword = !isOAuthUser || hasCustomPassword;

    // Validate required fields based on user type
    if (requiresCurrentPassword && !passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive"
      })
      return
    }

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required password fields",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your new password meets all requirements",
        variant: "destructive"
      })
      return
    }

    // Check if MFA is enabled - require verification for sensitive operations
    if (mfaStatus.enabled && !pendingPasswordChange) {
      setPendingPasswordChange(true)
      setShowMfaVerification(true)
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: "Error",
          description: "Please login again",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password updated successfully!"
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        let errorMessage = 'Password change failed'
        
        if (response.status === 404) {
          errorMessage = 'Password change feature is not yet implemented on the backend'
        } else {
          try {
            const error = await response.json()
            if (error.detail) {
              if (error.detail.toLowerCase().includes('incorrect') || error.detail.toLowerCase().includes('wrong')) {
                errorMessage = 'Current password is incorrect'
              } else if (error.detail.toLowerCase().includes('not found')) {
                errorMessage = 'User not found. Please login again.'
              } else {
                errorMessage = error.detail
              }
            }
          } catch (e) {
            errorMessage = `Password change failed (Status: ${response.status})`
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaStatusChange = (newStatus: any) => {
    setMfaStatus(newStatus)
  }

  const handleMfaVerified = () => {
    if (pendingPasswordChange) {
      setPendingPasswordChange(false)
      // Proceed with password change after MFA verification
      handlePasswordChange()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account, preferences, and subscription</p>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-900/50 border border-gray-800">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <Globe className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-400" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image Upload - Responsive */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 lg:w-24 lg:h-24 border-2 border-green-500/30">
                      <AvatarImage 
                        src={profileImage || ""} 
                        alt="Profile" 
                        className="object-cover"
                        onError={(e) => {
                          // Handle image loading errors by showing fallback
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 font-bold text-lg">
                        {user?.username ? user.username.slice(0, 2).toUpperCase() : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <motion.label
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors shadow-lg"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden"
                        title="Upload profile picture"
                      />
                    </motion.label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a new profile picture. Recommended size: 400x400px
                    </p>
                    <p className="text-xs text-green-400 mt-2">
                      Supports: JPG, PNG, GIF (max 5MB)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input 
                        id="username" 
                        value={formData.username} 
                        onChange={(e) => {
                          handleFormChange('username', e.target.value)
                          setUsernameAvailable(null) // Reset when typing
                        }}
                        className={`pr-10 ${
                          usernameAvailable === false 
                            ? 'border-red-500' 
                            : usernameAvailable === true 
                            ? 'border-green-500' 
                            : ''
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isCheckingUsername && (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                        )}
                        {!isCheckingUsername && usernameAvailable === true && (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {!isCheckingUsername && usernameAvailable === false && (
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {usernameAvailable === true && formData.username !== user?.username && (
                      <p className="mt-1 text-sm text-green-400">✓ Username is available</p>
                    )}
                    {usernameAvailable === false && (
                      <p className="mt-1 text-sm text-red-400">✗ Username is already taken</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      value={formData.displayName} 
                      onChange={(e) => handleFormChange('displayName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user?.role || 'user'} disabled className="bg-gray-800 cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleFormChange('bio', e.target.value)}
                  />
                </div>

                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security using Google Authenticator
                      </p>
                      {mfaStatus.enabled && (
                        <p className="text-xs text-green-400 mt-1">
                          {mfaStatus.recoveryCodes} of 10 recovery codes remaining
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {mfaStatus.loading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Badge 
                            className={`${
                              mfaStatus.enabled 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {mfaStatus.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowMfaSetup(true)}
                          >
                            {mfaStatus.enabled ? 'Manage' : 'Setup'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Change Password</h4>
                      {user?.is_oauth_user && !user?.has_custom_password && (
                        <p className="text-sm text-gray-400">
                          You signed in with Google. Set a password to enable password-based login.
                        </p>
                      )}
                    </div>
                    <div className={`grid gap-4 ${(!user?.is_oauth_user || user?.has_custom_password) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Current Password Field - Only show for regular users or OAuth users with custom password */}
                      {(!user?.is_oauth_user || user?.has_custom_password) && (
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input 
                            id="currentPassword" 
                            type="password" 
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                          className={`${
                            passwordData.newPassword && !passwordValidation.isValid 
                              ? 'border-red-500' 
                              : passwordData.newPassword && passwordValidation.isValid 
                              ? 'border-green-500' 
                              : ''
                          }`}
                        />
                        {/* Password Requirements */}
                        {passwordData.newPassword && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-300">Password must contain:</p>
                            <div className="grid grid-cols-1 gap-1">
                              {[
                                { text: 'At least 8 characters long', valid: passwordData.newPassword.length >= 8 },
                                { text: 'One uppercase letter', valid: /[A-Z]/.test(passwordData.newPassword) },
                                { text: 'One lowercase letter', valid: /[a-z]/.test(passwordData.newPassword) },
                                { text: 'One number', valid: /\d/.test(passwordData.newPassword) },
                                { text: 'One special character', valid: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(passwordData.newPassword) }
                              ].map((req, index) => (
                                <div key={index} className={`flex items-center space-x-2 text-xs ${req.valid ? 'text-green-400' : 'text-red-400'}`}>
                                  <span>{req.valid ? '✓' : '✗'}</span>
                                  <span>{req.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`space-y-2 ${(!user?.is_oauth_user || user?.has_custom_password) ? 'md:col-span-2' : ''}`}>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                          className={`${
                            passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                              ? 'border-red-500' 
                              : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword
                              ? 'border-green-500' 
                              : ''
                          }`}
                        />
                        {passwordData.confirmPassword && (
                          <p className={`mt-1 text-xs ${
                            passwordData.newPassword === passwordData.confirmPassword 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {passwordData.newPassword === passwordData.confirmPassword 
                              ? '✓ Passwords match' 
                              : '✗ Passwords do not match'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-green-400" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h4>
                        <p className="text-sm text-muted-foreground">
                          {key === "scanComplete" && "Get notified when scans are completed"}
                          {key === "vulnerabilityFound" && "Alert when new vulnerabilities are discovered"}
                          {key === "weeklyReport" && "Receive weekly security summary reports"}
                          {key === "securityAlerts" && "Critical security alerts and updates"}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative ${plan.popular ? "scale-105" : ""}`}
                >
                  <Card
                    className={`bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700 ${
                      plan.current ? "ring-2 ring-green-500" : ""
                    } ${plan.popular ? "border-green-500" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <plan.icon className="w-12 h-12 mx-auto text-green-400 mb-4" />
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold text-green-400">
                        {plan.price}
                        <span className="text-sm text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full ${
                          plan.current ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                        }`}
                        disabled={plan.current}
                      >
                        {plan.current ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-400" />
                  <span>Application Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">Eastern Time</SelectItem>
                        <SelectItem value="pst">Pacific Time</SelectItem>
                        <SelectItem value="cet">Central European Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* MFA Setup Modal */}
      <MfaSetupModal
        isOpen={showMfaSetup}
        onClose={() => setShowMfaSetup(false)}
        mfaStatus={mfaStatus}
        onMfaStatusChange={handleMfaStatusChange}
      />

      {/* MFA Verification Modal */}
      <MfaVerificationModal
        isOpen={showMfaVerification}
        onClose={() => {
          setShowMfaVerification(false)
          setPendingPasswordChange(false)
        }}
        onVerified={handleMfaVerified}
        title="Verify Identity for Password Change"
        description="Changing your password is a sensitive operation that requires two-factor authentication."
        action="Change Password"
      />
    </div>
  )
}

export default function SettingsPageWrapper() {
  return (
    <>
      <Head>
        <title>Settings - XploitEye Dashboard</title>
        <meta name="description" content="Dashboard settings and configuration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <SettingsPage />
      </DashboardLayout>
    </>
  );
}
