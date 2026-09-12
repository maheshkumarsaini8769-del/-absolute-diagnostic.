'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TestGuideItem {
  id: string;
  testName: string;
  aliases: string;
  fastingRequired: boolean;
  fastingHours?: string;
  waterAllowed: boolean;
  medicineRule: string;
  idealTime: string;
  tips: string;
}

const TEST_GUIDELINES: TestGuideItem[] = [
  {
    id: 'sugar-fasting',
    testName: 'Blood Sugar Fasting (FBS)',
    aliases: 'Fasting Glucose, Sugar Test',
    fastingRequired: true,
    fastingHours: '8 – 10 Hours',
    waterAllowed: true,
    medicineRule: 'Morning Diabetes tablet/insulin should NOT be taken before the blood sample. Take it with breakfast after giving sample.',
    idealTime: '7:00 AM – 9:00 AM',
    tips: 'Only plain water is allowed during fasting. Tea, coffee, or milk will spike blood sugar.',
  },
  {
    id: 'sugar-pp',
    testName: 'Post Prandial Blood Sugar (PPBS)',
    aliases: 'Sugar PP, After Meal Glucose',
    fastingRequired: false,
    waterAllowed: true,
    medicineRule: 'Take your regular morning medicine/insulin as advised by your doctor with breakfast.',
    idealTime: 'Exactly 2 hours after starting your meal',
    tips: 'Time starts from the very first bite of your breakfast, not after finishing meal.',
  },
  {
    id: 'lipid-profile',
    testName: 'Lipid Profile (Cholesterol & Triglycerides)',
    aliases: 'Heart Risk, Triglycerides, HDL, LDL',
    fastingRequired: true,
    fastingHours: '10 – 12 Hours',
    waterAllowed: true,
    medicineRule: 'Blood pressure (BP) medicines can be taken with sips of water in the morning.',
    idealTime: 'Morning before 9:30 AM',
    tips: 'Avoid alcohol and heavy oily food 24 hours prior to the test for accurate triglyceride readings.',
  },
  {
    id: 'thyroid',
    testName: 'Thyroid Profile (T3, T4, TSH)',
    aliases: 'Thyroid Stimulating Hormone, TFT',
    fastingRequired: false,
    waterAllowed: true,
    medicineRule: 'CRITICAL: Do NOT take your morning Thyroxine (Thyronorm/Eltroxin) tablet before the blood test. Give the sample first, then take the tablet.',
    idealTime: 'Early Morning (TSH levels peak in morning)',
    tips: 'Biotin/multivitamin supplements should be paused 48 hours before testing as they interfere with thyroid values.',
  },
  {
    id: 'lft',
    testName: 'Liver Function Test (LFT)',
    aliases: 'SGOT, SGPT, Bilirubin, Jaundice Test',
    fastingRequired: true,
    fastingHours: '8 – 10 Hours preferred',
    waterAllowed: true,
    medicineRule: 'Regular maintenance medicines allowed with water.',
    idealTime: 'Morning',
    tips: 'Avoid alcohol for at least 48 hours before giving sample.',
  },
  {
    id: 'kft',
    testName: 'Kidney Function Test (KFT / RFT)',
    aliases: 'Creatinine, Urea, Uric Acid',
    fastingRequired: false,
    waterAllowed: true,
    medicineRule: 'Drink normal amount of water. Do not severely dehydrate yourself.',
    idealTime: 'Anytime during daytime',
    tips: 'Heavy protein gym supplements (creatine powders) should be avoided 24 hours prior.',
  },
  {
    id: 'cbc',
    testName: 'Complete Blood Count (CBC)',
    aliases: 'Hemogram, TLC, DLC, Platelets, Hemoglobin',
    fastingRequired: false,
    waterAllowed: true,
    medicineRule: 'No special medicine restrictions.',
    idealTime: 'Anytime',
    tips: 'Stay well hydrated so blood sample collection is smooth and painless.',
  },
  {
    id: 'urine',
    testName: 'Urine Routine & Microscopy',
    aliases: 'Urine R/M, Pus Cells, Albumin',
    fastingRequired: false,
    waterAllowed: true,
    medicineRule: 'No restriction.',
    idealTime: 'First morning mid-stream urine is best',
    tips: 'Discard the first few drops of urine and collect the middle stream directly into the sterile container.',
  },
];

export default function TestGuidePage() {
  const [search, setSearch] = useState('');

  const filtered = TEST_GUIDELINES.filter(
    (t) =>
      t.testName.toLowerCase().includes(search.toLowerCase()) ||
      t.aliases.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Test Fasting &amp; Preparation Guidelines</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
            <span>💊</span> Patient Fasting &amp; Medicine Guide
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            टेस्ट से पहले की जरूरी सावधानियां
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            भूखे पेट (Fasting) रहना है या नहीं? दवा कब लेनी है? पानी पी सकते हैं या नहीं? जानें अपने टेस्ट की सही तैयारी।
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="टेस्ट का नाम खोजें (e.g. Thyroid, Sugar, Lipid, CBC, LFT)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            />
            <svg
              className="w-5 h-5 text-slate-400 absolute left-3.5 top-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Guideline Cards */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:border-teal-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{item.testName}</h3>
                  <p className="text-xs text-slate-500">{item.aliases}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.fastingRequired
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.fastingRequired ? `⚠️ Fasting: ${item.fastingHours}` : '✅ No Fasting Needed'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                    💧 Water {item.waterAllowed ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">💊 दवाई का नियम (Medicine Rule):</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.medicineRule}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">💡 विशेष सलाह (Doctor Tip):</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.tips}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  ⏰ सही समय: <strong className="text-slate-800">{item.idealTime}</strong>
                </span>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700"
                >
                  <span>Book this test</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
