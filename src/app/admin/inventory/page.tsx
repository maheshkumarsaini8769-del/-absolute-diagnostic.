'use client'

import { useState, useEffect } from 'react'

interface InventoryItem {
  _id: string
  name: string
  category: string
  sku: string
  batchNumber?: string
  currentStock: number
  unit: string
  minThreshold: number
  costPerUnit: number
  status: string
  location?: string
  expiryDate?: string
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [lowStockCount, setLowStockCount] = useState(0)

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('reagent')
  const [skuInput, setSkuInput] = useState('')
  const [stockInput, setStockInput] = useState('100')
  const [unitInput, setUnitInput] = useState('kits')
  const [minInput, setMinInput] = useState('20')
  const [costInput, setCostInput] = useState('500')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [categoryFilter])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const url = categoryFilter === 'all' 
        ? '/api/admin/inventory' 
        : `/api/admin/inventory?category=${categoryFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setItems(data.items || [])
      setLowStockCount(data.lowStockCount || 0)
    } catch (err) {
      console.error('Fetch inventory error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          category: categoryInput,
          sku: skuInput,
          currentStock: stockInput,
          unit: unitInput,
          minThreshold: minInput,
          costPerUnit: costInput,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add item')

      setIsAddModalOpen(false)
      setNameInput('')
      setSkuInput('')
      fetchInventory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Laboratory Reagents & Consumables Inventory
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Track analyzer reagents, blood collection tubes, test kits, PPE, and manage reorder thresholds.
          </p>
        </div>

        <button
          onClick={() => {
            setSkuInput(`SKU-${Math.floor(Math.random() * 9000 + 1000)}`)
            setIsAddModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Add Stock Item</span>
        </button>
      </div>

      {/* ═══ LOW STOCK ALERT BANNER ═══ */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Low Stock Warning: {lowStockCount} items below minimum safety threshold
              </p>
              <p className="text-xs text-amber-700">
                Reorder required soon to prevent testing delays or stockouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CATEGORY FILTER ═══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Inventory' },
          { id: 'reagent', label: 'Analyzer Reagents' },
          { id: 'vacutainer', label: 'Vacutainer Tubes' },
          { id: 'rapid_kit', label: 'Rapid Test Kits' },
          { id: 'consumable', label: 'Lab Consumables' },
          { id: 'ppe', label: 'PPE & Gloves' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              categoryFilter === tab.id
                ? 'bg-[var(--navy)] text-white'
                : 'bg-white border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading stock inventory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Item Name / SKU</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Stock Level</th>
                  <th className="px-5 py-3.5">Min Safety Threshold</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Est. Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {items.map((item) => {
                  const isLow = item.currentStock <= item.minThreshold
                  return (
                    <tr key={item._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[var(--navy)]">{item.name}</div>
                        <div className="text-xs text-[var(--gray-500)] font-mono">{item.sku}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold uppercase">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`font-mono text-base font-bold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[var(--navy)]">
                        ₹{item.costPerUnit || 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: ADD ITEM ═══ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Add Laboratory Stock Item</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Register new reagent, collection tube, or consumable</p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Sodium Citrate Coagulation Tubes"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Category</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="reagent">Analyzer Reagent</option>
                    <option value="vacutainer">Vacutainer Tube</option>
                    <option value="rapid_kit">Rapid Test Kit</option>
                    <option value="consumable">Lab Consumable</option>
                    <option value="ppe">PPE / Gloves</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Quantity</label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Unit</label>
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    placeholder="tubes/kits"
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Estimated Cost Per Unit (₹)</label>
                <input
                  type="number"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
