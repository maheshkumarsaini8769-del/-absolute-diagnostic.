'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Modal from '@/components/Modal'

interface ReportParameter {
  name: string
  value: string
  numericValue?: number
  unit: string
  referenceRange: string
  status: 'normal' | 'low' | 'high' | 'critical'
  notes?: string
}

interface ReportAnalysisData {
  parameters?: ReportParameter[]
  abnormalCount?: number
  criticalCount?: number
  summary?: string
  confidence?: number
}

interface Report {
  id: string
  patientId: string
  bookingId?: string
  testName: string
  reportDate: string
  fileUrl: string
  fileName: string
  status: string
  uploadedAt: string
  patientName?: string
  patientPhone?: string
  patientAge?: number
  patientGender?: string
  extractedName?: string
  extractedMobile?: string
  extractedAge?: number
  matchConfidence?: string
  matchMethod?: string
  matchScore?: number
  patient?: { id?: string; name?: string; phone?: string; age?: number } | null
  analysisData?: ReportAnalysisData
  verifiedBy?: string
  verifiedAt?: string
  publishedAt?: string
  rejectReason?: string
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

const statusFilters = ['all', 'uploaded', 'under_review', 'verified', 'ready', 'published', 'delivered', 'unmatched']
const statusColors: Record<string, string> = {
  uploaded: 'bg-blue/10 text-blue font-medium',
  processing: 'bg-amber-100 text-amber-800 font-medium',
  under_review: 'bg-purple-100 text-purple-800 font-medium',
  verified: 'bg-teal-100 text-teal-800 font-medium',
  ready: 'bg-green-100 text-green-800 font-medium',
  published: 'bg-emerald-100 text-emerald-800 font-medium',
  delivered: 'bg-emerald-100 text-emerald-800 font-medium',
  unmatched: 'bg-red-100 text-red-700 font-medium',
  rejected: 'bg-rose-100 text-rose-800 font-medium',
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
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
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter && filter !== 'all') params.set('status', filter)
      if (search.trim()) params.set('q', search.trim())
      params.set('page', String(page))
      params.set('limit', '20')
      params.set('sortBy', sortBy)

