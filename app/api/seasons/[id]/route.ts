import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SeasonFormData } from '@/lib/types';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SeasonFormData = await request.json();
    const { id } = params;

    // Validate required fields
    if (!body.name || !body.league_id) {
      return NextResponse.json(
        { error: 'Name and league_id are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('seasons')
      .update({
        league_id: body.league_id,
        name: body.name,
        description: body.description || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        status: body.status || 'planning',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating season:', error);
      return NextResponse.json(
        { error: 'Failed to update season' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { error } = await supabase.from('seasons').delete().eq('id', id);

    if (error) {
      console.error('Error deleting season:', error);
      return NextResponse.json(
        { error: 'Failed to delete season' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
