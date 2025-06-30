import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeagueFormData } from '@/lib/types';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sportId');

    // Build query with optional sport filter
    let query = supabase
      .from('leagues')
      .select(`
        *,
        sport:sports(*)
      `)
      .order('name', { ascending: true });

    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data: leagues, error } = await query;

    if (error) {
      console.error('Error fetching leagues:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leagues' },
        { status: 500 },
      );
    }

    return NextResponse.json(leagues || []);
  } catch (error) {
    console.error('Leagues API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sport_id,
      name,
      description,
      organization,
      level,
      region,
      logo_url,
      website,
      contact_email,
    }: LeagueFormData = body;

    if (!sport_id || !name) {
      return NextResponse.json(
        { error: 'Sport ID and name are required' },
        { status: 400 },
      );
    }

    // Create new league
    const { data: newLeague, error } = await supabase
      .from('leagues')
      .insert({
        sport_id,
        name: name.trim(),
        description: description?.trim(),
        organization: organization?.trim(),
        level: level?.trim(),
        region: region?.trim(),
        logo_url: logo_url?.trim(),
        website: website?.trim(),
        contact_email: contact_email?.trim(),
      })
      .select(`
        *,
        sport:sports(*)
      `)
      .single();

    if (error) {
      console.error('Error creating league:', error);
      return NextResponse.json(
        { error: 'Failed to create league' },
        { status: 500 },
      );
    }

    return NextResponse.json(newLeague);
  } catch (error) {
    console.error('Create league API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
