'use client'

import { useEffect, useState, useCallback } from 'react'

type Content = Record<string, string>

const sections = ['Hero', 'About', 'Trust Stats', 'Home Collection', 'Night Service', 'Footer']

export default function AdminCmsPage() {
  const [content, setContent] = useState<Content>({})
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Hero')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cms')
      if (res.ok) {
        const data = await res.json()
        setContent(data.content || {})
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchContent() }, [fetchContent])

  const get = (key: string, defaultVal = '') => content[key] || defaultVal
  const set = (key: string, value: string) => setContent(prev => ({ ...prev, [key]: value }))

  const saveSection = async (keys: string[]) => {
    setSaving(true)
    setSaved(false)
    try {
      const payload: Record<string, string> = {}
      keys.forEach(key => { payload[key] = content[key] || '' })
      const res = await fetch('/api/admin/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payload })
      })
      if (res.ok) {
        const data = await res.json()
        setContent(data.content || {})
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const Input = ({ label, fieldKey, placeholder = '' }: { label: string; fieldKey: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={get(fieldKey)}
        onChange={(e) => set(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
      />
    </div>
  )

  const Textarea = ({ label, fieldKey, rows = 3, placeholder = '' }: { label: string; fieldKey: string; rows?: number; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={get(fieldKey)}
        onChange={(e) => set(fieldKey, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
      />
    </div>
  )

  const SectionContent = () => {
    switch (activeSection) {
      case 'Hero':
        return (
          <div className="space-y-3">
            <Input label="Heading" fieldKey="hero_heading" placeholder="Your Health, Our Priority" />
            <Textarea label="Description" fieldKey="hero_description" placeholder="Trusted diagnostic lab with state-of-the-art equipment" />
            <Input label="CTA Primary Label" fieldKey="hero_cta_primary" placeholder="Book Now" />
            <Input label="CTA Primary URL" fieldKey="hero_cta_primary_url" placeholder="/booking" />
            <Input label="CTA Secondary Label" fieldKey="hero_cta_secondary" placeholder="View Tests" />
            <Input label="CTA Secondary URL" fieldKey="hero_cta_secondary_url" placeholder="/tests" />
            <Input label="Image URL" fieldKey="hero_image" placeholder="https://..." />
            <button onClick={() => saveSection(['hero_heading', 'hero_description', 'hero_cta_primary', 'hero_cta_primary_url', 'hero_cta_secondary', 'hero_cta_secondary_url', 'hero_image'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Hero Section'}
            </button>
          </div>
        )
      case 'About':
        return (
          <div className="space-y-3">
            <Textarea label="About Description" fieldKey="about_description" rows={4} placeholder="Tell visitors about your lab..." />
            <Textarea label="Mission Statement" fieldKey="about_mission" rows={3} placeholder="Your mission..." />
            <Input label="Image URL" fieldKey="about_image" placeholder="https://..." />
            <button onClick={() => saveSection(['about_description', 'about_mission', 'about_image'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save About Section'}
            </button>
          </div>
        )
      case 'Trust Stats':
        return (
          <div className="space-y-3">
            <Input label="Stat 1 Value" fieldKey="trust_stat_1_value" placeholder="10,000+" />
            <Input label="Stat 1 Label" fieldKey="trust_stat_1_label" placeholder="Happy Patients" />
            <Input label="Stat 2 Value" fieldKey="trust_stat_2_value" placeholder="500+" />
            <Input label="Stat 2 Label" fieldKey="trust_stat_2_label" placeholder="Tests Available" />
            <Input label="Stat 3 Value" fieldKey="trust_stat_3_value" placeholder="50+" />
            <Input label="Stat 3 Label" fieldKey="trust_stat_3_label" placeholder="Expert Doctors" />
            <Input label="Stat 4 Value" fieldKey="trust_stat_4_value" placeholder="24/7" />
            <Input label="Stat 4 Label" fieldKey="trust_stat_4_label" placeholder="Support Available" />
            <button onClick={() => saveSection(['trust_stat_1_value', 'trust_stat_1_label', 'trust_stat_2_value', 'trust_stat_2_label', 'trust_stat_3_value', 'trust_stat_3_label', 'trust_stat_4_value', 'trust_stat_4_label'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Trust Stats'}
            </button>
          </div>
        )
      case 'Home Collection':
        return (
          <div className="space-y-3">
            <Input label="Heading" fieldKey="home_collection_heading" placeholder="Home Collection Service" />
            <Textarea label="Description" fieldKey="home_collection_description" placeholder="Get tests done from the comfort of your home" />
            <Input label="Features (comma-separated)" fieldKey="home_collection_features" placeholder="Free pickup, Same day results, Trained staff" />
            <button onClick={() => saveSection(['home_collection_heading', 'home_collection_description', 'home_collection_features'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Home Collection Section'}
            </button>
          </div>
        )
      case 'Night Service':
        return (
          <div className="space-y-3">
            <Input label="Heading" fieldKey="night_service_heading" placeholder="Night Service Available" />
            <Textarea label="Description" fieldKey="night_service_description" placeholder="Need tests done at night? We've got you covered" />
            <Input label="Timing" fieldKey="night_service_timing" placeholder="8:00 PM - 6:00 AM" />
            <button onClick={() => saveSection(['night_service_heading', 'night_service_description', 'night_service_timing'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Night Service Section'}
            </button>
          </div>
        )
      case 'Footer':
        return (
          <div className="space-y-3">
            <Input label="Footer Tagline" fieldKey="footer_tagline" placeholder="Your trusted diagnostic partner" />
            <Input label="Copyright Text" fieldKey="footer_copyright" placeholder="© 2024 Lab Name. All rights reserved." />
            <Textarea label="Footer Description" fieldKey="footer_description" rows={2} placeholder="Brief description for footer" />
            <button onClick={() => saveSection(['footer_tagline', 'footer_copyright', 'footer_description'])} disabled={saving} className="w-full py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Footer Section'}
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
        <h1 className="text-xl font-bold text-gray-900">CMS Editor</h1>
        {saved && <span className="text-xs text-success font-medium">Saved!</span>}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {sections.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeSection === s ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <SectionContent />
      </div>
    </div>
  )
}
