'use client'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'

interface Test {
  id: string
  name: string
}

interface PackageTest {
  id: string
  testId: string
  test: Test
}

interface Package {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  mrp: number | null
  discount: number
  reportTime: string | null
  preparationInstructions: string | null
  homeCollection: boolean
  imageUrl: string | null
  isFeatured: boolean
  displayOrder: number
  isActive: boolean
  packageTests: PackageTest[]
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [allTests, setAllTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPkg, setEditingPkg] = useState<Package | null>(null)
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: 0, mrp: 0, discount: 0,
    reportTime: '', preparationInstructions: '', homeCollection: true,
    imageUrl: '', isFeatured: false, displayOrder: 0, isActive: true
  })

  const fetchData = useCallback(async () => {
    try {
      const [pkgRes, testRes] = await Promise.all([
        fetch('/api/admin/packages'),
        fetch('/api/admin/tests')
      ])
      if (pkgRes.ok) {
        const data = await pkgRes.json()
        setPackages(data.packages || [])
      }
      if (testRes.ok) {
        const data = await testRes.json()
        setAllTests(data.tests || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = packages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const openCreate = () => {
    setEditingPkg(null)
    setForm({ name: '', slug: '', description: '', price: 0, mrp: 0, discount: 0, reportTime: '', preparationInstructions: '', homeCollection: true, imageUrl: '', isFeatured: false, displayOrder: 0, isActive: true })
    setSelectedTests([])
    setError('')
    setShowModal(true)
  }

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg)
    setForm({
      name: pkg.name, slug: pkg.slug, description: pkg.description || '', price: pkg.price,
      mrp: pkg.mrp || 0, discount: pkg.discount || 0, reportTime: pkg.reportTime || '',
      preparationInstructions: pkg.preparationInstructions || '', homeCollection: pkg.homeCollection,
      imageUrl: pkg.imageUrl || '', isFeatured: pkg.isFeatured, displayOrder: pkg.displayOrder, isActive: pkg.isActive
    })
    setSelectedTests(pkg.packageTests.map(pt => pt.testId))
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editingPkg ? `/api/admin/packages/${editingPkg.id}` : '/api/admin/packages'
      const method = editingPkg ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, testIds: selectedTests })
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

  const toggleActive = async (pkg: Package) => {
    try {
      await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !pkg.isActive })
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Deactivate "${pkg.name}"?`)) return
    try {
      await fetch(`/api/admin/packages/${pkg.id}`, { method: 'DELETE' })
      await fetchData()
    } catch { /* ignore */ }
  }

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    )
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
        <h1 className="text-xl font-bold text-gray-900">Packages</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors">
          + New Package
        </button>
      </div>

      <input
        type="text"
        placeholder="Search packages..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
      />

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No packages found</p>
        ) : (
          filtered.map((pkg) => (
            <div key={pkg.id} className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{pkg.name}</span>
                  {!pkg.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pkg.packageTests.length} tests &middot; ₹{pkg.price}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(pkg)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  {pkg.isActive ? (
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
                <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(pkg)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPkg ? 'Edit Package' : 'New Package'} maxWidth="max-w-xl">
        <div className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">MRP</label>
              <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Tests</label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
              {allTests.map(test => (
                <label key={test.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                    className="rounded"
                  />
                  {test.name}
                </label>
              ))}
              {allTests.length === 0 && <p className="text-xs text-gray-500">No tests available</p>}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{selectedTests.length} test(s) selected</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.homeCollection} onChange={(e) => setForm({ ...form, homeCollection: e.target.checked })} className="rounded" />
              Home Collection
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
              Featured
            </label>
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
