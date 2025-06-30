import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type {
  Sport,
  League,
  Season,
  Team,
  ConstraintSet,
  Constraint,
  SportFormData,
  LeagueFormData,
  SeasonFormData,
  TeamFormData,
  ConstraintSetFormData,
  ConstraintFormData,
} from '@/lib/types';

// ===== SERVER-SIDE DATABASE OPERATIONS =====

// Sports Operations
export async function getSports(): Promise<Sport[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }

  return data || [];
}

export async function createSport(data: SportFormData): Promise<Sport> {
  const supabase = await createClient();

  const { data: newSport, error } = await supabase
    .from('sports')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating sport:', error);
    throw error;
  }

  return newSport;
}

// Leagues Operations
export async function getLeagues(sportId?: string): Promise<League[]> {
  const supabase = await createClient();

  let query = supabase
    .from('leagues')
    .select(`
      *,
      sport:sports(*)
    `)
    .order('name', { ascending: true });

  if (sportId) {
    query = query.eq('sport_id', sportId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leagues:', error);
    throw error;
  }

  return data || [];
}

export async function createLeague(data: LeagueFormData): Promise<League> {
  const supabase = await createClient();

  const { data: newLeague, error } = await supabase
    .from('leagues')
    .insert(data)
    .select(`
      *,
      sport:sports(*)
    `)
    .single();

  if (error) {
    console.error('Error creating league:', error);
    throw error;
  }

  return newLeague;
}

// Seasons Operations
export async function getSeasons(leagueId?: string): Promise<Season[]> {
  const supabase = await createClient();

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

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }

  return data || [];
}

export async function createSeason(data: SeasonFormData): Promise<Season> {
  const supabase = await createClient();

  const { data: newSeason, error } = await supabase
    .from('seasons')
    .insert(data)
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
    throw error;
  }

  return newSeason;
}

// Teams Operations
export async function getTeams(seasonId?: string): Promise<Team[]> {
  const supabase = await createClient();

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

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }

  return data || [];
}

export async function createTeam(data: TeamFormData): Promise<Team> {
  const supabase = await createClient();

  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert(data)
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
    throw error;
  }

  return newTeam;
}

// Enhanced Constraint Sets Operations
export async function getConstraintSets(
  userId: string,
  filters?: {
    sportId?: string;
    leagueId?: string;
    seasonId?: string;
    teamId?: string;
    visibility?: 'private' | 'shared' | 'public';
    isTemplate?: boolean;
  },
): Promise<ConstraintSet[]> {
  const supabase = await createClient();

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

  // Apply access control
  query = query.or(`user_id.eq.${userId},visibility.in.(shared,public)`);

  // Apply filters
  if (filters?.sportId) {
    query = query.eq('sport_id', filters.sportId);
  }
  if (filters?.leagueId) {
    query = query.eq('league_id', filters.leagueId);
  }
  if (filters?.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }
  if (filters?.teamId) {
    query = query.eq('team_id', filters.teamId);
  }
  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility);
  }
  if (filters?.isTemplate !== undefined) {
    query = query.eq('is_template', filters.isTemplate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching constraint sets:', error);
    throw error;
  }

  return data || [];
}

export async function createConstraintSet(
  data: ConstraintSetFormData,
  userId: string,
): Promise<ConstraintSet> {
  const supabase = await createClient();

  const { data: newSet, error } = await supabase
    .from('constraint_sets')
    .insert({
      ...data,
      user_id: userId,
      is_template: data.is_template || false,
      visibility: data.visibility || 'private',
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
    throw error;
  }

  return newSet;
}

export async function updateConstraintSet(
  id: string,
  data: Partial<ConstraintSetFormData>,
  userId: string,
): Promise<ConstraintSet> {
  const supabase = await createClient();

  const { data: updatedSet, error } = await supabase
    .from('constraint_sets')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
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
    throw error;
  }

  return updatedSet;
}

export async function deleteConstraintSet(
  id: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('constraint_sets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting constraint set:', error);
    throw error;
  }
}

// Constraints Operations
export async function getConstraints(setId: string): Promise<Constraint[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('constraints')
    .select('*')
    .eq('set_id', setId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching constraints:', error);
    throw error;
  }

  return data || [];
}

export async function createConstraint(
  data: ConstraintFormData & { parsed_data: any; confidence_score?: number },
): Promise<Constraint> {
  const supabase = await createClient();

  const { data: newConstraint, error } = await supabase
    .from('constraints')
    .insert({
      ...data,
      priority: data.priority || 'medium',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating constraint:', error);
    throw error;
  }

  return newConstraint;
}

export async function updateConstraint(
  id: string,
  data: Partial<
    ConstraintFormData & { parsed_data?: any; confidence_score?: number }
  >,
): Promise<Constraint> {
  const supabase = await createClient();

  const { data: updatedConstraint, error } = await supabase
    .from('constraints')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating constraint:', error);
    throw error;
  }

  return updatedConstraint;
}

export async function deleteConstraint(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('constraints').delete().eq('id', id);

  if (error) {
    console.error('Error deleting constraint:', error);
    throw error;
  }
}

