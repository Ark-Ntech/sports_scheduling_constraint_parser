import { NextResponse } from 'next/server';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? 'true' : 'false',
      version: '2.1.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
