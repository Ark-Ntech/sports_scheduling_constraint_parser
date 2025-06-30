import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Sample sports data
    const sportsData = [
      {
        name: 'Basketball',
        description: 'Indoor basketball leagues and tournaments',
        icon: 'basketball',
        color: '#FF8C00',
      },
      {
        name: 'Soccer',
        description: 'Youth and adult soccer leagues',
        icon: 'soccer',
        color: '#32CD32',
      },
      {
        name: 'Volleyball',
        description: 'Indoor and beach volleyball competitions',
        icon: 'volleyball',
        color: '#FFD700',
      },
    ];

    // Create sports
    const { data: sports, error: sportsError } = await supabase
      .from('sports')
      .insert(sportsData)
      .select();

    if (sportsError) {
      console.error('Error creating sports:', sportsError);
      return NextResponse.json(
        { error: 'Failed to create sports' },
        { status: 500 },
      );
    }

    const basketballSport = sports.find((s) => s.name === 'Basketball');
    const soccerSport = sports.find((s) => s.name === 'Soccer');
    const volleyballSport = sports.find((s) => s.name === 'Volleyball');

    // Sample leagues data
    const leaguesData = [
      // Basketball leagues
      {
        sport_id: basketballSport?.id,
        name: 'Metro Basketball League',
        description: 'Competitive adult basketball league',
        organization: 'Metro Sports Association',
        level: 'Adult',
        region: 'Metro Area',
        contact_email: 'info@metrobasketball.org',
      },
      {
        sport_id: basketballSport?.id,
        name: 'Youth Basketball Development',
        description: 'Youth development basketball program',
        organization: 'Community Sports',
        level: 'Youth',
        region: 'City Wide',
        contact_email: 'youth@communitysports.org',
      },
      // Soccer leagues
      {
        sport_id: soccerSport?.id,
        name: 'Premier Youth Soccer',
        description: 'Competitive youth soccer league',
        organization: 'Youth Soccer Association',
        level: 'Youth',
        region: 'Regional',
        contact_email: 'contact@premieryouth.com',
      },
      {
        sport_id: soccerSport?.id,
        name: 'Adult Recreation League',
        description: 'Recreational adult soccer',
        organization: 'Parks & Recreation',
        level: 'Recreational',
        region: 'Local',
        contact_email: 'recreation@city.gov',
      },
      // Volleyball leagues
      {
        sport_id: volleyballSport?.id,
        name: 'Indoor Volleyball Championship',
        description: 'Competitive indoor volleyball',
        organization: 'Volleyball Federation',
        level: 'Competitive',
        region: 'State Wide',
        contact_email: 'championship@volleyball.org',
      },
    ];

    // Create leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .insert(leaguesData)
      .select();

    if (leaguesError) {
      console.error('Error creating leagues:', leaguesError);
      return NextResponse.json(
        { error: 'Failed to create leagues' },
        { status: 500 },
      );
    }

    // Sample seasons data
    const seasonsData = [
      // Basketball seasons
      {
        league_id: leagues.find((l) => l.name === 'Metro Basketball League')
          ?.id,
        name: 'Fall 2024 Season',
        description: 'Fall basketball season',
        start_date: '2024-09-01',
        end_date: '2024-12-15',
        status: 'active' as const,
      },
      {
        league_id: leagues.find(
          (l) => l.name === 'Youth Basketball Development',
        )?.id,
        name: 'Winter 2024-25 Season',
        description: 'Winter youth basketball',
        start_date: '2024-11-01',
        end_date: '2025-02-28',
        status: 'planning' as const,
      },
      // Soccer seasons
      {
        league_id: leagues.find((l) => l.name === 'Premier Youth Soccer')?.id,
        name: 'Spring 2025 Season',
        description: 'Spring youth soccer season',
        start_date: '2025-03-01',
        end_date: '2025-06-15',
        status: 'planning' as const,
      },
      {
        league_id: leagues.find((l) => l.name === 'Adult Recreation League')
          ?.id,
        name: 'Summer 2024 League',
        description: 'Summer adult recreation',
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        status: 'completed' as const,
      },
      // Volleyball seasons
      {
        league_id: leagues.find(
          (l) => l.name === 'Indoor Volleyball Championship',
        )?.id,
        name: '2024 Championship Series',
        description: 'Annual championship tournament',
        start_date: '2024-10-01',
        end_date: '2024-11-30',
        status: 'active' as const,
      },
    ];

    // Create seasons
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .insert(seasonsData)
      .select();

    if (seasonsError) {
      console.error('Error creating seasons:', seasonsError);
      return NextResponse.json(
        { error: 'Failed to create seasons' },
        { status: 500 },
      );
    }

    // Sample teams data
    const teamsData = [
      // Basketball teams
      {
        season_id: seasons.find((s) => s.name === 'Fall 2024 Season')?.id,
        name: 'Thunder Hawks',
        description: 'Competitive adult basketball team',
        coach_name: 'Mike Johnson',
        contact_email: 'mike@thunderhawks.com',
        home_venue: 'Central Gymnasium',
        color: '#1E3A8A',
      },
      {
        season_id: seasons.find((s) => s.name === 'Fall 2024 Season')?.id,
        name: 'Lightning Bolts',
        description: 'Fast-paced basketball team',
        coach_name: 'Sarah Chen',
        contact_email: 'sarah@lightningbolts.com',
        home_venue: 'Westside Sports Center',
        color: '#DC2626',
      },
      {
        season_id: seasons.find((s) => s.name === 'Winter 2024-25 Season')?.id,
        name: 'Young Shooters',
        description: 'Youth development team',
        coach_name: 'David Martinez',
        contact_email: 'david@youngshooters.org',
        home_venue: 'Community Center Court',
        color: '#059669',
      },
      // Soccer teams
      {
        season_id: seasons.find((s) => s.name === 'Spring 2025 Season')?.id,
        name: 'Eagles FC',
        description: 'Premier youth soccer team',
        coach_name: 'Lisa Thompson',
        contact_email: 'lisa@eaglesfc.com',
        home_venue: 'Riverside Soccer Field',
        color: '#7C3AED',
      },
      {
        season_id: seasons.find((s) => s.name === 'Spring 2025 Season')?.id,
        name: 'Dynamo United',
        description: 'Competitive youth soccer',
        coach_name: 'Roberto Silva',
        contact_email: 'roberto@dynamounited.com',
        home_venue: 'Northside Soccer Complex',
        color: '#EA580C',
      },
      {
        season_id: seasons.find((s) => s.name === 'Summer 2024 League')?.id,
        name: 'Weekend Warriors',
        description: 'Adult recreational soccer',
        coach_name: 'Alex Kim',
        contact_email: 'alex@weekendwarriors.net',
        home_venue: 'City Park Field #1',
        color: '#0891B2',
      },
      // Volleyball teams
      {
        season_id: seasons.find((s) => s.name === '2024 Championship Series')
          ?.id,
        name: 'Spike Masters',
        description: 'Elite volleyball team',
        coach_name: 'Jennifer Wu',
        contact_email: 'jen@spikemasters.com',
        home_venue: 'Championship Volleyball Arena',
        color: '#BE185D',
      },
      {
        season_id: seasons.find((s) => s.name === '2024 Championship Series')
          ?.id,
        name: 'Net Ninjas',
        description: 'Agile volleyball squad',
        coach_name: 'Mark Rodriguez',
        contact_email: 'mark@netninjas.com',
        home_venue: 'Indoor Sports Complex',
        color: '#7C2D12',
      },
    ];

    // Create teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert(teamsData)
      .select();

    if (teamsError) {
      console.error('Error creating teams:', teamsError);
      return NextResponse.json(
        { error: 'Failed to create teams' },
        { status: 500 },
      );
    }

    // Create sample constraint sets
    const constraintSetsData = [
      {
        name: 'General Basketball Rules',
        description: 'Standard basketball scheduling constraints',
        user_id: user.id,
        sport_id: basketballSport?.id,
        is_template: false,
        visibility: 'shared' as const,
        tags: ['basketball', 'general'],
      },
      {
        name: 'Youth Soccer Safety Rules',
        description: 'Safety-focused constraints for youth soccer',
        user_id: user.id,
        sport_id: soccerSport?.id,
        is_template: true,
        visibility: 'public' as const,
        tags: ['soccer', 'youth', 'safety'],
      },
      {
        name: 'Thunder Hawks Team Rules',
        description: 'Specific constraints for Thunder Hawks team',
        user_id: user.id,
        team_id: teams.find((t) => t.name === 'Thunder Hawks')?.id,
        is_template: false,
        visibility: 'private' as const,
        tags: ['thunder-hawks', 'team-specific'],
      },
    ];

    // Create constraint sets
    const { data: constraintSets, error: constraintSetsError } = await supabase
      .from('constraint_sets')
      .insert(constraintSetsData)
      .select();

    if (constraintSetsError) {
      console.error('Error creating constraint sets:', constraintSetsError);
      return NextResponse.json(
        { error: 'Failed to create constraint sets' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sports: sports.length,
        leagues: leagues.length,
        seasons: seasons.length,
        teams: teams.length,
        constraintSets: constraintSets.length,
      },
    });
  } catch (error) {
    console.error('Sample data creation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
