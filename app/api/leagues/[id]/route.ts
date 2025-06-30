import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeagueFormData } from '@/lib/types';

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

    const body: LeagueFormData = await request.json();
    const { id } = params;

    // Validate required fields
    if (!body.name || !body.sport_id) {
      return NextResponse.json(
        { error: 'Name and sport_id are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('leagues')
      .update({
        sport_id: body.sport_id,
        name: body.name,
        description: body.description || null,
        organization: body.organization || null,
        level: body.level || null,
        region: body.region || null,
        logo_url: body.logo_url || null,
        website: body.website || null,
        contact_email: body.contact_email || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating league:', error);
      return NextResponse.json(
        { error: 'Failed to update league' },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating league:', error);
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

    const { error } = await supabase.from('leagues').delete().eq('id', id);

    if (error) {
      console.error('Error deleting league:', error);
      return NextResponse.json(
        { error: 'Failed to delete league' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
