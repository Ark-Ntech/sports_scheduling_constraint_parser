'use client';

import { useState, useEffect } from 'react';
import type {
  ConstraintSet,
  ParsedConstraintData,
  ConstraintType,
} from '@/lib/types';
import { ConfidenceMethodology } from '@/components/confidence-methodology';

interface ConstraintParserProps {
  constraintSets: ConstraintSet[];
  userId: string;
  selectedConstraintSetId?: string;
  onConstraintsParsed?: (constraints: any[]) => void;
  onConstraintsSaved?: () => void;
  onNavigateToManager?: () => void;
  onNavigateToCalendar?: () => void;
  integrationState?: any;
}

// Mock parsed data for demonstration
const mockParsedData: ParsedConstraintData = {
  type: 'temporal' as ConstraintType,
  entities: [
    { type: 'team', value: 'Team A', confidence: 0.95 },
    { type: 'day_of_week', value: 'Monday', confidence: 0.92 },
  ],
  conditions: [{ operator: 'not_equals', value: 'Monday' }],
  temporal: {
    days_of_week: ['Monday'],
    excluded_dates: [],
  },
};

const exampleConstraints = [
  {
    id: 'temporal-1',
    text: 'Team A cannot play on Mondays',
    type: 'temporal',
    description: 'Simple day-of-week restriction',
    category: 'Basic',
  },
  {
    id: 'temporal-2',
    text: 'Basketball games cannot be scheduled after 9 PM',
    type: 'temporal',
    description: 'Time-based scheduling restriction',
    category: 'Basic',
  },
  {
    id: 'temporal-3',
    text: 'No games on December 25th and January 1st',
    type: 'temporal',
    description: 'Holiday exclusions',
    category: 'Basic',
  },
  {
    id: 'temporal-4',
    text: 'Soccer games must be played between 10 AM and 6 PM on weekends',
    type: 'temporal',
    description: 'Complex time and day constraints',
    category: 'Advanced',
  },
  {
    id: 'capacity-1',
    text: 'No more than 3 games per day on Field 1',
    type: 'capacity',
    description: 'Resource capacity limitation',
    category: 'Basic',
  },
  {
    id: 'capacity-2',
    text: 'Central Gymnasium can host maximum 2 games per day',
    type: 'capacity',
    description: 'Venue capacity constraint',
    category: 'Basic',
  },
  {
    id: 'capacity-3',
    text: 'Each team can play at most 3 games per week',
    type: 'capacity',
    description: 'Team workload limitation',
    category: 'Intermediate',
  },
  {
    id: 'rest-1',
    text: 'Teams need at least 2 days between games',
    type: 'rest',
    description: 'Rest period requirement',
    category: 'Basic',
  },
  {
    id: 'rest-2',
    text: 'Thunder Hawks must have 48 hours rest between consecutive games',
    type: 'rest',
    description: 'Team-specific rest requirement',
    category: 'Intermediate',
  },
  {
    id: 'rest-3',
    text: 'No team should play more than 2 games in 3 consecutive days',
    type: 'rest',
    description: 'Advanced rest scheduling',
    category: 'Advanced',
  },
  {
    id: 'location-1',
    text: 'Home team must play at their home venue',
    type: 'location',
    description: 'Venue assignment rule',
    category: 'Basic',
  },
  {
    id: 'location-2',
    text: 'Eagles FC home games must be played at Riverside Soccer Field',
    type: 'location',
    description: 'Team-specific venue requirement',
    category: 'Basic',
  },
  {
    id: 'location-3',
    text: 'Volleyball games cannot be played outdoors during winter months',
    type: 'location',
    description: 'Seasonal venue restrictions',
    category: 'Intermediate',
  },
  {
    id: 'preference-1',
    text: 'Team B prefers weekend games',
    type: 'preference',
    description: 'Soft preference constraint',
    category: 'Basic',
  },
  {
    id: 'preference-2',
    text: 'Youth teams should play before 7 PM',
    type: 'preference',
    description: 'Age-appropriate scheduling',
    category: 'Intermediate',
  },
  {
    id: 'preference-3',
    text: 'Championship games should be scheduled on Saturday afternoons',
    type: 'preference',
    description: 'Important game scheduling preference',
    category: 'Intermediate',
  },
  {
    id: 'multiple-1',
    text: 'Team A cannot play on Mondays and no more than 3 games per day on Field 1',
    type: 'multiple',
    description: 'Multiple constraints in one statement',
    category: 'Advanced',
  },
  {
    id: 'multiple-2',
    text: 'Basketball games must end by 9 PM, teams need 2 days rest between games, and Central Gym can host max 2 games per day',
    type: 'multiple',
    description: 'Complex multi-constraint rule',
    category: 'Advanced',
  },
  {
    id: 'multiple-3',
    text: 'Soccer teams cannot play on Sundays, each team plays maximum 2 games per week, and all games must be between 9 AM and 8 PM',
    type: 'multiple',
    description: 'Sport-specific multi-rule constraint',
    category: 'Advanced',
  },
  {
    id: 'complex-1',
    text: 'During playoffs, teams must have 3 days rest, games can only be on weekends, and each venue hosts maximum 1 game per day',
    type: 'multiple',
    description: 'Tournament-specific constraints',
    category: 'Expert',
  },
  {
    id: 'complex-2',
    text: 'Youth league games on school days must start after 4 PM, cannot exceed 90 minutes duration, and require parent supervision',
    type: 'multiple',
    description: 'Youth-specific scheduling rules',
    category: 'Expert',
  },
];

