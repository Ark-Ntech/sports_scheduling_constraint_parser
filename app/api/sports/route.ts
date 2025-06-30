import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SportFormData } from '@/lib/types';

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

    // Fetch all sports (public data)
    const { data: sports, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sports' },
        { status: 500 },
      );
    }

    return NextResponse.json(sports || []);
  } catch (error) {
    console.error('Sports API error:', error);
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
    const { name, description, icon, color }: SportFormData = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create new sport
    const { data: newSport, error } = await supabase
      .from('sports')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        icon: icon?.trim(),
        color: color?.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sport:', error);
      return NextResponse.json(
        { error: 'Failed to create sport' },
        { status: 500 },
      );
    }

    return NextResponse.json(newSport);
  } catch (error) {
    console.error('Create sport API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
