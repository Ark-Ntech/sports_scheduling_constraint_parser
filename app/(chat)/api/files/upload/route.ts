import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    {
      error:
        'File upload functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}
