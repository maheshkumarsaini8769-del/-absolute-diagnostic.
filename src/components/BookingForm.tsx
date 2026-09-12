'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface Test {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  homeCollection: boolean;
  nightAvailable: boolean;
  nightSurcharge?: number;
  category?: { name: string };
  preparationInstructions?: string;
  fastingRequired?: boolean;
}

interface Package {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  packageTests?: { test: Test }[];
}

interface CartItem {
  testName: string;
  testPrice: number;
  testId?: string;
  packageId?: string;
  type: 'test' | 'package';
}

interface Settings {
  home_collection_charge?: string;
  night_charge?: string;
  home_collection_enabled?: string;
  night_service_enabled?: string;
}

const steps = ['Select Tests', 'Collection Type', 'Patient Details', 'Price Review', 'Confirm'];
const shortLabels = ['Tests', 'Type', 'Details', 'Price', 'Confirm'];

export default function BookingForm({ initialCollection }: { initialCollection?: string }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [tests, setTests] = useState<Test[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionType, setCollectionType] = useState(initialCollection || 'lab_visit');
  const [isNight, setIsNight] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Family Member state
  const [bookingFor, setBookingFor] = useState<'self' | 'family'>('self');
  const [familyRelation, setFamilyRelation] = useState('Father');
  const [familyMemberName, setFamilyMemberName] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [gentleCareRequested, setGentleCareRequested] = useState(false);
  const [success, setSuccess] = useState<{ bookingId: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/tests').then((r) => r.json()),
      fetch('/api/packages').then((r) => r.json()),
      fetch('/api/homepage').then((r) => r.json()),
    ]).then(([testsData, packagesData, homeData]) => {
      const loadedTests: Test[] = testsData.tests || [];
      const loadedPackages: Package[] = packagesData.packages || [];
      setTests(loadedTests);
      setPackages(loadedPackages);
      setSettings(homeData.settings || {});

      // Check URL query parameters for pre-selected tests (e.g. from prescription analysis)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const testParam = urlParams.get('tests') || urlParams.get('testId');
        if (testParam) {
          const testIds = testParam.split(',').map(s => s.trim()).filter(Boolean);
          const matchedCartItems: CartItem[] = [];
          for (const tid of testIds) {
            const foundTest = loadedTests.find(t => t.id === tid);
            if (foundTest) {
              matchedCartItems.push({
                testId: foundTest.id,
                testName: foundTest.name,
                testPrice: foundTest.price,
                type: 'test'
              });
            }
          }
          if (matchedCartItems.length > 0) {
            setCart(matchedCartItems);
            setStep(2); // Advance to Collection Type step directly
          }
        }
      }
    }).catch(() => {});
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      if (prev.some((i) => i.testId === item.testId && item.testId) || prev.some((i) => i.packageId === item.packageId && item.packageId)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const filteredTests = tests.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const homeCharge = collectionType === 'home_collection' && settings.home_collection_charge
    ? parseFloat(settings.home_collection_charge)
    : 0;

  const getItemPrepInfo = (item: CartItem) => {
    if (item.type === 'test' && item.testId) {
      const test = tests.find(t => t.id === item.testId)
      if (test?.preparationInstructions) return { name: test.name, instructions: test.preparationInstructions, fasting: test.fastingRequired }
    }
    if (item.type === 'package' && item.packageId) {
      const pkg = packages.find(p => p.id === item.packageId)
      if (pkg?.packageTests) {
        const prepTests = pkg.packageTests.filter(pt => pt.test.preparationInstructions)
        if (prepTests.length > 0) {
          return {
            name: pkg.name,
            instructions: prepTests.map(pt => `${pt.test.name}: ${pt.test.preparationInstructions}`).join('\n'),
            fasting: pkg.packageTests.some(pt => pt.test.fastingRequired)
          }
        }
      }
    }
    return null
  }

  const cartPrepInfo = cart.map(getItemPrepInfo).filter(Boolean)

  const hasFastingRequired = cartPrepInfo.some(info => info?.fasting) || cart.some(item => {
    const tObj = tests.find(t => t.id === item.testId || t.name === item.testName);
    if (tObj?.fastingRequired) return true;
    const name = item.testName.toLowerCase();
    return (
      name.includes('glucose') ||
      name.includes('sugar') ||
      name.includes('lipid') ||
      name.includes('cholesterol') ||
      name.includes('triglyceride') ||
      name.includes('fasting')
    );
  });

  const nightCharge = isNight && settings.night_charge
    ? parseFloat(settings.night_charge)
    : 0;

  const itemsTotal = cart.reduce((sum, item) => sum + item.testPrice, 0);
  const totalAmountBeforeCoupon = itemsTotal + homeCharge + nightCharge;
  const totalAmount = Math.max(0, totalAmountBeforeCoupon - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, cartTotal: totalAmountBeforeCoupon })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponMsg({ type: 'error', text: data.error || 'Invalid coupon code' });
        setCouponDiscount(0);
        setAppliedCoupon(null);
      } else {
        setCouponDiscount(data.discount);
        setAppliedCoupon(data.code);
        setCouponMsg({ type: 'success', text: data.message });
      }
    } catch {
      setCouponMsg({ type: 'error', text: 'Failed to apply coupon' });
    } finally {
      setCouponLoading(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return cart.length > 0;
      case 2: return true;
      case 3:
        if (patientName.length < 2 || patientPhone.length < 10) return false;
        if (bookingFor === 'family' && familyMemberName.trim().length < 2) return false;
        return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const finalPatientName = bookingFor === 'family' && familyMemberName.trim()
        ? `${familyMemberName.trim()} (${familyRelation} of ${patientName.trim()})`
        : patientName;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: finalPatientName,
          patientPhone,
          patientEmail: patientEmail || undefined,
          patientAddress: collectionType === 'home_collection' ? patientAddress : undefined,
          collectionType,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          couponCode: appliedCoupon || undefined,
          couponDiscount: couponDiscount || undefined,
          familyMemberName: bookingFor === 'family' ? familyMemberName.trim() : undefined,
          familyMemberRelation: bookingFor === 'family' ? familyRelation : undefined,
          items: cart.map((item) => ({
            testName: item.testName,
            testPrice: item.testPrice,
            testId: item.testId || undefined,
            packageId: item.packageId || undefined,
          })),
          isNightBooking: isNight,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Booking failed. Please try again.');
        return;
      }
      setSuccess({ bookingId: data.booking.bookingId });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════
     SUCCESS STATE
     ═══════════════════════════════════════ */
  if (success) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 px-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--teal)]/20 to-[var(--blue)]/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[var(--teal)]/10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="text-3xl sm:text-4xl font-bold text-[var(--navy)] mb-3"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Booking Confirmed!
        </h2>
        <p className="text-[var(--gray-500)] mb-6 text-lg">Your booking has been submitted successfully.</p>
        <div className="inline-block bg-[var(--blue)]/5 border border-[var(--blue)]/20 rounded-2xl px-8 py-5 mb-5">
          <p className="text-sm text-[var(--gray-500)] mb-1">Your Booking ID</p>
          <p className="text-2xl font-bold text-[var(--blue)] tracking-wider">{success.bookingId}</p>
        </div>

        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-teal-50 border border-teal-200/80 max-w-md mx-auto text-center shadow-xs">
          <p className="text-xs font-bold text-teal-900 mb-2">Track Sample Collection & Lab Report Live:</p>
          <Link
            href={`/track?q=${success.bookingId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0b7d73] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all"
          >
            <span>🔍 Track Phlebotomist & Sample Status</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        <p className="text-sm text-[var(--gray-400)] mb-10 max-w-md mx-auto">
          Please save this ID for reference. Our team will contact you shortly to confirm your appointment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setSuccess(null);
              setCart([]);
              setStep(1);
              setPatientName('');
              setPatientPhone('');
              setPatientEmail('');
              setPatientAddress('');
              setPreferredDate('');
              setPreferredTime('');
              setCollectionType('lab_visit');
              setIsNight(false);
            }}
            className="px-8 py-3.5 rounded-xl border border-[var(--gray-200)] text-sm font-semibold text-[var(--navy)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all"
          >
            Book Another Test
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-primary text-sm"
          >
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     MAIN FORM
     ═══════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs font-bold transition-all duration-300 ${
                i + 1 < step
                  ? 'bg-gradient-to-br from-[var(--teal)] to-[var(--teal-dark)] text-white shadow-lg shadow-[var(--teal)]/20'
                  : i + 1 === step
                  ? 'bg-gradient-to-br from-[var(--blue)] to-[var(--blue-light)] text-white shadow-lg shadow-[var(--blue)]/20'
                  : 'bg-[var(--gray-100)] text-[var(--gray-400)]'
              }`}>
                {i + 1 < step ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 mx-1 sm:mx-1.5 rounded-full transition-all duration-300 ${
                  i + 1 < step ? 'bg-[var(--teal)]' : 'bg-[var(--gray-200)]'
                }`} style={{ width: 'clamp(8px, 4vw, 64px)' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`text-center flex-1 min-w-0 ${
                i + 1 === step ? 'text-[var(--blue)]' : i + 1 < step ? 'text-[var(--teal)]' : 'text-[var(--gray-400)]'
              }`}
            >
              <span className="text-[9px] sm:hidden font-semibold block truncate">{shortLabels[i]}</span>
              <span className={`hidden sm:inline text-xs font-medium truncate ${i + 1 === step ? 'text-[var(--blue)]' : i + 1 < step ? 'text-[var(--teal)]' : 'text-[var(--gray-400)]'}`}>{s}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          {error}
        </div>
      )}

      {/* ═══════════ STEP 1: SELECT TESTS ═══════════ */}
      {step === 1 && (
        <div className="space-y-5">
          <h3
            className="text-xl font-bold text-[var(--navy)]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Select Tests or Packages
          </h3>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests or packages..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm transition-all"
              aria-label="Search tests"
            />
          </div>

          {hasFastingRequired && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-2xs">
              <span className="text-xl shrink-0">⚠️</span>
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Fasting Required (10-12 Hours)</p>
                <p className="mt-0.5 text-amber-800">
                  One or more of your selected tests require 10-12 hours overnight fasting before sample collection (only plain water allowed).
                </p>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--blue)]/5 border border-[var(--blue)]/10">
              <p className="text-sm font-semibold text-[var(--blue)] mb-2">
                Selected ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </p>
              <div className="flex flex-wrap gap-2">
                {cart.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--blue)]/20 text-xs font-medium text-[var(--navy)] shadow-sm">
                    {item.testName}
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-[var(--gray-400)] hover:text-[var(--error)] transition-colors"
                      aria-label={`Remove ${item.testName}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {filteredPackages.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-[var(--gray-700)] mb-3 uppercase tracking-wider">Health Packages</h4>
              <div className="space-y-2.5">
                {filteredPackages.map((pkg) => {
                  const isSelected = cart.some((i) => i.packageId === pkg.id);
                  const testCount = pkg.packageTests?.length || 0;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        if (isSelected) {
                          const idx = cart.findIndex((i) => i.packageId === pkg.id);
                          if (idx >= 0) removeFromCart(idx);
                        } else {
                          addToCart({
                            testName: pkg.name,
                            testPrice: pkg.price,
                            packageId: pkg.id,
                            type: 'package',
                          });
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[var(--blue)] bg-[var(--blue)]/5 shadow-sm'
                          : 'border-[var(--gray-100)] hover:border-[var(--gray-200)] bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-[var(--blue)] bg-[var(--blue)]' : 'border-[var(--gray-300)]'
                        }`}>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--navy)] text-sm">{pkg.name}</p>
                          <p className="text-xs text-[var(--gray-500)] mt-0.5">{testCount} tests included</p>
                        </div>
                      </div>
                      <span className="font-bold text-[var(--navy)] text-sm">₹{pkg.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredTests.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-[var(--gray-700)] mb-3 uppercase tracking-wider">Individual Tests</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide pr-1">
                {filteredTests.map((test) => {
                  const isSelected = cart.some((i) => i.testId === test.id);
                  return (
                    <button
                      key={test.id}
                      onClick={() => {
                        if (isSelected) {
                          const idx = cart.findIndex((i) => i.testId === test.id);
                          if (idx >= 0) removeFromCart(idx);
                        } else {
                          addToCart({
                            testName: test.name,
                            testPrice: test.price,
                            testId: test.id,
                            type: 'test',
                          });
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[var(--blue)] bg-[var(--blue)]/5 shadow-sm'
                          : 'border-[var(--gray-100)] hover:border-[var(--gray-200)] bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected ? 'border-[var(--blue)] bg-[var(--blue)]' : 'border-[var(--gray-300)]'
                        }`}>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--navy)] text-sm truncate">{test.name}</p>
                          <p className="text-xs text-[var(--gray-500)]">{test.category?.name}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[var(--navy)] text-sm shrink-0 ml-3">₹{test.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!searchQuery && filteredTests.length === 0 && filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-4">
                <svg className="text-[var(--gray-300)]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[var(--gray-400)] text-sm">Loading tests and packages...</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ STEP 2: COLLECTION TYPE ═══════════ */}
      {step === 2 && (
        <div className="space-y-5">
          <h3
            className="text-xl font-bold text-[var(--navy)]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            How would you like to get tested?
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => { setCollectionType('lab_visit'); setIsNight(false); }}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                collectionType === 'lab_visit' && !isNight
                  ? 'border-[var(--blue)] bg-[var(--blue)]/5 shadow-md shadow-[var(--blue)]/5'
                  : 'border-[var(--gray-100)] hover:border-[var(--gray-200)] hover:shadow-sm'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                collectionType === 'lab_visit' && !isNight
                  ? 'bg-gradient-to-br from-[var(--blue)] to-[var(--blue-light)] text-white shadow-lg shadow-[var(--blue)]/20'
                  : 'bg-[var(--gray-100)] text-[var(--gray-400)] group-hover:bg-[var(--gray-200)]'
              }`}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
                  <path d="M9 7h6M9 11h6M9 15h6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--navy)]">Walk-in Lab Visit</p>
                <p className="text-sm text-[var(--gray-500)] mt-0.5">Visit any of our branches directly</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                collectionType === 'lab_visit' && !isNight ? 'border-[var(--blue)]' : 'border-[var(--gray-300)]'
              }`}>
                {collectionType === 'lab_visit' && !isNight && <div className="w-3 h-3 rounded-full bg-[var(--blue)]" />}
              </div>
            </button>

            <button
              onClick={() => { setCollectionType('home_collection'); setIsNight(false); }}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                collectionType === 'home_collection'
                  ? 'border-[var(--teal)] bg-[var(--teal)]/5 shadow-md shadow-[var(--teal)]/5'
                  : 'border-[var(--gray-100)] hover:border-[var(--gray-200)] hover:shadow-sm'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                collectionType === 'home_collection'
                  ? 'bg-gradient-to-br from-[var(--teal)] to-[var(--teal-dark)] text-white shadow-lg shadow-[var(--teal)]/20'
                  : 'bg-[var(--gray-100)] text-[var(--gray-400)] group-hover:bg-[var(--gray-200)]'
              }`}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--navy)]">Home Collection</p>
                <p className="text-sm text-[var(--gray-500)] mt-0.5">
                  Sample collected at your doorstep
                  {settings.home_collection_charge && (
                    <span className="text-[var(--teal)] font-semibold ml-1">
                      (+₹{settings.home_collection_charge})
                    </span>
                  )}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                collectionType === 'home_collection' ? 'border-[var(--teal)]' : 'border-[var(--gray-300)]'
              }`}>
                {collectionType === 'home_collection' && <div className="w-3 h-3 rounded-full bg-[var(--teal)]" />}
              </div>
            </button>

            {settings.night_service_enabled !== 'false' && (
              <button
                onClick={() => { setCollectionType('night_request'); setIsNight(true); }}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                  collectionType === 'night_request'
                    ? 'border-purple-300 bg-purple-50 shadow-md shadow-purple-500/5'
                    : 'border-[var(--gray-100)] hover:border-[var(--gray-200)] hover:shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  collectionType === 'night_request'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-[var(--gray-100)] text-[var(--gray-400)] group-hover:bg-[var(--gray-200)]'
                }`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--navy)]">Night Collection</p>
                  <p className="text-sm text-[var(--gray-500)] mt-0.5">
                    After-hours sample collection
                    {settings.night_charge && (
                      <span className="text-purple-500 font-semibold ml-1">
                        (+₹{settings.night_charge})
                      </span>
                    )}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  collectionType === 'night_request' ? 'border-purple-500' : 'border-[var(--gray-300)]'
                }`}>
                  {collectionType === 'night_request' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                </div>
              </button>
            )}
          </div>

          {/* Gentle Phlebotomy & Butterfly Needle Guarantee */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/90 flex items-start gap-3.5 transition-all">
            <input
              type="checkbox"
              id="gentleCareRequested"
              checked={gentleCareRequested}
              onChange={(e) => setGentleCareRequested(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#0d9488] rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="gentleCareRequested" className="cursor-pointer">
              <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                🦋 Request Painless Gentle Care (Butterfly Needle)
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                Recommended for kids, senior citizens, and needle-sensitive patients. Ultra-fine butterfly needles guarantee zero-trauma, painless vein sampling at no extra cost.
              </p>
            </label>
          </div>

          {collectionType === 'night_request' && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-purple-700 font-semibold mb-0.5">Night Request Notice</p>
                <p className="text-xs text-purple-600 leading-relaxed">
                  Night requests require confirmation from our team. We will contact you to confirm appointment timing and availability.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ STEP 3: PATIENT DETAILS ═══════════ */}
      {step === 3 && (
        <div className="space-y-5">
          <h3
            className="text-xl font-bold text-[var(--navy)]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Patient Details
          </h3>
          <div className="space-y-4">
            {/* Booking For Option */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Who is this test for?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingFor('self')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    bookingFor === 'self'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  👤 Myself
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFor('family')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    bookingFor === 'family'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  👨‍👩‍👧 Family Member
                </button>
              </div>

              {bookingFor === 'family' && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Relationship *
                    </label>
                    <select
                      value={familyRelation}
                      onChange={(e) => setFamilyRelation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse (Husband / Wife)</option>
                      <option value="Child">Child (Son / Daughter)</option>
                      <option value="Sibling">Brother / Sister</option>
                      <option value="Other">Other Relative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Family Member&apos;s Name *
                    </label>
                    <input
                      type="text"
                      value={familyMemberName}
                      onChange={(e) => setFamilyMemberName(e.target.value)}
                      placeholder="e.g. Mrs. Vimla Devi"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {bookingFor === 'family'
                  ? 'Primary Contact Person Name *'
                  : 'Full Name *'}
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm transition-all"
                required
                aria-label="Patient full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                Phone Number <span className="text-[var(--error)]">*</span>
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm transition-all"
                required
                maxLength={10}
                aria-label="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm transition-all"
                aria-label="Email address"
              />
            </div>
            {collectionType === 'home_collection' && (
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                  Collection Address <span className="text-[var(--error)]">*</span>
                </label>
                <textarea
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="Full address for sample collection"
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm resize-none transition-all"
                  aria-label="Collection address"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm transition-all"
                  aria-label="Preferred date"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                  Preferred Time
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:ring-2 focus:ring-[var(--blue)]/10 focus:border-[var(--blue)] outline-none text-sm bg-white transition-all"
                  aria-label="Preferred time"
                >
                  <option value="">Select time</option>
                  <option value="07:00-09:00">7:00 AM - 9:00 AM</option>
                  <option value="09:00-11:00">9:00 AM - 11:00 AM</option>
                  <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
                  <option value="13:00-15:00">1:00 PM - 3:00 PM</option>
                  <option value="15:00-17:00">3:00 PM - 5:00 PM</option>
                  <option value="17:00-19:00">5:00 PM - 7:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 4: PRICE REVIEW ═══════════ */}
      {step === 4 && (
        <div className="space-y-5">
          <h3
            className="text-xl font-bold text-[var(--navy)]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Price Breakdown
          </h3>
          <div className="surface-elevated rounded-2xl overflow-hidden">
            {cart.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between px-5 py-4 ${idx > 0 ? 'border-t border-[var(--gray-100)]' : ''}`}>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--navy)] text-sm truncate">{item.testName}</p>
                  <p className="text-xs text-[var(--gray-500)] capitalize">{item.type}</p>
                </div>
                <span className="font-medium text-[var(--navy)] text-sm shrink-0 ml-4">₹{item.testPrice}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--gray-100)] bg-[var(--gray-50)]">
              <p className="font-semibold text-[var(--gray-700)] text-sm">Tests Subtotal</p>
              <span className="font-semibold text-[var(--navy)] text-sm">₹{itemsTotal}</span>
            </div>
            {homeCharge > 0 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--gray-100)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--teal)]" />
                  <p className="font-medium text-[var(--gray-700)] text-sm">Home Collection Charge</p>
                </div>
                <span className="font-medium text-[var(--navy)] text-sm">₹{homeCharge}</span>
              </div>
            )}
            {nightCharge > 0 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--gray-100)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <p className="font-medium text-[var(--gray-700)] text-sm">Night Service Charge</p>
                </div>
                <span className="font-medium text-[var(--navy)] text-sm">₹{nightCharge}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--gray-100)] bg-emerald-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 text-sm">🏷️</span>
                  <p className="font-semibold text-emerald-800 text-sm">
                    Coupon Discount ({appliedCoupon})
                  </p>
                </div>
                <span className="font-bold text-emerald-700 text-sm">-₹{couponDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-5 border-t-2 border-[var(--blue)]/20 bg-gradient-to-r from-[var(--blue)]/5 to-[var(--teal)]/5">
              <p className="font-bold text-[var(--navy)] text-base">Total Amount</p>
              <span className="font-bold text-2xl gradient-text">₹{totalAmount}</span>
            </div>
          </div>

          {/* Coupon Code Input Box */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              🏷️ Apply Promo / Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="e.g. HEALTH10, AUDIT20"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold uppercase tracking-wider focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={couponLoading || !couponInput.trim()}
                onClick={handleApplyCoupon}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {couponMsg && (
              <p className={`mt-2 text-xs font-semibold ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {couponMsg.text}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
            <p className="text-xs text-[var(--gray-500)] leading-relaxed">
              Note: Final amount may vary based on test add-ons or modifications. Our team will confirm the exact amount before proceeding.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 5: CONFIRM ═══════════ */}
      {step === 5 && (
        <div className="space-y-5">
          <h3
            className="text-xl font-bold text-[var(--navy)]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Confirm Booking
          </h3>

          <div className="surface-elevated rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--gray-100)]">
              <p className="text-xs text-[var(--gray-500)] font-semibold uppercase tracking-wider mb-2">Tests / Packages</p>
              <div className="space-y-1">
                {cart.map((item, idx) => (
                  <p key={idx} className="text-sm font-medium text-[var(--navy)]">{item.testName}</p>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-5 border-b border-[var(--gray-100)]">
              <div>
                <p className="text-xs text-[var(--gray-500)] font-semibold uppercase tracking-wider mb-1">Collection Type</p>
                <p className="text-sm font-medium text-[var(--navy)] capitalize">
                  {collectionType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--gray-500)] font-semibold uppercase tracking-wider mb-1">Patient</p>
                <p className="text-sm font-medium text-[var(--navy)]">{patientName}</p>
                <p className="text-xs text-[var(--gray-500)]">{patientPhone}</p>
              </div>
            </div>
            {preferredDate && (
              <div className="px-5 py-4 grid grid-cols-2 gap-5 border-b border-[var(--gray-100)]">
                <div>
                  <p className="text-xs text-[var(--gray-500)] font-semibold uppercase tracking-wider mb-1">Preferred Date</p>
                  <p className="text-sm font-medium text-[var(--navy)]">{preferredDate}</p>
                </div>
                {preferredTime && (
                  <div>
                    <p className="text-xs text-[var(--gray-500)] font-semibold uppercase tracking-wider mb-1">Preferred Time</p>
                    <p className="text-sm font-medium text-[var(--navy)]">{preferredTime}</p>
                  </div>
                )}
              </div>
            )}
            <div className="px-5 py-5 bg-gradient-to-r from-[var(--blue)]/5 to-[var(--teal)]/5 flex items-center justify-between">
              <p className="font-bold text-[var(--navy)] text-base">Total</p>
              <span className="font-bold text-2xl gradient-text">₹{totalAmount}</span>
            </div>
          </div>

          {cartPrepInfo.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Preparation Required</p>
              </div>
              <div className="space-y-3">
                {cartPrepInfo.map((info: any, idx: number) => (
                  <div key={idx}>
                    <p className="text-xs font-semibold text-blue-800">{info.name}{info.fasting ? ' (Fasting Required)' : ''}</p>
                    <p className="text-xs text-blue-600 leading-relaxed whitespace-pre-line mt-0.5">{info.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              By confirming, you agree to our booking terms. Our team will contact you to confirm the appointment.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════ NAVIGATION ═══════════ */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-[var(--gray-100)]">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        ) : (
          <div />
        )}
        {step < 5 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[var(--blue)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-glow flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirm Booking
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
