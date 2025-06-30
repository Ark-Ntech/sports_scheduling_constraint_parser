import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TeamFormData } from '@/lib/types';

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

    const body: TeamFormData = await request.json();
    const { id } = params;

    // Validate required fields
    if (!body.name || !body.season_id) {
      return NextResponse.json(
        { error: 'Name and season_id are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('teams')
      .update({
        season_id: body.season_id,
        name: body.name,
        description: body.description || null,
        coach_name: body.coach_name || null,
        contact_email: body.contact_email || null,
        home_venue: body.home_venue || null,
        color: body.color || null,
        logo_url: body.logo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating team:', error);
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

    const { error } = await supabase.from('teams').delete().eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json(
        { error: 'Failed to delete team' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
