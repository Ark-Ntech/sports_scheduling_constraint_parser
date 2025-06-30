import { NextResponse } from 'next/server';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'API routing is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'POST method is working!',
    timestamp: new Date().toISOString(),
  });
}
