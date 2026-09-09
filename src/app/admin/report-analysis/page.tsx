'use client'

import { useState, useEffect } from 'react'

interface MatchedTest {
  detectedName: string
  normalizedName: string
  matchedCatalogTestId?: string
  catalogName?: string
  price?: number
  confidence: number
  matchStatus: string
  isConfirmedByUser: boolean
}

interface AnalysisItem {
  id: string
  patientName: string
  patientPhone: string
  sourceFileName: string
  status: string
  confidence: number
  extractedTests: string[]
  matchedTests: MatchedTest[]
  subtotal: number
  finalTotal: number
  createdAt: string
}

export default function AdminReportAnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AnalysisItem | null>(null)

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/report-analysis?status=${filter}&q=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (res.ok) {
        setAnalyses(data.analyses || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyses()
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report AI Analysis & Test Matching</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor OCR extracted tests, catalog matches, DB price snapshots, and booking transitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="READY_FOR_CONFIRMATION">Ready for Confirmation</option>
            <option value="CONFIRMED">Confirmed by Patient</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading analysis sessions...</div>
        ) : analyses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No report analysis sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Detected Tests</th>
                  <th className="px-4 py-3">Matched Catalog Tests</th>
                  <th className="px-4 py-3">Catalog Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{item.patientName}</div>
                      <div className="text-xs text-gray-500">{item.patientPhone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[140px] truncate" title={item.sourceFileName}>
                      {item.sourceFileName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.extractedTests.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-sky-50 text-sky-700 border border-sky-200">
                            {t}
                          </span>
                        ))}
                        {item.extractedTests.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{item.extractedTests.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {item.matchedTests.map((m, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${m.matchStatus === 'EXACT_MATCH' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="font-medium text-gray-800">{m.catalogName || m.detectedName}</span>
                            <span className="text-gray-400 text-[10px]">({Math.round(m.confidence * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      ₹{item.finalTotal || item.subtotal}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'READY_FOR_CONFIRMATION' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(item)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Analysis Breakdown: {selected.patientName}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500 block">Source Document:</span>
                <span className="font-semibold text-gray-800">{selected.sourceFileName}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500 block">Status:</span>
                <span className="font-semibold text-gray-800">{selected.status}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Detected & Matched Catalog Tests:</h3>
              <div className="space-y-2">
                {selected.matchedTests.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{t.catalogName || t.detectedName}</div>
                      <div className="text-xs text-gray-500">Detected from report: &ldquo;{t.detectedName}&rdquo; &bull; Match: {t.matchStatus}</div>
                    </div>
                    <div className="text-right font-bold text-base text-emerald-700">
                      ₹{t.price || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between font-bold text-base">
              <span>Total Calculated:</span>
              <span className="text-emerald-700">₹{selected.finalTotal || selected.subtotal}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