      const [reportsRes, patientsRes] = await Promise.all([
        fetch(`/api/admin/reports?${params.toString()}`),
        fetch('/api/admin/patients')
      ])
      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setReports(data.reports || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1)
          setTotalCount(data.pagination.total || 0)
        }
      }
      if (patientsRes.ok) {
        const data = await patientsRes.json()
        const p = data.patients || []
        setPatients(p)
        setAllPatients(p)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter, search, page, sortBy])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = reports

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase()
    const isAllowed = ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')
    if (!isAllowed) {
      setError('Only PDF, PNG, or JPG files are allowed')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File too large (max 25MB)')
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
        setSelectedFile(null)
        setShowUpload(false)
        setUploadResult(null)
        await fetchData()
      } else {
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

  const handleVerify = async (reportId: string) => {
    setActionLoadingId(reportId)
    try {
      const res = await fetch('/api/admin/reports/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'verify' }),
      })
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'verified', verifiedAt: new Date().toISOString() } : r))
        await fetchData()
      }
    } catch { /* ignore */ }
    setActionLoadingId(null)
  }

  const handlePublish = async (reportId: string) => {
    setActionLoadingId(reportId)
    try {
      const res = await fetch('/api/admin/reports/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'publish' }),
      })
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ready', publishedAt: new Date().toISOString() } : r))
        await fetchData()
      }
    } catch { /* ignore */ }
    setActionLoadingId(null)
  }

  const handleReject = async (reportId: string) => {
    const reason = prompt('Please enter the reason for rejection / re-examination:')
    if (!reason) return
    setActionLoadingId(reportId)
    try {
      const res = await fetch('/api/admin/reports/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'reject', reason }),
      })
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected', rejectReason: reason } : r))
        await fetchData()
      }
    } catch { /* ignore */ }
    setActionLoadingId(null)
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
    if (!confirm(`Are you sure you want to permanently delete report "${report.fileName || report.testName}"?`)) return
    
    // Fast optimistic UI update: remove row immediately
    setReports(prev => prev.filter(r => r.id !== report.id))

    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        // Fallback to confirm route if direct delete fails
        await fetch('/api/admin/reports/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: report.id, action: 'delete' }),
        })
      }
    } catch {
      console.error('Delete error')
    }
    await fetchData()
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lab Reports</h1>
          <p className="text-xs text-gray-500">Manage uploaded reports, verification, analysis, and patient publishing</p>
        </div>
        <button
          onClick={() => { setShowUpload(true); setSelectedFile(null); setUploadResult(null); setError('') }}
          className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors shadow-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Report
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === f ? 'bg-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'under_review' ? 'Under Review' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unmatched' && reports.filter(r => r.status === 'unmatched').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                {reports.filter(r => r.status === 'unmatched').length}
              </span>
            )}
            {f === 'under_review' && reports.filter(r => r.status === 'under_review' || r.status === 'uploaded').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-purple-600 text-white rounded-full">
                {reports.filter(r => r.status === 'under_review' || r.status === 'uploaded').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by patient, test name, phone, UHID, or filename..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent bg-white shadow-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="newest">Newest Uploaded</option>
            <option value="oldest">Oldest Uploaded</option>
            <option value="reportDate">Report Date</option>
            <option value="patient">Patient Name</option>
            <option value="status">Status</option>
          </select>

          {(filter !== 'all' || search.trim() !== '' || sortBy !== 'newest') && (
            <button
              onClick={() => { setFilter('all'); setSearch(''); setSortBy('newest'); setPage(1); }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-gray-700">No reports found</p>
            <p className="text-xs text-gray-400 mt-1">Try changing the status filter or upload a new report.</p>
          </div>
        ) : (
          filtered.map((report) => {
            const isExpanded = expandedReportId === report.id
            const hasAnalysis = !!(report.analysisData?.parameters && report.analysisData.parameters.length > 0)
            const abnormalCount = report.analysisData?.abnormalCount || 0
            const criticalCount = report.analysisData?.criticalCount || 0

            return (
              <div key={report.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{report.testName}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColors[report.status] || 'bg-gray-100 text-gray-800'}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {abnormalCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                          {abnormalCount} Abnormal
                        </span>
                      )}
                      {criticalCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-full border border-red-200 animate-pulse">
                          {criticalCount} CRITICAL
                        </span>
                      )}
                      {report.matchConfidence && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${confidenceColors[report.matchConfidence] || ''}`}>
                          {report.matchConfidence} {report.matchScore ? `(${report.matchScore}%)` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {report.patient?.name || report.patientName || report.extractedName || 'Unmatched Patient'}
                      </span>
                      <span>&bull;</span>
                      <span>Phone: {report.patient?.phone || report.patientPhone || report.extractedMobile || 'N/A'}</span>
                      {(report.patient?.age || report.patientAge || report.extractedAge) && (
                        <>
                          <span>&bull;</span>
                          <span>Age: {report.patient?.age || report.patientAge || report.extractedAge}</span>
                        </>
                      )}
                      <span>&bull;</span>
                      <span className="text-gray-400">File: {report.fileName}</span>
                      <span>&bull;</span>
                      <span className="text-gray-400">Uploaded: {new Date(report.uploadedAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {/* Pathologist / Review Status line */}
                    {(report.verifiedBy || report.verifiedAt || report.publishedAt || report.rejectReason) && (
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                        {report.verifiedBy && (
                          <span className="text-teal-700 font-medium">
                            Verified by: {report.verifiedBy} {report.verifiedAt ? `on ${new Date(report.verifiedAt).toLocaleDateString('en-IN')}` : ''}
                          </span>
                        )}
                        {report.publishedAt && (
                          <span className="text-green-700 font-medium">
                            Published: {new Date(report.publishedAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                        {report.rejectReason && (
                          <span className="text-rose-600 font-medium">
                            Rejection note: {report.rejectReason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasAnalysis && (
                      <button
                        onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                          isExpanded ? 'bg-blue/10 border-blue text-blue' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title="Toggle parameter analysis table"
                      >
                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Analysis ({report.analysisData?.parameters?.length})
                      </button>
                    )}

                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-blue transition-colors"
                      title="View Report File"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>

                    <a
                      href={`${report.fileUrl}${report.fileUrl.includes('?') ? '&' : '?'}download=true`}
                      download={report.fileName || 'report.pdf'}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
                      title="Download Report File"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>

                    <button
                      onClick={() => deleteReport(report)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Report"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Workflow Buttons Bar */}
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100 flex-wrap">
                  {(report.status === 'uploaded' || report.status === 'processing' || report.status === 'under_review') && (
                    <button
                      onClick={() => handleVerify(report.id)}
                      disabled={actionLoadingId === report.id}
                      className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify as Pathologist
                    </button>
                  )}

                  {report.status === 'verified' && (
                    <button
                      onClick={() => handlePublish(report.id)}
                      disabled={actionLoadingId === report.id}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Publish & Notify Patient
                    </button>
                  )}

                  {(report.status === 'uploaded' || report.status === 'under_review' || report.status === 'verified') && (
                    <button
                      onClick={() => handleReject(report.id)}
                      disabled={actionLoadingId === report.id}
                      className="text-xs px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition-colors"
                    >
                      Reject / Revision
                    </button>
                  )}

                  {report.status === 'ready' && (
                    <button
                      onClick={() => updateStatus(report, 'delivered')}
                      className="text-xs px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>

                {/* Expanded Parameter Analysis Preview */}
                {isExpanded && hasAnalysis && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                        Extracted Clinical Parameters ({report.analysisData?.parameters?.length})
                      </span>
                      {report.analysisData?.summary && (
                        <span className="text-gray-500 italic text-[11px]">{report.analysisData.summary}</span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white rounded-lg border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                            <th className="py-1.5 px-3 font-semibold">Parameter</th>
                            <th className="py-1.5 px-3 font-semibold">Value</th>
                            <th className="py-1.5 px-3 font-semibold">Unit</th>
                            <th className="py-1.5 px-3 font-semibold">Reference Range</th>
                            <th className="py-1.5 px-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {report.analysisData?.parameters?.map((param, idx) => (
                            <tr key={idx} className={param.status === 'critical' ? 'bg-red-50/70 font-semibold' : param.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                              <td className="py-1.5 px-3 text-gray-900">{param.name}</td>
                              <td className="py-1.5 px-3 font-medium text-gray-900">{param.value}</td>
                              <td className="py-1.5 px-3 text-gray-500">{param.unit || '-'}</td>
                              <td className="py-1.5 px-3 text-gray-500">{param.referenceRange || '-'}</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  param.status === 'critical' ? 'bg-red-600 text-white' :
                                  param.status === 'high' ? 'bg-amber-100 text-amber-800' :
                                  param.status === 'low' ? 'bg-blue/10 text-blue' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {param.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-800">{((page - 1) * 20) + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">{Math.min(page * 20, totalCount)}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalCount}</span> reports
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                &larr; Previous
              </button>
              <span className="px-2 font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); setUploadResult(null) }} title="Upload Lab Report">
        <div className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive ? 'border-blue bg-blue/5' : selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            />
            {selectedFile ? (
              <div>
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Drop PDF, PNG or JPG here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Automatic parameter extraction & patient matching enabled (up to 25MB)</p>
              </div>
            )}
          </div>

          {/* Extracted Data Preview */}
          {uploadResult && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Extracted from File</h4>
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
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadResult(null) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors shadow-sm">
              {uploading ? 'Analyzing & Uploading...' : 'Upload & Extract'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Match Confirmation Modal */}
      <Modal isOpen={showMatchConfirm} onClose={() => setShowMatchConfirm(false)} title="Confirm Patient Link">
        {uploadResult && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detected from Report</h4>
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
              <button onClick={handleKeepUnmatched} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Keep Unmatched
              </button>
              {uploadResult.match && (
                <button onClick={() => handleConfirmLink()} className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue-dark shadow-sm">
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
