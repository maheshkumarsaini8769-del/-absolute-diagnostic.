'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Symptom {
  id: string;
  name: string;
  nameHindi: string;
  icon: string;
  category: string;
  suggestedTests: { name: string; price: number; reason: string }[];
  suggestedPackage: { name: string; price: number; mrp: number; slug: string; testsCount: number };
}

const SYMPTOMS_DATA: Symptom[] = [
  {
    id: 'fatigue',
    name: 'Fatigue & Low Energy',
    nameHindi: 'लगातार थकान व कमजोरी',
    icon: '🥱',
    category: 'General',
    suggestedTests: [
      { name: 'Complete Blood Count (CBC)', price: 299, reason: 'Checks for anemia, low hemoglobin & infections' },
      { name: 'Vitamin D & Vitamin B12', price: 999, reason: 'Essential for bone energy, nerve function & stamina' },
      { name: 'Thyroid Profile (T3, T4, TSH)', price: 399, reason: 'Sluggish thyroid slows down metabolism & causes extreme fatigue' }
    ],
    suggestedPackage: {
      name: 'Vital Energy & Immunity Package',
      price: 1199,
      mrp: 2499,
      slug: 'vital-energy-immunity',
      testsCount: 65
    }
  },
  {
    id: 'hairfall',
    name: 'Hair Fall & Brittle Nails',
    nameHindi: 'बाल झड़ना व रूखी त्वचा',
    icon: '💇',
    category: 'Hormonal',
    suggestedTests: [
      { name: 'Serum Ferritin & Iron Studies', price: 650, reason: 'Low iron stores are the #1 hidden cause of diffuse hair fall' },
      { name: 'Thyroid Profile (TSH)', price: 399, reason: 'Hormonal imbalance causes hair thinning and dry scalp' },
      { name: 'Zinc & Biotin Levels', price: 850, reason: 'Essential trace minerals for follicular strength' }
    ],
    suggestedPackage: {
      name: 'Hair Fall & Hormone Health Panel',
      price: 1399,
      mrp: 2800,
      slug: 'hairfall-hormone-panel',
      testsCount: 52
    }
  },
  {
    id: 'fever',
    name: 'Fever, Chills & Body Pain',
    nameHindi: 'बुखार, ठंड लगना या दर्द',
    icon: '🌡️',
    category: 'Infection',
    suggestedTests: [
      { name: 'CBC with ESR & Platelet Count', price: 350, reason: 'Detects bacterial/viral infection & platelet drops in dengue' },
      { name: 'Widal / Typhoid Test', price: 250, reason: 'Screens for enteric/typhoid salmonella bacterial fever' },
      { name: 'Malarial Antigen (Rapid)', price: 280, reason: 'Instant diagnosis of P. vivax & P. falciparum' }
    ],
    suggestedPackage: {
      name: 'Fever & Infection Complete Panel',
      price: 799,
      mrp: 1600,
      slug: 'fever-profile',
      testsCount: 38
    }
  },
  {
    id: 'jointpain',
    name: 'Joint, Knee & Bone Pain',
    nameHindi: 'जोड़ों व घुटनों में दर्द / अकड़न',
    icon: '🦴',
    category: 'Bone & Joints',
    suggestedTests: [
      { name: 'Vitamin D3 (25-Hydroxy)', price: 650, reason: 'Severe vitamin D deficiency leads to bone thinning and joint aches' },
      { name: 'Serum Calcium & Uric Acid', price: 350, reason: 'High uric acid causes gout crystal pain in joints & toes' },
      { name: 'RA Factor & CRP (Inflammation)', price: 550, reason: 'Rules out rheumatoid arthritis and joint inflammation' }
    ],
    suggestedPackage: {
      name: 'Bone & Joint Pain Care Package',
      price: 1299,
      mrp: 2700,
      slug: 'bone-joint-package',
      testsCount: 58
    }
  },
  {
    id: 'sugar',
    name: 'Frequent Thirst & Urination',
    nameHindi: 'ज्यादा प्यास व बार-बार पेशाब',
    icon: '🥤',
    category: 'Metabolic',
    suggestedTests: [
      { name: 'Fasting Blood Sugar & PPBS', price: 150, reason: 'Measures immediate glucose levels in blood' },
      { name: 'HbA1c (3-Month Sugar Average)', price: 450, reason: 'Gold standard test for diabetes detection without fasting variation' },
      { name: 'Urinalysis (Routine/Microscopic)', price: 180, reason: 'Checks for glucose leakage, protein and kidney strain' }
    ],
    suggestedPackage: {
      name: 'Advanced Diabetes & Kidney Shield',
      price: 899,
      mrp: 1950,
      slug: 'diabetes-kidney-shield',
      testsCount: 45
    }
  },
  {
    id: 'heart_bp',
    name: 'High BP & Chest Heaviness',
    nameHindi: 'हाई ब्लड प्रेशर / घबराहट',
    icon: '🫀',
    category: 'Cardiac',
    suggestedTests: [
      { name: 'Lipid Profile (Cholesterol & Triglycerides)', price: 450, reason: 'Measures bad LDL and triglycerides clogging arteries' },
      { name: 'High-Sensitivity CRP (hs-CRP)', price: 600, reason: 'Cardiac inflammatory marker for heart blockage risk' },
      { name: 'Serum Electrolytes (Na, K, Cl)', price: 400, reason: 'Crucial for heart rhythm and blood pressure control' }
    ],
    suggestedPackage: {
      name: 'Heart Health & Lipid Profile Package',
      price: 999,
      mrp: 2200,
      slug: 'heart-health-lipid',
      testsCount: 50
    }
  },
  {
    id: 'digestion',
    name: 'Gas, Bloating & Acidity',
    nameHindi: 'पेट में गैस, एसिडिटी व अपच',
    icon: '🤢',
    category: 'Digestive',
    suggestedTests: [
      { name: 'Liver Function Test (LFT)', price: 550, reason: 'Checks SGPT, SGOT, Bilirubin for fatty liver and enzyme balance' },
      { name: 'Stool Routine & Occult Blood', price: 250, reason: 'Detects microscopic bleeding and intestinal parasites' },
      { name: 'Serum Amylase & Lipase', price: 750, reason: 'Screens for pancreas inflammation and severe indigestion' }
    ],
    suggestedPackage: {
      name: 'Digestive & Liver Care Screen',
      price: 899,
      mrp: 1850,
      slug: 'digestive-liver-screen',
      testsCount: 42
    }
  },
  {
    id: 'weight',
    name: 'Sudden Weight Gain / Loss',
    nameHindi: 'अचानक वजन बढ़ना या घटना',
    icon: '⚖️',
    category: 'Endocrine',
    suggestedTests: [
      { name: 'Comprehensive Thyroid (T3, T4, TSH)', price: 399, reason: 'Identifies hypo/hyperthyroidism causing rapid weight shifts' },
      { name: 'Fasting Insulin & HOMA-IR', price: 700, reason: 'Tests for insulin resistance leading to stubborn belly fat' },
      { name: 'Cortisol (Stress Hormone)', price: 650, reason: 'High cortisol leads to water retention and central obesity' }
    ],
    suggestedPackage: {
      name: 'Metabolic & Hormone Wellness Panel',
      price: 1499,
      mrp: 3200,
      slug: 'metabolic-hormone-wellness',
      testsCount: 68
    }
  }
];

