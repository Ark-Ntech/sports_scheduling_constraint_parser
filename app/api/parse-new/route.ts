import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HuggingFaceConstraintParser } from '@/lib/nlp/huggingface-parser';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 NEW PARSE ENDPOINT CALLED');

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('📝 Parsing constraint:', text);

    // Simple test response to verify this endpoint works
    const response = {
      success: true,
      message: 'NEW ENDPOINT WORKING!',
      text: text,
      timestamp: new Date().toISOString(),
      endpoint: '/api/parse-new',
    };

    console.log('✅ Returning success response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('New parse API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'New parse endpoint is working!',
    endpoint: '/api/parse-new',
    timestamp: new Date().toISOString(),
  });
}
