import { NextResponse } from 'next/server';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return NextResponse.json(
    {
      error:
        'Document functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}

export async function POST(request: Request) {
  return NextResponse.json(
    {
      error:
        'Document functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}

export async function DELETE(request: Request) {
  return NextResponse.json(
    {
      error:
        'Document functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}
