'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface MatchedTestItem {
  detectedName: string;
  normalizedName: string;
  matchedCatalogTestId?: string;
  catalogName?: string;
  categoryName?: string;
  price?: number;
  confidence: number;
  matchStatus: 'EXACT_MATCH' | 'STRONG_MATCH' | 'POSSIBLE_MATCH' | 'NEEDS_CONFIRMATION' | 'NOT_FOUND';
  isConfirmedByUser: boolean;
  fastingRequired?: boolean;
}

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');

  // Flow State
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm_tests' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Analysis result state
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [detectedTests, setDetectedTests] = useState<MatchedTestItem[]>([]);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogSubtotal, setCatalogSubtotal] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(language === 'hi' ? 'फ़ाइल का साइज़ 15MB से कम होना चाहिए' : 'File size must be under 15MB');
      return;
    }

    setFileName(file.name);
    setMimeType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Submit image to AI/OCR and Medical Catalog Matcher
  const handleAnalyzeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया मरीज़ का नाम भरें' : 'Please enter patient name');
      return;
    }
    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg(language === 'hi' ? 'कृपया वैध 10-अंकों का मोबाइल नंबर भरें' : 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!filePreview) {
      setErrorMsg(language === 'hi' ? 'कृपया डॉक्टर की पर्ची / रिपोर्ट की फ़ाइल चुनें' : 'Please attach or capture your prescription/report');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStep('analyzing');

    try {
      const res = await fetch('/api/report-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: cleanPhone,
          patientAddress,
          fileData: filePreview,
          fileName,
          mimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      setAnalysisId(data.analysisId);
      const matches: MatchedTestItem[] = data.matchedTests || [];
      setDetectedTests(matches);

      // Pre-select matches that have valid catalog IDs
      const preselected = matches
        .filter((m) => m.matchedCatalogTestId && m.isConfirmedByUser)
        .map((m) => m.matchedCatalogTestId as string);

      setSelectedCatalogIds(preselected);
      calculateTotal(matches, preselected);
      setStep('confirm_tests');
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. You can choose tests manually.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: MatchedTestItem[], selectedIds: string[]) => {
    let total = 0;
    for (const item of items) {
      if (item.matchedCatalogTestId && selectedIds.includes(item.matchedCatalogTestId)) {
        total += item.price || 0;
      }
    }
    setCatalogSubtotal(total);
  };

  const toggleTestSelection = (catalogId: string) => {
    let next: string[];
    if (selectedCatalogIds.includes(catalogId)) {
      next = selectedCatalogIds.filter((id) => id !== catalogId);
    } else {
      next = [...selectedCatalogIds, catalogId];
    }
    setSelectedCatalogIds(next);
    calculateTotal(detectedTests, next);
  };

  // Step 2: Patient confirms tests -> Server validates prices & redirects to booking
  const handleProceedToBooking = async () => {
    if (selectedCatalogIds.length === 0) {
      setErrorMsg(language === 'hi' ? 'कृपया कम से कम एक टेस्ट चुनें' : 'Please confirm at least one test');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/report-analysis/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          selectedCatalogTestIds: selectedCatalogIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Confirmation failed');
      }

      // Seamless redirect to existing cart / booking flow with server-verified test IDs
      if (data.bookingUrl) {
        router.push(data.bookingUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error proceeding to booking');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
            {language === 'hi' ? 'AI रिपोर्ट एनालिसिस एवं टेस्ट डिटेक्शन' : 'AI Report & Prescription Scanner'}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            {language === 'hi' ? 'पर्ची अपलोड करें & टेस्ट चुनें' : 'Upload Report → Auto-Detect Tests'}
          </h1>
          <p className="mt-3 text-base text-gray-600 max-w-xl mx-auto">
            {language === 'hi'
              ? 'अपनी डॉक्टर पर्ची या पुरानी टेस्ट रिपोर्ट अपलोड करें। सिस्टम अपने आप टेस्ट पहचान कर लैब कैटलॉग से असली रेट दिखाएगा।'
              : 'Upload your doctor prescription or lab report. Our system automatically identifies tests, matches our certified lab catalog, and shows verified prices.'}
          </p>
        </div>

        {/* ═══ STEP 1: UPLOAD FORM ═══ */}
        {step === 'upload' && (
          <form onSubmit={handleAnalyzeReport} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'hi' ? 'डॉक्टर की पर्ची / रिपोर्ट की फोटो या PDF *' : 'Doctor Prescription / Report Photo or PDF *'}
              </label>

              {filePreview ? (
                <div className="relative rounded-xl border-2 border-emerald-500 overflow-hidden bg-slate-100 p-3">
                  {mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="py-12 text-center text-gray-700">
                      <span className="text-4xl block mb-2">📄</span>
                      <span className="font-semibold text-sm">{fileName}</span>
                    </div>
                  ) : (
                    <img
                      src={filePreview}
                      alt="Document preview"
                      className="max-h-72 mx-auto rounded-lg object-contain"
                    />
                  )}
                  <div className="mt-3 flex items-center justify-between px-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600 truncate">{fileName || 'document.jpg'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        setFileName('');
                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                        if (galleryInputRef.current) galleryInputRef.current.value = '';
                      }}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      {language === 'hi' ? 'बदलें / हटाएं' : 'Change / Remove'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Two Separate Buttons: Camera vs Gallery */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Direct Camera Click Button */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-center group cursor-pointer shadow-xs"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform">
                        📷
                      </div>
                      <span className="font-bold text-gray-900 text-sm">
                        {language === 'hi' ? 'कैमरा से फोटो खींचें' : 'Take Photo (Camera)'}
                      </span>
                      <span className="text-xs text-emerald-700 mt-0.5">
                        {language === 'hi' ? 'सीधा कैमरा खुलेगा' : 'Opens live phone camera'}
                      </span>
                    </button>

                    {/* Gallery / File Explorer Button */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group cursor-pointer shadow-xs"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform">
                        🖼️
                      </div>
                      <span className="font-bold text-gray-900 text-sm">
                        {language === 'hi' ? 'गैलरी / फ़ाइल से चुनें' : 'Choose from Gallery / PDF'}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {language === 'hi' ? 'फ़ोन गैलरी या PDF फ़ाइल' : 'Upload saved image or PDF'}
                      </span>
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-gray-500">
                    {language === 'hi' ? 'सपोर्टेड फॉर्मेट्स: JPG, JPEG, PNG, WebP, PDF (अधिकतम 15MB)' : 'Supported: JPG, JPEG, PNG, WebP, PDF (Max 15MB)'}
                  </p>
                </div>
              )}

              {/* Direct Camera Input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Gallery / File Manager Input */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Patient Name and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'hi' ? 'मरीज़ का नाम *' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: राहुल शर्मा' : 'e.g. Rahul Sharma'}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-gray-300 pl-12 pr-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'hi' ? 'घर का पता / लैंडमार्क (वैकल्पिक)' : 'Home Address / Landmark (Optional)'}
              </label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: 42, सिविल लाइन्स, जयपुर' : 'e.g. 42, Civil Lines, Jaipur'}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center space-x-2"
            >
              <span>🔬</span>
              <span>{language === 'hi' ? 'पर्ची स्कैन करें & टेस्ट पहचानें' : 'Scan Document & Detect Tests'}</span>
              <span>➔</span>
            </button>
          </form>
        )}

        {/* ═══ STEP 2: ANALYZING SPINNER ═══ */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'hi' ? 'दस्तावेज़ की जांच हो रही है...' : 'Scanning & Analyzing Document...'}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'सिस्टम पर्ची में से टेस्ट के नाम निकाल कर लैब कैटलॉग से मिला रहा है...'
                : 'Extracting medical text, normalizing abbreviations, and fetching official prices from catalog...'}
            </p>
          </div>
        )}

        {/* ═══ STEP 3: TEST CONFIRMATION SCREEN ═══ */}
        {step === 'confirm_tests' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                  {language === 'hi' ? 'रिपोर्ट एनालिसिस पूर्ण' : 'Report Analysis Complete'}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {language === 'hi' ? 'पहचाने गए टेस्ट व लैब रेट्स' : 'Detected Tests & Catalog Prices'}
                </h2>
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                {language === 'hi' ? 'दूसरी फ़ाइल अपलोड करें' : 'Upload Different File'}
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* List of Detected Tests */}
            <div className="space-y-3">
              {detectedTests.length === 0 ? (
                <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-2xl block mb-1">🔍</span>
                  <p className="text-sm font-semibold text-amber-900">
                    {language === 'hi' ? 'पर्ची से कोई टेस्ट स्पष्ट नहीं दिखा' : 'No matching catalog tests recognized automatically.'}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {language === 'hi' ? 'आप सीधे टेस्ट कैटलॉग से टेस्ट चुन सकते हैं।' : 'You can search and select tests directly from catalog.'}
                  </p>
                  <Link
                    href="/booking"
                    className="mt-3 inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                  >
                    {language === 'hi' ? 'मैन्युअल टेस्ट चुनें' : 'Select Tests Manually'}
                  </Link>
                </div>
              ) : (
                detectedTests.map((test, index) => {
                  const isSelected = test.matchedCatalogTestId ? selectedCatalogIds.includes(test.matchedCatalogTestId) : false;
                  const hasMatch = !!test.matchedCatalogTestId;

                  return (
                    <div
                      key={index}
                      onClick={() => hasMatch && test.matchedCatalogTestId && toggleTestSelection(test.matchedCatalogTestId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : hasMatch
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50/70 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!hasMatch}
                            onChange={() => {}}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">
                              {test.catalogName || test.detectedName}
                            </span>
                            {test.matchStatus === 'EXACT_MATCH' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Exact Match
                              </span>
                            )}
                            {test.matchStatus === 'STRONG_MATCH' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                Strong Match
                              </span>
                            )}
                            {test.matchStatus === 'NEEDS_CONFIRMATION' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Confirm Needed
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Report Text: &ldquo;{test.detectedName}&rdquo; {test.categoryName ? `&bull; ${test.categoryName}` : ''}
                          </div>
                          {test.fastingRequired && (
                            <span className="inline-block mt-1 text-[11px] text-amber-700 font-medium">
                              ⚠️ Fasting Required (10-12 hrs)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {hasMatch ? (
                          <>
                            <div className="text-base font-extrabold text-gray-900">₹{test.price}</div>
                            <span className="text-[10px] text-emerald-600 font-semibold block">Official Rate</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Not in Catalog</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Medical Safety Disclaimer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Safety Notice:</span> This system assists with test identification from doctor slips. Please confirm that the selected tests match your doctor prescription before booking.
            </div>

            {/* Subtotal & Continue Action Bar */}
            <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500 block">
                  {selectedCatalogIds.length} {language === 'hi' ? 'टेस्ट चुने गए' : 'Tests Selected'}
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  ₹{catalogSubtotal}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/booking"
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {language === 'hi' ? 'कैटलॉग से और जोड़ें' : '+ Add From Catalog'}
                </Link>

                <button
                  onClick={handleProceedToBooking}
                  disabled={loading || selectedCatalogIds.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-md disabled:opacity-50 transition"
                >
                  {loading ? 'Processing...' : language === 'hi' ? 'बुकिंग जारी रखें ➔' : 'Continue Booking ➔'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