interface CustomAIAnalysis {
  interpretationHindi: string;
  interpretationEnglish: string;
  recommendedTests: Array<{ name: string; reason: string }>;
  suggestedSpecialist: string;
  urgency: 'routine' | 'moderate' | 'urgent';
  immediateTips: string[];
}

export default function SymptomCheckerWidget() {
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>('fatigue');
  const [customQuery, setCustomQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [customAIResult, setCustomAIResult] = useState<CustomAIAnalysis | null>(null);

  const activeSymptom = SYMPTOMS_DATA.find((s) => s.id === selectedSymptomId) || SYMPTOMS_DATA[0];

  const handleCustomAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    setIsAnalyzing(true);
    setAiError('');

    try {
      const res = await fetch('/api/ai-symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: customQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }
      setCustomAIResult(data.analysis);
    } catch (err: any) {
      setAiError(err.message || 'AI विश्लेषण में त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white via-teal-50/30 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-[#0d9488] text-xs font-bold uppercase tracking-wider mb-3">
            <span>🔬 AI Symptom-to-Test Checker</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Not sure which test you need?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Select what you are experiencing or write your symptoms. Our Zenuxs AI will recommend the exact diagnostic investigations and cost-saving health packages.
          </p>
        </div>

        {/* Natural Language AI Symptom Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleCustomAISubmit} className="relative flex items-center">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="या अपने लक्षण लिखें (उदा: 3 दिन से सिरदर्द, कमजोरी और बुखार)..."
              className="w-full pl-4 pr-36 py-3.5 rounded-2xl bg-white border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-xs sm:text-sm text-slate-800 shadow-sm"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !customQuery.trim()}
              className="absolute right-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI सोच रहा है...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>AI सलाह लें</span>
                </>
              )}
            </button>
          </form>
          {aiError && (
            <p className="text-rose-600 text-xs mt-1.5 text-center font-medium">{aiError}</p>
          )}
        </div>

        {/* Custom AI Analysis Result Box */}
        {customAIResult && (
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 border border-teal-500/30 shadow-xl relative overflow-hidden animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Zenuxs AI Medical Recommendation
                  </h3>
                  <span className="text-xs text-teal-300">
                    लक्षण: &quot;{customQuery}&quot;
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  customAIResult.urgency === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}>
                  {customAIResult.urgency === 'urgent' ? '🚨 Immediate Doctor Care' : '🩺 Routine Checkup'}
                </span>
                <button
                  type="button"
                  onClick={() => { setCustomAIResult(null); setCustomQuery(''); }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  ✕ बंद करें
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-teal-100 font-medium leading-relaxed">
                  💡 {customAIResult.interpretationHindi}
                </p>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {customAIResult.interpretationEnglish}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
                    🔬 सुझाए गए आवश्यक टेस्ट (Recommended Tests):
                  </h4>
                  <div className="space-y-2">
                    {customAIResult.recommendedTests.map((t, idx) => (
                      <div key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-white block">{t.name}</span>
                        <span className="text-[11px] text-slate-300 block">{t.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                      👨‍⚕️ अनुशंसित विशेषज्ञ व प्राथमिक सावधानियां:
                    </h4>
                    <p className="text-xs font-bold text-white mb-2">
                      डॉक्टर: {customAIResult.suggestedSpecialist}
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {customAIResult.immediateTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-teal-400">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/booking"
                    className="mt-4 w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl text-center block transition-all shadow-md"
                  >
                    घर बैठे सैंपल कलेक्शन बुक करें ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Symptoms Heading */}
        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            या नीचे सामान्य लक्षणों में से चुनें:
          </span>
        </div>

        {/* Interactive Symptom Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-10">

          {SYMPTOMS_DATA.map((symptom) => {
            const isSelected = symptom.id === selectedSymptomId;
            return (
              <button
                key={symptom.id}
                type="button"
                onClick={() => setSelectedSymptomId(symptom.id)}
                className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-lg shadow-teal-700/20 scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/40 text-slate-700 shadow-2xs'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1.5">{symptom.icon}</span>
                <span className={`font-bold text-xs sm:text-sm leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {symptom.name}
                </span>
                <span className={`text-[10px] sm:text-[11px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {symptom.nameHindi}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recommendation Results Showcase */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Clinical Recommendation For:
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {activeSymptom.icon} {activeSymptom.name} ({activeSymptom.nameHindi})
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Doctors recommend checking the following clinical parameters to identify the root cause:
              </p>
            </div>

            <Link
              href={`/booking?symptom=${activeSymptom.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d9488] hover:bg-[#0b7d73] text-white text-sm font-bold shadow-md shadow-teal-700/20 hover:scale-[1.02] transition-all shrink-0"
            >
              <span>Book Recommended Tests</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* 2 Cols: Individual Tests */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recommended Blood Investigations
              </h4>
              <div className="space-y-3">
                {activeSymptom.suggestedTests.map((test, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-teal-300 transition-colors flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm sm:text-base">{test.name}</h5>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 pl-7 leading-relaxed">{test.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-teal-700 text-sm sm:text-base">₹{test.price}</span>
                      <Link
                        href={`/booking?test=${encodeURIComponent(test.name)}`}
                        className="block text-[11px] font-bold text-teal-600 hover:text-teal-800 hover:underline mt-1"
                      >
                        Book Test →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1 Col: Best Value Package Card */}
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-teal-900 to-slate-900 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10" />

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                  ⭐ Best Value Package
                </div>
                <h4 className="text-lg font-bold text-white leading-tight">
                  {activeSymptom.suggestedPackage.name}
                </h4>
                <p className="text-xs text-teal-200/80 mt-1">
                  Includes {activeSymptom.suggestedPackage.testsCount}+ parameters with free home collection.
                </p>

                <div className="my-5 p-3 rounded-xl bg-white/10 border border-white/10 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">₹{activeSymptom.suggestedPackage.price}</span>
                    <span className="text-xs text-slate-300 line-through ml-2">₹{activeSymptom.suggestedPackage.mrp}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    Save ₹{activeSymptom.suggestedPackage.mrp - activeSymptom.suggestedPackage.price}
                  </span>
                </div>

                <ul className="text-xs text-slate-200 space-y-1.5 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Free Home Sample Collection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>NABL Accredited Lab Testing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Digital Verified Reports in 24 hrs</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/packages`}
                className="w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0b7d73] text-white text-xs sm:text-sm font-bold text-center block transition-all shadow-md shadow-teal-900/50"
              >
                Book Package @ ₹{activeSymptom.suggestedPackage.price} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
