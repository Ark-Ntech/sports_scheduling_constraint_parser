import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TeamFormData } from '@/lib/types';

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
    const seasonId = searchParams.get('seasonId');

    // Build query with optional season filter
    let query = supabase
      .from('teams')
      .select(`
        *,
        season:seasons(
          *,
          league:leagues(
            *,
            sport:sports(*)
          )
        )
      `)
      .order('name', { ascending: true });

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data: teams, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 },
      );
    }

    return NextResponse.json(teams || []);
  } catch (error) {
    console.error('Teams API error:', error);
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
      season_id,
      name,
      description,
      coach_name,
      contact_email,
      home_venue,
      color,
      logo_url,
    }: TeamFormData = body;

    if (!season_id || !name) {
      return NextResponse.json(
        { error: 'Season ID and name are required' },
        { status: 400 },
      );
    }

    // Create new team
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        season_id,
        name: name.trim(),
        description: description?.trim(),
        coach_name: coach_name?.trim(),
        contact_email: contact_email?.trim(),
        home_venue: home_venue?.trim(),
        color: color?.trim(),
        logo_url: logo_url?.trim(),
      })
      .select(`
        *,
        season:seasons(
          *,
          league:leagues(
            *,
            sport:sports(*)
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 },
      );
    }

    return NextResponse.json(newTeam);
  } catch (error) {
    console.error('Create team API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
