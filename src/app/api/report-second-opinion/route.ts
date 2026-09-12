import { NextResponse } from 'next/server';
import { extractPDFText, extractParametersFromText } from '@/lib/pdf-extraction';
import { generateReportSecondOpinionAI } from '@/lib/zenuxs-ai';

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('report')) as File | null;
    const directText = (formData.get('text') as string | null) || '';

    let rawText = directText;

    if (file && typeof file !== 'string') {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.toLowerCase();

      if (ext.endsWith('.pdf')) {
        try {
          rawText = await extractPDFText(buffer);
        } catch {
          rawText = buffer.toString('utf-8').slice(0, 5000);
        }
      } else {
        // If image uploaded directly, fallback text or use provided OCR text
        if (!rawText) {
          rawText = buffer.toString('utf-8').slice(0, 3000);
        }
      }
    }

    if (!rawText || rawText.trim().length < 5) {
      return NextResponse.json({
        error: 'Could not extract legible clinical text from this document. Please type the key values or upload a clearer document.'
      }, { status: 400 });
    }

    // Extract clinical parameters & reference ranges
    const extractedParams = extractParametersFromText(rawText);

    // Hindi/English clinical explanation dictionary for instant patient clarity
    const EXPLANATIONS: Record<string, { hi: string; en: string; organ: string }> = {
      'Hemoglobin (Hb)': {
        hi: 'खून में हीमोग्लोबिन की मात्रा। कम होने पर एनीमिया (खून की कमी) और कमजोरी होती है।',
        en: 'Oxygen carrying capacity of red blood cells. Low values indicate anemia/fatigue.',
        organ: 'Blood / Hemogram',
      },
      'Total WBC Count (TLC)': {
        hi: 'श्वेत रक्त कणिकाएं (WBC)। ज्यादा होने पर शरीर में संक्रमण (Infection) या सूजन हो सकती है।',
        en: 'White blood cells fighting infection. Elevated levels signify infection or inflammation.',
        organ: 'Immune System',
      },
      'Platelet Count': {
        hi: 'प्लेटलेट्स खून का थक्का जमाने में मदद करते हैं। डेंगू या वायरल में कम हो सकते हैं।',
        en: 'Essential for blood clotting. Drops during viral fevers or dengue.',
        organ: 'Blood Clotting',
      },
      'Fasting Blood Glucose': {
        hi: 'खाली पेट रक्त शर्करा। 100 से ऊपर होने पर प्री-डायबिटीज और 126+ होने पर शुगर की संभावना होती है।',
        en: 'Fasting sugar level. >100 indicates pre-diabetes, >126 suggests diabetes.',
        organ: 'Pancreas / Metabolic',
      },
      'HbA1c (Glycated Hemoglobin)': {
        hi: 'पिछले 3 महीने का औसत शुगर स्तर। 5.7% से नीचे सामान्य, 6.5%+ पर डायबिटीज मानी जाती है।',
        en: '3-Month average blood sugar. <5.7% is normal, 6.5%+ confirms diabetes.',
        organ: 'Diabetes Control',
      },
      'Serum Creatinine': {
        hi: 'किडनी (गुर्दे) की कार्यक्षमता का मुख्य टेस्ट। बढ़ा हुआ स्तर किडनी पर दबाव दर्शाता है।',
        en: 'Primary marker for kidney filtration. Elevated levels indicate kidney strain.',
        organ: 'Kidneys (Renal)',
      },
      'Blood Urea Nitrogen (BUN)': {
        hi: 'खून में यूरिया की मात्रा। गुर्दे और डिहाइड्रेशन की स्थिति बताता है।',
        en: 'Waste product filtered by kidneys. High levels suggest dehydration or renal stress.',
        organ: 'Kidneys',
      },
      'Serum Bilirubin (Total)': {
        hi: 'पीलिया (Jaundice) का स्तर। 1.2 से ज्यादा होने पर आंखों व पेशाब में पीलापन आ सकता है।',
        en: 'Bile pigment. Elevated levels indicate jaundice or liver/gallbladder congestion.',
        organ: 'Liver (Hepatic)',
      },
      'SGPT / ALT': {
        hi: 'लिवर एंजाइम। फैटी लिवर या शराब/दवाइयों के असर से यह एंजाइम बढ़ जाता है।',
        en: 'Liver enzyme. Elevated in fatty liver, medication side-effects, or hepatitis.',
        organ: 'Liver',
      },
      'SGOT / AST': {
        hi: 'लिवर व मांसपेशियों का एंजाइम। बढ़ा हुआ स्तर लिवर तनाव की ओर इशारा करता है।',
        en: 'Enzyme found in liver and muscle cells. Elevated during liver or heart stress.',
        organ: 'Liver / Muscle',
      },
      'Total Cholesterol': {
        hi: 'खून में कुल कोलेस्ट्रॉल। 200 से अधिक होने पर दिल की नसों में ब्लॉकेज का खतरा बढ़ता है।',
        en: 'Overall blood cholesterol. >200 mg/dL increases long-term cardiovascular risk.',
        organ: 'Heart / Arteries',
      },
      'Triglycerides': {
        hi: 'खून की चिकनाई। तली-भुनी चीजें खाने और व्यायाम न करने से यह बढ़ जाती है।',
        en: 'Fat in blood. Rises with fried/sugary foods and lack of physical exercise.',
        organ: 'Heart / Metabolism',
      },
      'TSH (Thyroid Stimulating Hormone)': {
        hi: 'थायरॉइड ग्रंथि का हार्मोन। 4.5 से ज्यादा होने पर हाइपोथायरॉइड (वजन बढ़ना/थकान) होता है।',
        en: 'Pituitary thyroid hormone. >4.5 indicates hypothyroidism (weight gain/fatigue).',
        organ: 'Thyroid',
      },
      'Vitamin D (25-OH)': {
        hi: 'हड्डियों व इम्युनिटी के लिए आवश्यक। 30 से कम होने पर जोड़ों व कमर में दर्द होता है।',
        en: 'Crucial for bone density and immunity. <30 ng/mL causes bone/joint aches.',
        organ: 'Bones & Immunity',
      },
      'Vitamin B12': {
        hi: 'नसों और दिमाग की ताकत का विटामिन। कम होने पर हाथ-पैरों में झनझनाहट होती है।',
        en: 'Essential for nerve health and brain function. Low levels cause tingling/weakness.',
        organ: 'Nerves & Energy',
      },
    };

    const enriched = extractedParams.map((p) => {
      const exp = EXPLANATIONS[p.parameter] || {
        hi: 'लैब जांच का सामान्य मापदंड। संदर्भ सीमा (Reference Range) से तुलना करें।',
        en: 'Standard diagnostic parameter. Compare against reference range.',
        organ: 'General Health',
      };
      return {
        ...p,
        explanationHindi: exp.hi,
        explanationEnglish: exp.en,
        organ: exp.organ,
      };
    });

    const abnormalCount = enriched.filter((p) => p.isAbnormal).length;
    const criticalCount = enriched.filter((p) => p.indicator === 'critical').length;

    // Generate clinical AI Second Opinion via Zenuxs AI Studio
    const aiOpinion = await generateReportSecondOpinionAI(enriched, rawText);

    return NextResponse.json({
      success: true,
      totalParametersDetected: enriched.length,
      abnormalCount,
      criticalCount,
      parameters: enriched,
      aiOpinion,
      clinicalVerdict:
        criticalCount > 0
          ? 'URGENT_DOCTOR_ATTENTION_NEEDED'
          : abnormalCount > 0
          ? 'MILD_ABNORMALITIES_LIFESTYLE_REVIEW'
          : 'ALL_PARAMETERS_NORMAL',
      disclaimer:
        'This instant AI report analysis is powered by Zenuxs AI Studio for educational and informational understanding only. It does not replace clinical doctor diagnosis.',
    });

  } catch (err: any) {
    console.error('Analyze external report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze report' }, { status: 500 });
  }
}