export function ConstraintParser({
  constraintSets,
  userId,
  selectedConstraintSetId,
  onConstraintsParsed,
  onConstraintsSaved,
  onNavigateToManager,
  onNavigateToCalendar,
  integrationState,
}: ConstraintParserProps) {
  const [inputText, setInputText] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>(
    selectedConstraintSetId || '',
  );
  const [parsedData, setParsedData] = useState<ParsedConstraintData | null>(
    null,
  );
  const [multipleResults, setMultipleResults] = useState<any[] | null>(null);
  const [isMultiple, setIsMultiple] = useState(false);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add save-related state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [newSetForm, setNewSetForm] = useState({
    name: '',
    description: '',
    sport_id: '',
    league_id: '',
    season_id: '',
    team_id: '',
    visibility: 'private' as 'private' | 'shared' | 'public',
    is_template: false,
    tags: [] as string[],
  });

  // Add state for managing custom constraints
  const [customConstraints, setCustomConstraints] = useState<
    typeof exampleConstraints
  >([]);
  const [showAddConstraintDialog, setShowAddConstraintDialog] = useState(false);
  const [newConstraintForm, setNewConstraintForm] = useState({
    text: '',
    type: 'temporal' as ConstraintType,
    description: '',
    category: 'Basic' as string,
  });

  // Update selectedSet when prop changes
  useEffect(() => {
    if (selectedConstraintSetId) {
      setSelectedSet(selectedConstraintSetId);
    }
  }, [selectedConstraintSetId]);

  // Notify parent when constraints are parsed
  useEffect(() => {
    if (onConstraintsParsed && (parsedData || multipleResults)) {
      const constraints = prepareConstraintsForSave();
      if (constraints.length > 0) {
        onConstraintsParsed(constraints);
      }
    }
  }, [parsedData, multipleResults, onConstraintsParsed]);

  // Save handlers
  const handleSaveToExistingSet = async () => {
    if (!selectedSet) {
      alert('Please select a constraint set first');
      return;
    }

    const constraintsToSave = prepareConstraintsForSave();
    if (constraintsToSave.length === 0) {
      alert('No constraints to save');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch('/api/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: selectedSet,
          constraints: constraintsToSave,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSaveSuccess(result.message);
        // Notify parent component
        if (onConstraintsSaved) {
          onConstraintsSaved();
        }
        // Optionally clear the parsed data after successful save
        // setParsedData(null);
        // setMultipleResults(null);
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save constraints');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveToNewSet = async () => {
    if (!newSetForm.name.trim()) {
      alert('Please enter a name for the new constraint set');
      return;
    }

    const constraintsToSave = prepareConstraintsForSave();
    setSaveLoading(true);
    try {
      const response = await fetch('/api/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createNewSet: true,
          newSetData: newSetForm,
          constraints: constraintsToSave,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSaveSuccess(result.message);
        setShowSaveDialog(false);
        setNewSetForm({
          name: '',
          description: '',
          sport_id: '',
          league_id: '',
          season_id: '',
          team_id: '',
          visibility: 'private',
          is_template: false,
          tags: [],
        });
        // Notify parent component
        if (onConstraintsSaved) {
          onConstraintsSaved();
        }
      } else {
        alert(`Failed to create constraint set: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to create constraint set');
    } finally {
      setSaveLoading(false);
    }
  };

  const prepareConstraintsForSave = () => {
    const constraints: any[] = [];

    if (isMultiple && multipleResults) {
      multipleResults.forEach((result) => {
        const confidence =
          result.parsedData.llmJudge?.confidence || confidenceScore || 0.5;
        constraints.push({
          raw_text: result.rawText,
          parsed_data: result.parsedData,
          confidence_score: confidence,
          priority:
            confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
          status: 'active',
          tags: [result.parsedData.type],
          notes: `Parsed from: "${result.rawText}"`,
        });
      });
    } else if (parsedData) {
      const confidence =
        parsedData.llmJudge?.confidence || confidenceScore || 0.5;
      constraints.push({
        raw_text: inputText,
        parsed_data: parsedData,
        confidence_score: confidence,
        priority:
          confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
        status: 'active',
        tags: [parsedData.type],
        notes: `Parsed from: "${inputText}"`,
      });
    }

    return constraints;
  };

  // Add sport icon helper function
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

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setParsedData(null);
    setMultipleResults(null);
    setIsMultiple(false);
    setStatistics(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          constraintSetId: selectedSet || undefined,
          parseMultiple: true, // Enable multiple constraint parsing
        }),
      });

      console.log('Parse response status:', response.status);
      console.log('Parse response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Failed to parse constraint');
      }

      const result = await response.json();
      console.log('Parse result:', result);

      if (result.success) {
        setIsMultiple(result.isMultiple);
        setStatistics(result.statistics);

        if (result.isMultiple) {
          // Multiple constraints parsed
          console.log('Setting multiple results:', result.results);
          setMultipleResults(result.results);
          setConfidenceScore(result.statistics.averageConfidence);
        } else {
          // Single constraint (backward compatibility)
          console.log('Setting parsed data:', result.data);
          setParsedData(result.data);
          setConfidenceScore(result.data.confidence);
        }
      } else {
        console.log('Parse failed:', result.error);
        setError(result.error || 'Failed to parse constraint');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse constraint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced example click handler with add functionality
  const handleConstraintAction = (
    constraint: (typeof exampleConstraints)[0],
    action: 'use' | 'add',
  ) => {
    if (action === 'use') {
      setInputText(constraint.text);
      setParsedData(null);
      setMultipleResults(null);
      setIsMultiple(false);
      setStatistics(null);
      setConfidenceScore(null);
      setError(null);
    } else if (action === 'add') {
      setInputText(`${inputText}${inputText ? '\n\n' : ''}${constraint.text}`);
    }
  };

  // Handler to add new constraint to the list
  const handleAddNewConstraint = () => {
    if (!newConstraintForm.text.trim()) {
      alert('Please enter constraint text');
      return;
    }

    const newConstraint = {
      id: `custom-${Date.now()}`,
      text: newConstraintForm.text,
      type: newConstraintForm.type,
      description: newConstraintForm.description || 'Custom constraint',
      category: newConstraintForm.category,
    };

    setCustomConstraints((prev) => [...prev, newConstraint]);
    setShowAddConstraintDialog(false);
    setNewConstraintForm({
      text: '',
      type: 'temporal',
      description: '',
      category: 'Basic',
    });
  };

  // Get all constraints (built-in + custom)
  const getAllConstraints = () => {
    return [...exampleConstraints, ...customConstraints];
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('Basic');

  return (
    <div className="space-y-6">
      {/* Constraint Parser Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Constraint Parser
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Parser Ready</span>
            </div>
            {/* Integration Navigation */}
            {(onNavigateToManager || onNavigateToCalendar) && (
              <div className="flex items-center space-x-2">
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
          </div>
        </div>

        {/* Integration Status */}
        {selectedConstraintSetId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a9 9 0 012.21-2.21l.464-.464"
                />
              </svg>
              <span className="text-sm text-blue-800">
                Connected to constraint set:{' '}
                <strong>
                  {
                    constraintSets.find(
                      (cs) => cs.id === selectedConstraintSetId,
                    )?.name
                  }
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Constraint Set Selection */}
        {constraintSets.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor="constraint-set"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Save to Constraint Set (Optional)
            </label>
            <select
              id="constraint-set"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a constraint set...</option>
              {constraintSets.map((set) => {
                // Build hierarchical display name
                let displayName = set.name;
                let context = '';

                if (set.sport?.name) {
                  const sportIcon = set.sport.icon
                    ? getSportIcon(set.sport.icon)
                    : '🏆';
                  context = `${sportIcon} ${set.sport.name}`;
                }

                if (set.league?.name) {
                  context += ` → ${set.league.name}`;
                }

                if (set.season?.name) {
                  context += ` → ${set.season.name}`;
                }

                if (set.team?.name) {
                  context += ` → ${set.team.name}`;
                }

                if (context) {
                  displayName = `${set.name} (${context})`;
                }

                return (
                  <option key={set.id} value={set.id}>
                    {set.is_template ? '📐 ' : ''}
                    {displayName}
                  </option>
                );
              })}
            </select>
            {selectedSet && (
              <div className="mt-2 text-xs text-gray-500">
                {(() => {
                  const selectedSetData = constraintSets.find(
                    (set) => set.id === selectedSet,
                  );
                  if (!selectedSetData) return null;

                  return (
                    <div className="flex items-center space-x-2">
                      <span>
                        📊 {selectedSetData.constraint_count || 0} existing
                        constraints
                      </span>
                      {selectedSetData.is_template && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          📐 Template
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {selectedSetData.visibility === 'private'
                          ? '🔒'
                          : selectedSetData.visibility === 'shared'
                            ? '👥'
                            : '🌍'}{' '}
                        {selectedSetData.visibility}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="constraint-input"
                  className="block text-sm font-medium text-gray-700"
                >
                  Natural Language Constraint
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => setInputText(`${inputText}\n\n`)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    title="Add space for another constraint"
                  >
                    + Add Another
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="constraint-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter your scheduling constraints in plain English...

Examples:
• Single constraint: 'Team A cannot play on Mondays'
• Multiple constraints: 'Basketball games cannot be after 9 PM and teams need 2 days rest between games'
• Complex rules: 'During playoffs, teams must have 3 days rest, games only on weekends, and max 1 game per venue per day'

💡 Tips:
- Use 'and' to connect multiple constraints
- Be specific with team names, venues, and times
- Include 'must', 'cannot', 'should' for clarity
- Separate different rule sets with line breaks"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                />

                {/* Character count and parsing hints */}
                <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-xs text-gray-400">
                  <span>{inputText.length} chars</span>
                  {inputText.includes(' and ') && (
                    <span
                      className="text-blue-500"
                      title="Multiple constraints detected"
                    >
                      🔗 Multi
                    </span>
                  )}
                  {inputText.split('\n').filter((line) => line.trim()).length >
                    1 && (
                    <span
                      className="text-green-500"
                      title="Multiple rule sets detected"
                    >
                      📝{' '}
                      {
                        inputText.split('\n').filter((line) => line.trim())
                          .length
                      }{' '}
                      rules
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleParse}
                disabled={loading || !inputText.trim()}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Parsing...
                  </>
                ) : (
                  <>
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
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Parse Constraints
                  </>
                )}
              </button>

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const lines = inputText
                      .split('\n')
                      .filter((line) => line.trim());
                    if (lines.length > 1) {
                      alert(
                        `Ready to parse ${lines.length} constraint rules:\n\n${lines.map((line, i) => `${i + 1}. ${line.trim()}`).join('\n')}`,
                      );
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  title="Preview constraints"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="parsed-output"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Structured JSON Output
              </label>
              <div className="relative">
                <textarea
                  id="parsed-output"
                  value={
                    isMultiple && multipleResults
                      ? `// Multiple Constraints Detected (${multipleResults.length})\n// Average Confidence: ${(statistics?.averageConfidence * 100).toFixed(1)}%\n// See individual constraint details below\n\n${JSON.stringify(
                          {
                            isMultiple: true,
                            totalConstraints: multipleResults.length,
                            statistics,
                            constraints: multipleResults.map((r) => ({
                              index: r.index,
                              rawText: r.rawText,
                              type: r.parsedData.type,
                              confidence: r.parsedData.confidence,
                              entities: r.parsedData.entities,
                              conditions: r.parsedData.conditions,
                            })),
                          },
                          null,
                          2,
                        )}`
                      : parsedData
                        ? JSON.stringify(parsedData, null, 2)
                        : ''
                  }
                  readOnly
                  placeholder="Parsed JSON will appear here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm text-gray-900 placeholder-gray-500 resize-none"
                />
                {/* Debug indicator */}
                <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                  {isMultiple && multipleResults
                    ? `✓ Multiple constraints (${multipleResults.length})`
                    : parsedData
                      ? `✓ Data loaded (${Object.keys(parsedData).length} fields)`
                      : 'No data'}
                </div>
                {(parsedData || (isMultiple && multipleResults)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy =
                        isMultiple && multipleResults
                          ? JSON.stringify(
                              {
                                isMultiple: true,
                                totalConstraints: multipleResults.length,
                                statistics,
                                constraints: multipleResults.map(
                                  (r) => r.parsedData,
                                ),
                              },
                              null,
                              2,
                            )
                          : JSON.stringify(parsedData, null, 2);
                      navigator.clipboard.writeText(textToCopy);
                    }}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md"
                    title="Copy to clipboard"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Confidence Score */}
            {confidenceScore !== null && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">
                  {isMultiple ? 'Average Confidence:' : 'Confidence Score:'}
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidenceScore)}`}
                  >
                    {getConfidenceLabel(confidenceScore)}
                  </span>
                  <span className="text-sm font-mono text-gray-900">
                    {(confidenceScore * 100).toFixed(1)}%
                  </span>
                  {isMultiple && statistics && (
                    <span className="text-xs text-gray-500">
                      ({statistics.highConfidenceCount}/
                      {statistics.totalConstraints} high)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-green-400 mr-2 mt-0.5"
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
                  <span className="text-sm text-green-700">{saveSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setSaveSuccess(null)}
                    className="ml-auto text-green-400 hover:text-green-600"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Save Actions */}
            {(parsedData || (isMultiple && multipleResults)) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Save Constraints:
                  </span>
                  <div className="text-xs text-gray-500">
                    {isMultiple && multipleResults
                      ? `${multipleResults.length} constraints ready`
                      : '1 constraint ready'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Save to existing set */}
                  {selectedSet && (
                    <button
                      type="button"
                      onClick={handleSaveToExistingSet}
                      disabled={saveLoading}
                      className="inline-flex items-center justify-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {saveLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
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
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                            />
                          </svg>
                          Save to Selected Set
                        </>
                      )}
                    </button>
                  )}

                  {/* Save to new set */}
                  <button
                    type="button"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={saveLoading}
                    className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    Create New Constraint Set
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Results Display */}
        {isMultiple && multipleResults && statistics && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multiple Constraints Detected
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-600 font-medium">Total Found</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {statistics.totalConstraints}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-600 font-medium">
                    High Confidence
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {statistics.highConfidenceCount}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-purple-600 font-medium">
                    Avg Confidence
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(statistics.averageConfidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-orange-600 font-medium">Saved</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {statistics.savedCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {multipleResults.map((result, index) => (
                <div
                  key={`constraint-${result.index}-${result.rawText.slice(0, 20)}`}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">
                      Constraint {result.index}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.parsedData.type === 'temporal'
                            ? 'bg-blue-100 text-blue-800'
                            : result.parsedData.type === 'capacity'
                              ? 'bg-green-100 text-green-800'
                              : result.parsedData.type === 'rest'
                                ? 'bg-purple-100 text-purple-800'
                                : result.parsedData.type === 'location'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {result.parsedData.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.parsedData.confidence)}`}
                      >
                        {(result.parsedData.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Original Text:
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      "{result.rawText}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Entities ({result.parsedData.entities.length})
                      </p>
                      <div className="space-y-1">
                        {result.parsedData.entities.map(
                          (entity: any, entityIndex: number) => (
                            <div
                              key={`entity-${result.index}-${entity.type}-${entity.value}-${entityIndex}`}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-600">
                                {entity.type}: {entity.value}
                              </span>
                              <span className="text-gray-500">
                                {(entity.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Conditions ({result.parsedData.conditions.length})
                      </p>
                      <div className="space-y-1">
                        {result.parsedData.conditions.map(
                          (condition: any, conditionIndex: number) => (
                            <div
                              key={`condition-${result.index}-${condition.operator}-${condition.value}-${conditionIndex}`}
                              className="text-xs text-gray-600"
                            >
                              {condition.operator}: {condition.value}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* JSON Output for this constraint */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-700">
                        Parsed JSON
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            JSON.stringify(result.parsedData, null, 2),
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        title="Copy to clipboard"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={JSON.stringify(result.parsedData, null, 2)}
                        readOnly
                        rows={6}
                        className="w-full px-2 py-2 border border-gray-200 rounded text-xs font-mono bg-gray-50 text-gray-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* Confidence Methodology for this constraint */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <ConfidenceMethodology
                      parsedResult={result.parsedData}
                      originalText={result.rawText}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Methodology Display */}
        {!isMultiple && (
          <ConfidenceMethodology
            parsedResult={parsedData}
            originalText={inputText}
          />
        )}

        {/* Multiple Constraints Summary Methodology */}
        {isMultiple && multipleResults && statistics && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📊 Multiple Constraints Analysis Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">Overall Statistics:</h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • Total constraints processed:{' '}
                      {statistics.totalConstraints || multipleResults.length}
                    </li>
                    <li>
                      • Average confidence:{' '}
                      {((statistics.averageConfidence || 0) * 100).toFixed(1)}%
                    </li>
                    <li>
                      • High confidence (≥80%):{' '}
                      {statistics.highConfidenceCount || 0}/
                      {statistics.totalConstraints || multipleResults.length}
                    </li>
                    <li>
                      • Parsing method: {statistics.parsingMethod || 'unknown'}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    Constraint Types Detected:
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {(statistics.constraintTypes || []).map(
                      (type: string, index: number) => (
                        <li
                          key={`type-summary-${type}-${index}-${statistics.totalConstraints || multipleResults.length}`}
                        >
                          • Constraint {index + 1}: {type}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-700">
                💡 Each constraint above has been individually analyzed with
                full ML processing and confidence methodology. Expand any
                constraint to see its detailed scoring breakdown.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Example Constraints */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Constraints</h3>
          <div className="flex items-center space-x-2">
            {(parsedData || (isMultiple && multipleResults)) && (
              <button
                type="button"
                onClick={() => {
                  // Add parsed constraints to the list
                  if (isMultiple && multipleResults) {
                    multipleResults.forEach((result) => {
                      const newConstraint = {
                        id: `parsed-${Date.now()}-${Math.random()}`,
                        text: result.rawText,
                        type: result.parsedData.type,
                        description: 'Parsed from structured output',
                        category: 'Basic',
                      };
                      setCustomConstraints((prev) => [...prev, newConstraint]);
                    });
                  } else if (parsedData) {
                    const newConstraint = {
                      id: `parsed-${Date.now()}`,
                      text: inputText,
                      type: parsedData.type,
                      description: 'Parsed from structured output',
                      category: 'Basic',
                    };
                    setCustomConstraints((prev) => [...prev, newConstraint]);
                  }
                }}
                className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
              >
                <svg
                  className="w-3 h-3 mr-1"
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
                Add Parsed to List
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddConstraintDialog(true)}
              className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <svg
                className="w-3 h-3 mr-1"
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
              Add Custom
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Click on any constraint to use it, or click the + button to add it to
          your current input. You can also add your own custom constraints to
          this list.
        </p>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['Basic', 'Intermediate', 'Advanced', 'Expert'].map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      selectedCategory === category
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category}
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {
                        getAllConstraints().filter(
                          (ex) => ex.category === category,
                        ).length
                      }
                    </span>
                  </button>
                ),
              )}
            </nav>
          </div>
        </div>

        {/* Constraints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getAllConstraints()
            .filter((constraint) => constraint.category === selectedCategory)
            .map((constraint) => (
              <div
                key={constraint.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      constraint.type === 'temporal'
                        ? 'bg-blue-100 text-blue-800'
                        : constraint.type === 'capacity'
                          ? 'bg-green-100 text-green-800'
                          : constraint.type === 'multiple'
                            ? 'bg-gradient-to-r from-blue-100 to-green-100 text-indigo-800'
                            : constraint.type === 'rest'
                              ? 'bg-purple-100 text-purple-800'
                              : constraint.type === 'location'
                                ? 'bg-orange-100 text-orange-800'
                                : constraint.type === 'preference'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {constraint.type === 'multiple' ? 'multi' : constraint.type}
                    {constraint.id.startsWith('custom-') ||
                    constraint.id.startsWith('parsed-')
                      ? ' ✨'
                      : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConstraintAction(constraint, 'add');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                      title="Add to input"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConstraintAction(constraint, 'use');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                      title="Use this constraint"
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
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                  {constraint.text}
                </p>
                <p className="text-xs text-gray-500">
                  {constraint.description}
                </p>
              </div>
            ))}
        </div>

        {/* Multi-constraint Examples Highlight */}
        {selectedCategory === 'Advanced' || selectedCategory === 'Expert' ? (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  🔗 Multi-Constraint Power
                </h4>
                <p className="text-sm text-blue-700">
                  These constraints show how to combine multiple rules in
                  natural language. Use connecting words like "and", "but",
                  "while" to link different rules together.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Parsing Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Parsing Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Be Specific:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Use specific team names, venues, or time periods</li>
              <li>• Include exact numbers when relevant</li>
              <li>• Mention the type of event (game, practice, etc.)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Use Natural Language:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Write as you would speak to a person</li>
              <li>• Use common phrases like "cannot", "must", "prefer"</li>
              <li>• Include context when helpful</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save to New Set Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Constraint Set
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="new-set-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <input
                  id="new-set-name"
                  type="text"
                  value={newSetForm.name}
                  onChange={(e) =>
                    setNewSetForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Basketball League Rules"
                />
              </div>

              <div>
                <label
                  htmlFor="new-set-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="new-set-description"
                  value={newSetForm.description}
                  onChange={(e) =>
                    setNewSetForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description for this constraint set..."
                />
              </div>

              <div>
                <label
                  htmlFor="new-set-visibility"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Visibility
                </label>
                <select
                  id="new-set-visibility"
                  value={newSetForm.visibility}
                  onChange={(e) =>
                    setNewSetForm((prev) => ({
                      ...prev,
                      visibility: e.target.value as
                        | 'private'
                        | 'shared'
                        | 'public',
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="private">🔒 Private (only me)</option>
                  <option value="shared">👥 Shared (with team)</option>
                  <option value="public">🌍 Public (everyone)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="new-set-template"
                  type="checkbox"
                  checked={newSetForm.is_template}
                  onChange={(e) =>
                    setNewSetForm((prev) => ({
                      ...prev,
                      is_template: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="new-set-template"
                  className="ml-2 text-sm text-gray-700"
                >
                  📐 Save as template for reuse
                </label>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  {isMultiple && multipleResults
                    ? `This will create a new constraint set with ${multipleResults.length} parsed constraints.`
                    : 'This will create a new constraint set with 1 parsed constraint.'}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewSetForm({
                    name: '',
                    description: '',
                    sport_id: '',
                    league_id: '',
                    season_id: '',
                    team_id: '',
                    visibility: 'private',
                    is_template: false,
                    tags: [],
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToNewSet}
                disabled={saveLoading || !newSetForm.name.trim()}
                className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saveLoading ? 'Creating...' : 'Create & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Constraint Dialog */}
      {showAddConstraintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Custom Constraint
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="custom-constraint-text"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Constraint Text *
                </label>
                <textarea
                  id="custom-constraint-text"
                  value={newConstraintForm.text}
                  onChange={(e) =>
                    setNewConstraintForm((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Teams cannot play more than 3 games per week"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="custom-constraint-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="custom-constraint-type"
                    value={newConstraintForm.type}
                    onChange={(e) =>
                      setNewConstraintForm((prev) => ({
                        ...prev,
                        type: e.target.value as ConstraintType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="temporal">⏰ Temporal</option>
                    <option value="capacity">📊 Capacity</option>
                    <option value="rest">😴 Rest</option>
                    <option value="location">📍 Location</option>
                    <option value="preference">⭐ Preference</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="custom-constraint-category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="custom-constraint-category"
                    value={newConstraintForm.category}
                    onChange={(e) =>
                      setNewConstraintForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-constraint-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <input
                  id="custom-constraint-description"
                  type="text"
                  value={newConstraintForm.description}
                  onChange={(e) =>
                    setNewConstraintForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of this constraint"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  💡 Your custom constraint will be added to the "
                  {newConstraintForm.category}" category and marked with a ✨
                  sparkle icon.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddConstraintDialog(false);
                  setNewConstraintForm({
                    text: '',
                    type: 'temporal',
                    description: '',
                    category: 'Basic',
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewConstraint}
                disabled={!newConstraintForm.text.trim()}
                className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Add Constraint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
