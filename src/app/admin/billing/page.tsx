'use client'

import { useState, useEffect } from 'react'

interface BillingInvoice {
  _id: string
  invoiceNumber: string
  bookingCode: string
  patientName: string
  patientPhone: string
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  paymentMethod: string
  status: string
  receiptDate: string
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBilled, setTotalBilled] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)

  // Modals
  const [selectedInv, setSelectedInv] = useState<BillingInvoice | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Create Form
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [subtotalInput, setSubtotalInput] = useState('1500')
  const [discountInput, setDiscountInput] = useState('0')
  const [methodInput, setMethodInput] = useState('upi')
  const [paidInput, setPaidInput] = useState('1500')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchBilling()
  }, [])

  const fetchBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/billing')
      const data = await res.json()
      setInvoices(data.invoices || [])
      setTotalBilled(data.totalBilled || 0)
      setTotalPaid(data.totalPaid || 0)
      setTotalBalance(data.totalBalance || 0)
    } catch (err) {
      console.error('Fetch billing error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: nameInput,
          patientPhone: phoneInput,
          bookingCode: codeInput,
          subtotal: subtotalInput,
          discount: discountInput,
          paymentMethod: methodInput,
          paidAmount: paidInput,
        })
      })

      if (!res.ok) throw new Error('Failed to generate invoice')
      setIsCreateModalOpen(false)
      setNameInput('')
      setPhoneInput('')
      fetchBilling()
    } catch (err) {
      console.error(err)
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
            Billing, Invoicing & Receipts
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Track diagnostic fees, generate official tax receipts, record partial payments, and balance reconciliations.
          </p>
        </div>

        <button
          onClick={() => {
            setCodeInput(`WALK-${Math.floor(Math.random() * 90000 + 10000)}`)
            setIsCreateModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Generate Invoice / Bill</span>
        </button>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--gray-500)]">Total Invoiced Amount</p>
          <p className="text-2xl font-bold text-[var(--navy)] mt-1">₹{totalBilled.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <p className="text-xs font-semibold text-amber-600">Outstanding Balance Due</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">₹{totalBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading invoices...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Booking Code</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid / Balance</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-[var(--navy)]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[var(--navy)]">{inv.patientName}</div>
                      <div className="text-xs text-[var(--gray-500)]">{inv.patientPhone}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {inv.bookingCode}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[var(--navy)]">
                      ₹{inv.totalAmount}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="text-emerald-700 font-semibold">Paid: ₹{inv.paidAmount}</div>
                      {inv.balanceDue > 0 && <div className="text-rose-600 font-bold">Due: ₹{inv.balanceDue}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInv(inv)
                          setIsReceiptModalOpen(true)
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[var(--gray-200)] text-[var(--blue)] hover:bg-[var(--gray-50)] text-xs font-bold"
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: OFFICIAL RECEIPT VIEW ═══ */}
      {isReceiptModalOpen && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 mb-4">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--navy)]">ABSOLUTE DIAGNOSTIC</h3>
                  <p className="text-[11px] text-slate-500">NABL Accredited Clinical Laboratory</p>
                  <p className="text-[10px] text-slate-400">GSTIN: 27AAACA9876Q1Z8 • Reg # 487102</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[var(--blue)]">{selectedInv.invoiceNumber}</span>
                  <p className="text-[11px] text-slate-500">{new Date(selectedInv.receiptDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="text-xs space-y-1 mb-4 pb-3 border-b border-slate-200">
                <div>Patient Name: <span className="font-bold text-[var(--navy)]">{selectedInv.patientName}</span></div>
                <div>Phone: <span className="font-semibold">{selectedInv.patientPhone}</span></div>
                <div>Booking Reference: <span className="font-mono">{selectedInv.bookingCode}</span></div>
              </div>

              {/* Financials */}
              <div className="text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>₹{selectedInv.subtotal}</span>
                </div>
                {selectedInv.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-₹{selectedInv.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[var(--navy)] border-t border-slate-200 pt-2">
                  <span>Total Amount:</span>
                  <span>₹{selectedInv.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid via {selectedInv.paymentMethod.toUpperCase()}:</span>
                  <span>₹{selectedInv.paidAmount}</span>
                </div>
                {selectedInv.balanceDue > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{selectedInv.balanceDue}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                This is a computer-generated tax invoice. No signature required.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: CREATE INVOICE ═══ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Generate Diagnostic Bill</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Create walk-in test invoice and receipt</p>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Booking Ref</label>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Subtotal (₹) *</label>
                  <input
                    type="number"
                    required
                    value={subtotalInput}
                    onChange={(e) => setSubtotalInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Payment Method</label>
                  <select
                    value={methodInput}
                    onChange={(e) => setMethodInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash Counter</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="netbanking">NetBanking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