// ===== CLIENT-SIDE DATABASE OPERATIONS =====

export class DatabaseClient {
  private supabase = createBrowserClient();

  // Sports
  async getSports(): Promise<Sport[]> {
    const { data, error } = await this.supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sports:', error);
      throw error;
    }

    return data || [];
  }

  async createSport(data: SportFormData): Promise<Sport> {
    const { data: newSport, error } = await this.supabase
      .from('sports')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating sport:', error);
      throw error;
    }

    return newSport;
  }

  // Leagues
  async getLeagues(sportId?: string): Promise<League[]> {
    let query = this.supabase
      .from('leagues')
      .select(`
        *,
        sport:sports(*)
      `)
      .order('name', { ascending: true });

    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }

    return data || [];
  }

  async createLeague(data: LeagueFormData): Promise<League> {
    const { data: newLeague, error } = await this.supabase
      .from('leagues')
      .insert(data)
      .select(`
        *,
        sport:sports(*)
      `)
      .single();

    if (error) {
      console.error('Error creating league:', error);
      throw error;
    }

    return newLeague;
  }

  // Seasons
  async getSeasons(leagueId?: string): Promise<Season[]> {
    let query = this.supabase
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching seasons:', error);
      throw error;
    }

    return data || [];
  }

  async createSeason(data: SeasonFormData): Promise<Season> {
    const { data: newSeason, error } = await this.supabase
      .from('seasons')
      .insert(data)
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
      throw error;
    }

    return newSeason;
  }

  // Teams
  async getTeams(seasonId?: string): Promise<Team[]> {
    let query = this.supabase
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }

    return data || [];
  }

  async createTeam(data: TeamFormData): Promise<Team> {
    const { data: newTeam, error } = await this.supabase
      .from('teams')
      .insert(data)
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
      throw error;
    }

    return newTeam;
  }

  // Enhanced Constraint Sets
  async getConstraintSets(filters?: {
    sportId?: string;
    leagueId?: string;
    seasonId?: string;
    teamId?: string;
    visibility?: 'private' | 'shared' | 'public';
    isTemplate?: boolean;
  }): Promise<ConstraintSet[]> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = this.supabase
      .from('constraint_sets')
      .select(`
        *,
        sport:sports(*),
        league:leagues(*),
        season:seasons(*),
        team:teams(*)
      `)
      .order('created_at', { ascending: false });

    // Apply access control
    query = query.or(
      `user_id.eq.${user.user.id},visibility.in.(shared,public)`,
    );

    // Apply filters
    if (filters?.sportId) {
      query = query.eq('sport_id', filters.sportId);
    }
    if (filters?.leagueId) {
      query = query.eq('league_id', filters.leagueId);
    }
    if (filters?.seasonId) {
      query = query.eq('season_id', filters.seasonId);
    }
    if (filters?.teamId) {
      query = query.eq('team_id', filters.teamId);
    }
    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters?.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching constraint sets:', error);
      throw error;
    }

    return data || [];
  }

  async createConstraintSet(
    data: ConstraintSetFormData,
  ): Promise<ConstraintSet> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: newSet, error } = await this.supabase
      .from('constraint_sets')
      .insert({
        ...data,
        user_id: user.user.id,
        is_template: data.is_template || false,
        visibility: data.visibility || 'private',
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
      throw error;
    }

    return newSet;
  }

  async getConstraints(setId: string): Promise<Constraint[]> {
    const { data, error } = await this.supabase
      .from('constraints')
      .select('*')
      .eq('set_id', setId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching constraints:', error);
      throw error;
    }

    return data || [];
  }

  async createConstraint(
    data: ConstraintFormData & { parsed_data: any; confidence_score?: number },
  ): Promise<Constraint> {
    const { data: newConstraint, error } = await this.supabase
      .from('constraints')
      .insert({
        ...data,
        priority: data.priority || 'medium',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating constraint:', error);
      throw error;
    }

    return newConstraint;
  }

  // Subscribe to real-time changes
  subscribeToConstraintSet(setId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`constraint_set_${setId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'constraints',
          filter: `set_id=eq.${setId}`,
        },
        callback,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `set_id=eq.${setId}`,
        },
        callback,
      )
      .subscribe();
  }

  // Hierarchical data helpers
  async getHierarchyData() {
    const [sports, leagues, seasons, teams] = await Promise.all([
      this.getSports(),
      this.getLeagues(),
      this.getSeasons(),
      this.getTeams(),
    ]);

    return { sports, leagues, seasons, teams };
  }

  async getConstraintHierarchy(constraintSetId: string) {
    const { data: constraintSet, error } = await this.supabase
      .from('constraint_sets')
      .select(`
        *,
        sport:sports(*),
        league:leagues(*),
        season:seasons(*),
        team:teams(*)
      `)
      .eq('id', constraintSetId)
      .single();

    if (error) {
      console.error('Error fetching constraint hierarchy:', error);
      throw error;
    }

    return constraintSet;
  }
}
