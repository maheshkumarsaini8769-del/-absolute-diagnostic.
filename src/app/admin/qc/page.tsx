'use client'

import { useState, useEffect } from 'react'

interface QCRun {
  _id: string
  equipmentName: string
  testName: string
  controlLevel: string
  lotNumber: string
  targetValue: number
  measuredValue: number
  unit: string
  sd: number
  status: 'pass' | 'warning' | 'fail'
  operatorName: string
  correctiveAction?: string
  runDate: string
}

export default function AdminQualityControlPage() {
  const [runs, setRuns] = useState<QCRun[]>([])
  const [loading, setLoading] = useState(true)
  const [passCount, setPassCount] = useState(0)
  const [failCount, setFailCount] = useState(0)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eqInput, setEqInput] = useState('Beckman Coulter DxC 700 AU')
  const [testInput, setTestInput] = useState('Fasting Blood Glucose')
  const [levelInput, setLevelInput] = useState('level_2_normal')
  const [lotInput, setLotInput] = useState('LOT-2026-N1')
  const [targetInput, setTargetInput] = useState('100')
  const [measuredInput, setMeasuredInput] = useState('99.5')
  const [unitInput, setUnitInput] = useState('mg/dL')
  const [correctiveInput, setCorrectiveInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchQC()
  }, [])

  const fetchQC = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/qc')
      const data = await res.json()
      setRuns(data.runs || [])
      setPassCount(data.passCount || 0)
      setFailCount(data.failCount || 0)
    } catch (err) {
      console.error('Fetch QC error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddQC = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: eqInput,
          testName: testInput,
          controlLevel: levelInput,
          lotNumber: lotInput,
          targetValue: targetInput,
          measuredValue: measuredInput,
          unit: unitInput,
          correctiveAction: correctiveInput,
        })
      })

      if (!res.ok) throw new Error('Failed to record QC run')
      setIsModalOpen(false)
      fetchQC()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const total = runs.length
  const complianceRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : '100'

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Laboratory Quality Control (IQC / EQA)
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            NABL-standard internal quality control tracking, Westgard multi-rule checks, and standard deviation curves.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Log Daily QC Run</span>
        </button>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--gray-500)]">IQC Compliance Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-emerald-600">{complianceRate}%</span>
            <span className="text-xs text-slate-500">within 2 SD control limit</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Passed Control Runs</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{passCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <p className="text-xs font-semibold text-amber-600">Deviations / Warnings</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{failCount}</p>
        </div>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading quality control records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Analyzer / Test</th>
                  <th className="px-5 py-3.5">Control Level / Lot</th>
                  <th className="px-5 py-3.5">Target Value</th>
                  <th className="px-5 py-3.5">Measured Value</th>
                  <th className="px-5 py-3.5">Variance (SD)</th>
                  <th className="px-5 py-3.5">QC Status</th>
                  <th className="px-5 py-3.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {runs.map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[var(--navy)]">{r.testName}</div>
                      <div className="text-xs text-[var(--gray-500)]">{r.equipmentName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold uppercase">
                        {r.controlLevel.replace(/level_[0-9]_/, '')}
                      </span>
                      <div className="text-[11px] text-[var(--gray-400)] font-mono mt-1">{r.lotNumber}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700 font-semibold">
                      {r.targetValue} {r.unit}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[var(--navy)]">
                      {r.measuredValue} {r.unit}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      ±{r.sd} {r.unit}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                        r.status === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        r.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {r.status}
                      </span>
                      {r.correctiveAction && (
                        <div className="text-[10px] text-amber-700 mt-1 max-w-xs truncate" title={r.correctiveAction}>
                          Fix: {r.correctiveAction}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {r.operatorName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: LOG QC ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Log Daily Analyzer QC Run</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Record control material values and verify standard curve</p>

            <form onSubmit={handleAddQC} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Analyzer Instrument *</label>
                <input
                  type="text"
                  required
                  value={eqInput}
                  onChange={(e) => setEqInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Assay / Test Name *</label>
                <input
                  type="text"
                  required
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Control Level</label>
                  <select
                    value={levelInput}
                    onChange={(e) => setLevelInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="level_1_low">Level 1 (Low)</option>
                    <option value="level_2_normal">Level 2 (Normal)</option>
                    <option value="level_3_high">Level 3 (High)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={lotInput}
                    onChange={(e) => setLotInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Target</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Measured</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={measuredInput}
                    onChange={(e) => setMeasuredInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono font-bold text-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Unit</label>
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Corrective Action (if out of range)</label>
                <input
                  type="text"
                  value={correctiveInput}
                  onChange={(e) => setCorrectiveInput(e.target.value)}
                  placeholder="e.g. Re-calibrated with fresh lot vial"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  {isSubmitting ? 'Verifying...' : '✓ Log & Calculate Variance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
