'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Modal from '@/components/Modal'

interface Report {
  id: string
  patientId: string
  testName: string
  reportDate: string
  fileUrl: string
  fileName: string
  status: string
  uploadedAt: string
  extractedName?: string
  extractedMobile?: string
  extractedAge?: number
  matchConfidence?: string
  matchMethod?: string
  matchScore?: number
  patient: { id: string; name: string; phone: string }
}

interface MatchCandidate {
  id: string
  name: string
  mobile: string
  age: number | null
  score: number
}

interface UploadResult {
  report: { id: string; fileName: string; testName: string; status: string; patientId: string }
  extraction: { name: string | null; mobile: string | null; age: number | null; gender: string | null; testName: string | null; confidence: number; error: string | null }
  match: { confidence: string; score: number; patientName: string | null; patientMobile: string | null; patientAge: number | null; matchMethod: string; candidates: MatchCandidate[] } | null
  autoLinked: boolean
}

interface Patient {
  id: string
  name: string
  phone: string
}

const statusFilters = ['all', 'uploaded', 'processing', 'ready', 'delivered', 'unmatched']
const statusColors: Record<string, string> = {
  uploaded: 'bg-blue/10 text-blue',
  processing: 'bg-orange-100 text-orange-800',
  ready: 'bg-success/10 text-success',
  delivered: 'bg-green-100 text-green-800',
  unmatched: 'bg-red-100 text-red-700',
}
const confidenceColors: Record<string, string> = {
  HIGH: 'text-green-700 bg-green-50',
  MEDIUM: 'text-amber-700 bg-amber-50',
  LOW: 'text-red-700 bg-red-50',
  NONE: 'text-gray-500 bg-gray-100',
  CONFIRMED_BY_ADMIN: 'text-blue bg-blue/10',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [showMatchConfirm, setShowMatchConfirm] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [reportsRes, patientsRes] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/patients')
      ])
      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setReports(data.reports || [])
      }
      if (patientsRes.ok) {
        const data = await patientsRes.json()
        const p = data.patients || []
        setPatients(p)
        setAllPatients(p)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.patient?.name?.toLowerCase().includes(q) || r.testName.toLowerCase().includes(q) || r.patient?.phone?.includes(q) || r.fileName.toLowerCase().includes(q)
    }
    return true
  })

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setError('')
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('report', selectedFile)

      const res = await fetch('/api/admin/reports/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.status === 409 && data.error === 'duplicate') {
        setError(`Duplicate detected! This exact file was already uploaded for patient "${data.existingReport?.patientId || 'unknown'}" on ${new Date(data.existingReport?.uploadedAt).toLocaleDateString('en-IN')}.`)
        setUploading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      setUploadResult(data as UploadResult)

      if (data.autoLinked) {
        // Auto-linked successfully — close and refresh
        setSelectedFile(null)
        setShowUpload(false)
        setUploadResult(null)
        await fetchData()
      } else {
        // Needs admin confirmation
        setShowMatchConfirm(true)
      }
    } catch {
      setError('Network error during upload')
    }
    setUploading(false)
  }

  const handleConfirmLink = async (patientId?: string) => {
    if (!uploadResult) return
    try {
      const res = await fetch('/api/admin/reports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: uploadResult.report.id,
          patientId: patientId || uploadResult.match?.candidates?.[0]?.id,
          action: patientId ? 'choose_different' : 'confirm_link',
        })
      })
      if (res.ok) {
        setShowMatchConfirm(false)
        setUploadResult(null)
        setSelectedFile(null)
        setShowUpload(false)
        await fetchData()
      }
    } catch { /* ignore */ }
  }

  const handleKeepUnmatched = async () => {
    if (!uploadResult) return
    try {
      await fetch('/api/admin/reports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: uploadResult.report.id, action: 'keep_unmatched' }),
      })
      setShowMatchConfirm(false)
      setUploadResult(null)
      setSelectedFile(null)
      setShowUpload(false)
      await fetchData()
    } catch { /* ignore */ }
  }

  const updateStatus = async (report: Report, status: string) => {
    try {
      await fetch('/api/admin/reports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, action: 'update_status', status }),
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const deleteReport = async (report: Report) => {
    if (!confirm(`Delete report "${report.fileName}"?`)) return
    try {
      await fetch('/api/admin/reports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, action: 'delete' }),
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const filteredPatients = patientSearch
    ? allPatients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch)).slice(0, 20)
    : allPatients.slice(0, 20)

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
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <button onClick={() => { setShowUpload(true); setSelectedFile(null); setUploadResult(null); setError('') }} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors">
          + Upload Report
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {statusFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${filter === f ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unmatched' && reports.filter(r => r.status === 'unmatched').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                {reports.filter(r => r.status === 'unmatched').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Search by patient, test, phone, or filename..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent" />

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No reports found</p>
        ) : (
          filtered.map((report) => (
            <div key={report.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{report.testName}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[report.status] || 'bg-gray-100 text-gray-800'}`}>
                      {report.status}
                    </span>
                    {report.matchConfidence && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${confidenceColors[report.matchConfidence] || ''}`}>
                        {report.matchConfidence} {report.matchScore ? `(${report.matchScore}%)` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {report.patient?.name || 'Unmatched'} &middot; {report.patient?.phone || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {report.fileName} &middot; {new Date(report.uploadedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100" title="View PDF">
                    <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </a>
                  <button onClick={() => deleteReport(report)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              {report.status !== 'delivered' && (
                <div className="flex gap-1.5 mt-2">
                  {report.status === 'uploaded' && <button onClick={() => updateStatus(report, 'processing')} className="text-[10px] px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">Mark Processing</button>}
                  {(report.status === 'uploaded' || report.status === 'processing') && <button onClick={() => updateStatus(report, 'ready')} className="text-[10px] px-2 py-1 bg-success/10 text-success rounded-lg font-medium">Mark Ready</button>}
                  {report.status === 'ready' && <button onClick={() => updateStatus(report, 'delivered')} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">Mark Delivered</button>}
                  {report.status === 'unmatched' && <button onClick={() => { /* TODO: open reassign modal */ }} className="text-[10px] px-2 py-1 bg-blue/10 text-blue rounded-lg font-medium">Match Patient</button>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); setUploadResult(null) }} title="Upload Report">
        <div className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-blue bg-blue/5' : selectedFile ? 'border-green bg-green-50' : 'border-gray-300 hover:border-blue hover:bg-gray-50'}`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
            {selectedFile ? (
              <div>
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm font-medium text-gray-700">Drop PDF here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF files up to 20MB</p>
              </div>
            )}
          </div>

          {/* Extracted Data Preview */}
          {uploadResult && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Extracted from PDF</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{uploadResult.extraction.name || 'Not detected'}</span></div>
                <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{uploadResult.extraction.mobile || 'Not detected'}</span></div>
                <div><span className="text-gray-500">Age:</span> <span className="font-medium">{uploadResult.extraction.age || 'Not detected'}</span></div>
                <div><span className="text-gray-500">Test:</span> <span className="font-medium">{uploadResult.extraction.testName || 'Not detected'}</span></div>
                <div><span className="text-gray-500">Confidence:</span> <span className="font-medium">{uploadResult.extraction.confidence}%</span></div>
                {uploadResult.extraction.error && <div className="col-span-2 text-amber-600">Extraction warning: {uploadResult.extraction.error}</div>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadResult(null) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors">
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Match Confirmation Modal */}
      <Modal isOpen={showMatchConfirm} onClose={() => setShowMatchConfirm(false)} title="Report Match">
        {uploadResult && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detected from PDF</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{uploadResult.extraction.name || 'N/A'}</span></div>
                <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{uploadResult.extraction.mobile || 'N/A'}</span></div>
                <div><span className="text-gray-500">Age:</span> <span className="font-medium">{uploadResult.extraction.age || 'N/A'}</span></div>
                <div><span className="text-gray-500">Test:</span> <span className="font-medium">{uploadResult.extraction.testName || 'N/A'}</span></div>
              </div>
            </div>

            {uploadResult.match && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Best Match</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${confidenceColors[uploadResult.match.confidence] || ''}`}>
                    {uploadResult.match.confidence} ({uploadResult.match.score}%)
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{uploadResult.match.patientName || 'Unknown'}</p>
                  <p className="text-gray-500">{uploadResult.match.patientMobile || 'N/A'} &middot; Age: {uploadResult.match.patientAge || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">Method: {uploadResult.match.matchMethod}</p>
                </div>
              </div>
            )}

            {/* Other candidates */}
            {uploadResult.match && uploadResult.match.candidates.length > 1 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Other Possible Matches</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadResult.match.candidates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.mobile} &middot; Age: {c.age || 'N/A'}</p>
                      </div>
                      <button onClick={() => handleConfirmLink(c.id)} className="text-xs px-3 py-1 bg-blue text-white rounded-lg font-medium hover:bg-blue-dark">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleKeepUnmatched} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Keep Unmatched</button>
              {uploadResult.match && (
                <button onClick={() => handleConfirmLink()} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark">
                  Confirm & Link
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
