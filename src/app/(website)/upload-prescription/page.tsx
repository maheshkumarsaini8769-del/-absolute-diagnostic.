'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function UploadPrescriptionPage() {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(language === 'hi' ? 'फ़ाइल का साइज़ 10MB से कम होना चाहिए' : 'File size must be under 10MB');
      return;
    }

    setFileName(file.name);
    setMimeType(file.type);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setErrorMsg(language === 'hi' ? 'कृपया डॉक्टर की पर्ची (Prescription) की फोटो अपलोड करें' : 'Please attach a photo of the doctor prescription');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientPhone: cleanPhone,
          patientAddress,
          notes,
          fileData: filePreview,
          fileName,
          mimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload prescription');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
            {language === 'hi' ? 'डॉक्टर की पर्ची से टेस्ट बुक करें' : 'Easy 1-Click Prescription Booking'}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            {language === 'hi' ? 'डॉक्टर की पर्ची (Prescription) अपलोड करें' : 'Upload Doctor Prescription'}
          </h1>
          <p className="mt-3 text-base text-gray-600 max-w-xl mx-auto">
            {language === 'hi'
              ? 'टेस्ट के नाम ढूंढने की चिंता छोड़ें! बस डॉक्टर की पर्ची की फोटो खींचें, हमारे लैब एक्सपर्ट्स टेस्ट समझ कर आपकी होम कलेक्शन बुक कर देंगे।'
              : "Don't worry about searching test names! Simply snap a photo of your doctor's slip, and our diagnostic experts will arrange your home collection."}
          </p>
        </div>

        {/* 3 Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">1</div>
            <h4 className="font-semibold text-gray-900 text-sm">{language === 'hi' ? 'पर्ची की फोटो लें' : 'Snap / Upload Slip'}</h4>
            <p className="text-xs text-gray-500 mt-1">{language === 'hi' ? 'मोबाइल कैमरा या गैलरी से फोटो चुनें' : 'Camera or Gallery photo'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-2">2</div>
            <h4 className="font-semibold text-gray-900 text-sm">{language === 'hi' ? 'नंबर व पता भरें' : 'Enter Phone & Address'}</h4>
            <p className="text-xs text-gray-500 mt-1">{language === 'hi' ? 'ताकि हम आपसे संपर्क कर सकें' : 'For callback and collection'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-2">3</div>
            <h4 className="font-semibold text-gray-900 text-sm">{language === 'hi' ? '15 मिनट में कॉल बैक' : 'Callback in 15 Mins'}</h4>
            <p className="text-xs text-gray-500 mt-1">{language === 'hi' ? 'लैब टीम टेस्ट व टाइम कन्फर्म करेगी' : 'Lab team confirms appointment'}</p>
          </div>
        </div>

        {/* Form or Success View */}
        {success ? (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'hi' ? 'पर्ची सफलतापूर्वक प्राप्त हो गई!' : 'Prescription Received Successfully!'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
              {language === 'hi'
                ? 'धन्यवाद! हमारी पैथोलॉजी टीम आपकी पर्ची की जांच कर रही है और अगले 15 मिनट में आपके नंबर पर संपर्क करेगी।'
                : 'Thank you! Our pathology specialist is reviewing your prescription and will call your mobile number within 15 minutes.'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setFilePreview(null);
                  setPatientName('');
                  setPatientPhone('');
                  setPatientAddress('');
                  setNotes('');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {language === 'hi' ? 'दूसरी पर्ची अपलोड करें' : 'Upload Another Slip'}
              </button>
              <Link
                href="/tests"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow"
              >
                {language === 'hi' ? 'सभी टेस्ट देखें' : 'Explore All Tests'}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* File Upload Zone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'hi' ? 'डॉक्टर की पर्ची की फोटो / फ़ाइल *' : 'Doctor Prescription Photo / File *'}
              </label>

              {filePreview ? (
                <div className="relative rounded-xl border-2 border-emerald-500 overflow-hidden bg-slate-100 p-2">
                  <img
                    src={filePreview}
                    alt="Prescription preview"
                    className="max-h-72 mx-auto rounded-lg object-contain"
                  />
                  <div className="mt-2 flex items-center justify-between px-2">
                    <span className="text-xs text-gray-600 truncate">{fileName || 'prescription.jpg'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        setFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      {language === 'hi' ? 'बदलें / हटाएं' : 'Change / Remove'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition"
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-3 text-sm font-semibold text-emerald-700">
                    {language === 'hi' ? 'फोटो खींचें या गैलरी से चुनें' : 'Click to Take Photo or Browse Files'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {language === 'hi' ? 'JPG, PNG, PDF समर्थित (अधिकतम 10MB)' : 'JPG, PNG, WebP or PDF (up to 10MB)'}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Patient Info Fields */}
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
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    className="w-full rounded-xl border border-gray-300 pl-12 pr-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'hi' ? 'घर का पता / लैंडमार्क (होम कलेक्शन के लिए)' : 'Home Address / Landmark (For Sample Collection)'}
              </label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: मकान नं 42, सिविल लाइन्स, जयपुर' : 'e.g. Flat 402, Civil Lines, Jaipur'}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'hi' ? 'अतिरिक्त नोट या डॉक्टर का नाम (वैकल्पिक)' : 'Special Notes or Doctor Name (Optional)'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: डॉक्टर ने CBC और शुगर टेस्ट लिखा है' : 'e.g. Doctor prescribed fasting sugar & CBC'}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>{language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading Prescription...'}</span>
              ) : (
                <>
                  <span>{language === 'hi' ? 'पर्ची भेजें और टेस्ट बुक करें' : 'Submit Prescription & Book Test'}</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
