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
  summaryHindi: string;
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

  const prompt = `You are a clinical pathologist at Absolute Diagnostic.
Review this patient diagnostic lab report:
Parameters detected:
${paramSummary}

Provide a concise, patient-friendly medical explanation.
Output your evaluation in strict JSON format with these exact keys:
{
  "summaryHindi": "2-3 clear sentences in simple Hindi explaining the overall status and what is high/low.",
  "summaryEnglish": "2-3 clear sentences in English summarizing the clinical findings.",
  "doctorSpecialist": "e.g., General Physician, Endocrinologist, Nephrologist, Cardiologist",
  "urgency": "normal" | "moderate" | "critical",
  "lifestyleAdvice": ["Advice 1", "Advice 2", "Advice 3"],
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
      // Clean possible markdown code fences
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          summaryHindi: parsed.summaryHindi || '',
          summaryEnglish: parsed.summaryEnglish || '',
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
  const abnormal = parameters.filter((p) => p.isAbnormal);
  const critical = parameters.filter((p) => p.indicator === 'critical');

  let doctorSpecialist = 'General Physician (सामान्य चिकित्सक)';
  const lifestyleAdvice: string[] = [];
  const keyObservations: string[] = [];

  const abnormalNames = abnormal.map((p) => p.parameter.toLowerCase());

  if (abnormalNames.some((n) => n.includes('creatinine') || n.includes('urea') || n.includes('kft'))) {
    doctorSpecialist = 'Nephrologist (गुर्दा रोग विशेषज्ञ)';
    lifestyleAdvice.push('पर्याप्त मात्रा में पानी पिएं (दिन में 2.5 - 3 लीटर)।');
    lifestyleAdvice.push('दवाइयों (विशेषकर पेनकिलर) का अनावश्यक सेवन तुरंत बंद करें।');
    keyObservations.push('गुर्दे (Kidney) से जुड़े मापदंडों में असंतुलन देखा गया है।');
  }

  if (abnormalNames.some((n) => n.includes('glucose') || n.includes('sugar') || n.includes('hba1c'))) {
    doctorSpecialist = 'Endocrinologist / Diabetologist';
    lifestyleAdvice.push('मीठे खाद्य पदार्थ और रिफाइंड कार्ब्स का सेवन सीमित करें।');
    lifestyleAdvice.push('प्रतिदिन कम से कम 30 मिनट तेज गति से पैदल चलें।');
    keyObservations.push('रक्त शर्करा (Blood Sugar) का स्तर नियंत्रित रखने की आवश्यकता है।');
  }

  if (abnormalNames.some((n) => n.includes('sgpt') || n.includes('sgot') || n.includes('bilirubin'))) {
    doctorSpecialist = 'Gastroenterologist / Physician';
    lifestyleAdvice.push('तली-भुनी, मसालेदार और वसायुक्त चीजों से परहेज रखें।');
    lifestyleAdvice.push('ताजे मौसमी फल व घर का सादा भोजन लें।');
    keyObservations.push('लिवर एंजाइम सामान्य स्तर से अधिक हैं।');
  }

  if (abnormalNames.some((n) => n.includes('hemoglobin') || n.includes('platelet'))) {
    lifestyleAdvice.push('हरी पत्तेदार सब्जियां, अनार, चुकंदर और गुड़-चना आहार में शामिल करें।');
    keyObservations.push('खून की लाल कोशिकाओं या प्लेटलेट्स की स्थिति पर ध्यान देने की आवश्यकता है।');
  }

  if (lifestyleAdvice.length === 0) {
    lifestyleAdvice.push('संतुलित व पौष्टिक आहार लें तथा नियमित व्यायाम करें।');
    lifestyleAdvice.push('हाइड्रेटेड रहें और 7-8 घंटे की पर्याप्त नींद लें।');
  }

  const isCritical = critical.length > 0;
  const isAbnormal = abnormal.length > 0;

  const summaryHindi = isCritical
    ? `आपकी रिपोर्ट में ${critical.length} टेस्ट मान चिंताजनक सीमा में हैं। बिना देरी किए योग्य डॉक्टर से परामर्श लें ताकि उचित उपचार शुरू हो सके।`
    : isAbnormal
    ? `आपकी रिपोर्ट में ${abnormal.length} टेस्ट सामान्य सीमा से थोड़े बाहर हैं। खान-पान में सुधार और डॉक्टर से सलाह लेकर इन्हें सामान्य किया जा सकता है।`
    : 'बधाई हो! आपकी रिपोर्ट के सभी जांचे गए मुख्य मापदंड पूरी तरह सामान्य सीमा के भीतर हैं।';

  const summaryEnglish = isCritical
    ? `Critical parameter variation detected (${critical.map((c) => c.parameter).join(', ')}). Immediate consultation with a physician is strongly advised.`
    : isAbnormal
    ? `Mild parameter variations noted in ${abnormal.map((a) => a.parameter).join(', ')}. Routine physician review and targeted lifestyle management recommended.`
    : 'All detected clinical parameters fall within established physiological reference limits.';

  return {
    summaryHindi,
    summaryEnglish,
    doctorSpecialist,
    urgency: isCritical ? 'critical' : isAbnormal ? 'moderate' : 'normal',
    lifestyleAdvice,
    keyObservations: keyObservations.length > 0 ? keyObservations : ['सभी मुख्य अंग सामान्य रूप से काम कर रहे हैं।'],
  };
}

export interface AISymptomAnalysisResult {
  interpretationHindi: string;
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

Analyze these symptoms and recommend appropriate diagnostic lab tests.
Respond in strict JSON format:
{
  "interpretationHindi": "1-2 sentences in simple Hindi explaining what these symptoms might indicate.",
  "interpretationEnglish": "1-2 sentences in English summarizing the potential clinical concern.",
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
        return {
          interpretationHindi: parsed.interpretationHindi || 'आपके बताए गए लक्षणों के आधार पर नीचे दी गई जांचें उपयोगी हो सकती हैं।',
          interpretationEnglish: parsed.interpretationEnglish || 'Based on your symptoms, the following diagnostic tests are suggested.',
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

  if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('thand') || lower.includes('chills')) {
    tests.push({ name: 'Complete Blood Count (CBC) with ESR', reason: 'Detects bacterial or viral infection' });
    tests.push({ name: 'Typhoid (Widal Test) & Malarial Antigen', reason: 'Screens common causes of acute fever' });
  }
  if (lower.includes('thakan') || lower.includes('fatigue') || lower.includes('weakness') || lower.includes('chakkar')) {
    tests.push({ name: 'Hemoglobin & Iron Profile', reason: 'Checks for anemia and low oxygen delivery' });
    tests.push({ name: 'Vitamin D & Vitamin B12', reason: 'Deficiency causes persistent tiredness and weakness' });
    tests.push({ name: 'Thyroid Profile (TSH)', reason: 'Identifies hypothyroidism causing fatigue' });
  }
  if (lower.includes('dard') || lower.includes('joint') || lower.includes('knee') || lower.includes('pain')) {
    tests.push({ name: 'Uric Acid & Serum Calcium', reason: 'Rules out gout and bone density weakness' });
    tests.push({ name: 'RA Factor & CRP', reason: 'Checks for joint inflammation and arthritis' });
  }
  if (tests.length === 0) {
    tests.push({ name: 'Complete Blood Count (CBC)', reason: 'Basic health screen for infections and cellular health' });
    tests.push({ name: 'Routine Urine Examination', reason: 'Checks kidney filtration and metabolic waste' });
  }

  return {
    interpretationHindi: 'आपके बताए गए लक्षणों की जांच के लिए प्राथमिक ब्लड टेस्ट आवश्यक हैं ताकि सही कारण का पता लगाया जा सके।',
    interpretationEnglish: 'Initial diagnostic evaluation is advised to determine the underlying cause of your symptoms.',
    recommendedTests: tests,
    suggestedSpecialist: 'General Physician (सामान्य चिकित्सक)',
    urgency: lower.includes('chest') || lower.includes('severe') || lower.includes('saas') ? 'urgent' : 'moderate',
    immediateTips: ['आराम करें और भरपूर पानी पिएं।', 'बिना डॉक्टर की सलाह के खुद से एंटीबायोटिक्स न लें।'],
  };
}
