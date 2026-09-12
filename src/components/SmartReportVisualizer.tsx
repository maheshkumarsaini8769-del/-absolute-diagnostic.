'use client';

import { useState } from 'react';

export interface ParameterResult {
  name: string;
  nameHindi: string;
  value: number;
  unit: string;
  minNormal: number;
  maxNormal: number;
  status: 'normal' | 'borderline' | 'critical';
  clinicalMeaning: string;
  clinicalMeaningHindi: string;
}

const SAMPLE_PARAMETERS: ParameterResult[] = [
  {
    name: 'Hemoglobin (Hb)',
    nameHindi: 'हीमोग्लोबिन (खून की मात्रा)',
    value: 13.8,
    unit: 'g/dL',
    minNormal: 12.0,
    maxNormal: 16.5,
    status: 'normal',
    clinicalMeaning: 'Normal oxygen carrying capacity. No signs of anemia.',
    clinicalMeaningHindi: 'खून की मात्रा पूरी तरह सामान्य है। एनीमिया के कोई लक्षण नहीं हैं।'
  },
  {
    name: 'Fasting Blood Sugar',
    nameHindi: 'फास्टिंग ब्लड शुगर (खाली पेट)',
    value: 114,
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 99,
    status: 'borderline',
    clinicalMeaning: 'Mildly elevated (Impaired Fasting Glucose). Pre-diabetes range; lifestyle & dietary adjustments recommended.',
    clinicalMeaningHindi: 'हल्का सा बढ़ा हुआ (प्री-डायबिटीज रेंज)। मीठा व जंक फूड कम करें और नियमित टहलें।'
  },
  {
    name: 'HbA1c (Glycated Hemoglobin)',
    nameHindi: 'एचबीए1सी (3 माह का औसत शुगर)',
    value: 5.8,
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    status: 'borderline',
    clinicalMeaning: 'Borderline range (5.7% - 6.4%). Indicates early insulin resistance.',
    clinicalMeaningHindi: 'बॉर्डरलाइन रेंज। पिछले 3 महीनों का शुगर स्तर थोड़ा सा बढ़ा हुआ है।'
  },
  {
    name: 'Thyroid Stimulating Hormone (TSH)',
    nameHindi: 'थायरॉइड टीएसएच',
    value: 2.45,
    unit: 'µIU/mL',
    minNormal: 0.4,
    maxNormal: 4.2,
    status: 'normal',
    clinicalMeaning: 'Euthyroid state. Thyroid gland functioning normally.',
    clinicalMeaningHindi: 'थायरॉइड ग्रंथि पूरी तरह स्वस्थ है और सही काम कर रही है।'
  },
  {
    name: 'Serum SGPT / ALT',
    nameHindi: 'एसजीपीटी (लिवर एंजाइम)',
    value: 32,
    unit: 'U/L',
    minNormal: 10,
    maxNormal: 45,
    status: 'normal',
    clinicalMeaning: 'Healthy liver enzyme levels. No signs of hepatic stress.',
    clinicalMeaningHindi: 'लिवर एंजाइम पूरी तरह सामान्य हैं। लिवर सुरक्षित है।'
  },
  {
    name: 'Total Cholesterol',
    nameHindi: 'कोलेस्ट्रॉल (नसों की चिकनाई)',
    value: 218,
    unit: 'mg/dL',
    minNormal: 125,
    maxNormal: 200,
    status: 'borderline',
    clinicalMeaning: 'Mildly elevated. Reduce fried food, trans-fats and increase daily cardio exercise.',
    clinicalMeaningHindi: 'हल्का बढ़ा हुआ। तला-भुना खाना कम करें और वसा रहित भोजन लें।'
  }
];

