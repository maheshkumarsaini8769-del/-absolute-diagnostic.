'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import HomepageAnimations from '@/components/HomepageAnimations'

interface BookingItem {
  testName: string
  testPrice: number
}

interface Booking {
  id: string
  bookingId: string
  patientName: string
  patientPhone: string
  patientEmail: string | null
  collectionType: string
  preferredDate: string | null
  preferredTime: string | null
  status: string
  totalAmount: number
  homeCharge: number
  nightCharge: number
  isNightBooking: boolean
  createdAt: string
  items: BookingItem[]
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId) return
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        if (!res.ok) {
          setError('Booking not found')
          setLoading(false)
          return
        }
        const data = await res.json()
        setBooking(data.booking || data)
      } catch {
        setError('Failed to load booking')
      }
      setLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'requested': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'sample_collected': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'report_ready': return 'bg-green-50 text-green-700 border-green-200'
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  if (loading) {
    return (
      <HomepageAnimations>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </HomepageAnimations>
    )
  }

  if (error || !booking) {
    return (
      <HomepageAnimations>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--navy)] mb-2">Booking Not Found</h1>
            <p className="text-[var(--gray-500)] mb-6">{error || 'The booking you are looking for does not exist.'}</p>
            <Link href="/" className="btn-primary inline-flex"><span>Go Home</span></Link>
          </div>
        </div>
      </HomepageAnimations>
    )
  }

  const itemsTotal = booking.items.reduce((sum, item) => sum + item.testPrice, 0)

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Booking Confirmation</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Booking <span className="gradient-text">Confirmed</span>
          </h1>
          <p className="text-white/60 text-lg">Your booking has been submitted successfully.</p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="invoice-content" className="surface-elevated rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--gray-100)]">
              <div>
                <h2 className="text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Absolute Diagnostic</h2>
                <p className="text-xs text-[var(--gray-500)] mt-1">NABL Accredited Diagnostic Laboratory</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--gray-500)]">Booking ID</p>
                <p className="text-lg font-bold text-[var(--blue)] font-mono">{booking.bookingId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Patient Name</p>
                <p className="font-medium text-[var(--navy)]">{booking.patientName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Phone</p>
                <p className="font-medium text-[var(--navy)]">{booking.patientPhone}</p>
              </div>
              {booking.patientEmail && (
                <div>
                  <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-[var(--navy)]">{booking.patientEmail}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Collection Type</p>
                <p className="font-medium text-[var(--navy)]">{booking.collectionType === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</p>
              </div>
              {booking.preferredDate && (
                <div>
                  <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Preferred Date</p>
                  <p className="font-medium text-[var(--navy)]">{booking.preferredDate}</p>
                </div>
              )}
              {booking.preferredTime && (
                <div>
                  <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Preferred Time</p>
                  <p className="font-medium text-[var(--navy)]">{booking.preferredTime}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                  {formatStatus(booking.status)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1">Booking Date</p>
                <p className="font-medium text-[var(--navy)]">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-[var(--navy)] mb-3 uppercase tracking-wider">Tests / Packages</h3>
              <div className="border border-[var(--gray-100)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--gray-50)]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--navy)]">Item</th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--navy)]">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gray-100)]">
                    {booking.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-[var(--gray-600)]">{item.testName}</td>
                        <td className="px-4 py-3 text-right font-medium text-[var(--navy)]">₹{item.testPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[var(--gray-100)] pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--gray-500)]">Tests Total</span>
                <span className="font-medium text-[var(--navy)]">₹{itemsTotal}</span>
              </div>
              {booking.homeCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--gray-500)]">Home Collection Charge</span>
                  <span className="font-medium text-[var(--navy)]">₹{booking.homeCharge}</span>
                </div>
              )}
              {booking.nightCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--gray-500)]">Night Surcharge</span>
                  <span className="font-medium text-[var(--navy)]">₹{booking.nightCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--gray-100)]">
                <span className="text-[var(--navy)]">Total Amount</span>
                <span className="text-[var(--blue)]">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
            <button onClick={() => window.print()} className="btn-primary text-center">
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                Print Invoice
              </span>
            </button>
            <Link href="/" className="btn-outline text-center"><span>Go Home</span></Link>
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </HomepageAnimations>
  )
}
