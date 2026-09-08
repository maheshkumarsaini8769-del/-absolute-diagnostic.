'use client'

import { useState } from 'react'

export interface Testimonial {
  id: string
  patientName?: string
  name?: string
  content?: string
  text?: string
  rating?: number
  isFeatured?: boolean
  isActive?: boolean
  createdAt?: string | Date
}

interface ReviewsSectionProps {
  initialTestimonials: Testimonial[]
  heading?: string
}

export default function ReviewsSection({ initialTestimonials = [], heading }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Testimonial[]>(initialTestimonials)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false)

  // Form State
  const [patientName, setPatientName] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  // Calculations
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0'

  // Only show first 3 reviews on the homepage as requested
  const displayedReviews = reviews.slice(0, 3)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!patientName.trim()) {
      setFormError('Please enter your name.')
      return
    }

    if (!content.trim()) {
      setFormError('Please write your review feedback.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          rating,
          content: content.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Prepend the new review to local state immediately
      const newReview: Testimonial = data.testimonial || {
        id: 'new-' + Date.now(),
        patientName: patientName.trim(),
        content: content.trim(),
        rating,
        createdAt: new Date().toISOString()
      }

      setReviews((prev) => [newReview, ...prev])
      setFormSuccess(true)

      // Reset form fields
      setPatientName('')
      setContent('')
      setRating(5)

      // Auto close modal after brief delay
      setTimeout(() => {
        setFormSuccess(false)
        setIsWriteModalOpen(false)
      }, 1800)
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }

  return (
    <section className="py-12 lg:py-16 bg-white relative overflow-hidden" id="patient-reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ═══ TOP HEADER & WRITE A REVIEW BUTTON ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)]">
                Patient Testimonials
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg className="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {avgRating} / 5 ({totalReviews} Reviews)
              </span>
            </div>
            <h2
              className="text-xl sm:text-3xl lg:text-4xl font-bold text-[var(--navy)]"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {heading || 'What Our Patients Say'}
            </h2>
            <p className="text-[var(--gray-500)] text-sm sm:text-base mt-1">
              Real feedback from patients who rely on our accurate diagnostic testing
            </p>
          </div>

          {/* Upper Action: "Write a Review" Button */}
          <div className="shrink-0">
            <button
              onClick={() => {
                setFormError('')
                setFormSuccess(false)
                setIsWriteModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--blue)] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* ═══ 3 REVIEWS GRID (HOMEPAGE COMPACT) ═══ */}
        {displayedReviews.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-dashed border-[var(--gray-200)] bg-[var(--gray-50)]">
            <p className="text-[var(--gray-600)] text-sm mb-3">No reviews submitted yet. Be the first to share your experience!</p>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)] transition-colors"
            >
              + Write the First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedReviews.map((t, idx) => {
              const name = t.patientName || t.name || 'Patient'
              const initial = name.charAt(0).toUpperCase() || 'P'
              const text = t.content || t.text || ''
              const starCount = t.rating || 5

              return (
                <div
                  key={t.id || idx}
                  className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[var(--gray-50)]/70 to-white border border-[var(--gray-100)] hover:border-[var(--blue)]/30 hover:shadow-xl hover:shadow-[var(--navy)]/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Stars & Quote Icon */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < starCount ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <svg className="w-6 h-6 text-[var(--blue)]/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    {/* Review text */}
                    <p className="text-[var(--gray-600)] text-sm leading-relaxed mb-6 line-clamp-4">
                      "{text}"
                    </p>
                  </div>

                  {/* Patient Info Footer */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[var(--gray-100)]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--blue)] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--navy)] text-sm truncate">{name}</p>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Verified Patient</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ BOTTOM ACTION: VIEW ALL REVIEWS BUTTON ═══ */}
        {reviews.length > 0 && (
          <div className="mt-8 sm:mt-10 text-center">
            <button
              onClick={() => setIsViewAllModalOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[var(--gray-200)] bg-white hover:bg-[var(--gray-50)] text-[var(--navy)] hover:text-[var(--blue)] text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all duration-300 group"
            >
              <span>View All Reviews ({totalReviews})</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

      </div>

      {/* ═══ MODAL: WRITE A REVIEW ═══ */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--gray-100)] animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--gray-100)] bg-[var(--gray-50)]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5 text-[var(--blue)]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--navy)]">Write a Patient Review</h3>
                  <p className="text-xs text-[var(--gray-500)]">Your review will be immediately visible to all patients</p>
                </div>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-2 rounded-xl text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6">
              {formSuccess ? (
                <div className="py-8 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-[var(--navy)] mb-1">Thank You!</h4>
                  <p className="text-sm text-[var(--gray-600)]">Your review has been published and is now visible on the website.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider mb-1.5">
                      Your Rating *
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = (hoverRating || rating) >= star
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 focus:outline-none transition-transform hover:scale-110"
                            >
                              <svg
                                className={`w-7 h-7 ${isFilled ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} transition-colors`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-xs font-bold text-[var(--navy)] bg-[var(--gray-100)] px-2.5 py-1 rounded-lg">
                        {ratingDescriptions[hoverRating || rating]} ({hoverRating || rating}/5)
                      </span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g., Rajesh Kumar"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 text-sm outline-none transition-all"
                    />
                  </div>

                  {/* Feedback Content Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--navy)] uppercase tracking-wider mb-1.5">
                      Your Feedback / Experience *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your experience regarding our test accuracy, home collection staff, report speed, or lab hygiene..."
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 text-sm outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWriteModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-50)] text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--navy)] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <span>Submit Review</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: VIEW ALL REVIEWS ═══ */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-[var(--gray-100)] animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--gray-100)] bg-[var(--gray-50)]/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5 text-[var(--blue)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--navy)]">All Patient Reviews</h3>
                  <p className="text-xs text-[var(--gray-500)]">
                    {avgRating} ★ average rating based on {totalReviews} patient reviews
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewAllModalOpen(false)
                    setIsWriteModalOpen(true)
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)] transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Write a Review</span>
                </button>
                <button
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Reviews List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {reviews.map((t, idx) => {
                const name = t.patientName || t.name || 'Patient'
                const initial = name.charAt(0).toUpperCase() || 'P'
                const text = t.content || t.text || ''
                const starCount = t.rating || 5

                return (
                  <div
                    key={t.id || idx}
                    className="p-5 rounded-2xl bg-[var(--gray-50)]/70 border border-[var(--gray-100)] hover:border-[var(--blue)]/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--navy)] text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[var(--navy)]">{name}</h4>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${i < starCount ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--gray-600)] leading-relaxed pl-12">
                      "{text}"
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--gray-100)] bg-[var(--gray-50)] flex items-center justify-between shrink-0">
              <span className="text-xs text-[var(--gray-500)]">
                Showing all {totalReviews} approved patient reviews
              </span>
              <button
                onClick={() => setIsViewAllModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white border border-[var(--gray-200)] text-xs font-bold text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}
