import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    {
      error:
        'Vote functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}
