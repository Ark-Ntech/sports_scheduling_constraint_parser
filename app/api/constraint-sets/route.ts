import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ConstraintSetFormData } from '@/lib/types';

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
    const leagueId = searchParams.get('leagueId');
    const seasonId = searchParams.get('seasonId');
    const teamId = searchParams.get('teamId');
    const visibility = searchParams.get('visibility') as
      | 'private'
      | 'shared'
      | 'public'
      | null;
    const isTemplate = searchParams.get('isTemplate');

    // Build query with enhanced joins and filters
    let query = supabase
      .from('constraint_sets')
      .select(`
        *,
        sport:sports(*),
        league:leagues(*),
        season:seasons(*),
        team:teams(*)
      `)
      .order('created_at', { ascending: false });

    // Apply access control - users can see their own private sets + shared/public sets
    query = query.or(`user_id.eq.${user.id},visibility.in.(shared,public)`);

    // Apply filters
    if (sportId) {
      query = query.eq('sport_id', sportId);
    }
    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }
    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    if (visibility) {
      query = query.eq('visibility', visibility);
    }
    if (isTemplate !== null) {
      query = query.eq('is_template', isTemplate === 'true');
    }

    const { data: constraintSets, error } = await query;

    if (error) {
      console.error('Error fetching constraint sets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch constraint sets' },
        { status: 500 },
      );
    }

    return NextResponse.json(constraintSets || []);
  } catch (error) {
    console.error('Constraint sets API error:', error);
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
      name,
      description,
      sport_id,
      league_id,
      season_id,
      team_id,
      tags,
      is_template,
      visibility,
    }: ConstraintSetFormData = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create new constraint set with enhanced features
    const { data: newSet, error } = await supabase
      .from('constraint_sets')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        user_id: user.id,
        sport_id: sport_id || null,
        league_id: league_id || null,
        season_id: season_id || null,
        team_id: team_id || null,
        tags: tags || [],
        is_template: is_template || false,
        visibility: visibility || 'private',
      })
      .select(`
        *,
        sport:sports(*),
        league:leagues(*),
        season:seasons(*),
        team:teams(*)
      `)
      .single();

    if (error) {
      console.error('Error creating constraint set:', error);
      return NextResponse.json(
        { error: 'Failed to create constraint set' },
        { status: 500 },
      );
    }

    return NextResponse.json(newSet);
  } catch (error) {
    console.error('Create constraint set API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
