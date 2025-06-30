import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SeasonFormData } from '@/lib/types';

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
    const leagueId = searchParams.get('leagueId');

    // Build query with optional league filter
    let query = supabase
      .from('seasons')
      .select(`
        *,
        league:leagues(
          *,
          sport:sports(*)
        )
      `)
      .order('start_date', { ascending: false });

    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }

    const { data: seasons, error } = await query;

    if (error) {
      console.error('Error fetching seasons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch seasons' },
        { status: 500 },
      );
    }

    return NextResponse.json(seasons || []);
  } catch (error) {
    console.error('Seasons API error:', error);
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
      league_id,
      name,
      description,
      start_date,
      end_date,
      status,
    }: SeasonFormData = body;

    if (!league_id || !name) {
      return NextResponse.json(
        { error: 'League ID and name are required' },
        { status: 400 },
      );
    }

    // Create new season
    const { data: newSeason, error } = await supabase
      .from('seasons')
      .insert({
        league_id,
        name: name.trim(),
        description: description?.trim(),
        start_date,
        end_date,
        status: status || 'planning',
      })
      .select(`
        *,
        league:leagues(
          *,
          sport:sports(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating season:', error);
      return NextResponse.json(
        { error: 'Failed to create season' },
        { status: 500 },
      );
    }

    return NextResponse.json(newSeason);
  } catch (error) {
    console.error('Create season API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
