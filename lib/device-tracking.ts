// lib/device-tracking.ts
// Prevents users from creating multiple free accounts on the same device

import { createClient } from "@/lib/supabase/client"

// Generate a device fingerprint
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
  }
  
  // Create a hash of the fingerprint
  return btoa(JSON.stringify(fingerprint)).slice(0, 64)
}

// Store device fingerprint in localStorage
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = generateDeviceFingerprint()
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

// Check if this device has already used free trial
export async function checkDeviceEligibility(): Promise<{
  eligible: boolean
  reason?: string
}> {
  const deviceId = getDeviceId()
  const supabase = createClient()
  
  // Check if device is already registered
  const { data, error } = await supabase
    .from('device_registrations')
    .select('user_id, created_at')
    .eq('device_id', deviceId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine
    console.error('Error checking device:', error)
    return { eligible: true } // Allow signup on error to avoid blocking legitimate users
  }
  
  if (data) {
    return {
      eligible: false,
      reason: 'This device has already been used to create a free account. Please sign in or upgrade to Pro.'
    }
  }
  
  return { eligible: true }
}

// Register device after successful signup
export async function registerDevice(userId: string): Promise<void> {
  const deviceId = getDeviceId()
  const supabase = createClient()
  
  await supabase
    .from('device_registrations')
    .insert({
      device_id: deviceId,
      user_id: userId,
      created_at: new Date().toISOString()
    })
}