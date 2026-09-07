'use client'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'

interface Service {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  imageUrl: string | null
  displayOrder: number
  isActive: boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', slug: '', description: '', icon: '', imageUrl: '', displayOrder: 0, isActive: true })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', slug: '', description: '', icon: '', imageUrl: '', displayOrder: 0, isActive: true })
    setError('')
    setShowModal(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({ title: s.title, slug: s.slug, description: s.description || '', icon: s.icon || '', imageUrl: s.imageUrl || '', displayOrder: s.displayOrder, isActive: s.isActive })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/admin/services/${editing.id}` : '/api/admin/services'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        await fetchData()
      } else {
        const data = await res.json()
        setError(typeof data.error === 'string' ? data.error : 'Save failed')
      }
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  const toggleActive = async (s: Service) => {
    try {
      await fetch(`/api/admin/services/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive })
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const handleDelete = async (s: Service) => {
    if (!confirm(`Deactivate "${s.title}"?`)) return
    try {
      await fetch(`/api/admin/services/${s.id}`, { method: 'DELETE' })
      await fetchData()
    } catch { /* ignore */ }
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
        <h1 className="text-xl font-bold text-gray-900">Services</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors">
          + New Service
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {services.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No services found</p>
        ) : (
          services.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{s.title}</span>
                  {!s.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{s.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  {s.isActive ? (
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Service' : 'New Service'}>
        <div className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: autoSlug(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
