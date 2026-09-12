'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Symptom {
  id: string;
  name: string;
  nameHindi: string; // kept for interface compatibility, holds simple English subtitle
  icon: string;
  category: string;
  suggestedTests: { name: string; price: number; reason: string }[];
  suggestedPackage: { name: string; price: number; mrp: number; slug: string; testsCount: number };
}

const SYMPTOMS_DATA: Symptom[] = [
  {
    id: 'fatigue',
    name: 'Fatigue & Low Energy',
    nameHindi: 'Persistent Tiredness & Weakness',
    icon: '🥱',
    category: 'General',
    suggestedTests: [
      { name: 'Complete Blood Count (CBC)', price: 299, reason: 'Checks for anemia, low hemoglobin & infections' },
      { name: 'Vitamin D & Vitamin B12', price: 999, reason: 'Essential for bone energy, nerve function & stamina' },
      { name: 'Thyroid Profile (T3, T4, TSH)', price: 399, reason: 'Sluggish thyroid slows down metabolism & causes fatigue' }
    ],
    suggestedPackage: {
      name: 'Vital Energy & Immunity Package',
      price: 1199,
      mrp: 1697,
      slug: 'vital-energy-immunity',
      testsCount: 65
    }
  },
  {
    id: 'hairfall',
    name: 'Hair Fall & Brittle Nails',
    nameHindi: 'Hair Thinning & Dry Scalp',
    icon: '💇',
    category: 'Hormonal',
    suggestedTests: [
      { name: 'Serum Ferritin & Iron Studies', price: 650, reason: 'Low iron stores are the #1 hidden cause of diffuse hair fall' },
      { name: 'Thyroid Profile (TSH)', price: 399, reason: 'Hormonal imbalance causes hair thinning and dry scalp' },
      { name: 'Zinc & Biotin Levels', price: 850, reason: 'Essential trace minerals for follicular strength' }
    ],
    suggestedPackage: {
      name: 'Hair Fall & Hormone Health Panel',
      price: 1299,
      mrp: 1899,
      slug: 'hairfall-hormone-panel',
      testsCount: 52
    }
  },
  {
    id: 'fever',
    name: 'Fever, Chills & Body Pain',
    nameHindi: 'High Temperature & Body Aches',
    icon: '🌡️',
    category: 'Infection',
    suggestedTests: [
      { name: 'CBC with ESR & Platelet Count', price: 350, reason: 'Detects bacterial/viral infection & platelet drops in dengue' },
      { name: 'Widal / Typhoid Test', price: 250, reason: 'Screens for enteric/typhoid salmonella bacterial fever' },
      { name: 'Malarial Antigen (Rapid)', price: 280, reason: 'Instant diagnosis of P. vivax & P. falciparum' }
    ],
    suggestedPackage: {
      name: 'Fever & Infection Complete Panel',
      price: 699,
      mrp: 880,
      slug: 'fever-profile',
      testsCount: 38
    }
  },
  {
    id: 'jointpain',
    name: 'Joint, Knee & Bone Pain',
    nameHindi: 'Stiffness & Movement Discomfort',
    icon: '🦴',
    category: 'Bone & Joints',
    suggestedTests: [
      { name: 'Vitamin D3 (25-Hydroxy)', price: 650, reason: 'Severe vitamin D deficiency leads to bone thinning and joint aches' },
      { name: 'Serum Calcium & Uric Acid', price: 350, reason: 'High uric acid causes gout crystal pain in joints & toes' },
      { name: 'RA Factor & CRP (Inflammation)', price: 550, reason: 'Rules out rheumatoid arthritis and joint inflammation' }
    ],
    suggestedPackage: {
      name: 'Bone & Joint Pain Care Package',
      price: 1199,
      mrp: 1550,
      slug: 'bone-joint-package',
      testsCount: 58
    }
  },
  {
    id: 'sugar',
    name: 'Frequent Thirst & Urination',
    nameHindi: 'High Sugar & Excessive Thirst',
    icon: '🥤',
    category: 'Metabolic',
    suggestedTests: [
      { name: 'Fasting Blood Sugar & PPBS', price: 150, reason: 'Measures immediate glucose levels in blood' },
      { name: 'HbA1c (3-Month Sugar Average)', price: 450, reason: 'Gold standard test for diabetes detection without fasting variation' },
      { name: 'Urinalysis (Routine/Microscopic)', price: 180, reason: 'Checks for glucose leakage, protein and kidney strain' }
    ],
    suggestedPackage: {
      name: 'Advanced Diabetes & Kidney Shield',
      price: 599,
      mrp: 780,
      slug: 'diabetes-kidney-shield',
      testsCount: 45
    }
  },
  {
    id: 'heart_bp',
    name: 'High BP & Chest Heaviness',
    nameHindi: 'Palpitations & Blood Pressure',
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
      mrp: 1450,
      slug: 'heart-health-lipid',
      testsCount: 50
    }
  },
  {
    id: 'digestion',
    name: 'Gas, Bloating & Acidity',
    nameHindi: 'Stomach Upset & Indigestion',
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
      mrp: 1550,
      slug: 'digestive-liver-screen',
      testsCount: 42
    }
  },
  {
    id: 'weight',
    name: 'Sudden Weight Gain / Loss',
    nameHindi: 'Rapid Metabolic Changes',
    icon: '⚖️',
    category: 'Endocrine',
    suggestedTests: [
      { name: 'Comprehensive Thyroid (T3, T4, TSH)', price: 399, reason: 'Identifies hypo/hyperthyroidism causing rapid weight shifts' },
      { name: 'Fasting Insulin & HOMA-IR', price: 700, reason: 'Tests for insulin resistance leading to stubborn belly fat' },
      { name: 'Cortisol (Stress Hormone)', price: 650, reason: 'High cortisol leads to water retention and central obesity' }
    ],
    suggestedPackage: {
      name: 'Metabolic & Hormone Wellness Panel',
      price: 1299,
      mrp: 1749,
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
      setAiError(err.message || 'Error analyzing symptoms. Please try again.');
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
            Select what you are experiencing or type your symptoms. Our AI engine will recommend the exact diagnostic investigations and cost-saving health packages.
          </p>
        </div>

        {/* Natural Language AI Symptom Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleCustomAISubmit} className="relative flex items-center">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Or type symptoms in plain English (e.g., headache, fever, fatigue for 3 days)..."
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
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Ask AI</span>
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
                    Reported Symptoms: &quot;{customQuery}&quot;
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
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-teal-100 font-medium leading-relaxed">
                  💡 {customAIResult.interpretationEnglish || customAIResult.interpretationHindi}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
                    🔬 Recommended Diagnostic Tests:
                  </h4>
                  <div className="space-y-2">
                    {customAIResult.recommendedTests.map((t, idx) => (
                      <div key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{t.name}</span>
                          <span className="text-[11px] text-slate-300 block leading-snug">{t.reason}</span>
                        </div>
                        <Link
                          href={`/booking?test=${encodeURIComponent(t.name)}`}
                          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-[11px] font-bold shadow-xs transition-colors whitespace-nowrap"
                        >
                          Book Test →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                      👨‍⚕️ Recommended Specialist &amp; Advice:
                    </h4>
                    <p className="text-xs font-bold text-white mb-2">
                      Doctor: {customAIResult.suggestedSpecialist}
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
                    href={`/booking?tests=${encodeURIComponent(customAIResult.recommendedTests.map(t => t.name).join(','))}`}
                    className="mt-4 w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl text-center block transition-all shadow-md"
                  >
                    Book Recommended Tests ({customAIResult.recommendedTests.length}) ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Symptoms Heading */}
        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Or select a symptom category below:
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
                {activeSymptom.icon} {activeSymptom.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Doctors recommend checking the following clinical parameters to identify the root cause:
              </p>
            </div>

            <Link
              href={`/booking?symptom=${activeSymptom.id}&tests=${encodeURIComponent(activeSymptom.suggestedTests.map(t => `${t.name}:::${t.price}`).join(','))}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d9488] hover:bg-[#0b7d73] text-white text-sm font-bold shadow-md shadow-teal-700/20 hover:scale-[1.02] transition-all shrink-0"
            >
              <span>Book Recommended Tests ({activeSymptom.suggestedTests.length})</span>
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
                        href={`/booking?test=${encodeURIComponent(`${test.name}:::${test.price}`)}`}
                        className="block text-[11px] font-bold text-teal-600 hover:text-teal-800 hover:underline mt-1"
                      >
                        Book Test →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1 Col: Suggested Health Package */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl border border-teal-500/20 relative overflow-hidden">
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

                {(() => {
                  const testsTotal = activeSymptom.suggestedTests.reduce((sum, t) => sum + t.price, 0);
                  const pkgPrice = activeSymptom.suggestedPackage.price;
                  const savings = Math.max(0, testsTotal - pkgPrice);
                  return (
                    <div className="my-5 p-3 rounded-xl bg-white/10 border border-white/10 flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-white">₹{pkgPrice}</span>
                        <span className="text-xs text-slate-300 line-through ml-2" title="Total of individual tests above">
                          ₹{testsTotal}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        Save ₹{savings}
                      </span>
                    </div>
                  );
                })()}

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
                href={`/booking?package=${encodeURIComponent(activeSymptom.suggestedPackage.name)}`}
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
