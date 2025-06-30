import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json({ error: 'setId is required' }, { status: 400 });
    }

    // Get constraints for the specified set
    const { data: constraints, error } = await supabase
      .from('constraints')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching constraints:', error);
      return NextResponse.json(
        { error: 'Failed to fetch constraints' },
        { status: 500 },
      );
    }

    return NextResponse.json(constraints || []);
  } catch (error) {
    console.error('Constraints API error:', error);
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
    const { setId, constraints, createNewSet, newSetData } = body;

    // If creating a new constraint set
    if (createNewSet && newSetData) {
      const { data: newSet, error: setError } = await supabase
        .from('constraint_sets')
        .insert({
          name: newSetData.name,
          description: newSetData.description,
          user_id: user.id,
          sport_id: newSetData.sport_id || null,
          league_id: newSetData.league_id || null,
          season_id: newSetData.season_id || null,
          team_id: newSetData.team_id || null,
          tags: newSetData.tags || [],
          is_template: newSetData.is_template || false,
          visibility: newSetData.visibility || 'private',
        })
        .select(`
          *,
          sport:sports(*),
          league:leagues(*),
          season:seasons(*),
          team:teams(*)
        `)
        .single();

      if (setError) {
        console.error('Error creating constraint set:', setError);
        return NextResponse.json(
          { error: 'Failed to create constraint set' },
          { status: 500 },
        );
      }

      // Use the new set ID for constraints
      const targetSetId = newSet.id;

      // Save constraints to the new set
      if (constraints && constraints.length > 0) {
        const constraintsToInsert = constraints.map((constraint: any) => ({
          set_id: targetSetId,
          raw_text: constraint.raw_text,
          parsed_data: constraint.parsed_data,
          confidence_score: constraint.confidence_score,
          priority: constraint.priority || 'medium',
          status: constraint.status || 'active',
          tags: constraint.tags || [],
          notes: constraint.notes || '',
        }));

        const { data: savedConstraints, error: constraintsError } =
          await supabase
            .from('constraints')
            .insert(constraintsToInsert)
            .select('*');

        if (constraintsError) {
          console.error('Error saving constraints:', constraintsError);
          return NextResponse.json(
            { error: 'Failed to save constraints' },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          constraintSet: newSet,
          constraints: savedConstraints,
          message: `Created new constraint set "${newSet.name}" with ${savedConstraints.length} constraints`,
        });
      } else {
        return NextResponse.json({
          success: true,
          constraintSet: newSet,
          constraints: [],
          message: `Created new constraint set "${newSet.name}"`,
        });
      }
    }

    // If adding to existing set
    if (setId && constraints && constraints.length > 0) {
      // Verify user has access to the constraint set
      const { data: constraintSet, error: setError } = await supabase
        .from('constraint_sets')
        .select('*')
        .eq('id', setId)
        .eq('user_id', user.id)
        .single();

      if (setError || !constraintSet) {
        return NextResponse.json(
          { error: 'Constraint set not found or access denied' },
          { status: 404 },
        );
      }

      const constraintsToInsert = constraints.map((constraint: any) => ({
        set_id: setId,
        raw_text: constraint.raw_text,
        parsed_data: constraint.parsed_data,
        confidence_score: constraint.confidence_score,
        priority: constraint.priority || 'medium',
        status: constraint.status || 'active',
        tags: constraint.tags || [],
        notes: constraint.notes || '',
      }));

      const { data: savedConstraints, error: constraintsError } = await supabase
        .from('constraints')
        .insert(constraintsToInsert)
        .select('*');

      if (constraintsError) {
        console.error('Error saving constraints:', constraintsError);
        return NextResponse.json(
          { error: 'Failed to save constraints' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        constraints: savedConstraints,
        message: `Added ${savedConstraints.length} constraints to "${constraintSet.name}"`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request: missing setId or constraints' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Save constraints API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, priority, status, tags, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Constraint ID is required' },
        { status: 400 },
      );
    }

    // Update constraint
    const { data: updatedConstraint, error } = await supabase
      .from('constraints')
      .update({
        priority: priority || 'medium',
        status: status || 'active',
        tags: tags || [],
        notes: notes || '',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating constraint:', error);
      return NextResponse.json(
        { error: 'Failed to update constraint' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      constraint: updatedConstraint,
      message: 'Constraint updated successfully',
    });
  } catch (error) {
    console.error('Update constraint API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Constraint ID is required' },
        { status: 400 },
      );
    }

    // Delete constraint
    const { error } = await supabase.from('constraints').delete().eq('id', id);

    if (error) {
      console.error('Error deleting constraint:', error);
      return NextResponse.json(
        { error: 'Failed to delete constraint' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Constraint deleted successfully',
    });
  } catch (error) {
    console.error('Delete constraint API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
