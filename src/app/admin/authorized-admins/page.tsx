'use client'

import { useState, useEffect } from 'react'

interface AuthorizedAdmin {
  id: string
  email: string
  name: string | null
  isActive: boolean
  addedBy: string | null
  createdAt: string
  _count?: { Admin: number }
}

export default function AuthorizedAdminsPage() {
  const [admins, setAdmins] = useState<AuthorizedAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => { fetchAdmins() }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/authorized-admins')
      const data = await res.json()
      setAdmins(data.admins || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleAdd = async () => {
    setError('')
    setSuccess('')
    setActionLoading('add')

    try {
      const res = await fetch('/api/admin/authorized-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to add')
        setActionLoading('')
        return
      }

      setSuccess(`${newEmail} has been authorized`)
      setNewEmail('')
      setNewName('')
      setShowAdd(false)
      fetchAdmins()
    } catch {
      setError('Network error')
    }
    setActionLoading('')
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    setActionLoading(id)
    try {
      await fetch(`/api/admin/authorized-admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      })
      fetchAdmins()
    } catch { /* ignore */ }
    setActionLoading('')
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove authorization for ${email}?`)) return
    setActionLoading(id)
    try {
      await fetch(`/api/admin/authorized-admins/${id}`, { method: 'DELETE' })
      fetchAdmins()
    } catch { /* ignore */ }
    setActionLoading('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authorized Admins</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who can access the admin panel via OTP login</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors"
        >
          + Add Admin
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Authorized Admin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="Optional name"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={!newEmail || actionLoading === 'add'}
              className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'add' ? 'Adding...' : 'Add Admin'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError(''); setSuccess('') }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No authorized admins yet. Add one to get started.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${a.isActive ? 'bg-blue' : 'bg-gray-400'}`}>
                    {(a.name || a.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.name || a.email}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.isActive ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggle(a.id, a.isActive)}
                    disabled={actionLoading === a.id}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {a.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id, a.email)}
                    disabled={actionLoading === a.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
