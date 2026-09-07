'use client'

import { useEffect, useState, useCallback } from 'react'

type Settings = Record<string, string>

const tabs = ['General', 'Social', 'Booking', 'Home Collection', 'Night Service', 'Notification', 'Report', 'SEO']

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('General')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const get = (key: string, defaultVal = '') => settings[key] || defaultVal
  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const saveSettings = async (keys: string[]) => {
    setSaving(true)
    setSaved(false)
    try {
      const payload = keys.map(key => ({ key, value: settings[key] || '' }))
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const Input = ({ label, fieldKey, type = 'text', placeholder = '' }: { label: string; fieldKey: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={get(fieldKey)}
        onChange={(e) => set(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
      />
    </div>
  )

  const Toggle = ({ label, fieldKey }: { label: string; fieldKey: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => set(fieldKey, get(fieldKey) === 'true' ? 'false' : 'true')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${get(fieldKey) === 'true' ? 'bg-success' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${get(fieldKey) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  const TabContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="space-y-3">
            <Input label="Lab Name" fieldKey="lab_name" placeholder="My Diagnostic Lab" />
            <Input label="Logo URL" fieldKey="lab_logo" placeholder="https://..." />
            <Input label="Phone" fieldKey="lab_phone" placeholder="+91 9876543210" />
            <Input label="WhatsApp" fieldKey="lab_whatsapp" placeholder="+91 9876543210" />
            <Input label="Email" fieldKey="lab_email" type="email" placeholder="info@lab.com" />
            <Input label="Address" fieldKey="lab_address" placeholder="Full address" />
            <button onClick={() => saveSettings(['lab_name', 'lab_logo', 'lab_phone', 'lab_whatsapp', 'lab_email', 'lab_address'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        )
      case 'Social':
        return (
          <div className="space-y-3">
            <Input label="Facebook URL" fieldKey="social_facebook" placeholder="https://facebook.com/..." />
            <Input label="Instagram URL" fieldKey="social_instagram" placeholder="https://instagram.com/..." />
            <Input label="Twitter URL" fieldKey="social_twitter" placeholder="https://twitter.com/..." />
            <Input label="YouTube URL" fieldKey="social_youtube" placeholder="https://youtube.com/..." />
            <button onClick={() => saveSettings(['social_facebook', 'social_instagram', 'social_twitter', 'social_youtube'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Social Settings'}
            </button>
          </div>
        )
      case 'Booking':
        return (
          <div className="space-y-3">
            <Input label="Minimum Notice (hours)" fieldKey="booking_min_notice_hours" type="number" placeholder="2" />
            <button onClick={() => saveSettings(['booking_min_notice_hours'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Booking Settings'}
            </button>
          </div>
        )
      case 'Home Collection':
        return (
          <div className="space-y-3">
            <Toggle label="Home Collection Enabled" fieldKey="home_collection_enabled" />
            <Input label="Standard Charge" fieldKey="home_collection_charge" type="number" placeholder="100" />
            <Input label="Night Charge" fieldKey="home_collection_night_charge" type="number" placeholder="200" />
            <Input label="Service Areas" fieldKey="home_collection_areas" placeholder="Area 1, Area 2" />
            <Input label="Timing" fieldKey="home_collection_timing" placeholder="7:00 AM - 9:00 PM" />
            <button onClick={() => saveSettings(['home_collection_enabled', 'home_collection_charge', 'home_collection_night_charge', 'home_collection_areas', 'home_collection_timing'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Home Collection Settings'}
            </button>
          </div>
        )
      case 'Night Service':
        return (
          <div className="space-y-3">
            <Toggle label="Night Service Enabled" fieldKey="night_service_enabled" />
            <Input label="Start Time" fieldKey="night_service_start" placeholder="8:00 PM" />
            <Input label="End Time" fieldKey="night_service_end" placeholder="6:00 AM" />
            <Toggle label="Emergency Enabled" fieldKey="night_emergency_enabled" />
            <Input label="Emergency Start" fieldKey="night_emergency_start" placeholder="10:00 PM" />
            <Input label="Emergency End" fieldKey="night_emergency_end" placeholder="6:00 AM" />
            <Input label="Night Charge" fieldKey="night_charge" type="number" placeholder="200" />
            <Input label="Emergency Charge" fieldKey="night_emergency_charge" type="number" placeholder="500" />
            <Input label="Minimum Notice (hours)" fieldKey="night_min_notice" type="number" placeholder="2" />
            <Input label="Allowed Tests (comma-separated)" fieldKey="night_allowed_tests" placeholder="test1, test2" />
            <Input label="Patient Message" fieldKey="night_patient_message" placeholder="Message shown to patients" />
            <button onClick={() => saveSettings(['night_service_enabled', 'night_service_start', 'night_service_end', 'night_emergency_enabled', 'night_emergency_start', 'night_emergency_end', 'night_charge', 'night_emergency_charge', 'night_min_notice', 'night_allowed_tests', 'night_patient_message'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Night Service Settings'}
            </button>
          </div>
        )
      case 'Notification':
        return (
          <div className="space-y-3">
            <Toggle label="Push Notifications Enabled" fieldKey="push_notifications_enabled" />
            <button onClick={() => saveSettings(['push_notifications_enabled'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        )
      case 'Report':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Verification Provider</label>
              <select value={get('report_verification_provider', 'otp')} onChange={(e) => set('report_verification_provider', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue">
                <option value="otp">OTP Verification</option>
                <option value="dob">Date of Birth</option>
                <option value="phone">Phone Number</option>
              </select>
            </div>
            <button onClick={() => saveSettings(['report_verification_provider'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Report Settings'}
            </button>
          </div>
        )
      case 'SEO':
        return (
          <div className="space-y-3">
            <Input label="Default Title" fieldKey="seo_title" placeholder="My Diagnostic Lab" />
            <Input label="Default Description" fieldKey="seo_description" placeholder="Lab description for search engines" />
            <Input label="Default Keywords" fieldKey="seo_keywords" placeholder="lab, diagnostic, health" />
            <button onClick={() => saveSettings(['seo_title', 'seo_description', 'seo_keywords'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        {saved && <span className="text-xs text-success font-medium">Saved!</span>}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeTab === tab ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <TabContent />
      </div>
    </div>
  )
}
