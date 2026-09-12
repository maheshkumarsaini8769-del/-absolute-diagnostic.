/**
 * Zenuxs AI Studio Client & Diagnostic Intelligence
 * Integrates with Zenuxs AI Studio (https://zenuxs-ai-studio.netlify.app/docs)
 * Uses API Key: zx-e6f10740de7548bd97305e0b4e383933
 */

const ZENUXS_DEFAULT_KEY = 'zx-e6f10740de7548bd97305e0b4e383933';
const ZENUXS_DEFAULT_BASE_URL = 'https://aistudio.zenuxs.site';
const CANDIDATE_MODELS = [
  'nex-agi/nex-n2.5-mini:free',
  'inclusionai/ling-3.0-flash-vl:free',
  'nex-agi/nex-n2.5-pro:free',
  'liquid/lfm-2.5-2.6b:free',
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZenuxsAIOptions {
  prompt?: string;
  systemPrompt?: string;
  messages?: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

/**
 * Low-level chat completion caller to Zenuxs AI Studio
 */
export async function callZenuxsAI(options: ZenuxsAIOptions): Promise<string | null> {
  const apiKey = process.env.ZENUXS_AI_API_KEY || ZENUXS_DEFAULT_KEY;
  const baseUrl = (process.env.ZENUXS_AI_BASE_URL || ZENUXS_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const preferredModel = options.model || process.env.ZENUXS_AI_MODEL || CANDIDATE_MODELS[0];
  const timeoutMs = options.timeoutMs || 8000;

  const messages: ChatMessage[] = options.messages || [];
  if (messages.length === 0) {
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    if (options.prompt) {
      messages.push({ role: 'user', content: options.prompt });
    }
  }

  // Try preferred model, then fallback models
  const modelsToTry = [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)];

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 600,
          temperature: options.temperature ?? 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Zenuxs AI attempt with ${model} returned ${response.status}`);
        continue;
      }

      const json = await response.json();
      const choice = json.choices?.[0];
      const text = choice?.message?.content || choice?.message?.reasoning || null;

      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`Zenuxs AI call error with model ${model}:`, err.message);
    }
  }

  return null;
}

export interface AISecondOpinionResult {
  isMedicalReport?: boolean;
  summaryHindi: string; // Kept for backwards compatibility, contains simple English explanation
  summaryEnglish: string;
  doctorSpecialist: string;
  urgency: 'normal' | 'moderate' | 'critical';
  lifestyleAdvice: string[];
  keyObservations: string[];
}

/**
 * Generate a pathologist-level second opinion for lab reports
 */
export async function generateReportSecondOpinionAI(
  parameters: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    indicator: 'normal' | 'high' | 'low' | 'critical';
    isAbnormal: boolean;
  }>,
  rawText?: string
): Promise<AISecondOpinionResult> {
  const abnormal = parameters.filter((p) => p.isAbnormal);
  const critical = parameters.filter((p) => p.indicator === 'critical');

  const paramSummary = parameters
    .map((p) => `- ${p.parameter}: ${p.value} ${p.unit} (Normal: ${p.referenceRange}) [${p.indicator.toUpperCase()}]`)
    .join('\n');

  const prompt = `You are a senior clinical pathologist at Absolute Diagnostic.
You are reviewing patient-uploaded document text.

Document extracted parameters:
${paramSummary || 'No standard test parameters extracted by automated parser.'}

Document raw text snippet:
${(rawText || '').slice(0, 1200)}

First, verify if this document contains genuine diagnostic pathology/laboratory test results.
If this is NOT a medical lab report (for example, a photo of a person, vehicle, animal, room, furniture, food, receipt, bill, homework, casual conversation, or non-medical document):
Set "isMedicalReport": false, and in "summarySimple" state clearly: "This document does not contain diagnostic lab test results. Please upload a clear photo or document of a pathology lab report (e.g. CBC, Blood Sugar, Thyroid, KFT, or LFT)."

If this IS a genuine medical lab report:
Set "isMedicalReport": true, and provide your clinical evaluation in simple, easy-to-understand English.

Output in strict JSON format with these exact keys:
{
  "isMedicalReport": true,
  "summarySimple": "2-3 clear sentences in simple English explaining findings.",
  "summaryEnglish": "2-3 clear sentences summarizing clinical findings and physician recommendations.",
  "doctorSpecialist": "e.g., General Physician, Endocrinologist, Nephrologist, Cardiologist",
  "urgency": "normal" | "moderate" | "critical",
  "lifestyleAdvice": ["Advice 1", "Advice 2"],
  "keyObservations": ["Observation 1", "Observation 2"]
}`;

  try {
    const aiResponse = await callZenuxsAI({
      prompt,
      maxTokens: 700,
      temperature: 0.2,
      timeoutMs: 9000,
    });

    if (aiResponse) {
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const isMedical = typeof parsed.isMedicalReport === 'boolean' ? parsed.isMedicalReport : parameters.length > 0;
        const simpleSummary = parsed.summarySimple || parsed.summaryHindi || parsed.summaryEnglish || '';
        return {
          isMedicalReport: isMedical,
          summaryHindi: simpleSummary,
          summaryEnglish: parsed.summaryEnglish || simpleSummary,
          doctorSpecialist: parsed.doctorSpecialist || (critical.length > 0 ? 'MD Physician / Specialist' : 'General Physician'),
          urgency: parsed.urgency || (critical.length > 0 ? 'critical' : abnormal.length > 0 ? 'moderate' : 'normal'),
          lifestyleAdvice: Array.isArray(parsed.lifestyleAdvice) ? parsed.lifestyleAdvice : [],
          keyObservations: Array.isArray(parsed.keyObservations) ? parsed.keyObservations : [],
        };
      }
    }
  } catch (err) {
    console.warn('AI Second Opinion parsing note:', err);
  }

  // Resilient Clinical Fallback (if remote network times out)
  return createHeuristicSecondOpinion(parameters);
}

function createHeuristicSecondOpinion(
  parameters: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    indicator: 'normal' | 'high' | 'low' | 'critical';
    isAbnormal: boolean;
  }>
): AISecondOpinionResult {
  if (parameters.length === 0) {
    return {
      isMedicalReport: false,
      summaryHindi: 'No clinical diagnostic parameters detected. Please upload a clear photo or document of a pathology lab test report (e.g. CBC, Sugar, Thyroid, KFT, or LFT).',
      summaryEnglish: 'No clinical diagnostic parameters detected. Please upload a clear photo or document of a pathology lab test report (e.g. CBC, Sugar, Thyroid, KFT, or LFT).',
      doctorSpecialist: 'Pathologist / Lab Support',
      urgency: 'normal',
      lifestyleAdvice: ['Upload a clear pathology lab report or enter test values manually.'],
      keyObservations: ['No medical test values were detected in this image.'],
    };
  }

  const abnormal = parameters.filter((p) => p.isAbnormal);
  const critical = parameters.filter((p) => p.indicator === 'critical');

  let doctorSpecialist = 'General Physician';
  const lifestyleAdvice: string[] = [];
  const keyObservations: string[] = [];

  const abnormalNames = abnormal.map((p) => p.parameter.toLowerCase());

  if (abnormalNames.some((n) => n.includes('creatinine') || n.includes('urea') || n.includes('kft'))) {
    doctorSpecialist = 'Nephrologist (Kidney Specialist)';
    lifestyleAdvice.push('Stay well hydrated by drinking 2.5 to 3 liters of water daily.');
    lifestyleAdvice.push('Avoid unnecessary over-the-counter painkillers that strain the kidneys.');
    keyObservations.push('Kidney-related filtration parameters require clinical attention.');
  }

  if (abnormalNames.some((n) => n.includes('glucose') || n.includes('sugar') || n.includes('hba1c'))) {
    doctorSpecialist = 'Endocrinologist / Diabetologist';
    lifestyleAdvice.push('Limit refined carbohydrates and sugary foods.');
    lifestyleAdvice.push('Engage in 30 minutes of brisk walking or exercise daily.');
    keyObservations.push('Blood glucose parameters indicate need for metabolic monitoring.');
  }

  if (abnormalNames.some((n) => n.includes('sgpt') || n.includes('sgot') || n.includes('bilirubin'))) {
    doctorSpecialist = 'Gastroenterologist / Physician';
    lifestyleAdvice.push('Avoid oily, fried, and heavily spiced foods.');
    lifestyleAdvice.push('Maintain a fresh, balanced diet rich in leafy greens and fiber.');
    keyObservations.push('Liver enzymes are elevated above standard physiological range.');
  }

  if (abnormalNames.some((n) => n.includes('hemoglobin') || n.includes('platelet'))) {
    lifestyleAdvice.push('Incorporate iron-rich foods such as spinach, beetroot, and pomegranates.');
    keyObservations.push('Blood cell parameters (hemoglobin/platelets) require clinical review.');
  }

  if (lifestyleAdvice.length === 0) {
    lifestyleAdvice.push('Maintain a balanced, nutritious diet with regular physical exercise.');
    lifestyleAdvice.push('Stay hydrated and ensure 7-8 hours of restful sleep every day.');
  }

  const isCritical = critical.length > 0;
  const isAbnormal = abnormal.length > 0;

  const summaryEnglish = isCritical
    ? `Critical parameter variations detected (${critical.map((c) => c.parameter).join(', ')}). Immediate consultation with a doctor is strongly advised.`
    : isAbnormal
    ? `Mild parameter variations noted in ${abnormal.map((a) => a.parameter).join(', ')}. Routine doctor review and lifestyle adjustments are recommended.`
    : 'All detected clinical parameters fall safely within established reference limits.';

  return {
    isMedicalReport: true,
    summaryHindi: summaryEnglish,
    summaryEnglish,
    doctorSpecialist,
    urgency: isCritical ? 'critical' : isAbnormal ? 'moderate' : 'normal',
    lifestyleAdvice,
    keyObservations: keyObservations.length > 0 ? keyObservations : ['All vital organs and parameters are operating normally.'],
  };
}

export interface AISymptomAnalysisResult {
  interpretationHindi: string; // Kept for backwards compatibility, contains simple English explanation
  interpretationEnglish: string;
  recommendedTests: Array<{ name: string; reason: string }>;
  suggestedSpecialist: string;
  urgency: 'routine' | 'moderate' | 'urgent';
  immediateTips: string[];
}

/**
 * AI Symptom to Test recommender using Zenuxs AI Studio
 */
export async function analyzeSymptomsAI(symptomText: string): Promise<AISymptomAnalysisResult> {
  const prompt = `You are a medical triage assistant at Absolute Diagnostic Pathology Lab.
A patient describes the following symptoms:
"${symptomText}"

Analyze these symptoms and recommend appropriate diagnostic lab tests in simple, clear English.
Respond in strict JSON format:
{
  "interpretationEnglish": "1-2 clear sentences in simple English explaining what these symptoms might indicate.",
  "recommendedTests": [
    {"name": "Test Name 1", "reason": "Why this test is needed"},
    {"name": "Test Name 2", "reason": "Why this test is needed"}
  ],
  "suggestedSpecialist": "e.g., General Physician, Cardiologist, ENT, Dermatologist",
  "urgency": "routine" | "moderate" | "urgent",
  "immediateTips": ["Tip 1", "Tip 2"]
}`;

  try {
    const aiResponse = await callZenuxsAI({
      prompt,
      maxTokens: 500,
      temperature: 0.3,
      timeoutMs: 8000,
    });

    if (aiResponse) {
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const eng = parsed.interpretationEnglish || parsed.interpretationHindi || 'Based on your reported symptoms, the following lab tests are recommended.';
        return {
          interpretationHindi: eng,
          interpretationEnglish: eng,
          recommendedTests: Array.isArray(parsed.recommendedTests) ? parsed.recommendedTests : [],
          suggestedSpecialist: parsed.suggestedSpecialist || 'General Physician',
          urgency: parsed.urgency || 'routine',
          immediateTips: Array.isArray(parsed.immediateTips) ? parsed.immediateTips : [],
        };
      }
    }
  } catch (e) {
    console.warn('AI Symptom check note:', e);
  }

  // Heuristic symptom mapping fallback
  const lower = symptomText.toLowerCase();
  const tests: Array<{ name: string; reason: string }> = [];

  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('chills')) {
    tests.push({ name: 'Complete Blood Count (CBC) with ESR', reason: 'Detects bacterial or viral infection' });
    tests.push({ name: 'Typhoid (Widal Test) & Malarial Antigen', reason: 'Screens common causes of acute fever' });
  }
  if (lower.includes('fatigue') || lower.includes('tired') || lower.includes('weakness') || lower.includes('dizziness')) {
    tests.push({ name: 'Hemoglobin & Iron Profile', reason: 'Checks for anemia and oxygen delivery' });
    tests.push({ name: 'Vitamin D & Vitamin B12', reason: 'Deficiency causes chronic fatigue and weakness' });
    tests.push({ name: 'Thyroid Profile (TSH)', reason: 'Identifies hypothyroidism causing low energy' });
  }
  if (lower.includes('pain') || lower.includes('joint') || lower.includes('knee') || lower.includes('bone')) {
    tests.push({ name: 'Uric Acid & Serum Calcium', reason: 'Rules out gout and bone density weakness' });
    tests.push({ name: 'RA Factor & CRP', reason: 'Checks for joint inflammation and arthritis' });
  }
  if (tests.length === 0) {
    tests.push({ name: 'Complete Blood Count (CBC)', reason: 'Basic health screening for infections and cells' });
    tests.push({ name: 'Routine Urine Examination', reason: 'Checks kidney filtration and metabolic health' });
  }

  const englishSummary = 'Initial diagnostic evaluation is advised to determine the underlying cause of your symptoms.';

  return {
    interpretationHindi: englishSummary,
    interpretationEnglish: englishSummary,
    recommendedTests: tests,
    suggestedSpecialist: 'General Physician',
    urgency: lower.includes('chest') || lower.includes('severe') || lower.includes('breath') ? 'urgent' : 'moderate',
    immediateTips: ['Get adequate rest and stay well hydrated.', 'Do not take unprescribed medications before consulting a doctor.'],
  };
}
