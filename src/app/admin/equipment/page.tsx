'use client'

import { useState, useEffect } from 'react'

interface EquipmentLog {
  date: string
  type: string
  performedBy: string
  notes?: string
}

interface EquipmentItem {
  _id: string
  name: string
  modelNumber?: string
  serialNumber?: string
  department: string
  status: string
  lastCalibrationDate?: string
  nextCalibrationDate?: string
  serviceProvider?: string
  logs: EquipmentLog[]
}

export default function AdminEquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [calibrationDueCount, setCalibrationDueCount] = useState(0)

  // Modals
  const [selectedEq, setSelectedEq] = useState<EquipmentItem | null>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Log Form
  const [logType, setLogType] = useState('Standard Calibration Curve Verification')
  const [logNotes, setLogNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Add Form
  const [nameInput, setNameInput] = useState('')
  const [modelInput, setModelInput] = useState('')
  const [serialInput, setSerialInput] = useState('')
  const [deptInput, setDeptInput] = useState('biochemistry')
  const [vendorInput, setVendorInput] = useState('')

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/equipment')
      const data = await res.json()
      setEquipmentList(data.equipment || [])
      setCalibrationDueCount(data.calibrationDueCount || 0)
    } catch (err) {
      console.error('Fetch equipment error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEq) return
    setIsProcessing(true)

    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          equipmentId: selectedEq._id,
          logType,
          logNotes,
        })
      })

      if (!res.ok) throw new Error('Failed to save log')
      setIsLogModalOpen(false)
      setLogNotes('')
      fetchEquipment()
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          modelNumber: modelInput,
          serialNumber: serialInput,
          department: deptInput,
          serviceProvider: vendorInput,
        })
      })

      if (!res.ok) throw new Error('Failed to register equipment')
      setIsAddModalOpen(false)
      setNameInput('')
      setModelInput('')
      setSerialInput('')
      fetchEquipment()
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Laboratory Equipment & Analyzer Management
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Track diagnostic machinery, automated analyzers, calibration certificates, and preventive maintenance logs.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Register Analyzer</span>
        </button>
      </div>

      {/* ═══ ALERT BANNER ═══ */}
      {calibrationDueCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Calibration Attention Required ({calibrationDueCount} Analyzers)
              </p>
              <p className="text-xs text-amber-700">
                Regular calibration ensures optical and analytical precision as per NABL guidelines.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EQUIPMENT CARDS ═══ */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--gray-500)] animate-pulse">
          Loading equipment records...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {equipmentList.map((eq) => {
            const isDue = eq.status === 'calibration_due'
            return (
              <div
                key={eq._id}
                className="p-6 rounded-3xl bg-white border border-[var(--gray-200)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-slate-100 text-slate-700">
                      {eq.department}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
                      isDue ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {eq.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--navy)] mb-1">{eq.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--gray-500)] font-mono mb-4">
                    <span>Model: {eq.modelNumber || 'N/A'}</span>
                    <span>•</span>
                    <span>SN: {eq.serialNumber || 'N/A'}</span>
                  </div>

                  {/* Calibration Dates */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Calibrated:</span>
                      <span className="font-semibold text-slate-800">
                        {eq.lastCalibrationDate ? new Date(eq.lastCalibrationDate).toLocaleDateString() : 'Initial'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Next Due Date:</span>
                      <span className={`font-bold ${isDue ? 'text-amber-600' : 'text-slate-800'}`}>
                        {eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Agency:</span>
                      <span className="text-slate-700 truncate">{eq.serviceProvider || 'Certified OEM Team'}</span>
                    </div>
                  </div>

                  {/* Recent Log */}
                  {eq.logs && eq.logs.length > 0 && (
                    <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Latest Maintenance Record:</span>
                      <p className="font-semibold mt-0.5">{eq.logs[0].type}</p>
                      <p className="text-[11px] text-slate-500">{eq.logs[0].notes}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedEq(eq)
                      setIsLogModalOpen(true)
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs font-bold transition-colors"
                  >
                    + Log Calibration Check
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ MODAL: LOG CALIBRATION ═══ */}
      {isLogModalOpen && selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Record Calibration & QC Run</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">{selectedEq.name}</p>

            <form onSubmit={handleAddLog} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Calibration Activity *</label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                >
                  <option value="Standard Calibration Curve Verification">Standard Calibration Curve Verification</option>
                  <option value="Photometer / Optical Filter Standardization">Optical Filter Standardization</option>
                  <option value="Aspirating Needle & Tubing Replacement">Needle & Tubing Replacement</option>
                  <option value="Preventive Maintenance & Deep Clean">Preventive Maintenance & Deep Clean</option>
                  <option value="OEM Engineer Annual Service">OEM Engineer Annual Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Observations / Results *</label>
                <textarea
                  required
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Low, Normal, High calibrator controls passed with < 1.5% CV deviation."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs outline-none focus:border-[var(--blue)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  {isProcessing ? 'Saving...' : '✓ Confirm & Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: ADD EQUIPMENT ═══ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Register New Diagnostic Analyzer</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Add equipment to laboratory maintenance registry</p>

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Analyzer Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Vitros 5600 Integrated Chemistry System"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Department</label>
                  <select
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="biochemistry">Biochemistry</option>
                    <option value="hematology">Hematology</option>
                    <option value="immunology">Immunology</option>
                    <option value="microbiology">Microbiology</option>
                    <option value="general">General Lab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Model Number</label>
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Service Vendor</label>
                  <input
                    type="text"
                    value={vendorInput}
                    onChange={(e) => setVendorInput(e.target.value)}
                    placeholder="OEM Support"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
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
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  {isProcessing ? 'Saving...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
