'use client'

import { useEffect, useState, useCallback } from 'react'

interface Device {
  id: string
  deviceName: string
  deviceType: string | null
  browser: string | null
  fcmToken: string | null
  endpoint: string | null
  isActive: boolean
  isTrusted: boolean
  lastActive: string
  createdAt: string
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState('')
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingId, setEditingId] = useState('')
  const [editName, setEditName] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [showPairing, setShowPairing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/devices')
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

  useEffect(() => {
    fetchData()
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW register error:', err)
      })
    }
  }, [fetchData])

  const sendTestToDevice = async (deviceId: string) => {
    setSending(deviceId)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_test' })
      })
      const data = await res.json()
      setMessage({ type: data.success ? 'success' : 'error', text: data.message || 'Done' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to send test notification' })
    }
    setSending('')
  }

  const sendTestAll = async () => {
    setSending('all')
    setMessage(null)
    try {
      const res = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Notification', message: 'Admin notification system is working.' })
      })
      const data = await res.json()
      setMessage({ type: 'success', text: data.message || 'Notification sent' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to send notification' })
    }
    setSending('')
  }

  const registerCurrentDevice = async () => {
    setRegistering(true)
    setMessage(null)
    try {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      const deviceType = isIOS ? 'iPhone' : isAndroid ? 'Android' : 'Desktop'
      const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' :
        navigator.userAgent.includes('Firefox') ? 'Firefox' :
        navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
      const deviceName = `${deviceType} - ${browserName}`

      let subJson: any = null
      let pushEnabled = false

      // Try Push Notifications if supported on this browser/device
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          // Register service worker if needed
          let reg = await navigator.serviceWorker.getRegistration('/sw.js')
          if (!reg) {
            reg = await navigator.serviceWorker.register('/sw.js')
          }

          // Use timeout so ready never hangs forever on mobile
          const readyReg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration | null>((resolve) => setTimeout(() => resolve(null), 3000))
          ])

          const activeReg = readyReg || reg

          if (activeReg && 'PushManager' in window && 'Notification' in window) {
            let permission = Notification.permission
            if (permission === 'default') {
              permission = await Notification.requestPermission()
            }

            if (permission === 'granted') {
              const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || 'BFCLUdNhSCcHfm2T-2WU99z13_0FGKxMQo86IUbkVTSQ5gAUkSu_v70KpUv0M4OvEimYzVAvD1_MX5DuMx8tD_Q'
              const convertedKey = urlBase64ToUint8Array(vapidKey)

              let subscription = await activeReg.pushManager.getSubscription()
              if (!subscription) {
                subscription = await activeReg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedKey
                })
              }
              if (subscription) {
                subJson = subscription.toJSON()
                pushEnabled = true
              }
            }
          }
        } catch (swErr) {
          console.warn('Push subscription note:', swErr)
        }
      }

      // Register device on backend (supports both with or without push subscription)
      const res = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName,
          deviceType,
          browser: browserName,
          endpoint: subJson?.endpoint,
          p256dh: subJson?.keys?.p256dh,
          auth: subJson?.keys?.auth,
          isTrusted: true
        })
      })

      const data = await res.json()
      if (res.ok) {
        if (pushEnabled) {
          setMessage({ type: 'success', text: `✓ ${deviceName} registered with Push Notifications active!` })
        } else if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
          setMessage({
            type: 'success',
            text: `✓ ${deviceName} registered! (Tip: On iOS, tap Share → 'Add to Home Screen' for instant push alerts)`
          })
        } else {
          setMessage({
            type: 'success',
            text: `✓ ${deviceName} registered successfully! (Push alerts disabled in browser settings)`
          })
        }
        await fetchData()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to register device' })
      }
    } catch (err: any) {
      console.error('Error registering device:', err)
      setMessage({ type: 'error', text: err?.message || 'Error registering device' })
    }
    setRegistering(false)
  }

  const handleRename = async (id: string) => {
    if (!editName.trim()) return
    try {
      await fetch(`/api/admin/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: editName })
      })
      setEditingId('')
      fetchData()
    } catch { /* ignore */ }
  }

  const handleRevoke = async (device: Device) => {
    if (!confirm(`Revoke device "${device.deviceName}"?`)) return
    try {
      await fetch(`/api/admin/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' })
      })
      fetchData()
      setMessage({ type: 'success', text: 'Device revoked' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke device' })
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Revoke ALL devices? This will log out all sessions.')) return
    try {
      const res = await fetch('/api/admin/devices/revoke-all', { method: 'POST' })
      const data = await res.json()
      fetchData()
      setMessage({ type: 'success', text: data.message || 'All devices revoked' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke all devices' })
    }
  }

  const generatePairingCode = async () => {
    try {
      const res = await fetch('/api/admin/devices/pairing-code', { method: 'POST' })
      const data = await res.json()
      if (data.code) {
        setPairingCode(data.code)
        setShowPairing(true)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate pairing code' })
    }
  }

  const getDeviceIcon = (type: string | null) => {
    if (type === 'iPhone' || type === 'iPad') return '📱'
    if (type === 'Android') return '📱'
    return '💻'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeCount = devices.filter(d => d.isActive).length
  const trustedCount = devices.filter(d => d.isTrusted && d.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Devices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {devices.length} registered ({activeCount} active, {trustedCount} trusted)
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 font-medium">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={sendTestAll}
          disabled={!!sending}
          className="px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {sending === 'all' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔔'}
          Send Test to All
        </button>
        <button
          onClick={registerCurrentDevice}
          disabled={registering}
          className="px-4 py-2.5 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {registering ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📱'}
          Register Current Device
        </button>
        <button
          onClick={generatePairingCode}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔗 Generate Pairing Code
        </button>
        {devices.length > 0 && (
          <button
            onClick={handleRevokeAll}
            className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            Revoke All
          </button>
        )}
      </div>

      {showPairing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Pairing Code</p>
              <p className="text-2xl font-bold text-blue-700 tracking-widest mt-1">{pairingCode}</p>
              <p className="text-xs text-blue-600 mt-1">Expires in 10 minutes. Use this on another device to register it.</p>
            </div>
            <button onClick={() => setShowPairing(false)} className="text-blue-400 hover:text-blue-600">&times;</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {devices.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No devices registered yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {devices.map((device) => (
              <div key={device.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                    <div>
                      {editingId === device.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(device.id)}
                          />
                          <button onClick={() => handleRename(device.id)} className="text-xs text-blue font-medium">Save</button>
                          <button onClick={() => setEditingId('')} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{device.deviceName}</span>
                          <button onClick={() => { setEditingId(device.id); setEditName(device.deviceName) }} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${device.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {device.isActive ? 'Active' : 'Revoked'}
                        </span>
                        {device.isTrusted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Trusted</span>
                        )}
                        {device.deviceType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{device.deviceType}</span>
                        )}
                        {device.browser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{device.browser}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last active: {new Date(device.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => sendTestToDevice(device.id)}
                      disabled={!!sending}
                      className="px-3 py-1.5 text-xs font-medium text-blue border border-blue/20 rounded-lg hover:bg-blue/5 disabled:opacity-50"
                    >
                      {sending === device.id ? '...' : 'Test'}
                    </button>
                    <button
                      onClick={() => handleRevoke(device)}
                      disabled={!device.isActive}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-30"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