export default function SmartReportVisualizer({
  patientName = 'Verified Patient',
  reportDate = 'Today',
  parameters = SAMPLE_PARAMETERS,
  hasCriticalAlert = false
}: {
  patientName?: string;
  reportDate?: string;
  parameters?: ParameterResult[];
  hasCriticalAlert?: boolean;
}) {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Check if any parameter has critical or borderline status
  const criticalItems = parameters.filter((p) => p.status === 'critical');
  const borderlineItems = parameters.filter((p) => p.status === 'borderline');
  const normalItems = parameters.filter((p) => p.status === 'normal');

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {/* Top Bar with Language Toggle & Patient Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0d9488] text-xs font-bold uppercase tracking-wider mb-2">
            📊 Smart AI Report Summary
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Interactive Diagnostic Overview
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Patient: <span className="font-semibold text-slate-800">{patientName}</span> | Date: {reportDate}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              lang === 'hi' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇮🇳 सरल हिंदी
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              lang === 'en' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Critical Panic Value Alert (if applicable) */}
      {(hasCriticalAlert || criticalItems.length > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3.5 animate-pulse">
          <span className="text-2xl shrink-0">🚨</span>
          <div>
            <h4 className="font-bold text-sm text-rose-950">
              {lang === 'hi' ? 'महत्वपूर्ण अलर्ट: तुरंत डॉक्टर से परामर्श लें' : 'Critical Panic Value Alert: Consult Doctor Urgently'}
            </h4>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              {lang === 'hi'
                ? 'इस रिपोर्ट में कुछ पैरामीटर सामान्य सीमा से काफी बाहर हैं। कृपया बिना देर किए अपने चिकित्सक या हमारे ऑन-कॉल डॉक्टर से संपर्क करें।'
                : 'One or more values require immediate clinical attention. Please consult your physician without delay.'}
            </p>
          </div>
        </div>
      )}

      {/* Quick Status Pill Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
          <span className="text-lg sm:text-xl font-black text-emerald-700">{normalItems.length}</span>
          <p className="text-[11px] sm:text-xs font-bold text-emerald-800 mt-0.5">
            {lang === 'hi' ? 'सामान्य (Normal)' : 'Normal'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
          <span className="text-lg sm:text-xl font-black text-amber-700">{borderlineItems.length}</span>
          <p className="text-[11px] sm:text-xs font-bold text-amber-800 mt-0.5">
            {lang === 'hi' ? 'बॉर्डरलाइन (Attention)' : 'Borderline'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
          <span className="text-lg sm:text-xl font-black text-rose-700">{criticalItems.length}</span>
          <p className="text-[11px] sm:text-xs font-bold text-rose-800 mt-0.5">
            {lang === 'hi' ? 'क्रिटिकल (High Risk)' : 'Critical'}
          </p>
        </div>
      </div>

      {/* Parameters Visual Range Meters */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {lang === 'hi' ? 'मुख्य पैरामीटर और रंगीन स्टेटस मीटर' : 'Key Clinical Parameters & Range Meters'}
        </h4>

        {parameters.map((param, idx) => {
          const isNormal = param.status === 'normal';
          const isBorderline = param.status === 'borderline';
          const isCritical = param.status === 'critical';

          // Percentage calculation along bar
          const rangeSpan = Math.max(1, param.maxNormal - param.minNormal);
          const ratio = Math.min(100, Math.max(5, ((param.value - param.minNormal) / rangeSpan) * 50 + 25));

          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-teal-300 transition-all bg-slate-50/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                    {lang === 'hi' ? param.nameHindi : param.name}
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Normal Range: {param.minNormal} – {param.maxNormal} {param.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {param.value} <span className="text-xs font-normal text-slate-500">{param.unit}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isNormal
                        ? 'bg-emerald-100 text-emerald-800'
                        : isBorderline
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isNormal ? 'NORMAL' : isBorderline ? 'BORDERLINE' : 'CRITICAL'}
                  </span>
                </div>
              </div>

              {/* Color Visual Range Bar */}
              <div className="relative pt-2 pb-1">
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="w-[30%] bg-blue-300" title="Low" />
                  <div className="w-[45%] bg-emerald-400" title="Normal" />
                  <div className="w-[15%] bg-amber-400" title="Borderline High" />
                  <div className="w-[10%] bg-rose-500" title="Critical High" />
                </div>

                {/* Marker Needle */}
                <div
                  className="absolute top-1.5 w-3 h-4 bg-slate-900 rounded-sm shadow-md transition-all -ml-1.5"
                  style={{ left: `${ratio}%` }}
                  title={`Your Value: ${param.value} ${param.unit}`}
                />
              </div>

              {/* AI Layman Explanation Toggle */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? '▲ कम दिखाएं' : '💡 इसका क्या मतलब है? (Explain Meaning)'}</span>
                </button>

                {isExpanded && (
                  <p className="text-xs text-slate-700 mt-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 leading-relaxed">
                    {lang === 'hi' ? param.clinicalMeaningHindi : param.clinicalMeaning}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Re-test Reminder Box (Feature 4/7) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-teal-950">
              {lang === 'hi' ? 'नियमित 3-महीने का हेल्थ चेकअप रिमाइंडर' : 'Automated 3-Month Retest Reminder'}
            </h4>
            <p className="text-[11px] text-teal-800 mt-0.5">
              {lang === 'hi'
                ? 'शुगर, थायरॉइड और लिपिड प्रोफाइल की नियमित निगरानी के लिए WhatsApp पर फ्री रिमाइंडर सेट करें।'
                : 'Get friendly routine checkup reminders on WhatsApp every 3 or 6 months.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert(lang === 'hi' ? '✅ आपके नंबर पर 3-महीने का चेकअप रिमाइंडर सेट हो गया है!' : '✅ 3-Month Routine Reminder successfully enabled for your phone!')}
          className="px-5 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0b7d73] text-white text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer text-center"
        >
          {lang === 'hi' ? 'रिमाइंडर चालू करें 🔔' : 'Enable WhatsApp Reminder 🔔'}
        </button>
      </div>
    </div>
  );
}
