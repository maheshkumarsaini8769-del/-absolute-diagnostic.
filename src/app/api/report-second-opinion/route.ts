import { NextResponse } from 'next/server';
import { extractPDFText, extractParametersFromText } from '@/lib/pdf-extraction';
import { generateReportSecondOpinionAI } from '@/lib/zenuxs-ai';

export const dynamic = 'force-dynamic';


const MEDICAL_LAB_KEYWORDS = [
  'hemoglobin', 'hb', 'tlc', 'dlc', 'wbc', 'rbc', 'platelet', 'platelets',
  'glucose', 'sugar', 'creatinine', 'urea', 'bun', 'bilirubin', 'sgpt', 'alt',
  'sgot', 'ast', 'cholesterol', 'triglyceride', 'triglycerides', 'hdl', 'ldl',
  'tsh', 'thyroid', 't3', 't4', 'uric acid', 'esr', 'crp', 'calcium', 'vitamin d',
  'vitamin b12', 'urine', 'dengue', 'widal', 'typhoid', 'malaria', 'hba1c',
  'kft', 'lft', 'cbc', 'rft', 'lipid', 'electrolytes', 'pathology',
  'diagnostic', 'laboratory', 'specimen', 'reference range', 'biological reference',
  'observed value', 'investigation', 'normal range', 'serum', 'plasma', 'hematology', 'biochemistry'
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('report')) as File | null;
    const directText = (formData.get('text') as string | null) || '';

    let rawText = directText;

    if (file && typeof file !== 'string') {
      const ext = file.name.toLowerCase();

      if (ext.endsWith('.pdf')) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          rawText = await extractPDFText(buffer);
        } catch {
          rawText = '';
        }
      } else {
        // Image files: text must be passed from OCR or direct input
        // Do not convert binary image buffer to string
        if (!rawText || rawText.trim().length === 0) {
          return NextResponse.json({
            error: 'This image does not contain readable lab test data. Please upload a clear photo of a pathology test report.'
          }, { status: 400 });
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

    // Verify if the document has actual medical lab signatures
    const lowerText = rawText.toLowerCase();
    const matchedKeywordCount = MEDICAL_LAB_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;

    // Reject non-medical images/documents (e.g. photos of people, cars, animals, receipts, bills, etc.)
    if (extractedParams.length === 0 && matchedKeywordCount < 2) {
      return NextResponse.json({
        error: 'This image does not appear to be a medical lab report. Please upload a clear photo or document of a pathology test report (such as CBC, Blood Sugar, Thyroid, KFT, LFT, or Lipid Profile).'
      }, { status: 400 });
    }

    // Simple English clinical explanation dictionary for instant patient clarity
    const EXPLANATIONS: Record<string, { hi: string; en: string; organ: string }> = {
      'Hemoglobin (Hb)': {
        hi: 'Oxygen carrying capacity of red blood cells. Low values indicate anemia, fatigue, or low energy.',
        en: 'Oxygen carrying capacity of red blood cells. Low values indicate anemia/fatigue.',
        organ: 'Blood / Hemogram',
      },
      'Total WBC Count (TLC)': {
        hi: 'White blood cells fight infection. Higher levels indicate infection, inflammation, or physical stress.',
        en: 'White blood cells fighting infection. Elevated levels signify infection or inflammation.',
        organ: 'Immune System',
      },
      'Platelet Count': {
        hi: 'Platelets help your blood clot normally. Low levels can occur during viral fevers, dengue, or infection.',
        en: 'Essential for blood clotting. Drops during viral fevers or dengue.',
        organ: 'Blood Clotting',
      },
      'Fasting Blood Glucose': {
        hi: 'Fasting blood sugar level. Values above 100 suggest pre-diabetes; above 126 suggests diabetes.',
        en: 'Fasting sugar level. >100 indicates pre-diabetes, >126 suggests diabetes.',
        organ: 'Pancreas / Metabolic',
      },
      'HbA1c (Glycated Hemoglobin)': {
        hi: 'Average blood sugar over the last 3 months. Normal is below 5.7%; above 6.5% indicates diabetes.',
        en: '3-Month average blood sugar. <5.7% is normal, 6.5%+ confirms diabetes.',
        organ: 'Diabetes Control',
      },
      'Serum Creatinine': {
        hi: 'Key indicator of kidney filtration efficiency. High levels suggest strain on kidney function.',
        en: 'Primary marker for kidney filtration. Elevated levels indicate kidney strain.',
        organ: 'Kidneys (Renal)',
      },
      'Blood Urea Nitrogen (BUN)': {
        hi: 'Measures waste filtered by kidneys. High levels may indicate dehydration or kidney stress.',
        en: 'Waste product filtered by kidneys. High levels suggest dehydration or renal stress.',
        organ: 'Kidneys',
      },
      'Serum Bilirubin (Total)': {
        hi: 'Bile pigment in blood. Values above 1.2 mg/dL may cause yellowing of eyes and indicate liver strain.',
        en: 'Bile pigment. Elevated levels indicate jaundice or liver/gallbladder congestion.',
        organ: 'Liver (Hepatic)',
      },
      'SGPT / ALT': {
        hi: 'Key liver enzyme. Rises with fatty liver, medication side-effects, or liver inflammation.',
        en: 'Liver enzyme. Elevated in fatty liver, medication side-effects, or hepatitis.',
        organ: 'Liver',
      },
      'SGOT / AST': {
        hi: 'Enzyme found in liver and heart muscles. Elevated values indicate cellular or liver stress.',
        en: 'Enzyme found in liver and muscle cells. Elevated during liver or heart stress.',
        organ: 'Liver / Muscle',
      },
      'Total Cholesterol': {
        hi: 'Total blood cholesterol. Values above 200 mg/dL increase cardiovascular risk over time.',
        en: 'Overall blood cholesterol. >200 mg/dL increases long-term cardiovascular risk.',
        organ: 'Heart / Arteries',
      },
      'Triglycerides': {
        hi: 'Fat molecules in the blood. Elevated by high sugar, fried food intake, and lack of exercise.',
        en: 'Fat in blood. Rises with fried/sugary foods and lack of physical exercise.',
        organ: 'Heart / Metabolism',
      },
      'TSH (Thyroid Stimulating Hormone)': {
        hi: 'Thyroid gland regulator hormone. Levels above 4.5 indicate an underactive thyroid (fatigue, weight gain).',
        en: 'Pituitary thyroid hormone. >4.5 indicates hypothyroidism (weight gain/fatigue).',
        organ: 'Thyroid',
      },
      'Vitamin D (25-OH)': {
        hi: 'Crucial for bone density and strong immunity. Below 30 ng/mL causes bone pain and muscle weakness.',
        en: 'Crucial for bone density and immunity. <30 ng/mL causes bone/joint aches.',
        organ: 'Bones & Immunity',
      },
      'Vitamin B12': {
        hi: 'Essential for nerve health and brain function. Low levels lead to numbness, tingling, and fatigue.',
        en: 'Essential for nerve health and brain function. Low levels cause tingling/weakness.',
        organ: 'Nerves & Energy',
      },
    };

    const enriched = extractedParams.map((p) => {
      const exp = EXPLANATIONS[p.parameter] || {
        hi: 'Standard diagnostic parameter. Compare your result with the reference range.',
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

    if (aiOpinion.isMedicalReport === false) {
      return NextResponse.json({
        error: aiOpinion.summaryEnglish || 'This image does not appear to be a medical lab report. Please upload a clear photo or document of a pathology test report (such as CBC, Blood Sugar, Thyroid, KFT, LFT, or Lipid Profile).'
      }, { status: 400 });
    }

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
          : enriched.length > 0
          ? 'ALL_PARAMETERS_NORMAL'
          : 'NO_PARAMETERS_DETECTED',
      disclaimer:
        'This instant AI report analysis is powered by Zenuxs AI Studio for educational and informational understanding only. It does not replace clinical doctor diagnosis.',
    });

  } catch (err: any) {
    console.error('Analyze external report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze report' }, { status: 500 });
  }
}
