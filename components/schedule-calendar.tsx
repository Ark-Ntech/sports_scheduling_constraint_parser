'use client';

import { useState, useEffect } from 'react';
import type { ConstraintSet, Sport, League, Season, Team } from '@/lib/types';

interface ScheduleCalendarProps {
  constraintSets: ConstraintSet[];
  selectedConstraintSet?: ConstraintSet;
  onConstraintSetSelected?: (constraintSet: ConstraintSet) => void;
  onNavigateToParser?: () => void;
  onNavigateToManager?: () => void;
  integrationState?: any;
}

interface GameEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  season: string;
}

export function ScheduleCalendar({
  constraintSets,
  selectedConstraintSet,
  onConstraintSetSelected,
  onNavigateToParser,
  onNavigateToManager,
  integrationState,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Add missing state variables
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [selectedConstraintSetId, setSelectedConstraintSetId] =
    useState<string>('');
  const [violationFilter, setViolationFilter] = useState<
    'all' | 'violations-only' | 'no-violations'
  >('all');

  // Hierarchy data
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Sample games data
  const [games, setGames] = useState<GameEvent[]>([
    {
      id: '1',
      title: 'Thunder Hawks vs Lightning Bolts',
      date: '2024-12-15',
      time: '19:00',
      venue: 'Central Gymnasium',
      homeTeam: 'Thunder Hawks',
      awayTeam: 'Lightning Bolts',
      sport: 'Basketball',
      league: 'Metro Basketball League',
      season: 'Fall 2024 Season',
    },
    {
      id: '2',
      title: 'Eagles FC vs Dynamo United',
      date: '2024-12-14',
      time: '15:00',
      venue: 'Riverside Soccer Field',
      homeTeam: 'Eagles FC',
      awayTeam: 'Dynamo United',
      sport: 'Soccer',
      league: 'Premier Youth Soccer',
      season: 'Spring 2025 Season',
    },
    {
      id: '3',
      title: 'Spike Masters vs Net Ninjas',
      date: '2024-12-16',
      time: '18:30',
      venue: 'Championship Volleyball Arena',
      homeTeam: 'Spike Masters',
      awayTeam: 'Net Ninjas',
      sport: 'Volleyball',
      league: 'Indoor Volleyball Championship',
      season: '2024 Championship Series',
    },
  ]);

  // New game form state
  const [newGameForm, setNewGameForm] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    homeTeam: '',
    awayTeam: '',
    sport: '',
    league: '',
    season: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHierarchyData();
  }, []);

  // Effect to refresh constraint sets and their constraints
  useEffect(() => {
    const loadConstraintDetails = async () => {
      for (const constraintSet of constraintSets) {
        if (constraintSet.id) {
          try {
            const response = await fetch(
              `/api/constraints?setId=${constraintSet.id}`,
            );
            if (response.ok) {
              const constraints = await response.json();
              // Store constraints in a way that doesn't modify the original object
              console.log(
                'Loaded constraints for',
                constraintSet.name,
                constraints,
              );
            }
          } catch (error) {
            console.error(
              'Error loading constraints for set:',
              constraintSet.id,
              error,
            );
          }
        }
      }
    };

    if (constraintSets.length > 0 && validationEnabled) {
      loadConstraintDetails();
    }
  }, [constraintSets.length, validationEnabled]); // Use length instead of the array itself to prevent infinite re-renders

  const loadHierarchyData = async () => {
    try {
      const response = await fetch('/api/sports');
      if (response.ok) {
        const sportsData = await response.json();
        setSports(sportsData);
      }
    } catch (error) {
      console.error('Error loading sports:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getGamesForDate = (date: Date | null) => {
    if (!date) return [];

    const dateString = date.toISOString().split('T')[0];
    return games.filter((game) => {
      const gameMatches = game.date === dateString;
      if (!gameMatches) return false;

      // Apply filters
      if (selectedSport && game.sport !== selectedSport) return false;
      if (selectedLeague && game.league !== selectedLeague) return false;
      if (selectedSeason && game.season !== selectedSeason) return false;
      if (selectedTeam && !game.title.includes(selectedTeam)) return false;

      return true;
    });
  };

  const getConstraintViolations = (date: Date | null) => {
    if (!date) return [];

    // This would integrate with your constraint validation logic
    // For now, return sample violations
    const violations = [];
    const gamesOnDate = getGamesForDate(date);

    if (gamesOnDate.length > 3) {
      violations.push('More than 3 games scheduled on this date');
    }

    if (date.getDay() === 0) {
      // Sunday
      const sundayGames = gamesOnDate.filter(
        (game) => game.sport === 'Basketball',
      );
      if (sundayGames.length > 0) {
        violations.push('Basketball games not allowed on Sundays');
      }
    }

    return violations;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      Basketball: '🏀',
      Soccer: '⚽',
      Volleyball: '🏐',
      Tennis: '🎾',
      Baseball: '⚾',
      Hockey: '🏒',
    };
    return icons[sport] || '🏆';
  };

  // Form handling functions
  const resetForm = () => {
    setNewGameForm({
      title: '',
      date: selectedDate,
      time: '',
      venue: '',
      homeTeam: '',
      awayTeam: '',
      sport: '',
      league: '',
      season: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newGameForm.homeTeam.trim()) {
      errors.homeTeam = 'Home team is required';
    }
    if (!newGameForm.awayTeam.trim()) {
      errors.awayTeam = 'Away team is required';
    }
    if (newGameForm.homeTeam === newGameForm.awayTeam) {
      errors.awayTeam = 'Away team must be different from home team';
    }
    if (!newGameForm.date) {
      errors.date = 'Date is required';
    }
    if (!newGameForm.time) {
      errors.time = 'Time is required';
    }
    if (!newGameForm.venue.trim()) {
      errors.venue = 'Venue is required';
    }
    if (!newGameForm.sport) {
      errors.sport = 'Sport is required';
    }
    if (!newGameForm.league) {
      errors.league = 'League is required';
    }
    if (!newGameForm.season) {
      errors.season = 'Season is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate title if not provided
      const title =
        newGameForm.title ||
        `${newGameForm.homeTeam} vs ${newGameForm.awayTeam}`;

      // Create new game object
      const newGame: GameEvent = {
        id: Date.now().toString(),
        title,
        date: newGameForm.date,
        time: newGameForm.time,
        venue: newGameForm.venue,
        homeTeam: newGameForm.homeTeam,
        awayTeam: newGameForm.awayTeam,
        sport: newGameForm.sport,
        league: newGameForm.league,
        season: newGameForm.season,
      };

      // Check for constraint violations
      const selectedGameDate = new Date(newGameForm.date);
      const violations = getConstraintViolations(selectedGameDate);

      if (violations.length > 0) {
        const confirmSchedule = window.confirm(
          `Warning: This game has ${violations.length} constraint violation(s):\n\n${violations.join('\n')}\n\nDo you want to schedule it anyway?`,
        );

        if (!confirmSchedule) {
          setIsSubmitting(false);
          return;
        }
      }

      // Add game to the list
      setGames((prev) => [...prev, newGame]);

      // Reset form and close modal
      resetForm();
      setShowNewGameModal(false);

      // Show success message
      alert('Game scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling game:', error);
      alert('Failed to schedule game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to populate form when date is selected
  useEffect(() => {
    if (selectedDate && showNewGameModal) {
      setNewGameForm((prev) => ({
        ...prev,
        date: selectedDate,
      }));
    }
  }, [selectedDate, showNewGameModal]);

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Calendar Header with Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Calendar
          </h2>
          <div className="flex items-center space-x-4">
            {/* Integration Navigation */}
            {(onNavigateToParser || onNavigateToManager) && (
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
                {onNavigateToManager && (
                  <button
                    type="button"
                    onClick={onNavigateToManager}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Go to Constraint Set Manager"
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
                        d="M19 11H5m14-4h-7M5 15h14"
                      />
                    </svg>
                    Manager
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowNewGameModal(true)}
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
              Schedule Game
            </button>
          </div>
        </div>

        {/* Constraint Set Integration */}
        {constraintSets.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Constraint Validation
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="validation-enabled"
                  checked={validationEnabled}
                  onChange={(e) => setValidationEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="validation-enabled"
                  className="text-sm text-gray-700"
                >
                  Enable validation
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="constraint-set-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Constraint Set
                </label>
                <select
                  id="constraint-set-select"
                  value={selectedConstraintSet?.id || ''}
                  onChange={(e) => {
                    const constraintSet = constraintSets.find(
                      (cs) => cs.id === e.target.value,
                    );
                    if (constraintSet && onConstraintSetSelected) {
                      onConstraintSetSelected(constraintSet);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No constraint set selected</option>
                  {constraintSets.map((constraintSet) => (
                    <option key={constraintSet.id} value={constraintSet.id}>
                      {constraintSet.name} (
                      {constraintSet.constraint_count || 0} constraints)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="violation-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Violation Filter
                </label>
                <select
                  id="violation-filter"
                  value={violationFilter}
                  onChange={(e) => setViolationFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Show all games</option>
                  <option value="violations-only">Show violations only</option>
                  <option value="no-violations">Hide violations</option>
                </select>
              </div>
            </div>

            {selectedConstraintSet && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-blue-800">
                    Using <strong>{selectedConstraintSet.name}</strong> with{' '}
                    {selectedConstraintSet.constraint_count || 0} constraints
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label
            htmlFor="calendar-sport"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sport Filter
          </label>
          <select
            id="calendar-sport"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sports</option>
            <option value="Basketball">🏀 Basketball</option>
            <option value="Soccer">⚽ Soccer</option>
            <option value="Volleyball">🏐 Volleyball</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="calendar-league"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            League Filter
          </label>
          <select
            id="calendar-league"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Leagues</option>
            <option value="Metro Basketball League">
              Metro Basketball League
            </option>
            <option value="Premier Youth Soccer">Premier Youth Soccer</option>
            <option value="Indoor Volleyball Championship">
              Indoor Volleyball Championship
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="calendar-season"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Season Filter
          </label>
          <select
            id="calendar-season"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Seasons</option>
            <option value="Fall 2024 Season">Fall 2024 Season</option>
            <option value="Spring 2025 Season">Spring 2025 Season</option>
            <option value="2024 Championship Series">
              2024 Championship Series
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="calendar-team"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Team Filter
          </label>
          <select
            id="calendar-team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Teams</option>
            <option value="Thunder Hawks">Thunder Hawks</option>
            <option value="Lightning Bolts">Lightning Bolts</option>
            <option value="Eagles FC">Eagles FC</option>
            <option value="Dynamo United">Dynamo United</option>
            <option value="Spike Masters">Spike Masters</option>
            <option value="Net Ninjas">Net Ninjas</option>
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Calendar Navigation */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((dayName) => (
              <div
                key={dayName}
                className="p-2 text-center text-sm font-medium text-gray-500"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const gamesOnDate = getGamesForDate(date);
              const violations = getConstraintViolations(date);
              const hasViolations = violations.length > 0;
              const isToday =
                date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={
                    date ? date.toISOString().split('T')[0] : `empty-${index}`
                  }
                  className={`min-h-24 p-2 border border-gray-100 rounded-lg transition-colors ${
                    date
                      ? `cursor-pointer hover:bg-gray-50 ${
                          isToday ? 'bg-blue-50 border-blue-200' : ''
                        } ${hasViolations ? 'bg-red-50 border-red-200' : ''}`
                      : 'bg-gray-50'
                  }`}
                  onClick={() => {
                    if (date) {
                      setSelectedDate(date.toISOString().split('T')[0]);
                      setShowNewGameModal(true);
                    }
                  }}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'text-blue-600'
                            : hasViolations
                              ? 'text-red-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      {/* Games */}
                      <div className="space-y-1">
                        {gamesOnDate.slice(0, 2).map((game) => (
                          <div
                            key={game.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                            title={`${game.title} at ${game.time}`}
                          >
                            {getSportIcon(game.sport)} {game.time}
                          </div>
                        ))}
                        {gamesOnDate.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{gamesOnDate.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Constraint Violations */}
                      {hasViolations && (
                        <div className="mt-1">
                          <div
                            className="text-xs text-red-600 font-medium"
                            title={violations.join('; ')}
                          >
                            ⚠️ {violations.length} issue
                            {violations.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded" />
            <span className="text-gray-700">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 rounded" />
            <span className="text-gray-700">Scheduled Games</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded" />
            <span className="text-gray-700">Constraint Violations</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>💡 Pro Tip:</strong> Click on any date to schedule a new
            game. Red dates indicate constraint violations that need attention.
          </p>
        </div>
      </div>

      {/* Game Scheduling Modal */}
      {showNewGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Schedule New Game
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewGameModal(false);
                    resetForm();
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

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={newGameForm.date}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.date && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="time"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Time *
                    </label>
                    <input
                      type="time"
                      id="time"
                      value={newGameForm.time}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.time ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.time && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="homeTeam"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Home Team *
                    </label>
                    <select
                      id="homeTeam"
                      value={newGameForm.homeTeam}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          homeTeam: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.homeTeam
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Home Team</option>
                      <option value="Thunder Hawks">Thunder Hawks</option>
                      <option value="Lightning Bolts">Lightning Bolts</option>
                      <option value="Eagles FC">Eagles FC</option>
                      <option value="Dynamo United">Dynamo United</option>
                      <option value="Spike Masters">Spike Masters</option>
                      <option value="Net Ninjas">Net Ninjas</option>
                    </select>
                    {formErrors.homeTeam && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.homeTeam}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="awayTeam"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Away Team *
                    </label>
                    <select
                      id="awayTeam"
                      value={newGameForm.awayTeam}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          awayTeam: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.awayTeam
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Away Team</option>
                      <option value="Thunder Hawks">Thunder Hawks</option>
                      <option value="Lightning Bolts">Lightning Bolts</option>
                      <option value="Eagles FC">Eagles FC</option>
                      <option value="Dynamo United">Dynamo United</option>
                      <option value="Spike Masters">Spike Masters</option>
                      <option value="Net Ninjas">Net Ninjas</option>
                    </select>
                    {formErrors.awayTeam && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.awayTeam}
                      </p>
                    )}
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label
                    htmlFor="venue"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Venue *
                  </label>
                  <input
                    type="text"
                    id="venue"
                    value={newGameForm.venue}
                    onChange={(e) =>
                      setNewGameForm((prev) => ({
                        ...prev,
                        venue: e.target.value,
                      }))
                    }
                    placeholder="Enter venue name"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.venue ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.venue && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.venue}
                    </p>
                  )}
                </div>

                {/* Sport, League, Season */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="sport"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sport *
                    </label>
                    <select
                      id="sport"
                      value={newGameForm.sport}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          sport: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.sport ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Sport</option>
                      <option value="Basketball">🏀 Basketball</option>
                      <option value="Soccer">⚽ Soccer</option>
                      <option value="Volleyball">🏐 Volleyball</option>
                      <option value="Tennis">🎾 Tennis</option>
                      <option value="Baseball">⚾ Baseball</option>
                      <option value="Hockey">🏒 Hockey</option>
                    </select>
                    {formErrors.sport && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.sport}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="league"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      League *
                    </label>
                    <select
                      id="league"
                      value={newGameForm.league}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          league: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.league ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select League</option>
                      <option value="Metro Basketball League">
                        Metro Basketball League
                      </option>
                      <option value="Premier Youth Soccer">
                        Premier Youth Soccer
                      </option>
                      <option value="Indoor Volleyball Championship">
                        Indoor Volleyball Championship
                      </option>
                    </select>
                    {formErrors.league && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.league}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="season"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Season *
                    </label>
                    <select
                      id="season"
                      value={newGameForm.season}
                      onChange={(e) =>
                        setNewGameForm((prev) => ({
                          ...prev,
                          season: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.season ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Season</option>
                      <option value="Fall 2024 Season">Fall 2024 Season</option>
                      <option value="Spring 2025 Season">
                        Spring 2025 Season
                      </option>
                      <option value="2024 Championship Series">
                        2024 Championship Series
                      </option>
                    </select>
                    {formErrors.season && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.season}
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newGameForm.title}
                    onChange={(e) =>
                      setNewGameForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Leave blank to auto-generate from teams"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Constraint Violations Preview */}
                {newGameForm.date && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Constraint Check
                    </h4>
                    {(() => {
                      const violations = getConstraintViolations(
                        new Date(newGameForm.date),
                      );
                      if (violations.length > 0) {
                        return (
                          <div className="space-y-1">
                            <p className="text-sm text-yellow-700">
                              ⚠️ {violations.length} potential violation(s)
                              detected:
                            </p>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {violations.map((violation, index) => (
                                <li key={violation}>{violation}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      } else {
                        return (
                          <p className="text-sm text-green-700">
                            ✅ No constraint violations detected for this date.
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewGameModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
