import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    message: 'Diagnostic endpoint active',
    version: '2024-12-30-auth-enabled',
    features: {
      supabaseClient: 'available',
      authenticationEnabled: true,
      apiRouteLocation: '/app/api/diagnostic/route.ts',
      expectedBehavior:
        'This endpoint should work without auth for diagnostics',
    },
  };

  return NextResponse.json(diagnostic);
}

export async function POST() {
  try {
    // Test Supabase connection and auth
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const authDiagnostic = {
      timestamp: new Date().toISOString(),
      message: 'Auth diagnostic',
      version: '2024-12-30-auth-enabled',
      authResult: {
        hasUser: !!user,
        userID: user?.id || null,
        authError: authError?.message || null,
        supabaseWorking: !authError,
      },
      expectedBehavior: user
        ? 'Should work with auth'
        : 'Should return 401 in parse endpoint',
    };

    return NextResponse.json(authDiagnostic);
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      message: 'Auth diagnostic error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
