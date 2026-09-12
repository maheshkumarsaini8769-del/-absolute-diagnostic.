import { NextResponse } from 'next/server';
import { analyzeSymptomsAI } from '@/lib/zenuxs-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symptoms } = body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      return NextResponse.json(
        { error: 'कृपया अपने लक्षण कम से कम 3 अक्षरों में लिखें (उदा. बुखार, बदन दर्द, सिरदर्द)' },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymptomsAI(symptoms.trim());

    return NextResponse.json({
      success: true,
      analysis,
      disclaimer: 'यह AI सुझाव केवल प्राथमिक जानकारी हेतु है। सटीक उपचार के लिए डॉक्टर से संपर्क करें।',
    });
  } catch (error: any) {
    console.error('AI symptom check error:', error);
    return NextResponse.json(
      { error: error.message || 'लक्षणों के विश्लेषण में समस्या आई।' },
      { status: 500 }
    );
  }
}
