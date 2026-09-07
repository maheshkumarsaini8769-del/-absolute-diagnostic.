'use client'

import { useEffect, useState, useCallback } from 'react'

interface AuditLog {
  id: string
  adminId: string
  action: string
  entity: string | null
  entityId: string | null
  details: string | null
  createdAt: string
  admin: { id: string; name: string; email: string }
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-blue/10 text-blue',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-800',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const limit = 30

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))
      const res = await fetch(`/api/admin/audit?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        let filtered = data.logs || []
        if (actionFilter) {
          filtered = filtered.filter((l: AuditLog) => l.action === actionFilter)
        }
        setLogs(filtered)
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, actionFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const actionTypes = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN']

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
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <span className="text-xs text-gray-500">{total} entries</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {actionTypes.map(a => (
          <button
            key={a || 'all'}
            onClick={() => { setActionFilter(a); setPage(0) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              actionFilter === a ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {a || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No audit logs found</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                    {log.entity && (
                      <span className="text-xs font-medium text-gray-700">{log.entity}</span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {log.admin.name} &middot; {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page + 1} of {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
