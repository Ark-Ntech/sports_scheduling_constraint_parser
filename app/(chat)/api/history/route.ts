import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json(
    {
      error:
        'History functionality is temporarily disabled. This project focuses on constraint parsing.',
    },
    { status: 501 },
  );
}
