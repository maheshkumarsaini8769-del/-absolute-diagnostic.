import { NextResponse } from 'next/server';
import { analyzeSymptomsAI } from '@/lib/zenuxs-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symptoms } = body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter your symptoms in at least 3 letters (e.g. fever, body ache, headache)' },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymptomsAI(symptoms.trim());

    return NextResponse.json({
      success: true,
      analysis,
      disclaimer: 'This AI recommendation is for initial information only. Please consult a qualified doctor for diagnosis and treatment.',
    });
  } catch (error: any) {
    console.error('AI symptom check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze symptoms. Please try again.' },
      { status: 500 }
    );
  }
}
