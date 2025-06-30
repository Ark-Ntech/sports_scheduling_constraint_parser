import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SportFormData } from '@/lib/types';

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

    const sportId = params.id;
    const body = await request.json();
    const { name, description, icon, color }: SportFormData = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if the sport exists
    const { data: existingSport, error: fetchError } = await supabase
      .from('sports')
      .select('id')
      .eq('id', sportId)
      .single();

    if (fetchError || !existingSport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    // Update the sport
    const { data: updatedSport, error } = await supabase
      .from('sports')
      .update({
        name: name.trim(),
        description: description?.trim(),
        icon: icon?.trim(),
        color: color?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sport:', error);
      return NextResponse.json(
        { error: 'Failed to update sport' },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedSport);
  } catch (error) {
    console.error('Update sport API error:', error);
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

    const sportId = params.id;

    // Check if the sport exists
    const { data: existingSport, error: fetchError } = await supabase
      .from('sports')
      .select('id')
      .eq('id', sportId)
      .single();

    if (fetchError || !existingSport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    // Delete the sport (this will cascade delete related leagues, seasons, teams, and constraint sets due to foreign key constraints)
    const { error } = await supabase.from('sports').delete().eq('id', sportId);

    if (error) {
      console.error('Error deleting sport:', error);
      return NextResponse.json(
        { error: 'Failed to delete sport' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete sport API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
