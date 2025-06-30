'use client';

import { useState, useEffect } from 'react';
import type {
  Sport,
  League,
  Season,
  Team,
  ConstraintSet,
  ConstraintSetFormData,
  SportFormData,
  LeagueFormData,
  SeasonFormData,
  TeamFormData,
} from '@/lib/types';

interface EnhancedConstraintSetManagerProps {
  constraintSets: ConstraintSet[];
  onConstraintSetsChange: (sets: ConstraintSet[]) => void;
  onConstraintSetSelected?: (constraintSet: ConstraintSet) => void;
  integrationState?: any;
  onNavigateToParser?: () => void;
  onNavigateToCalendar?: () => void;
}

type ViewMode = 'hierarchy' | 'sets' | 'templates';
type CreateMode = 'set' | 'sport' | 'league' | 'season' | 'team';

export function EnhancedConstraintSetManager({
  constraintSets,
  onConstraintSetsChange,
  onConstraintSetSelected,
  integrationState,
  onNavigateToParser,
  onNavigateToCalendar,
}: EnhancedConstraintSetManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [createMode, setCreateMode] = useState<CreateMode>('set');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [templateConstraints, setTemplateConstraints] = useState<string[]>([]);
  const [showConstraints, setShowConstraints] = useState(false);
  const [selectedConstraintSet, setSelectedConstraintSet] =
    useState<ConstraintSet | null>(null);
  const [constraints, setConstraints] = useState<any[]>([]);

  // Add editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<
    'set' | 'sport' | 'league' | 'season' | 'team' | null
  >(null);

  // Hierarchy data
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // All hierarchy data for comprehensive display
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);

  // Expand/collapse state for hierarchy items
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    new Set(),
  );

  // Example templates for demonstration
  const exampleTemplates = [
    {
      id: 'template-1',
      name: 'Basketball Tournament Rules',
      description:
        'Standard constraints for basketball tournaments with venue capacity and rest period requirements',
      sport: { name: 'Basketball', icon: 'basketball' },
      is_template: true,
      visibility: 'public' as const,
      constraint_count: 8,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      constraints: [
        'No more than 3 games per day on any court',
        'Teams must have at least 24 hours rest between games',
        'No games on Sundays',
        'Home team gets first choice of uniform color',
        'Maximum 2 games per team per day',
        'Court A reserved for championship games only',
        'No games before 8:00 AM or after 10:00 PM',
        'Referee assignments must be confirmed 48 hours in advance',
      ],
    },
    {
      id: 'template-2',
      name: 'Youth Soccer League Constraints',
      description:
        'Safety-focused constraints for youth soccer with parent volunteer requirements and weather considerations',
      sport: { name: 'Soccer', icon: 'soccer' },
      is_template: true,
      visibility: 'public' as const,
      constraint_count: 6,
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      constraints: [
        'No games during school hours on weekdays',
        'Games cancelled if temperature below 40°F or above 95°F',
        'Each team must provide 2 parent volunteers per game',
        'No more than 2 games per team per weekend',
        'Home team responsible for field setup and cleanup',
        'Lightning delay protocol: 30 minutes after last thunder',
      ],
    },
    {
      id: 'template-3',
      name: 'Multi-Venue Tournament',
      description:
        'Complex tournament constraints across multiple venues with travel time considerations',
      sport: { name: 'Volleyball', icon: 'volleyball' },
      is_template: true,
      visibility: 'shared' as const,
      constraint_count: 10,
      created_at: '2024-02-01T09:15:00Z',
      updated_at: '2024-02-01T09:15:00Z',
      constraints: [
        'Teams playing at different venues need 2+ hours between games',
        'Venue A: Maximum 4 simultaneous games',
        'Venue B: Maximum 6 simultaneous games',
        'Championship matches only at Venue A',
        'No team travels to more than 2 different venues per day',
        'Officials assigned to same venue for entire day',
        'Venue setup requires 30 minutes before first game',
        'Awards ceremony at Venue A after championship',
        'Parking limited at Venue B on weekends',
        'Live streaming equipment only available at Venue A',
      ],
    },
  ];

  const helpContent = {
    hierarchy: {
      title: '🏗️ Organizational Hierarchy',
      description:
        'Build your sports organization structure from top to bottom',
      steps: [
        'Start by creating Sports (Basketball, Soccer, etc.)',
        'Add Leagues within each sport (e.g., Metro League, Youth Division)',
        'Create Seasons within leagues (e.g., Fall 2024, Spring 2025)',
        'Add Teams to seasons with coach and venue information',
        'Organize constraint sets at any level of the hierarchy',
      ],
      tips: [
        '💡 You can create constraint sets at any level - sport-wide rules, league-specific policies, or team-only constraints',
        '🎨 Use custom colors and icons to make sports easily recognizable',
        '📅 Season dates help with automatic constraint validation',
        '🏠 Team home venues enable location-based constraint checking',
      ],
    },
    sets: {
      title: '📋 Constraint Sets',
      description: 'Organize and manage your scheduling rules',
      steps: [
        'Create constraint sets to group related scheduling rules',
        'Associate sets with specific sports, leagues, seasons, or teams',
        'Use the constraint parser to add individual rules to sets',
        'Filter by hierarchy level to find relevant constraint sets',
        'Copy and modify existing sets for similar scenarios',
      ],
      tips: [
        '🔍 Use filters to quickly find constraint sets for specific contexts',
        '📝 Add descriptive names and descriptions for easy identification',
        '🔗 Link constraint sets to specific organizational levels for better organization',
        '👥 Share constraint sets with team members using visibility settings',
      ],
    },
    templates: {
      title: '📐 Templates',
      description: 'Reusable constraint patterns for common scenarios',
      steps: [
        'Browse example templates to see common constraint patterns',
        'Create your own templates by marking constraint sets as templates',
        'Copy templates to create new constraint sets for specific contexts',
        'Modify template constraints to fit your specific needs',
        'Share templates publicly to help the community',
      ],
      tips: [
        '⚡ Templates speed up setup for recurring tournaments or seasons',
        '🌍 Public templates help other organizations with similar needs',
        '🔄 Templates can be copied and customized without affecting the original',
        '📚 Study example templates to learn constraint writing best practices',
      ],
    },
  };

  // Filters
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Form states
  const [constraintSetForm, setConstraintSetForm] =
    useState<ConstraintSetFormData>({
      name: '',
      description: '',
      sport_id: '',
      league_id: '',
      season_id: '',
      team_id: '',
      tags: [],
      is_template: false,
      visibility: 'private',
    });

  const [sportForm, setSportForm] = useState<SportFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#FF8C00',
  });

  const [leagueForm, setLeagueForm] = useState<LeagueFormData>({
    sport_id: '',
    name: '',
    description: '',
    organization: '',
    level: '',
    region: '',
    logo_url: '',
    website: '',
    contact_email: '',
  });

  const [seasonForm, setSeasonForm] = useState<SeasonFormData>({
    league_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
  });

  const [teamForm, setTeamForm] = useState<TeamFormData>({
    season_id: '',
    name: '',
    description: '',
    coach_name: '',
    contact_email: '',
    home_venue: '',
    color: '',
    logo_url: '',
  });

  // Load all hierarchy data on mount and when data changes
  useEffect(() => {
    loadAllHierarchyData();
  }, []);

  // Update form dropdowns when selections change
  useEffect(() => {
    if (selectedSport) {
      loadLeagues(selectedSport);
    } else {
      setLeagues([]);
      setSelectedLeague('');
    }
  }, [selectedSport]);

  useEffect(() => {
    if (selectedLeague) {
      loadSeasons(selectedLeague);
    } else {
      setSeasons([]);
      setSelectedSeason('');
    }
  }, [selectedLeague]);

  useEffect(() => {
    if (selectedSeason) {
      loadTeams(selectedSeason);
    } else {
      setTeams([]);
      setSelectedTeam('');
    }
  }, [selectedSeason]);

  // Load all hierarchy data comprehensively
  const loadAllHierarchyData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [sportsRes, allLeaguesRes, allSeasonsRes, allTeamsRes] =
        await Promise.all([
          fetch('/api/sports'),
          fetch('/api/leagues'), // Get all leagues
          fetch('/api/seasons'), // Get all seasons
          fetch('/api/teams'), // Get all teams
        ]);

      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        setSports(sportsData);
      }

      if (allLeaguesRes.ok) {
        const allLeaguesData = await allLeaguesRes.json();
        setAllLeagues(allLeaguesData);
      }

      if (allSeasonsRes.ok) {
        const allSeasonsData = await allSeasonsRes.json();
        setAllSeasons(allSeasonsData);
      }

      if (allTeamsRes.ok) {
        const allTeamsData = await allTeamsRes.json();
        setAllTeams(allTeamsData);
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Keep the existing functions for form dropdowns
  const loadHierarchyData = async () => {
    try {
      const [sportsRes] = await Promise.all([fetch('/api/sports')]);

      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        setSports(sportsData);
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error);
      setError('Failed to load data');
    }
  };

  const loadLeagues = async (sportId: string) => {
    try {
      const response = await fetch(`/api/leagues?sportId=${sportId}`);
      if (response.ok) {
        const data = await response.json();
        setLeagues(data);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
    }
  };

  const loadSeasons = async (leagueId: string) => {
    try {
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        setSeasons(data);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  const loadTeams = async (seasonId: string) => {
    try {
      const response = await fetch(`/api/teams?seasonId=${seasonId}`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleCreateConstraintSet = async () => {
    if (!constraintSetForm.name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/constraint-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...constraintSetForm,
          sport_id: constraintSetForm.sport_id || null,
          league_id: constraintSetForm.league_id || null,
          season_id: constraintSetForm.season_id || null,
          team_id: constraintSetForm.team_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create constraint set');
      }

      const newSet = await response.json();
      onConstraintSetsChange([newSet, ...constraintSets]);
      resetForms();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating constraint set:', error);
      setError('Failed to create constraint set');
    } finally {
      setLoading(false);
    }
  };

  // Special function to create a constraint set with constraints from an example template
  const handleCreateConstraintSetFromTemplate = async (
    templateConstraints: string[],
  ) => {
    if (!constraintSetForm.name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // First create the constraint set
      const response = await fetch('/api/constraint-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...constraintSetForm,
          sport_id: constraintSetForm.sport_id || null,
          league_id: constraintSetForm.league_id || null,
          season_id: constraintSetForm.season_id || null,
          team_id: constraintSetForm.team_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create constraint set');
      }

      const newSet = await response.json();

      // Now add the constraints from the template using the correct API format
      if (templateConstraints && templateConstraints.length > 0) {
        const constraintsData = templateConstraints.map((constraintText) => ({
          raw_text: constraintText,
          parsed_data: {
            type: 'general',
            description: constraintText,
            priority: 'medium',
          },
          confidence_score: 0.8,
          priority: 'medium',
          status: 'active',
          tags: [],
          notes: 'Copied from template',
        }));

        const constraintResponse = await fetch('/api/constraints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setId: newSet.id,
            constraints: constraintsData,
          }),
        });

        if (!constraintResponse.ok) {
          console.warn('Failed to add constraints from template');
        }
      }

      // Refresh the constraint set to get the updated constraint count
      const refreshResponse = await fetch(`/api/constraint-sets`);
      if (refreshResponse.ok) {
        const refreshedSets = await refreshResponse.json();
        const refreshedSet = refreshedSets.find(
          (set: any) => set.id === newSet.id,
        );
        if (refreshedSet) {
          onConstraintSetsChange([refreshedSet, ...constraintSets]);
        } else {
          onConstraintSetsChange([newSet, ...constraintSets]);
        }
      } else {
        onConstraintSetsChange([newSet, ...constraintSets]);
      }

      resetForms();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating constraint set from template:', error);
      setError('Failed to create constraint set from template');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSport = async () => {
    if (!sportForm.name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sportForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create sport');
      }

      const newSport = await response.json();
      setSports([...sports, newSport]);
      resetForms();
      setIsCreating(false);
      // Data will be accurate since we only need sports for this level
    } catch (error) {
      console.error('Error creating sport:', error);
      setError('Failed to create sport');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async () => {
    if (!leagueForm.name.trim() || !leagueForm.sport_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leagueForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create league');
      }

      const newLeague = await response.json();
      setLeagues([...leagues, newLeague]);
      setAllLeagues([...allLeagues, newLeague]);
      resetForms();
      setIsCreating(false);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error creating league:', error);
      setError('Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!seasonForm.name.trim() || !seasonForm.league_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seasonForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create season');
      }

      const newSeason = await response.json();
      setSeasons([...seasons, newSeason]);
      setAllSeasons([...allSeasons, newSeason]);
      resetForms();
      setIsCreating(false);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error creating season:', error);
      setError('Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim() || !teamForm.season_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const newTeam = await response.json();
      setTeams([...teams, newTeam]);
      setAllTeams([...allTeams, newTeam]);
      resetForms();
      setIsCreating(false);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setConstraintSetForm({
      name: '',
      description: '',
      sport_id: '',
      league_id: '',
      season_id: '',
      team_id: '',
      tags: [],
      is_template: false,
      visibility: 'private',
    });

    setSportForm({
      name: '',
      description: '',
      icon: '',
      color: '#FF8C00',
    });

    setLeagueForm({
      sport_id: '',
      name: '',
      description: '',
      organization: '',
      level: '',
      region: '',
      logo_url: '',
      website: '',
      contact_email: '',
    });

    setSeasonForm({
      league_id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
    });

    setTeamForm({
      season_id: '',
      name: '',
      description: '',
      coach_name: '',
      contact_email: '',
      home_venue: '',
      color: '',
      logo_url: '',
    });

    // Clear template constraints
    setTemplateConstraints([]);
  };

  // Edit and Delete Functions
  const handleEditConstraintSet = (set: ConstraintSet) => {
    if (!set.id) return;

    // Check if this is an example template
    if (isExampleTemplate(set)) {
      // For example templates, store the constraints and treat as creating a new constraint set
      const exampleTemplate = set as any;
      setTemplateConstraints(exampleTemplate.constraints || []);

      setConstraintSetForm({
        name: `${set.name} (Copy)`,
        description: set.description || '',
        sport_id: '',
        league_id: '',
        season_id: '',
        team_id: '',
        tags: set.tags || [],
        is_template: false,
        visibility: 'private',
      });
      setCreateMode('set');
      setIsCreating(true);
    } else {
      // For real constraint sets, edit normally
      setTemplateConstraints([]); // Clear any template constraints
      setEditingId(set.id);
      setEditingType('set');
      setConstraintSetForm({
        name: set.name,
        description: set.description || '',
        sport_id: set.sport_id || '',
        league_id: set.league_id || '',
        season_id: set.season_id || '',
        team_id: set.team_id || '',
        tags: set.tags || [],
        is_template: set.is_template || false,
        visibility: set.visibility || 'private',
      });
      setIsEditing(true);
    }
  };

  const handleEditSport = (sport: Sport) => {
    if (!sport.id) return;
    setEditingId(sport.id);
    setEditingType('sport');
    setSportForm({
      name: sport.name,
      description: sport.description || '',
      icon: sport.icon || '',
      color: sport.color || '#FF8C00',
    });
    // Load leagues for this sport
    loadLeagues(sport.id);
    setIsEditing(true);
  };

  const handleEditLeague = (league: League) => {
    if (!league.id) return;
    setEditingId(league.id);
    setEditingType('league');
    setLeagueForm({
      sport_id: league.sport_id,
      name: league.name,
      description: league.description || '',
      organization: league.organization || '',
      level: league.level || '',
      region: league.region || '',
      logo_url: league.logo_url || '',
      website: league.website || '',
      contact_email: league.contact_email || '',
    });
    // Load seasons for this league
    loadSeasons(league.id);
    setIsEditing(true);
  };

  const handleEditSeason = (season: Season) => {
    if (!season.id) return;
    setEditingId(season.id);
    setEditingType('season');
    setSeasonForm({
      league_id: season.league_id,
      name: season.name,
      description: season.description || '',
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      status: season.status,
    });
    // Load teams for this season
    loadTeams(season.id);
    setIsEditing(true);
  };

  const handleEditTeam = (team: Team) => {
    if (!team.id) return;
    setEditingId(team.id);
    setEditingType('team');
    setTeamForm({
      season_id: team.season_id,
      name: team.name,
      description: team.description || '',
      coach_name: team.coach_name || '',
      contact_email: team.contact_email || '',
      home_venue: team.home_venue || '',
      color: team.color || '',
      logo_url: team.logo_url || '',
    });
    setIsEditing(true);
  };

  const handleUpdateConstraintSet = async () => {
    if (!constraintSetForm.name.trim() || !editingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/constraint-sets/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...constraintSetForm,
          sport_id: constraintSetForm.sport_id || null,
          league_id: constraintSetForm.league_id || null,
          season_id: constraintSetForm.season_id || null,
          team_id: constraintSetForm.team_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update constraint set');
      }

      const updatedSet = await response.json();
      const updatedSets = constraintSets.map((set) =>
        set.id === editingId ? updatedSet : set,
      );
      onConstraintSetsChange(updatedSets);

      resetForms();
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating constraint set:', error);
      setError('Failed to update constraint set');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSport = async () => {
    if (!sportForm.name.trim() || !editingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sports/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sportForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update sport');
      }

      const updatedSport = await response.json();
      const updatedSports = sports.map((sport) =>
        sport.id === editingId ? updatedSport : sport,
      );
      setSports(updatedSports);
      resetForms();
      setIsEditing(false);
      setEditingId(null);
      setEditingType(null);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error updating sport:', error);
      setError('Failed to update sport');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeague = async () => {
    if (!leagueForm.name.trim() || !editingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leagueForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update league');
      }

      const updatedLeague = await response.json();
      const updatedLeagues = leagues.map((league) =>
        league.id === editingId ? updatedLeague : league,
      );
      setLeagues(updatedLeagues);
      const updatedAllLeagues = allLeagues.map((league) =>
        league.id === editingId ? updatedLeague : league,
      );
      setAllLeagues(updatedAllLeagues);
      resetForms();
      setIsEditing(false);
      setEditingId(null);
      setEditingType(null);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error updating league:', error);
      setError('Failed to update league');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeason = async () => {
    if (!seasonForm.name.trim() || !editingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/seasons/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seasonForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update season');
      }

      const updatedSeason = await response.json();
      const updatedSeasons = seasons.map((season) =>
        season.id === editingId ? updatedSeason : season,
      );
      setSeasons(updatedSeasons);
      const updatedAllSeasons = allSeasons.map((season) =>
        season.id === editingId ? updatedSeason : season,
      );
      setAllSeasons(updatedAllSeasons);
      resetForms();
      setIsEditing(false);
      setEditingId(null);
      setEditingType(null);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error updating season:', error);
      setError('Failed to update season');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!teamForm.name.trim() || !editingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const updatedTeam = await response.json();
      const updatedTeams = teams.map((team) =>
        team.id === editingId ? updatedTeam : team,
      );
      setTeams(updatedTeams);
      const updatedAllTeams = allTeams.map((team) =>
        team.id === editingId ? updatedTeam : team,
      );
      setAllTeams(updatedAllTeams);
      resetForms();
      setIsEditing(false);
      setEditingId(null);
      setEditingType(null);
      // State updated, no need to reload all data
    } catch (error) {
      console.error('Error updating team:', error);
      setError('Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConstraintSet = async (setId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this constraint set? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/constraint-sets/${setId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete constraint set');
      }

      const updatedSets = constraintSets.filter((set) => set.id !== setId);
      onConstraintSetsChange(updatedSets);
    } catch (error) {
      console.error('Error deleting constraint set:', error);
      setError('Failed to delete constraint set');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSport = async (sportId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this sport? This will also delete all associated leagues, seasons, teams, and constraint sets. This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sports/${sportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sport');
      }

      const updatedSports = sports.filter((sport) => sport.id !== sportId);
      setSports(updatedSports);
      // State updated, no need to reload all data

      // Also remove related constraint sets from the local state
      const updatedSets = constraintSets.filter(
        (set) => set.sport_id !== sportId,
      );
      onConstraintSetsChange(updatedSets);
    } catch (error) {
      console.error('Error deleting sport:', error);
      setError('Failed to delete sport');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this league? This will also delete all associated seasons, teams, and constraint sets. This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete league');
      }

      const updatedLeagues = leagues.filter((league) => league.id !== leagueId);
      setLeagues(updatedLeagues);
      const updatedAllLeagues = allLeagues.filter(
        (league) => league.id !== leagueId,
      );
      setAllLeagues(updatedAllLeagues);
      // State updated, no need to reload all data

      // Also remove related constraint sets from the local state
      const updatedSets = constraintSets.filter(
        (set) => set.league_id !== leagueId,
      );
      onConstraintSetsChange(updatedSets);
    } catch (error) {
      console.error('Error deleting league:', error);
      setError('Failed to delete league');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this season? This will also delete all associated teams and constraint sets. This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/seasons/${seasonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete season');
      }

      const updatedSeasons = seasons.filter((season) => season.id !== seasonId);
      setSeasons(updatedSeasons);
      const updatedAllSeasons = allSeasons.filter(
        (season) => season.id !== seasonId,
      );
      setAllSeasons(updatedAllSeasons);
      // State updated, no need to reload all data

      // Also remove related constraint sets from the local state
      const updatedSets = constraintSets.filter(
        (set) => set.season_id !== seasonId,
      );
      onConstraintSetsChange(updatedSets);
    } catch (error) {
      console.error('Error deleting season:', error);
      setError('Failed to delete season');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this team? This will also delete all associated constraint sets. This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      const updatedTeams = teams.filter((team) => team.id !== teamId);
      setTeams(updatedTeams);
      const updatedAllTeams = allTeams.filter((team) => team.id !== teamId);
      setAllTeams(updatedAllTeams);
      // State updated, no need to reload all data

      // Also remove related constraint sets from the local state
      const updatedSets = constraintSets.filter(
        (set) => set.team_id !== teamId,
      );
      onConstraintSetsChange(updatedSets);
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredConstraintSets = () => {
    return constraintSets.filter((set) => {
      if (selectedSport && set.sport_id !== selectedSport) return false;
      if (selectedLeague && set.league_id !== selectedLeague) return false;
      if (selectedSeason && set.season_id !== selectedSeason) return false;
      if (selectedTeam && set.team_id !== selectedTeam) return false;
      if (viewMode === 'templates' && !set.is_template) return false;
      return true;
    });
  };

  const getDisplayTemplates = () => {
    const realTemplates = getFilteredConstraintSets();
    // If no real templates exist, show example templates for education
    if (realTemplates.length === 0 && viewMode === 'templates') {
      return exampleTemplates;
    }
    return realTemplates;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSportIcon = (iconName?: string) => {
    const icons: Record<string, string> = {
      basketball: '🏀',
      soccer: '⚽',
      baseball: '⚾',
      tennis: '🎾',
      volleyball: '🏐',
      hockey: '🏒',
    };
    return icons[iconName || ''] || '🏆';
  };

  // Helper function to check if a constraint set is an example template
  const isExampleTemplate = (set: any) => {
    return typeof set.id === 'string' && set.id.startsWith('template-');
  };

  const loadConstraints = async (constraintSetId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/constraints?setId=${constraintSetId}`);
      if (response.ok) {
        const constraintsData = await response.json();
        setConstraints(constraintsData);
      } else {
        setConstraints([]);
      }
    } catch (error) {
      console.error('Error loading constraints:', error);
      setConstraints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditConstraints = (constraintSet: ConstraintSet) => {
    setSelectedConstraintSet(constraintSet);
    setShowConstraints(true);
    if (constraintSet.id) {
      loadConstraints(constraintSet.id);
    }
  };

  const createSampleData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sample-data', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create sample data');
      }

      const result = await response.json();

      // Reload hierarchy data to show the new sample data
      await loadHierarchyData();

      // Show success message
      alert(
        `Successfully created sample data:\n- ${result.data.sports} sports\n- ${result.data.leagues} leagues\n- ${result.data.seasons} seasons\n- ${result.data.teams} teams\n- ${result.data.constraintSets} constraint sets`,
      );
    } catch (error) {
      console.error('Error creating sample data:', error);
      setError('Failed to create sample data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for expand/collapse
  const toggleSportExpansion = (sportId: string) => {
    const newExpanded = new Set(expandedSports);
    if (newExpanded.has(sportId)) {
      newExpanded.delete(sportId);
    } else {
      newExpanded.add(sportId);
      // Load leagues when expanding sport
      loadLeagues(sportId);
    }
    setExpandedSports(newExpanded);
  };

  const toggleLeagueExpansion = (leagueId: string) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId);
    } else {
      newExpanded.add(leagueId);
      // Load seasons when expanding league
      loadSeasons(leagueId);
    }
    setExpandedLeagues(newExpanded);
  };

  const toggleSeasonExpansion = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
      // Load teams when expanding season
      loadTeams(seasonId);
    }
    setExpandedSeasons(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header with View Mode Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Constraint Set Manager
          </h2>
          <div className="flex items-center space-x-4">
            {/* Integration Navigation */}
            {(onNavigateToParser || onNavigateToCalendar) && (
              <div className="flex items-center space-x-2">
                {onNavigateToParser && (
                  <button
                    type="button"
                    onClick={onNavigateToParser}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Go to Constraint Parser"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Parser
                  </button>
                )}
                {onNavigateToCalendar && (
                  <button
                    type="button"
                    onClick={onNavigateToCalendar}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Test constraints in Calendar"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                      />
                    </svg>
                    Calendar
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
          </div>
        </div>

        {/* Integration Status */}
        {integrationState?.showIntegrationPanel &&
          integrationState?.pendingConstraints && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-sm font-semibold text-orange-800">
                  Parsed Constraints Ready to Save
                </span>
              </div>
              <p className="text-sm text-orange-700">
                You have {integrationState.pendingConstraints.length} parsed
                constraint(s) from the parser. Select a constraint set below to
                save them.
              </p>
            </div>
          )}
      </div>

      {/* View Mode Tabs and Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏗️ Hierarchy
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sets')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'sets'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Constraint Sets
          </button>
          <button
            type="button"
            onClick={() => setViewMode('templates')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'templates'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📐 Templates
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New
        </button>
      </div>

      {/* Hierarchical Filters */}
      {viewMode !== 'hierarchy' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label
              htmlFor="filter-sport"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sport
            </label>
            <select
              id="filter-sport"
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sports</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {getSportIcon(sport.icon)} {sport.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-league"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              League
            </label>
            <select
              id="filter-league"
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              disabled={!selectedSport}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.organization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-season"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Season
            </label>
            <select
              id="filter-season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              disabled={!selectedLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} ({season.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-team"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Team
            </label>
            <select
              id="filter-team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={!selectedSeason}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Help Dropdown */}
      {showHelp && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {helpContent[viewMode].title}
              </h3>
              <p className="text-blue-700 mt-1">
                {helpContent[viewMode].description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                📋 How to Use:
              </h4>
              <ol className="space-y-1 text-sm text-blue-800">
                {helpContent[viewMode].steps.map((step, index) => (
                  <li
                    key={`step-${viewMode}-${index}-${step.slice(0, 20)}`}
                    className="flex items-start"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 text-blue-800 text-xs font-medium rounded-full mr-2 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                {helpContent[viewMode].tips.map((tip, index) => (
                  <li
                    key={`tip-${viewMode}-${index}-${tip.slice(0, 20)}`}
                    className="flex items-start"
                  >
                    <span className="mr-2 mt-0.5 flex-shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing
                  ? `Edit ${editingType === 'set' ? 'Constraint Set' : editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}`
                  : `Create New ${createMode === 'set' ? 'Constraint Set' : createMode.charAt(0).toUpperCase() + createMode.slice(1)}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setEditingId(null);
                  resetForms();
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Create Mode Selector - only show when creating */}
            {!isEditing && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    ['set', 'sport', 'league', 'season', 'team'] as CreateMode[]
                  ).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCreateMode(mode)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        createMode === mode
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'set'
                        ? 'Constraint Set'
                        : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Constraint Set Form */}
            {(createMode === 'set' || editingType === 'set') && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="set-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="set-name"
                    type="text"
                    value={constraintSetForm.name}
                    onChange={(e) =>
                      setConstraintSetForm({
                        ...constraintSetForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Basketball Tournament Rules"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="set-description"
                    value={constraintSetForm.description}
                    onChange={(e) =>
                      setConstraintSetForm({
                        ...constraintSetForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Hierarchy Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="set-sport"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sport
                    </label>
                    <select
                      id="set-sport"
                      value={constraintSetForm.sport_id}
                      onChange={(e) => {
                        setConstraintSetForm({
                          ...constraintSetForm,
                          sport_id: e.target.value,
                          league_id: '',
                          season_id: '',
                          team_id: '',
                        });
                        if (e.target.value) loadLeagues(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Sport</option>
                      {sports.map((sport) => (
                        <option key={sport.id} value={sport.id}>
                          {getSportIcon(sport.icon)} {sport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="set-league"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      League
                    </label>
                    <select
                      id="set-league"
                      value={constraintSetForm.league_id}
                      onChange={(e) => {
                        setConstraintSetForm({
                          ...constraintSetForm,
                          league_id: e.target.value,
                          season_id: '',
                          team_id: '',
                        });
                        if (e.target.value) loadSeasons(e.target.value);
                      }}
                      disabled={!constraintSetForm.sport_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">No League</option>
                      {leagues.map((league) => (
                        <option key={league.id} value={league.id}>
                          {league.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="set-season"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Season
                    </label>
                    <select
                      id="set-season"
                      value={constraintSetForm.season_id}
                      onChange={(e) => {
                        setConstraintSetForm({
                          ...constraintSetForm,
                          season_id: e.target.value,
                          team_id: '',
                        });
                        if (e.target.value) loadTeams(e.target.value);
                      }}
                      disabled={!constraintSetForm.league_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">No Season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="set-team"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Team
                    </label>
                    <select
                      id="set-team"
                      value={constraintSetForm.team_id}
                      onChange={(e) =>
                        setConstraintSetForm({
                          ...constraintSetForm,
                          team_id: e.target.value,
                        })
                      }
                      disabled={!constraintSetForm.season_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">No Team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="set-template"
                      type="checkbox"
                      checked={constraintSetForm.is_template}
                      onChange={(e) =>
                        setConstraintSetForm({
                          ...constraintSetForm,
                          is_template: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="set-template"
                      className="text-sm text-gray-700"
                    >
                      Template (reusable across seasons/teams)
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="set-visibility"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Visibility
                    </label>
                    <select
                      id="set-visibility"
                      value={constraintSetForm.visibility}
                      onChange={(e) =>
                        setConstraintSetForm({
                          ...constraintSetForm,
                          visibility: e.target.value as
                            | 'private'
                            | 'shared'
                            | 'public',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="private">🔒 Private (only you)</option>
                      <option value="shared">👥 Shared (team members)</option>
                      <option value="public">🌍 Public (everyone)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sport Form with Full Hierarchy Management */}
            {(createMode === 'sport' || editingType === 'sport') && (
              <div className="space-y-6">
                {/* Basic Sport Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
                    Sport Information
                  </h4>

                  <div>
                    <label
                      htmlFor="sport-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name *
                    </label>
                    <input
                      id="sport-name"
                      type="text"
                      value={sportForm.name}
                      onChange={(e) =>
                        setSportForm({ ...sportForm, name: e.target.value })
                      }
                      placeholder="e.g., Basketball"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sport-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="sport-description"
                      value={sportForm.description}
                      onChange={(e) =>
                        setSportForm({
                          ...sportForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="sport-icon"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Icon
                      </label>
                      <select
                        id="sport-icon"
                        value={sportForm.icon}
                        onChange={(e) =>
                          setSportForm({ ...sportForm, icon: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Icon</option>
                        <option value="basketball">🏀 Basketball</option>
                        <option value="soccer">⚽ Soccer</option>
                        <option value="baseball">⚾ Baseball</option>
                        <option value="tennis">🎾 Tennis</option>
                        <option value="volleyball">🏐 Volleyball</option>
                        <option value="hockey">🏒 Hockey</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="sport-color"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Color
                      </label>
                      <input
                        id="sport-color"
                        type="color"
                        value={sportForm.color}
                        onChange={(e) =>
                          setSportForm({ ...sportForm, color: e.target.value })
                        }
                        className="w-full h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Leagues Management */}
                {isEditing && editingType === 'sport' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">
                        Leagues (
                        {
                          allLeagues.filter((l) => l.sport_id === editingId)
                            .length
                        }
                        )
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setLeagueForm({
                            ...leagueForm,
                            sport_id: editingId || '',
                          });
                          setCreateMode('league');
                          setIsCreating(true);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        + Add League
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                      {allLeagues.filter((l) => l.sport_id === editingId)
                        .length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No leagues yet. Click "Add League" to create one.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {allLeagues
                            .filter((l) => l.sport_id === editingId)
                            .map((league) => (
                              <div
                                key={league.id}
                                className="p-3 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {league.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {league.organization} • {league.level}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEditLeague(league);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                    title="Edit League"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      league.id && handleDeleteLeague(league.id)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete League"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* League Form with Full Hierarchy Management */}
            {(createMode === 'league' || editingType === 'league') && (
              <div className="space-y-6">
                {/* Basic League Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
                    League Information
                  </h4>

                  {/* Sport Selection for new leagues */}
                  {!isEditing && (
                    <div>
                      <label
                        htmlFor="league-sport"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Sport *
                      </label>
                      <select
                        id="league-sport"
                        value={leagueForm.sport_id}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            sport_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Sport</option>
                        {sports.map((sport) => (
                          <option key={sport.id} value={sport.id}>
                            {getSportIcon(sport.icon)} {sport.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="league-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name *
                    </label>
                    <input
                      id="league-name"
                      type="text"
                      value={leagueForm.name}
                      onChange={(e) =>
                        setLeagueForm({ ...leagueForm, name: e.target.value })
                      }
                      placeholder="e.g., National Basketball Association"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="league-organization"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Organization *
                    </label>
                    <input
                      id="league-organization"
                      type="text"
                      value={leagueForm.organization}
                      onChange={(e) =>
                        setLeagueForm({
                          ...leagueForm,
                          organization: e.target.value,
                        })
                      }
                      placeholder="e.g., NBA, NCAA, Local Recreation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="league-level"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Level
                      </label>
                      <select
                        id="league-level"
                        value={leagueForm.level}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            level: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Level</option>
                        <option value="professional">Professional</option>
                        <option value="college">College</option>
                        <option value="high-school">High School</option>
                        <option value="youth">Youth</option>
                        <option value="recreational">Recreational</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="league-region"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Region
                      </label>
                      <input
                        id="league-region"
                        type="text"
                        value={leagueForm.region}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            region: e.target.value,
                          })
                        }
                        placeholder="e.g., North America, California"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="league-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="league-description"
                      value={leagueForm.description}
                      onChange={(e) =>
                        setLeagueForm({
                          ...leagueForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="league-website"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Website
                      </label>
                      <input
                        id="league-website"
                        type="url"
                        value={leagueForm.website}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="league-contact"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Contact Email
                      </label>
                      <input
                        id="league-contact"
                        type="email"
                        value={leagueForm.contact_email}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            contact_email: e.target.value,
                          })
                        }
                        placeholder="contact@league.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Seasons Management */}
                {isEditing && editingType === 'league' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">
                        Seasons (
                        {
                          allSeasons.filter((s) => s.league_id === editingId)
                            .length
                        }
                        )
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSeasonForm({
                            ...seasonForm,
                            league_id: editingId || '',
                          });
                          setCreateMode('season');
                          setIsCreating(true);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        + Add Season
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                      {allSeasons.filter((s) => s.league_id === editingId)
                        .length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No seasons yet. Click "Add Season" to create one.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {allSeasons
                            .filter((s) => s.league_id === editingId)
                            .map((season) => (
                              <div
                                key={season.id}
                                className="p-3 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {season.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {season.status} • {season.start_date} to{' '}
                                    {season.end_date}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEditSeason(season);
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title="Edit Season"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      season.id && handleDeleteSeason(season.id)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete Season"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Season Form with Full Hierarchy Management */}
            {(createMode === 'season' || editingType === 'season') && (
              <div className="space-y-6">
                {/* Basic Season Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
                    Season Information
                  </h4>

                  {/* League Selection for new seasons */}
                  {!isEditing && (
                    <div>
                      <label
                        htmlFor="season-league"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        League *
                      </label>
                      <select
                        id="season-league"
                        value={seasonForm.league_id}
                        onChange={(e) =>
                          setSeasonForm({
                            ...seasonForm,
                            league_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select League</option>
                        {leagues.map((league) => (
                          <option key={league.id} value={league.id}>
                            {league.name} ({league.organization})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="season-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name *
                    </label>
                    <input
                      id="season-name"
                      type="text"
                      value={seasonForm.name}
                      onChange={(e) =>
                        setSeasonForm({ ...seasonForm, name: e.target.value })
                      }
                      placeholder="e.g., 2024 Regular Season, Spring 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="season-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="season-description"
                      value={seasonForm.description}
                      onChange={(e) =>
                        setSeasonForm({
                          ...seasonForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="season-start"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Start Date
                      </label>
                      <input
                        id="season-start"
                        type="date"
                        value={seasonForm.start_date}
                        onChange={(e) =>
                          setSeasonForm({
                            ...seasonForm,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="season-end"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        End Date
                      </label>
                      <input
                        id="season-end"
                        type="date"
                        value={seasonForm.end_date}
                        onChange={(e) =>
                          setSeasonForm({
                            ...seasonForm,
                            end_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="season-status"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Status
                    </label>
                    <select
                      id="season-status"
                      value={seasonForm.status}
                      onChange={(e) =>
                        setSeasonForm({
                          ...seasonForm,
                          status: e.target.value as
                            | 'planning'
                            | 'active'
                            | 'completed'
                            | 'cancelled',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Teams Management */}
                {isEditing && editingType === 'season' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">
                        Teams (
                        {
                          allTeams.filter((t) => t.season_id === editingId)
                            .length
                        }
                        )
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setTeamForm({
                            ...teamForm,
                            season_id: editingId || '',
                          });
                          setCreateMode('team');
                          setIsCreating(true);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        + Add Team
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                      {allTeams.filter((t) => t.season_id === editingId)
                        .length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No teams yet. Click "Add Team" to create one.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {allTeams
                            .filter((t) => t.season_id === editingId)
                            .map((team) => (
                              <div
                                key={team.id}
                                className="p-3 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {team.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {team.coach_name &&
                                      `Coach: ${team.coach_name}`}{' '}
                                    {team.home_venue && `• ${team.home_venue}`}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEditTeam(team);
                                    }}
                                    className="p-1 text-gray-400 hover:text-purple-600 rounded"
                                    title="Edit Team"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      team.id && handleDeleteTeam(team.id)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Delete Team"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Form */}
            {(createMode === 'team' || editingType === 'team') && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 border-b pb-2">
                  Team Information
                </h4>

                {/* Season Selection for new teams */}
                {!isEditing && (
                  <div>
                    <label
                      htmlFor="team-season"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Season *
                    </label>
                    <select
                      id="team-season"
                      value={teamForm.season_id}
                      onChange={(e) =>
                        setTeamForm({ ...teamForm, season_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name} ({season.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="team-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    value={teamForm.name}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, name: e.target.value })
                    }
                    placeholder="e.g., Lakers, Warriors, Team A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="team-description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="team-description"
                    value={teamForm.description}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, description: e.target.value })
                    }
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="team-coach"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Coach Name
                    </label>
                    <input
                      id="team-coach"
                      type="text"
                      value={teamForm.coach_name}
                      onChange={(e) =>
                        setTeamForm({ ...teamForm, coach_name: e.target.value })
                      }
                      placeholder="Coach Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="team-contact"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Contact Email
                    </label>
                    <input
                      id="team-contact"
                      type="email"
                      value={teamForm.contact_email}
                      onChange={(e) =>
                        setTeamForm({
                          ...teamForm,
                          contact_email: e.target.value,
                        })
                      }
                      placeholder="coach@team.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="team-venue"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Home Venue
                    </label>
                    <input
                      id="team-venue"
                      type="text"
                      value={teamForm.home_venue}
                      onChange={(e) =>
                        setTeamForm({ ...teamForm, home_venue: e.target.value })
                      }
                      placeholder="Stadium Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="team-color"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Team Color
                    </label>
                    <input
                      id="team-color"
                      type="color"
                      value={teamForm.color}
                      onChange={(e) =>
                        setTeamForm({ ...teamForm, color: e.target.value })
                      }
                      className="w-full h-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    // Handle edit mode
                    if (editingType === 'set') {
                      handleUpdateConstraintSet();
                    } else if (editingType === 'sport') {
                      handleUpdateSport();
                    } else if (editingType === 'league') {
                      handleUpdateLeague();
                    } else if (editingType === 'season') {
                      handleUpdateSeason();
                    } else if (editingType === 'team') {
                      handleUpdateTeam();
                    }
                  } else {
                    // Handle create mode
                    if (createMode === 'set') {
                      // Check if we have template constraints to copy
                      if (templateConstraints.length > 0) {
                        handleCreateConstraintSetFromTemplate(
                          templateConstraints,
                        );
                      } else {
                        handleCreateConstraintSet();
                      }
                    } else if (createMode === 'sport') {
                      handleCreateSport();
                    } else if (createMode === 'league') {
                      handleCreateLeague();
                    } else if (createMode === 'season') {
                      handleCreateSeason();
                    } else if (createMode === 'team') {
                      handleCreateTeam();
                    }
                  }
                }}
                disabled={
                  loading ||
                  ((createMode === 'set' ||
                    (editingType && editingType === 'set')) &&
                    !constraintSetForm.name.trim()) ||
                  ((createMode === 'sport' ||
                    (editingType && editingType === 'sport')) &&
                    !sportForm.name.trim()) ||
                  ((createMode === 'league' ||
                    (editingType && editingType === 'league')) &&
                    (!leagueForm.name.trim() ||
                      !leagueForm.organization?.trim())) ||
                  ((createMode === 'season' ||
                    (editingType && editingType === 'season')) &&
                    (!seasonForm.name.trim() || !seasonForm.league_id)) ||
                  ((createMode === 'team' ||
                    (editingType && editingType === 'team')) &&
                    (!teamForm.name.trim() || !teamForm.season_id)) ||
                  false
                }
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                    ? `Update ${editingType === 'set' ? 'Constraint Set' : editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}`
                    : `Create ${createMode === 'set' ? 'Constraint Set' : createMode.charAt(0).toUpperCase() + createMode.slice(1)}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setEditingId(null);
                  resetForms();
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'hierarchy' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏗️ Organizational Hierarchy
          </h3>

          {sports.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-4h-7M5 15h14"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No sports created yet
              </h4>
              <p className="text-gray-500 mb-4">
                Create your first sport to start organizing your constraint
                sets.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreateMode('sport');
                  setIsCreating(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Your First Sport
              </button>

              <div className="mt-4 text-center">
                <div className="text-sm text-gray-500 mb-2">
                  Or get started quickly:
                </div>
                <button
                  type="button"
                  onClick={createSampleData}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {loading ? 'Creating...' : 'Create Sample Data'}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  Creates sample sports, leagues, seasons, and teams
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Expand/Collapse Button */}
                      <button
                        type="button"
                        onClick={() =>
                          sport.id && toggleSportExpansion(sport.id)
                        }
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                        title={
                          expandedSports.has(sport.id || '')
                            ? 'Collapse'
                            : 'Expand'
                        }
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedSports.has(sport.id || '')
                              ? 'rotate-90'
                              : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: sport.color }}
                      >
                        {getSportIcon(sport.icon)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {sport.name}
                        </h4>
                        {sport.description && (
                          <p className="text-sm text-gray-500">
                            {sport.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {
                          allLeagues.filter((l) => l.sport_id === sport.id)
                            .length
                        }{' '}
                        leagues •{' '}
                        {
                          constraintSets.filter(
                            (set) => set.sport_id === sport.id,
                          ).length
                        }{' '}
                        constraint sets
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLeagueForm({
                              ...leagueForm,
                              sport_id: sport.id || '',
                            });
                            setCreateMode('league');
                            setIsCreating(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Add League"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSport(sport)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          title="Edit Sport"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sport.id && handleDeleteSport(sport.id)
                          }
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete Sport"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Leagues */}
                  {expandedSports.has(sport.id || '') && (
                    <div className="mt-4 ml-8 space-y-2">
                      {allLeagues.filter(
                        (league) => league.sport_id === sport.id,
                      ).length === 0 ? (
                        <div className="text-sm text-gray-500 italic border-l-2 border-blue-200 pl-4">
                          No leagues yet. Click "+" to add a league.
                        </div>
                      ) : (
                        allLeagues
                          .filter((league) => league.sport_id === sport.id)
                          .map((league) => (
                            <div
                              key={league.id}
                              className="border-l-2 border-blue-200 pl-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {/* League Expand/Collapse Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      league.id &&
                                      toggleLeagueExpansion(league.id)
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                                    title={
                                      expandedLeagues.has(league.id || '')
                                        ? 'Collapse'
                                        : 'Expand'
                                    }
                                  >
                                    <svg
                                      className={`w-3 h-3 transition-transform ${
                                        expandedLeagues.has(league.id || '')
                                          ? 'rotate-90'
                                          : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>

                                  <div>
                                    <h5 className="font-medium text-gray-800">
                                      {league.name}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {league.organization} • {league.level} •{' '}
                                      {
                                        allSeasons.filter(
                                          (s) => s.league_id === league.id,
                                        ).length
                                      }{' '}
                                      seasons
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSeasonForm({
                                        ...seasonForm,
                                        league_id: league.id || '',
                                      });
                                      setCreateMode('season');
                                      setIsCreating(true);
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                                    title="Add Season"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditLeague(league)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                                    title="Edit League"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      league.id && handleDeleteLeague(league.id)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                    title="Delete League"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Seasons */}
                              {expandedLeagues.has(league.id || '') && (
                                <div className="mt-2 ml-4 space-y-1">
                                  {allSeasons.filter(
                                    (season) => season.league_id === league.id,
                                  ).length === 0 ? (
                                    <div className="text-xs text-gray-500 italic border-l-2 border-green-200 pl-3">
                                      No seasons yet. Click "+" to add a season.
                                    </div>
                                  ) : (
                                    allSeasons
                                      .filter(
                                        (season) =>
                                          season.league_id === league.id,
                                      )
                                      .map((season) => (
                                        <div
                                          key={season.id}
                                          className="border-l-2 border-green-200 pl-3"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                              {/* Season Expand/Collapse Button */}
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  season.id &&
                                                  toggleSeasonExpansion(
                                                    season.id,
                                                  )
                                                }
                                                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                                                title={
                                                  expandedSeasons.has(
                                                    season.id || '',
                                                  )
                                                    ? 'Collapse'
                                                    : 'Expand'
                                                }
                                              >
                                                <svg
                                                  className={`w-3 h-3 transition-transform ${
                                                    expandedSeasons.has(
                                                      season.id || '',
                                                    )
                                                      ? 'rotate-90'
                                                      : ''
                                                  }`}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                  />
                                                </svg>
                                              </button>

                                              <div>
                                                <h6 className="text-sm font-medium text-gray-700">
                                                  {season.name}
                                                </h6>
                                                <p className="text-xs text-gray-400">
                                                  {season.status} •{' '}
                                                  {season.start_date} to{' '}
                                                  {season.end_date} •{' '}
                                                  {
                                                    allTeams.filter(
                                                      (t) =>
                                                        t.season_id ===
                                                        season.id,
                                                    ).length
                                                  }{' '}
                                                  teams
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setTeamForm({
                                                    ...teamForm,
                                                    season_id: season.id || '',
                                                  });
                                                  setCreateMode('team');
                                                  setIsCreating(true);
                                                }}
                                                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                                                title="Add Team"
                                              >
                                                <svg
                                                  className="w-3 h-3"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                  />
                                                </svg>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleEditSeason(season)
                                                }
                                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                                                title="Edit Season"
                                              >
                                                <svg
                                                  className="w-3 h-3"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                  />
                                                </svg>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  season.id &&
                                                  handleDeleteSeason(season.id)
                                                }
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                title="Delete Season"
                                              >
                                                <svg
                                                  className="w-3 h-3"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                  />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>

                                          {/* Expanded Teams */}
                                          {expandedSeasons.has(
                                            season.id || '',
                                          ) && (
                                            <div className="mt-1 ml-3 space-y-1">
                                              {allTeams.filter(
                                                (team) =>
                                                  team.season_id === season.id,
                                              ).length === 0 ? (
                                                <div className="text-xs text-gray-500 italic">
                                                  No teams yet. Click "+" to add
                                                  a team.
                                                </div>
                                              ) : (
                                                allTeams
                                                  .filter(
                                                    (team) =>
                                                      team.season_id ===
                                                      season.id,
                                                  )
                                                  .map((team) => (
                                                    <div
                                                      key={team.id}
                                                      className="flex items-center justify-between space-x-2"
                                                    >
                                                      <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                        <div>
                                                          <span className="text-xs text-gray-600 font-medium">
                                                            {team.name}
                                                          </span>
                                                          {(team.coach_name ||
                                                            team.home_venue) && (
                                                            <p className="text-xs text-gray-400">
                                                              {team.coach_name &&
                                                                `Coach: ${team.coach_name}`}
                                                              {team.coach_name &&
                                                                team.home_venue &&
                                                                ' • '}
                                                              {team.home_venue}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center space-x-1">
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            handleEditTeam(team)
                                                          }
                                                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                                                          title="Edit Team"
                                                        >
                                                          <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                          </svg>
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            team.id &&
                                                            handleDeleteTeam(
                                                              team.id,
                                                            )
                                                          }
                                                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                          title="Delete Team"
                                                        >
                                                          <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                          </svg>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(viewMode === 'sets' || viewMode === 'templates') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'sets' ? '📋 Constraint Sets' : '📐 Templates'}
          </h3>

          {getDisplayTemplates().length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No {viewMode === 'sets' ? 'constraint sets' : 'templates'} found
              </h4>
              <p className="text-gray-500 mb-4">
                {viewMode === 'sets'
                  ? 'Create your first constraint set to get started.'
                  : 'Create reusable templates for common constraint patterns.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreateMode('set');
                  if (viewMode === 'templates') {
                    setConstraintSetForm({
                      ...constraintSetForm,
                      is_template: true,
                    });
                  }
                  setIsCreating(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Your First{' '}
                {viewMode === 'sets' ? 'Constraint Set' : 'Template'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {getDisplayTemplates().map((set) => (
                <div
                  key={set.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {set.name}
                        </h4>
                        {set.is_template && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📐 Template
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {set.visibility === 'private'
                            ? '🔒'
                            : set.visibility === 'shared'
                              ? '👥'
                              : '🌍'}{' '}
                          {set.visibility}
                        </span>
                      </div>

                      {set.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {set.description}
                        </p>
                      )}

                      {/* Show constraint examples for templates */}
                      {viewMode === 'templates' && (set as any).constraints && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            Example Constraints:
                          </h5>
                          <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600">
                            <ul className="space-y-1">
                              {((set as any).constraints as string[])
                                .slice(0, 3)
                                .map((constraint: string, idx: number) => (
                                  <li
                                    key={`constraint-${set.id}-${idx}`}
                                    className="flex items-start"
                                  >
                                    <span className="text-gray-400 mr-2">
                                      •
                                    </span>
                                    {constraint}
                                  </li>
                                ))}
                              {((set as any).constraints as string[]).length >
                                3 && (
                                <li className="text-gray-500 italic">
                                  +
                                  {((set as any).constraints as string[])
                                    .length - 3}{' '}
                                  more constraints...
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Hierarchy Context */}
                      {((set as ConstraintSet).sport ||
                        (set as ConstraintSet).league ||
                        (set as ConstraintSet).season ||
                        (set as ConstraintSet).team) && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          {(set as ConstraintSet).sport && (
                            <span className="flex items-center">
                              {getSportIcon((set as ConstraintSet).sport?.icon)}{' '}
                              {(set as ConstraintSet).sport?.name}
                            </span>
                          )}
                          {(set as ConstraintSet).league && (
                            <span>→ {(set as ConstraintSet).league?.name}</span>
                          )}
                          {(set as ConstraintSet).season && (
                            <span>→ {(set as ConstraintSet).season?.name}</span>
                          )}
                          {(set as ConstraintSet).team && (
                            <span>→ {(set as ConstraintSet).team?.name}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>{set.constraint_count || 0} constraints</span>
                        <span>•</span>
                        <span>Created {formatDate(set.created_at)}</span>
                        <span>•</span>
                        <span>Updated {formatDate(set.updated_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditConstraintSet(set as ConstraintSet)
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleEditConstraints(set as ConstraintSet);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Edit Constraints"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h9a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          set.id && handleDeleteConstraintSet(set.id)
                        }
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                      {onConstraintSetSelected && onNavigateToCalendar && (
                        <button
                          type="button"
                          onClick={() => {
                            onConstraintSetSelected(set as ConstraintSet);
                            onNavigateToCalendar();
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                          title="Use in Calendar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Constraint Editing Modal */}
      {showConstraints && selectedConstraintSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Constraints - {selectedConstraintSet.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowConstraints(false);
                  setSelectedConstraintSet(null);
                  setConstraints([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-500 mt-2">Loading constraints...</p>
                </div>
              ) : constraints.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No constraints found
                  </h4>
                  <p className="text-gray-500">
                    This constraint set doesn't have any constraints yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {constraints.map((constraint, index) => (
                    <div
                      key={constraint.id || index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                constraint.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : constraint.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {constraint.priority || 'medium'} priority
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                constraint.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : constraint.status === 'inactive'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {constraint.status || 'active'}
                            </span>
                            {constraint.confidence_score && (
                              <span className="text-xs text-gray-500">
                                {Math.round(constraint.confidence_score * 100)}%
                                confidence
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">
                            {constraint.raw_text}
                          </p>
                          {constraint.parsed_data && (
                            <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
                              <strong>Parsed:</strong>{' '}
                              {JSON.stringify(constraint.parsed_data, null, 2)}
                            </div>
                          )}
                          {constraint.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Notes:</strong> {constraint.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowConstraints(false);
                  setSelectedConstraintSet(null);
                  setConstraints([]);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
