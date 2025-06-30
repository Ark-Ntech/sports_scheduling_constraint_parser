import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ConstraintSetFormData } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const constraintSetId = params.id;
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

    // Check if the constraint set exists and belongs to the user
    const { data: existingSet, error: fetchError } = await supabase
      .from('constraint_sets')
      .select('user_id')
      .eq('id', constraintSetId)
      .single();

    if (fetchError || !existingSet) {
      return NextResponse.json(
        { error: 'Constraint set not found' },
        { status: 404 },
      );
    }

    if (existingSet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only edit your own constraint sets' },
        { status: 403 },
      );
    }

    // Update the constraint set
    const { data: updatedSet, error } = await supabase
      .from('constraint_sets')
      .update({
        name: name.trim(),
        description: description?.trim(),
        sport_id: sport_id || null,
        league_id: league_id || null,
        season_id: season_id || null,
        team_id: team_id || null,
        tags: tags || [],
        is_template: is_template || false,
        visibility: visibility || 'private',
        updated_at: new Date().toISOString(),
      })
      .eq('id', constraintSetId)
      .select(`
        *,
        sport:sports(*),
        league:leagues(*),
        season:seasons(*),
        team:teams(*)
      `)
      .single();

    if (error) {
      console.error('Error updating constraint set:', error);
      return NextResponse.json(
        { error: 'Failed to update constraint set' },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Update constraint set API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const constraintSetId = params.id;

    // Check if the constraint set exists and belongs to the user
    const { data: existingSet, error: fetchError } = await supabase
      .from('constraint_sets')
      .select('user_id')
      .eq('id', constraintSetId)
      .single();

    if (fetchError || !existingSet) {
      return NextResponse.json(
        { error: 'Constraint set not found' },
        { status: 404 },
      );
    }

    if (existingSet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only delete your own constraint sets' },
        { status: 403 },
      );
    }

    // Delete the constraint set (this will cascade delete related constraints due to foreign key constraints)
    const { error } = await supabase
      .from('constraint_sets')
      .delete()
      .eq('id', constraintSetId);

    if (error) {
      console.error('Error deleting constraint set:', error);
      return NextResponse.json(
        { error: 'Failed to delete constraint set' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete constraint set API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
