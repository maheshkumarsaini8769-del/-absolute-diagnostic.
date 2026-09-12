'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface AnalyzedParameter {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  indicator: 'normal' | 'high' | 'low' | 'critical';
  explanationHindi: string;
  explanationEnglish: string;
  organ: string;
}

export default function SecondOpinionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<{
    parameters: AnalyzedParameter[];
    clinicalVerdict: string;
    abnormalCount: number;
    criticalCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg('');

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !manualText.trim()) {
      setErrorMsg('कृपया रिपोर्ट की फ़ोटो या PDF चुनें, अथवा रिपोर्ट का टेक्स्ट लिखें।');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');
    setResults(null);

    try {
      let textToSend = manualText;

      // If an image was selected, run fast in-browser Tesseract OCR so serverless gets crisp text
      if (file && file.type.startsWith('image/')) {
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          const ret = await worker.recognize(file);
          textToSend = `${textToSend}\n${ret.data.text}`;
          await worker.terminate();
        } catch (ocrErr) {
          console.warn('Browser OCR note:', ocrErr);
        }
      }

      const formData = new FormData();
      if (file) formData.append('file', file);
      if (textToSend) formData.append('text', textToSend);

      const res = await fetch('/api/report-second-opinion', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze report');
      }

      setResults(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'विश्लेषण में समस्या आई। कृपया साफ़ फ़ोटो अपलोड करें।');
    }
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">AI Lab Report Explainer &amp; Second Opinion</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            <span>🤖</span> 100% Free Instant AI Explainer
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            किसी भी लैब की रिपोर्ट समझें — AI सेकंड ओपिनियन
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            किसी भी अस्पताल या लैब की रिपोर्ट अपलोड करें। हमारी AI सिस्टम <strong>10 सेकंड में</strong> रिपोर्ट के कठिन मेडिकल नंबरों को आसान हिंदी में समझाकर बताएगी कि कौन सी वैल्यू सामान्य है और कौन सी खतरे में।
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleAnalyze} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                अपनी टेस्ट रिपोर्ट की फ़ोटो या PDF अपलोड करें:
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                {file ? (
                  <div className="space-y-2">
                    <span className="text-3xl block">📄</span>
                    <span className="font-bold text-slate-800 text-sm block">{file.name}</span>
                    <span className="text-xs text-teal-600 font-semibold">बदलने के लिए क्लिक करें</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl mx-auto">
                      📸
                    </div>
                    <span className="font-bold text-slate-800 text-sm block">
                      फ़ोटो खींचें या गैलरी / PDF से चुनें
                    </span>
                    <span className="text-xs text-slate-500 block">
                      (CBC, LFT, KFT, Thyroid, Sugar, Lipid, Urine etc.)
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* Optional Manual Text Paste */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                या सीधे रिपोर्ट की वैल्यू यहाँ लिख दें (वैकल्पिक):
              </label>
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="उदा. Hemoglobin 10.2, SGPT 55, TSH 6.8, Creatinine 1.4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI रिपोर्ट पढ़ रहा है और विश्लेषण कर रहा है...</span>
                </>
              ) : (
                <>
                  <span>🔬</span>
                  <span>रिपोर्ट समझें — AI सेकंड ओपिनियन देखें ➔</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Verdict Banner */}
            <div
              className={`p-6 rounded-3xl border shadow-sm ${
                results.criticalCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : results.abnormalCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xl">
                  {results.criticalCount > 0 ? '🚨' : results.abnormalCount > 0 ? '⚠️' : '✅'}
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  {results.criticalCount > 0
                    ? 'गंभीर असामान्यता पाई गई (डॉक्टर परामर्श आवश्यक)'
                    : results.abnormalCount > 0
                    ? 'हल्की असामान्यता (जीवनशैली व खान-पान पर ध्यान दें)'
                    : 'सभी जांच परिणाम सामान्य सीमा में हैं'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                पहचाने गए कुल <strong>{results.parameters.length}</strong> मापदंडों में से{' '}
                <strong>{results.abnormalCount}</strong> मान सामान्य सीमा से बाहर हैं। नीचे प्रत्येक टेस्ट का सरल हिंदी में अर्थ दिया गया है:
              </p>
            </div>

            {/* List of Detected Parameters with Color Badges */}
            <div className="space-y-3.5">
              {results.parameters.map((p, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl bg-white border transition-all ${
                    p.indicator === 'critical'
                      ? 'border-rose-400 shadow-sm shadow-rose-100'
                      : p.indicator === 'high' || p.indicator === 'low'
                      ? 'border-amber-300 shadow-sm shadow-amber-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{p.parameter}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {p.organ}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        सामान्य सीमा (Reference Range): <span className="font-mono font-medium text-slate-700">{p.referenceRange} {p.unit}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block leading-none">आपकी वैल्यू</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {p.value} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          p.indicator === 'critical'
                            ? 'bg-rose-600 text-white'
                            : p.indicator === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : p.indicator === 'low'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.indicator}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-teal-800 block mb-0.5">💡 सरल हिंदी में इसका क्या अर्थ है:</span>
                    {p.explanationHindi}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA to verify or re-test */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-white">क्या आपको दोबारा टेस्ट या कन्फर्मेशन चाहिए?</h4>
                <p className="text-xs text-slate-400 mt-0.5">Absolute Diagnostic की NABL प्रमाणित लैब से घर बैठे सटीक जांच करवाएं।</p>
              </div>
              <Link
                href="/booking"
                className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm font-bold shadow-lg transition-all shrink-0 text-center"
              >
                घर पर ब्लड सैंपल बुक करें ➔
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
