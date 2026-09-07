'use client'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'

interface TestCategory {
  id: string
  name: string
}

interface Test {
  id: string
  name: string
  slug: string
  categoryId: string
  price: number
  mrp: number | null
  discount: number
  shortDescription: string | null
  description: string | null
  reportTime: string | null
  preparationInstructions: string | null
  fastingRequired: boolean
  homeCollection: boolean
  nightAvailable: boolean
  nightSurcharge: number
  imageUrl: string | null
  isFeatured: boolean
  displayOrder: number
  isActive: boolean
  category: TestCategory
}

const emptyForm = {
  name: '', slug: '', categoryId: '', price: 0, mrp: 0, discount: 0,
  shortDescription: '', description: '', reportTime: '',
  preparationInstructions: '', fastingRequired: false, homeCollection: true,
  nightAvailable: false, nightSurcharge: 0, imageUrl: '',
  isFeatured: false, displayOrder: 0, isActive: true
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [categories, setCategories] = useState<TestCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const testsRes = await fetch('/api/admin/tests')
      if (testsRes.ok) {
        const data = await testsRes.json()
        const testsList = data.tests || []
        setTests(testsList)
        const catMap = new Map<string, TestCategory>()
        testsList.forEach((t: Test) => {
          if (t.category && !catMap.has(t.category.id)) {
            catMap.set(t.category.id, t.category)
          }
        })
        setCategories(Array.from(catMap.values()))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingTest(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (test: Test) => {
    setEditingTest(test)
    setForm({
      name: test.name, slug: test.slug, categoryId: test.categoryId,
      price: test.price, mrp: test.mrp || 0, discount: test.discount || 0,
      shortDescription: test.shortDescription || '', description: test.description || '',
      reportTime: test.reportTime || '', preparationInstructions: test.preparationInstructions || '',
      fastingRequired: test.fastingRequired, homeCollection: test.homeCollection,
      nightAvailable: test.nightAvailable, nightSurcharge: test.nightSurcharge || 0,
      imageUrl: test.imageUrl || '', isFeatured: test.isFeatured,
      displayOrder: test.displayOrder, isActive: test.isActive
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingTest ? `/api/admin/tests/${editingTest.id}` : '/api/admin/tests'
      const method = editingTest ? 'PUT' : 'POST'
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

  const toggleActive = async (test: Test) => {
    try {
      await fetch(`/api/admin/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !test.isActive })
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const handleDelete = async (test: Test) => {
    if (!confirm(`Deactivate "${test.name}"?`)) return
    try {
      await fetch(`/api/admin/tests/${test.id}`, { method: 'DELETE' })
      await fetchData()
    } catch { /* ignore */ }
  }

  const autoSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
        <h1 className="text-xl font-bold text-gray-900">Tests</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors">
          + New Test
        </button>
      </div>

      <input
        type="text"
        placeholder="Search tests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
      />

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filteredTests.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No tests found</p>
        ) : (
          filteredTests.map((test) => (
            <div key={test.id} className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{test.name}</span>
                  {!test.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">Inactive</span>}
                  {test.isFeatured && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Featured</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{test.category.name} &middot; ₹{test.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(test)} className="p-1.5 rounded-lg hover:bg-gray-100 text-xs" title="Toggle active">
                  {test.isActive ? (
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
                <button onClick={() => openEdit(test)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(test)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTest ? 'Edit Test' : 'New Test'} maxWidth="max-w-xl">
        <div className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue">
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">MRP</label>
              <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
              <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Report Time</label>
            <input value={form.reportTime} onChange={(e) => setForm({ ...form, reportTime: e.target.value })} placeholder="e.g. 24 hours" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.fastingRequired} onChange={(e) => setForm({ ...form, fastingRequired: e.target.checked })} className="rounded" />
              Fasting Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.homeCollection} onChange={(e) => setForm({ ...form, homeCollection: e.target.checked })} className="rounded" />
              Home Collection
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.nightAvailable} onChange={(e) => setForm({ ...form, nightAvailable: e.target.checked })} className="rounded" />
              Night Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
              Featured
            </label>
          </div>

          {form.nightAvailable && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Night Surcharge</label>
              <input type="number" value={form.nightSurcharge} onChange={(e) => setForm({ ...form, nightSurcharge: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preparation Instructions</label>
            <textarea value={form.preparationInstructions} onChange={(e) => setForm({ ...form, preparationInstructions: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

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
