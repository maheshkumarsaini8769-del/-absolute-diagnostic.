'use client'

import { useState, useEffect } from 'react'

interface Parameter {
  name: string
  value: string
  unit: string
  referenceRange: string
  isCritical?: boolean
  flag?: 'normal' | 'high' | 'low' | 'critical'
}

interface WorklistItem {
  _id: string
  sampleId: string
  patientName: string
  patientAge?: number
  patientGender?: string
  testName: string
  parameters: Parameter[]
  technicianName?: string
  technicianNotes?: string
  pathologistName?: string
  pathologistNotes?: string
  status: 'pending_entry' | 'results_entered' | 'verified' | 'rejected' | 'amended'
  criticalAlert: boolean
  createdAt: string
  updatedAt: string
}

// Pre-built clinical parameter templates
const TEST_TEMPLATES: Record<string, Parameter[]> = {
  'Complete Blood Count (CBC)': [
    { name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0' },
    { name: 'RBC Count', value: '4.8', unit: 'million/mcL', referenceRange: '4.5 - 5.5' },
    { name: 'WBC (Total Leucocyte Count)', value: '7200', unit: 'cells/mcL', referenceRange: '4000 - 11000' },
    { name: 'Platelet Count', value: '250000', unit: 'cells/mcL', referenceRange: '150000 - 450000' },
    { name: 'PCV / Hematocrit', value: '42.0', unit: '%', referenceRange: '40 - 50' },
  ],
  'Lipid Profile': [
    { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '< 200' },
    { name: 'Triglycerides', value: '140', unit: 'mg/dL', referenceRange: '< 150' },
    { name: 'HDL Cholesterol (Good)', value: '48', unit: 'mg/dL', referenceRange: '> 40' },
    { name: 'LDL Cholesterol (Bad)', value: '105', unit: 'mg/dL', referenceRange: '< 100' },
    { name: 'VLDL Cholesterol', value: '28', unit: 'mg/dL', referenceRange: '< 30' },
  ],
  'Kidney Function Test (KFT)': [
    { name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.6 - 1.2' },
    { name: 'Blood Urea Nitrogen (BUN)', value: '15', unit: 'mg/dL', referenceRange: '7 - 20' },
    { name: 'Serum Uric Acid', value: '5.2', unit: 'mg/dL', referenceRange: '3.5 - 7.2' },
    { name: 'Serum Sodium', value: '140', unit: 'mEq/L', referenceRange: '136 - 145' },
    { name: 'Serum Potassium', value: '4.4', unit: 'mEq/L', referenceRange: '3.5 - 5.1' },
  ],
  'Liver Function Test (LFT)': [
    { name: 'Bilirubin Total', value: '0.8', unit: 'mg/dL', referenceRange: '0.2 - 1.2' },
    { name: 'SGOT / AST', value: '25', unit: 'U/L', referenceRange: '10 - 40' },
    { name: 'SGPT / ALT', value: '30', unit: 'U/L', referenceRange: '7 - 56' },
    { name: 'Alkaline Phosphatase (ALP)', value: '85', unit: 'U/L', referenceRange: '44 - 147' },
    { name: 'Serum Protein Total', value: '7.2', unit: 'g/dL', referenceRange: '6.0 - 8.3' },
  ],
  'Diabetes Panel': [
    { name: 'Fasting Blood Glucose', value: '92', unit: 'mg/dL', referenceRange: '70 - 99' },
    { name: 'Post Prandial Glucose', value: '128', unit: 'mg/dL', referenceRange: '< 140' },
    { name: 'HbA1c (Glycated Hemoglobin)', value: '5.4', unit: '%', referenceRange: '< 5.7' },
  ],
  'Thyroid Profile (T3, T4, TSH)': [
    { name: 'Total T3', value: '1.2', unit: 'ng/mL', referenceRange: '0.8 - 2.0' },
    { name: 'Total T4', value: '8.4', unit: 'mcg/dL', referenceRange: '5.1 - 14.1' },
    { name: 'TSH (Ultrasensitive)', value: '2.1', unit: 'uIU/mL', referenceRange: '0.4 - 4.2' },
  ],
}

export default function LabWorklistPage() {
  const [worklists, setWorklists] = useState<WorklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [criticalFilter, setCriticalFilter] = useState(false)
  const [criticalCount, setCriticalCount] = useState(0)
  
  // Result Entry Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [sampleIdInput, setSampleIdInput] = useState('')
  const [patientNameInput, setPatientNameInput] = useState('')
  const [patientAgeInput, setPatientAgeInput] = useState('35')
  const [patientGenderInput, setPatientGenderInput] = useState('Male')
  const [testNameInput, setTestNameInput] = useState('Complete Blood Count (CBC)')
  const [technicianNotesInput, setTechnicianNotesInput] = useState('')
  const [paramsList, setParamsList] = useState<Parameter[]>(TEST_TEMPLATES['Complete Blood Count (CBC)'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  useEffect(() => {
    fetchWorklists()
  }, [statusFilter, criticalFilter])

  const fetchWorklists = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (criticalFilter) params.set('critical', 'true')

      const res = await fetch(`/api/admin/lab-worklist?${params.toString()}`)
      const data = await res.json()
      setWorklists(data.worklists || [])
      setCriticalCount(data.criticalCount || 0)
    } catch (err) {
      console.error('Fetch worklist error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateName: string) => {
    setTestNameInput(templateName)
    if (TEST_TEMPLATES[templateName]) {
      setParamsList([...TEST_TEMPLATES[templateName]])
    }
  }

  const handleParamChange = (index: number, field: keyof Parameter, val: string) => {
    setParamsList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const addParamRow = () => {
    setParamsList((prev) => [
      ...prev,
      { name: '', value: '', unit: '', referenceRange: '' }
    ])
  }

  const removeParamRow = (index: number) => {
    setParamsList((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setModalMessage('')

    try {
      const res = await fetch('/api/admin/lab-worklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: sampleIdInput.trim() || `APC-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
          patientName: patientNameInput.trim(),
          patientAge: Number(patientAgeInput) || 30,
          patientGender: patientGenderInput,
          testName: testNameInput,
          technicianNotes: technicianNotesInput,
          parameters: paramsList,
          status: 'results_entered'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit results')

      setModalMessage(data.isCritical 
        ? '⚠️ Results saved! CRITICAL VALUE DETECTED - Alert generated for pathologist.' 
        : '✓ Results saved & forwarded to Pathologist for verification.'
      )

      setTimeout(() => {
        setIsEntryModalOpen(false)
        setModalMessage('')
        fetchWorklists()
      }, 1400)
    } catch (err: any) {
      setModalMessage(err.message || 'Submission failed')
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
            Technician Lab Worklist & Result Entry
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Input analyzer values, inspect reference ranges, and auto-detect critical panic values before pathologist verification.
          </p>
        </div>

        <button
          onClick={() => {
            setSampleIdInput(`APC-2026-${Math.floor(Math.random() * 900000 + 100000)}`)
            setPatientNameInput('')
            setParamsList(TEST_TEMPLATES['Complete Blood Count (CBC)'])
            setIsEntryModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Enter Test Results</span>
        </button>
      </div>

      {/* ═══ CRITICAL ALERT BANNER ═══ */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900">
                Critical / Panic Value Alerts Detected ({criticalCount} Cases)
              </p>
              <p className="text-xs text-rose-700">
                Patient results contain life-threatening abnormal levels. Immediate clinical telephonic alert recommended.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCriticalFilter(!criticalFilter)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 shadow-sm"
          >
            {criticalFilter ? 'Show All' : 'Filter Critical Only'}
          </button>
        </div>
      )}

      {/* ═══ FILTERS ═══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'results_entered', 'verified', 'rejected', 'amended'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st)
              setCriticalFilter(false)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
              statusFilter === st && !criticalFilter
                ? 'bg-[var(--navy)] text-white'
                : 'bg-white border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]'
            }`}
          >
            {st === 'all' ? 'All Worklists' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ═══ WORKLIST TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading technician worklist...
          </div>
        ) : worklists.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-base font-bold text-[var(--navy)]">No test result entries found</p>
            <p className="text-xs text-[var(--gray-500)] mt-1">Click "Enter Test Results" above to record analyzer findings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Sample / Test</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Parameters Summary</th>
                  <th className="px-5 py-3.5">Alerts</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Technician</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {worklists.map((w) => (
                  <tr key={w._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                    <td className="px-5 py-4 font-mono">
                      <div className="font-bold text-[var(--navy)]">{w.testName}</div>
                      <div className="text-xs text-[var(--gray-500)] font-mono">{w.sampleId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[var(--navy)]">{w.patientName}</div>
                      <div className="text-xs text-[var(--gray-500)]">
                        {w.patientAge ? `${w.patientAge} Y / ` : ''}{w.patientGender || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-1 max-w-sm">
                        {w.parameters?.slice(0, 3).map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-700">
                            <span className="truncate">{p.name}:</span>
                            <span className={`font-mono font-bold ${
                              p.flag === 'critical' ? 'text-rose-600 bg-rose-50 px-1.5 rounded' : 
                              p.flag === 'high' ? 'text-amber-600' : 
                              p.flag === 'low' ? 'text-blue-600' : 'text-slate-800'
                            }`}>
                              {p.value} {p.unit}
                            </span>
                          </div>
                        ))}
                        {w.parameters?.length > 3 && (
                          <span className="text-[10px] text-[var(--gray-400)]">+{w.parameters.length - 3} more parameters</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {w.criticalAlert ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          ⚠️ CRITICAL
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">✓ Normal Ranges</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize border ${
                        w.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        w.status === 'results_entered' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        w.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {w.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--gray-600)]">
                      {w.technicianName || 'Lab Technician'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSampleIdInput(w.sampleId)
                          setPatientNameInput(w.patientName)
                          setPatientAgeInput(String(w.patientAge || 30))
                          setPatientGenderInput(w.patientGender || 'Male')
                          setTestNameInput(w.testName)
                          setParamsList(w.parameters || [])
                          setIsEntryModalOpen(true)
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[var(--gray-200)] text-[var(--navy)] hover:bg-[var(--gray-100)] text-xs font-bold"
                      >
                        Edit / View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: ENTER TEST RESULTS ═══ */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--navy)]">Diagnostic Result Entry & Value Evaluation</h3>
                <p className="text-xs text-[var(--gray-500)]">Record machine values with automated panic alert checks</p>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-[var(--gray-600)]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitResults} className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold ${
                  modalMessage.includes('CRITICAL') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {modalMessage}
                </div>
              )}

              {/* Patient & Sample Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <label className="font-bold text-[var(--navy)] block mb-1">Sample ID / Barcode *</label>
                  <input
                    type="text"
                    required
                    value={sampleIdInput}
                    onChange={(e) => setSampleIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--navy)] block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="font-bold text-[var(--navy)] block mb-1">Age</label>
                    <input
                      type="number"
                      value={patientAgeInput}
                      onChange={(e) => setPatientAgeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="font-bold text-[var(--navy)] block mb-1">Gender</label>
                    <select
                      value={patientGenderInput}
                      onChange={(e) => setPatientGenderInput(e.target.value)}
                      className="w-full px-2 py-2 bg-white rounded-lg border border-slate-300"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Select Diagnostic Panel Template</label>
                <select
                  value={testNameInput}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--gray-200)] text-xs sm:text-sm font-semibold text-[var(--navy)]"
                >
                  {Object.keys(TEST_TEMPLATES).map((tmpl) => (
                    <option key={tmpl} value={tmpl}>{tmpl}</option>
                  ))}
                  <option value="Custom Test Panel">Custom Test Panel</option>
                </select>
              </div>

              {/* Parameter Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                    Test Parameters & Measured Values
                  </label>
                  <button
                    type="button"
                    onClick={addParamRow}
                    className="text-xs font-bold text-[var(--blue)] hover:underline"
                  >
                    + Add Parameter
                  </button>
                </div>

                <div className="space-y-2">
                  {paramsList.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)]/50">
                      <input
                        type="text"
                        placeholder="Parameter Name (e.g. Hemoglobin)"
                        value={p.name}
                        onChange={(e) => handleParamChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-[var(--gray-200)] text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={p.value}
                        onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white rounded-lg border border-[var(--gray-200)] text-xs font-bold font-mono text-[var(--navy)]"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={p.unit}
                        onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                        className="w-20 px-2 py-1.5 bg-white rounded-lg border border-[var(--gray-200)] text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Ref Range"
                        value={p.referenceRange}
                        onChange={(e) => handleParamChange(idx, 'referenceRange', e.target.value)}
                        className="w-28 px-2 py-1.5 bg-white rounded-lg border border-[var(--gray-200)] text-xs text-[var(--gray-500)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeParamRow(idx)}
                        className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technician Notes */}
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Technician Observations / Equipment Notes</label>
                <textarea
                  rows={2}
                  value={technicianNotesInput}
                  onChange={(e) => setTechnicianNotesInput(e.target.value)}
                  placeholder="e.g. Analyzed on Automated Hematology Cell Counter. Calibrations verified."
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--gray-200)] text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--navy)] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {isSubmitting ? 'Verifying & Saving...' : 'Submit to Pathologist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
