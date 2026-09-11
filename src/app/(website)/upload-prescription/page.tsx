'use client';

import { useState, useRef, useEffect } from 'react';
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

interface CatalogSearchResult {
  id: string;
  name: string;
  price: number;
  category?: { name: string };
  fastingRequired?: boolean;
}

const POPULAR_TEST_SUGGESTIONS = [
  { name: 'Complete Blood Count (CBC)', hint: 'CBC' },
  { name: 'HbA1c (Glycated Haemoglobin)', hint: 'Sugar / HbA1c' },
  { name: 'Serum Creatinine', hint: 'Kidney / KFT' },
  { name: 'Blood Urea Nitrogen (BUN)', hint: 'Urea' },
  { name: 'Triglycerides', hint: 'Lipid / Heart' },
  { name: 'Urinalysis (Routine)', hint: 'Urine R/M' },
  { name: 'Haemoglobin (Hb)', hint: 'Hemoglobin' },
  { name: 'Anti TPO Antibodies', hint: 'Thyroid' },
];

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
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');

  // Analysis result state
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [customTextInput, setCustomTextInput] = useState('');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [detectedTests, setDetectedTests] = useState<MatchedTestItem[]>([]);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogSubtotal, setCatalogSubtotal] = useState(0);

  // Live Catalog Search within confirm step
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pharmacist lead state
  const [leadSuccessMsg, setLeadSuccessMsg] = useState('');

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
  const handleAnalyzeReport = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
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
    setOcrProgress(0);
    setOcrStatusText(language === 'hi' ? 'दस्तावेज़ की AI जांच हो रही है...' : 'Scanning & Analyzing Document with AI OCR...');

    let recognizedText = overrideText || customTextInput || '';

    // Fast device-side OCR for images (JPG / PNG)
    if (!recognizedText && filePreview && (mimeType.startsWith('image/') || !mimeType.includes('pdf'))) {
      try {
        setOcrStatusText(
          language === 'hi'
            ? 'मोबाइल AI द्वारा पर्ची से टेस्ट पढ़े जा रहे हैं...'
            : 'Scanning prescription with on-device AI...'
        );
        const Tesseract = await import('tesseract.js');
        const ocrRes = await Tesseract.recognize(filePreview, 'eng', {
          logger: (m: any) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });
        if (ocrRes?.data?.text && ocrRes.data.text.trim().length > 3) {
          recognizedText = ocrRes.data.text;
          setExtractedText(recognizedText);
          setCustomTextInput(recognizedText);
        }
      } catch (clientOcrErr) {
        console.warn('Client OCR note (will fallback to server):', clientOcrErr);
      }
    }

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
          providedText: recognizedText || overrideText || customTextInput || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      setAnalysisId(data.analysisId);
      const text = data.extractedText || '';
      setExtractedText(text);
      if (!customTextInput && text) {
        setCustomTextInput(text);
      }

      const rawMatches: MatchedTestItem[] = data.matchedTests || [];
      const seenIds = new Set<string>();
      const matches: MatchedTestItem[] = [];
      for (const m of rawMatches) {
        if (m.matchedCatalogTestId) {
          if (seenIds.has(m.matchedCatalogTestId)) continue;
          seenIds.add(m.matchedCatalogTestId);
        }
        matches.push(m);
      }
      setDetectedTests(matches);

      // Pre-select all detected catalog tests by default
      const preselected = matches
        .filter((m) => m.matchedCatalogTestId)
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

  // Search catalog tests when user types in search bar
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/tests?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tests || []);
        }
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add any test directly into the detected/selected list
  const addCatalogTestItem = (test: { id: string; name: string; price: number; fastingRequired?: boolean; category?: { name: string } }) => {
    if (selectedCatalogIds.includes(test.id)) return;

    const newItem: MatchedTestItem = {
      detectedName: test.name,
      normalizedName: test.name,
      matchedCatalogTestId: test.id,
      catalogName: test.name,
      categoryName: test.category?.name || 'Diagnostic Test',
      price: test.price,
      confidence: 1.0,
      matchStatus: 'EXACT_MATCH',
      isConfirmedByUser: true,
      fastingRequired: test.fastingRequired,
    };

    const nextList = [newItem, ...detectedTests.filter((d) => d.matchedCatalogTestId !== test.id)];
    const nextSelected = [...selectedCatalogIds, test.id];

    setDetectedTests(nextList);
    setSelectedCatalogIds(nextSelected);
    calculateTotal(nextList, nextSelected);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 1-Click: Let Lab Pharmacist verify handwriting & book for patient
  const handleDirectPharmacistSubmit = async () => {
    if (!patientName.trim() || !patientPhone.trim() || !filePreview) {
      setErrorMsg(language === 'hi' ? 'कृपया नाम और मोबाइल नंबर भरें' : 'Please provide patient name and phone');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.replace(/\D/g, '').slice(-10),
          patientAddress,
          notes: notes || 'Submitted from prescription scanner for lab pharmacist callback',
          fileData: filePreview,
          fileName: fileName || 'prescription.jpg',
          mimeType: mimeType || 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setLeadSuccessMsg(data.message || 'Prescription uploaded successfully!');
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting prescription');
    } finally {
      setLoading(false);
    }
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

      if (data.bookingUrl) {
        router.push(data.bookingUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error proceeding to booking');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{language === 'hi' ? 'वापस होम पर जाएं' : 'Back to Home'}</span>
          </Link>
        </div>

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
                        setExtractedText('');
                        setCustomTextInput('');
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
              {language === 'hi' ? 'दस्तावेज़ की AI जांच हो रही है...' : 'Scanning & Analyzing Document with AI OCR...'}
            </h2>
            {ocrStatusText && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{ocrStatusText}</span>
                {ocrProgress > 0 && <span className="text-emerald-600 font-mono">({ocrProgress}%)</span>}
              </div>
            )}
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'OCR पर्ची में से लिखे हुए टेस्ट के नाम पढ़ रहा है और आधिकारिक लैब कैटलॉग से मैच कर रहा है...'
                : 'Extracting medical text, identifying test names, and fetching official prices from certified catalog...'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Optimizing contrast &amp; reading prescription</span>
            </div>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>{language === 'hi' ? 'वापस जाएं (Change File)' : 'Back / Re-upload'}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* OCR Scanned Text Summary Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'hi' ? 'पर्ची से पढ़ा गया टेक्स्ट:' : 'OCR Scanned Text:'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {extractedText ? `${extractedText.slice(0, 60)}...` : '(No clear printed text detected)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTextEditor(!showTextEditor)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {showTextEditor ? 'Hide Text' : 'Edit / Add Text ✏️'}
                </button>
              </div>

              {showTextEditor && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'hi'
                      ? 'यदि कोई टेस्ट छूट गया हो, तो यहाँ नाम टाइप करें (जैसे: CBC, LFT, Sugar):'
                      : 'If OCR missed anything, edit or type test names (e.g. CBC, LFT, Sugar):'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTextInput}
                      onChange={(e) => setCustomTextInput(e.target.value)}
                      placeholder="e.g. CBC, LFT, Lipid Profile, Sugar"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAnalyzeReport(undefined, customTextInput)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      {language === 'hi' ? 'री-मैच करें' : 'Re-match'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Detected Tests */}
            <div className="space-y-3">
              {detectedTests.length === 0 ? (
                <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <span className="text-3xl block">🔍</span>
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      {language === 'hi'
                        ? 'पर्ची से कोई प्रिंटेड टेस्ट अपने-आप नहीं मिला'
                        : 'No matching tests automatically detected from this image.'}
                    </p>
                    <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                      {language === 'hi'
                        ? 'डॉक्टर की हाथ की लिखाई होने पर ऐसा हो सकता है। नीचे दिए गए लोकप्रिय टेस्ट में से चुनें, या पर्ची सबमिट करें ताकि लैब टीम कॉल करके टेस्ट जोड़े।'
                        : 'Doctor handwriting or blurry images can be hard for OCR. Quick-add from popular tests below, search catalog, or request a free callback.'}
                    </p>
                  </div>

                  {/* 1-Click Callback Button for Handwriting */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDirectPharmacistSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <span>📞</span>
                      <span>
                        {language === 'hi'
                          ? 'पर्ची सबमिट करें — लैब टीम कॉल करके टेस्ट फाइनल करेगी'
                          : 'Submit for Free Lab Callback (We Will Call in 10 Mins)'}
                      </span>
                    </button>
                  </div>
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
                            Report Text: &ldquo;{test.detectedName}&rdquo; {test.categoryName ? `• ${test.categoryName}` : ''}
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

            {/* Quick Add Popular Tests Chips */}
            <div className="pt-2">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                {language === 'hi' ? '⚡ लोकप्रिय टेस्ट जोड़ें (1-क्लिक):' : '⚡ Quick-Add Popular Tests:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TEST_SUGGESTIONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/tests?search=${encodeURIComponent(item.name.split(' ')[0])}`);
                        if (res.ok) {
                          const data = await res.json();
                          const found = (data.tests || []).find((t: any) =>
                            t.name.toLowerCase().includes(item.hint.toLowerCase().split('/')[0].trim())
                          ) || data.tests?.[0];
                          if (found) {
                            addCatalogTestItem(found);
                          }
                        }
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-medium transition-all"
                  >
                    <span>+</span>
                    <span>{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-Page Catalog Search Bar */}
            <div className="relative pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'hi' ? '🔍 कोई अन्य टेस्ट खोजें और जोड़ें:' : '🔍 Search & Add Any Test From Catalog:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: Dengue, Vitamin D, Thyroid, Sugar...' : 'Search by name (e.g. Dengue, Calcium, Vitamin D)...'}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((result) => {
                    const isAlreadyAdded = selectedCatalogIds.includes(result.id);
                    return (
                      <div
                        key={result.id}
                        onClick={() => addCatalogTestItem(result)}
                        className="p-2.5 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-gray-900">{result.name}</div>
                          <div className="text-[10px] text-gray-500">{result.category?.name || 'General Pathology'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700">₹{result.price}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${isAlreadyAdded ? 'bg-gray-100 text-gray-500' : 'bg-emerald-600 text-white'}`}>
                            {isAlreadyAdded ? 'Added ✓' : '+ Add'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                <button
                  type="button"
                  onClick={handleDirectPharmacistSubmit}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition"
                >
                  📞 {language === 'hi' ? 'कॉल सहायता लें' : 'Request Callback'}
                </button>

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

        {/* ═══ STEP 4: SUCCESS / CALLBACK REQUESTED ═══ */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              {language === 'hi' ? 'पर्ची सफलतापूर्वक प्राप्त हुई!' : 'Prescription Uploaded Successfully!'}
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {leadSuccessMsg ||
                (language === 'hi'
                  ? 'हमारी लैब टीम और फार्मासिस्ट आपकी पर्ची की जांच करके अगले 10-15 मिनट में आपके मोबाइल नंबर पर कॉल करेंगे।'
                  : 'Our medical lab team is reviewing your doctor slip. We will call you within 10-15 minutes to confirm required tests and home collection time.')}
            </p>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 max-w-sm mx-auto text-left text-xs space-y-1 text-emerald-900">
              <div><strong>मरीज़:</strong> {patientName}</div>
              <div><strong>मोबाइल:</strong> +91 {patientPhone}</div>
              {patientAddress && <div><strong>पता:</strong> {patientAddress}</div>}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
              >
                {language === 'hi' ? 'होम पेज पर जाएं' : 'Back to Home'}
              </Link>
              <Link
                href="/booking"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                {language === 'hi' ? 'कैटलॉग देखें' : 'Browse All Tests'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

