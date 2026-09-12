'use client';

import { useState } from 'react';
import Link from 'next/link';

interface QuestionOption {
  text: string;
  points: number;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: 'age',
    title: 'What is your age group?',
    subtitle: 'Age is a primary indicator for metabolic risk screening',
    options: [
      { text: 'Under 30 years', points: 0 },
      { text: '30 to 45 years', points: 1 },
      { text: '45 to 60 years', points: 2 },
      { text: 'Above 60 years', points: 3 },
    ],
  },
  {
    id: 'activity',
    title: 'How active are you daily?',
    subtitle: 'Daily physical movement and exercise levels',
    options: [
      { text: 'Regular exercise / Walking (30+ mins)', points: 0 },
      { text: 'Moderate movement throughout the day', points: 1 },
      { text: 'Mostly sitting desk job / Sedentary', points: 2 },
    ],
  },
  {
    id: 'family',
    title: 'Family history of Diabetes or Heart issues?',
    subtitle: 'Genetic predisposition in blood relatives',
    options: [
      { text: 'No family history', points: 0 },
      { text: 'Grandparents or distant relatives', points: 1 },
      { text: 'Parents or Siblings', points: 3 },
    ],
  },
  {
    id: 'symptoms',
    title: 'Do you experience frequent fatigue or thirst?',
    subtitle: 'Common early signs of blood sugar and metabolic variation',
    options: [
      { text: 'Never / Rare', points: 0 },
      { text: 'Sometimes after work', points: 1 },
      { text: 'Frequently / Often', points: 2 },
    ],
  },
  {
    id: 'weight',
    title: 'Body weight & Waist circumference',
    subtitle: 'Evaluation of central adiposity and body mass index',
    options: [
      { text: 'Healthy weight & flat waist', points: 0 },
      { text: 'Slightly overweight', points: 1 },
      { text: 'Noticeable belly fat / High BMI', points: 2 },
    ],
  },
];

export default function HealthRiskCalculatorPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId: string, points: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: points }));
  };

  const totalScore = Object.values(answers).reduce((sum, p) => sum + p, 0);

  const getRiskLevel = () => {
    if (totalScore <= 2) {
      return {
        level: 'LOW RISK',
        color: 'text-emerald-600',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        barColor: 'bg-emerald-500',
        width: '30%',
        desc: 'Great news! Your lifestyle and risk indicators are in a healthy range. An annual preventive health checkup is recommended to maintain optimal wellness.',
        recommendedPackage: 'Basic Wellness Health Profile',
        recommendedPrice: '₹499',
        testsIncluded: 'CBC, Blood Sugar Fasting, Urine Routine, Lipid Profile',
        bookingUrl: '/packages',
      };
    }
    if (totalScore <= 6) {
      return {
        level: 'MODERATE RISK',
        color: 'text-amber-600',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        barColor: 'bg-amber-500',
        width: '65%',
        desc: 'Attention advised. Your symptoms and profile indicate early potential for blood sugar or metabolic variation. A routine preventive checkup is recommended every 3-6 months.',
        recommendedPackage: 'Diabetes & Heart Care Screening',
        recommendedPrice: '₹899',
        testsIncluded: 'HbA1c (3-Month Sugar), Lipid Profile, Serum Creatinine, Liver Panel',
        bookingUrl: '/packages',
      };
    }
    return {
      level: 'HIGH RISK',
      color: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      width: '95%',
      desc: 'High risk score detected. We strongly advise taking a comprehensive full body checkup and consulting a medical practitioner without delay.',
      recommendedPackage: 'Comprehensive Full Body Health Checkup',
      recommendedPrice: '₹1,299',
      testsIncluded: 'HbA1c, Complete KFT, LFT, Lipid, Thyroid Profile, CBC, Vitamin D/B12',
      bookingUrl: '/booking',
    };
  };

  const risk = getRiskLevel();
  const isComplete = Object.keys(answers).length === QUESTIONS.length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Health &amp; Diabetes Risk Calculator</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            <span>🩺</span> 1-Minute Preventive Health Check
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Heart &amp; Diabetes Risk Calculator
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Answer 5 simple questions to assess your metabolic health profile and discover the right preventive checkup package.
          </p>
        </div>

        {!submitted ? (
          <div className="space-y-6">
            {QUESTIONS.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{q.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3 ml-8">{q.subtitle}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-0 sm:ml-8">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.points;
                    return (
                      <button
                        key={opt.text}
                        type="button"
                        onClick={() => handleSelect(q.id, opt.points)}
                        className={`p-3 text-left rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {isSelected && <span className="text-teal-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button
                type="button"
                disabled={!isComplete}
                onClick={() => setSubmitted(true)}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📊</span>
                <span>Calculate Risk Score &amp; View Recommendations</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in duration-300">
            <div className="text-center pb-4 border-b border-slate-100">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-extrabold border uppercase tracking-wider mb-2 ${risk.badgeBg}`}>
                {risk.level}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Your Health Risk Score: <span className={risk.color}>{totalScore} / 12</span>
              </h2>

              {/* Progress Meter Bar */}
              <div className="w-full max-w-md mx-auto bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
                <div className={`h-full transition-all duration-700 ${risk.barColor}`} style={{ width: risk.width }} />
              </div>

              <p className="text-sm text-slate-600 mt-4 max-w-lg mx-auto leading-relaxed">
                {risk.desc}
              </p>
            </div>

            {/* Recommended Checkup Box */}
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-800 block mb-1">
                ⭐ Recommended Health Package for You
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{risk.recommendedPackage}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tests Included: <span className="font-semibold text-slate-800">{risk.testsIncluded}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 line-through mr-1.5">₹2,000</span>
                  <span className="text-xl font-black text-teal-700">{risk.recommendedPrice}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/booking"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 transition-all"
                >
                  Book Package (Home Collection) ➔
                </Link>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setAnswers({}); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  🔄 Retake Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
