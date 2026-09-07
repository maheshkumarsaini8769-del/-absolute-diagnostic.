'use client'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'

interface Media {
  id: string
  filename: string
  originalName: string
  altText: string | null
  category: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  isActive: boolean
  createdAt: string
}

const categories = ['logo', 'hero', 'service', 'package', 'test', 'branch', 'team', 'blog']

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ filename: '', originalName: '', altText: '', category: 'logo', filePath: '', fileSize: 0, mimeType: '' })

  const fetchData = useCallback(async () => {
    try {
      const params = categoryFilter ? `?category=${categoryFilter}` : ''
      const res = await fetch(`/api/admin/media${params}`)
      if (res.ok) {
        const data = await res.json()
        setMedia(data.media || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [categoryFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    if (!form.filename || !form.originalName || !form.category || !form.filePath) {
      setError('Filename, name, category, and file path are required')
      setSaving(false)
      return
    }
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ filename: '', originalName: '', altText: '', category: 'logo', filePath: '', fileSize: 0, mimeType: '' })
        await fetchData()
      } else {
        const data = await res.json()
        setError(typeof data.error === 'string' ? data.error : 'Failed to add media')
      }
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
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
        <h1 className="text-xl font-bold text-gray-900">Media Library</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors">
          + Upload Media
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
            !categoryFilter ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              categoryFilter === c ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {media.length === 0 ? (
          <p className="col-span-full p-8 text-center text-sm text-gray-500">No media found</p>
        ) : (
          media.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {item.mimeType?.startsWith('image/') ? (
                  <img src={item.filePath} alt={item.altText || item.originalName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900 truncate">{item.originalName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">{item.category}</span>
                  <span className="text-[10px] text-gray-400">{formatSize(item.fileSize)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Media">
        <div className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File Name *</label>
            <input value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} placeholder="e.g. logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Original Name *</label>
            <input value={form.originalName} onChange={(e) => setForm({ ...form, originalName: e.target.value })} placeholder="e.g. Company Logo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File Path / URL *</label>
            <input value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} placeholder="https://... or /uploads/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alt Text</label>
            <input value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} placeholder="Describe the image" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Add Media'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
