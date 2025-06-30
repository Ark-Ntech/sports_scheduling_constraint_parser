import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConstraint } from '@/lib/database';
import { HuggingFaceConstraintParser } from '@/lib/nlp/huggingface-parser';
import type {
  ParsedConstraintData,
  Entity,
  Condition,
  ConstraintType,
  ConditionOperator,
  EntityType,
} from '@/lib/types';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { text, constraintSetId, parseMultiple = true } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Text is required',
        },
        { status: 400 },
      );
    }

    // Check if this is a multi-constraint input
    const constraintTexts = parseMultiple
      ? splitMultipleConstraints(text)
      : [text];
    const isMultipleConstraints = constraintTexts.length > 1;

    console.log(`📝 Processing ${constraintTexts.length} constraint(s):`);
    constraintTexts.forEach((constraint, index) => {
      console.log(`  ${index + 1}. "${constraint}"`);
    });

    let parsedResults: Array<{
      index: number;
      rawText: string;
      parsedData: any;
      saved: boolean;
      constraintId: string | undefined;
    }>;

    try {
      // Use HuggingFace parser for advanced NLP (with fallback to rule-based)
      const hfParser = new HuggingFaceConstraintParser();
      console.log(`🔍 HF Parser configured: ${hfParser.isConfigured}`);

      // Parse each constraint individually
      parsedResults = await Promise.all(
        constraintTexts.map(async (constraintText, index) => {
          console.log(
            `🔍 Parsing constraint ${index + 1}: "${constraintText}"`,
          );

          let parsedData: any;
          try {
            parsedData = await hfParser.parseConstraint(constraintText.trim());
          } catch (parseError) {
            console.warn(
              `Failed to parse constraint ${index + 1}, using fallback:`,
              parseError,
            );
            // Use simple parser as absolute fallback
            parsedData = simpleConstraintParser(constraintText.trim());
            // Ensure fallback has consistent structure
            if (!parsedData.llmJudge) {
              parsedData.llmJudge = {
                isValid: true,
                confidence: parsedData.confidence,
                reasoning: 'Simple rule-based parsing used as fallback',
                completenessScore: parsedData.confidence,
                contextualInsights:
                  'Fallback parsing applied due to ML parser failure',
              };
            }
          }

          // Save to database if constraintSetId is provided
          let savedConstraint = null;
          if (constraintSetId) {
            try {
              savedConstraint = await createConstraint({
                set_id: constraintSetId,
                raw_text: constraintText.trim(),
                parsed_data: parsedData,
                confidence_score: parsedData.confidence,
              });
            } catch (dbError) {
              console.error(`Failed to save constraint ${index + 1}:`, dbError);
              // Continue without saving - return the parsed result anyway
            }
          }

          return {
            index: index + 1,
            rawText: constraintText.trim(),
            parsedData,
            saved: !!savedConstraint,
            constraintId: savedConstraint?.id,
          };
        }),
      );
    } catch (parserError) {
      console.error(
        'Parser initialization failed, using simple fallback:',
        parserError,
      );
      // If HF parser completely fails, use simple parser for all constraints
      parsedResults = constraintTexts.map((constraintText, index) => {
        const parsedData: any = simpleConstraintParser(constraintText.trim());
        // Ensure consistent structure
        parsedData.llmJudge = {
          isValid: true,
          confidence: parsedData.confidence,
          reasoning: 'Simple rule-based parsing used due to ML parser failure',
          completenessScore: parsedData.confidence,
          contextualInsights:
            'Fallback parsing applied due to parser initialization failure',
        };

        return {
          index: index + 1,
          rawText: constraintText.trim(),
          parsedData,
          saved: false,
          constraintId: undefined,
        };
      });
    }

    // Calculate overall statistics
    const totalConfidence = parsedResults.reduce(
      (sum, result) => sum + result.parsedData.confidence,
      0,
    );
    const averageConfidence = totalConfidence / parsedResults.length;
    const savedCount = parsedResults.filter((result) => result.saved).length;

    // Prepare simplified response structure - ALWAYS include success: true
    const response: any = {
      success: true,
      isMultiple: isMultipleConstraints,
      totalConstraints: parsedResults.length,
      results: parsedResults.map((result) => {
        // Generate the exact output structure as specified in requirements
        const constraintOutput = {
          constraint_id:
            result.constraintId ||
            `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: mapToRequiredConstraintType(result.parsedData.type),
          scope: extractScope(result.parsedData),
          parameters: extractParameters(result.parsedData),
          priority: determinePriority(result.rawText),
          confidence: result.parsedData.confidence,
          // Include entities for UI display
          entities: result.parsedData.entities || [],
          conditions: result.parsedData.conditions || [],
          llmJudge: result.parsedData.llmJudge,
          // Additional metadata
          temporal_info: result.parsedData.temporal,
          raw_text: result.rawText,
          parsing_method: 'rule_based', // Will be updated based on actual parser used
        };

        return {
          ...result,
          standardOutput: constraintOutput,
        };
      }),
      statistics: {
        totalConstraints: parsedResults.length,
        averageConfidence,
        savedCount,
        parsingMethod: 'rule-based', // Will be determined by actual parser
        constraintTypes: parsedResults.map((r) =>
          mapToRequiredConstraintType(r.parsedData.type),
        ),
        highConfidenceCount: parsedResults.filter(
          (r) => r.parsedData.confidence >= 0.8,
        ).length,
      },
    };

    // For single constraint (backward compatibility), also include the old format
    if (!isMultipleConstraints) {
      const singleResult = parsedResults[0];
      response.data = singleResult.parsedData;
      response.saved = singleResult.saved;
      response.constraintId = singleResult.constraintId;
      response.parsingMethod = 'rule-based';

      // Include the exact required output structure
      response.standardOutput = response.results[0]?.standardOutput;

      // Include LLM judge analysis if available
      if (singleResult.parsedData.llmJudge) {
        response.analysis = {
          isValid: singleResult.parsedData.llmJudge.isValid,
          reasoning: singleResult.parsedData.llmJudge.reasoning,
          completenessScore: singleResult.parsedData.llmJudge.completenessScore,
          contextualInsights:
            singleResult.parsedData.llmJudge.contextualInsights,
          suggestedCorrections:
            singleResult.parsedData.llmJudge.suggestedCorrections,
        };

        // Include enhanced result suggestions if available
        if (singleResult.parsedData.llmJudge.enhancedResult) {
          response.enhancedSuggestions =
            singleResult.parsedData.llmJudge.enhancedResult;
        }
      }
    }

    console.log(
      `✅ Successfully processed ${parsedResults.length} constraint(s) with average confidence: ${(averageConfidence * 100).toFixed(1)}%`,
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Split multiple constraints from a single input text
 * Handles various separators and conjunctions
 */
function splitMultipleConstraints(text: string): string[] {
  // First, try line breaks (most common separator)
  let constraints = text.split(/\n\s*\n|\r\n\s*\r\n/); // Double line breaks

  if (constraints.length === 1) {
    // Try single line breaks if no double breaks found
    constraints = text.split(/\n|\r\n/);
  }

  if (constraints.length === 1) {
    // If still one constraint, try other separators
    const separators = [
      /\s+and\s+(?=(?:team|no|maximum|minimum|at\s+least|at\s+most|field|court|venue|eagles|games|must|cannot|require|need)\s)/gi, // "and" followed by constraint keywords
      /\s*;\s*/g, // semicolon
      /\s*\.\s*(?=[A-Z])/g, // period followed by capital letter (new sentence)
      /\s*,\s*(?=(?:team|no|maximum|minimum|at\s+least|at\s+most|field|court|venue|eagles|games|must|cannot|require|need)\s)/gi, // comma before constraint keywords
    ];

    // Apply each separator
    for (const separator of separators) {
      const newConstraints: string[] = [];
      for (const constraint of constraints) {
        const split = constraint.split(separator);
        if (split.length > 1) {
          // Only split if we get meaningful constraints
          const validSplits = split.filter((part) => {
            const trimmed = part.trim();
            return (
              trimmed.length > 10 && // Reduced minimum length to catch shorter supervision requirements
              (trimmed.toLowerCase().includes('team') ||
                trimmed.toLowerCase().includes('field') ||
                trimmed.toLowerCase().includes('game') ||
                trimmed.toLowerCase().includes('no more') ||
                trimmed.toLowerCase().includes('at least') ||
                trimmed.toLowerCase().includes('maximum') ||
                trimmed.toLowerCase().includes('minimum') ||
                trimmed.toLowerCase().includes('cannot') ||
                trimmed.toLowerCase().includes('must') ||
                trimmed.toLowerCase().includes('need') ||
                trimmed.toLowerCase().includes('require') || // Added require
                trimmed.toLowerCase().includes('between') ||
                trimmed.toLowerCase().includes('home') ||
                trimmed.toLowerCase().includes('venue') ||
                trimmed.toLowerCase().includes('court') ||
                trimmed.toLowerCase().includes('exceed') || // Added exceed for duration constraints
                trimmed.toLowerCase().includes('duration') || // Added duration
                trimmed.toLowerCase().includes('supervision') || // Added supervision
                trimmed.toLowerCase().includes('minutes') || // Added time units
                trimmed.toLowerCase().includes('hours') || // Added time units
                trimmed.toLowerCase().includes('eagles'))
            );
          });

          if (validSplits.length > 1) {
            newConstraints.push(...validSplits);
          } else {
            newConstraints.push(constraint);
          }
        } else {
          newConstraints.push(constraint);
        }
      }
      constraints = newConstraints;
    }
  }

  // Clean up and filter results
  const finalConstraints = constraints
    .map((constraint) => constraint.trim())
    .filter((constraint) => constraint.length > 8) // Reduced from 10 to catch supervision requirements
    .filter((constraint) => {
      // Filter out fragments that don't look like complete constraints
      const lower = constraint.toLowerCase();
      return (
        lower.includes('team') ||
        lower.includes('field') ||
        lower.includes('game') ||
        lower.includes('no more') ||
        lower.includes('at least') ||
        lower.includes('maximum') ||
        lower.includes('minimum') ||
        lower.includes('cannot') ||
        lower.includes('must') ||
        lower.includes('need') ||
        lower.includes('require') || // Added require
        lower.includes('between') ||
        lower.includes('home') ||
        lower.includes('venue') ||
        lower.includes('court') ||
        lower.includes('before') ||
        lower.includes('after') ||
        lower.includes('exceed') || // Added exceed
        lower.includes('duration') || // Added duration
        lower.includes('supervision') || // Added supervision
        lower.includes('minutes') || // Added time units
        lower.includes('hours') || // Added time units
        lower.includes('eagles') ||
        lower.includes('played')
      );
    });

  // Add debugging
  console.log(
    `🔍 Split constraints: Found ${finalConstraints.length} constraints from input:`,
    finalConstraints,
  );

  return finalConstraints;
}

function simpleConstraintParser(
  text: string,
): ParsedConstraintData & { confidence: number } {
  const textLower = text.toLowerCase();

  // Initialize result structure
  const result: any = {
    type: 'unknown',
    entities: [],
    conditions: [],
    confidence: 0.0,
  };

  // Determine constraint type
  const constraintType = classifyConstraintType(textLower);
  result.type = constraintType;

  // Extract entities
  result.entities = extractEntities(text);

  // Extract conditions and specific data based on type
  switch (constraintType) {
    case 'temporal':
      result.temporal = parseTemporalConstraint(textLower);
      result.conditions = extractTemporalConditions(textLower);
      break;
    case 'capacity':
      result.capacity = parseCapacityConstraint(textLower);
      result.conditions = extractCapacityConditions(textLower);
      break;
    case 'location':
      result.location = parseLocationConstraint(textLower);
      result.conditions = extractLocationConditions(textLower);
      break;
    case 'rest':
      result.rest = parseRestConstraint(textLower);
      result.conditions = extractRestConditions(textLower);
      break;
  }

  // Calculate confidence score
  result.confidence = calculateConfidence(text, result);

  return result as ParsedConstraintData & { confidence: number };
}

function classifyConstraintType(text: string): ConstraintType {
  const temporalKeywords = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'time',
    'hour',
    'am',
    'pm',
    'morning',
    'afternoon',
    'evening',
    'night',
    'before',
    'after',
    'during',
    'date',
    'week',
    'month',
    'day',
  ];

  const capacityKeywords = [
    'maximum',
    'minimum',
    'limit',
    'capacity',
    'more than',
    'less than',
    'no more',
    'at least',
    'per day',
    'per week',
    'games',
    'matches',
  ];

  const locationKeywords = [
    'field',
    'venue',
    'location',
    'home',
    'away',
    'court',
    'stadium',
    'ground',
    'facility',
    'site',
    'place',
  ];

  const restKeywords = [
    'rest',
    'break',
    'between',
    'gap',
    'interval',
    'recovery',
    'days between',
    'hours between',
    'time between',
  ];

  // Count keyword matches
  const scores = {
    temporal: temporalKeywords.filter((keyword) => text.includes(keyword))
      .length,
    capacity: capacityKeywords.filter((keyword) => text.includes(keyword))
      .length,
    location: locationKeywords.filter((keyword) => text.includes(keyword))
      .length,
    rest: restKeywords.filter((keyword) => text.includes(keyword)).length,
  };

  // Return type with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'temporal'; // Default fallback

  const topType = Object.entries(scores).find(
    ([_, score]) => score === maxScore,
  )?.[0];
  return (topType as ConstraintType) || 'temporal';
}

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];

  // Team names (capitalized words)
  const teamMatches = text.match(
    /\b(Team\s+[A-Z]\w*|[A-Z]\w+\s+Team|[A-Z]\w+s)\b/g,
  );
  if (teamMatches) {
    teamMatches.forEach((match) => {
      entities.push({
        type: 'team' as EntityType,
        value: match,
        confidence: 0.8,
      });
    });
  }

  // Days of week
  const dayMatches = text.match(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mondays|Tuesdays|Wednesdays|Thursdays|Fridays|Saturdays|Sundays)\b/gi,
  );
  if (dayMatches) {
    dayMatches.forEach((match) => {
      entities.push({
        type: 'day_of_week' as EntityType,
        value: match.replace(/s$/, '').toLowerCase(),
        confidence: 0.95,
      });
    });
  }

  // Times
  const timeMatches = text.match(
    /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b/g,
  );
  if (timeMatches) {
    timeMatches.forEach((match) => {
      entities.push({
        type: 'time' as EntityType,
        value: match,
        confidence: 0.9,
      });
    });
  }

  // Numbers
  const numberMatches = text.match(/\b(\d+)\b/g);
  if (numberMatches) {
    numberMatches.forEach((match) => {
      entities.push({
        type: 'number' as EntityType,
        value: match,
        confidence: 0.85,
      });
    });
  }

  // Venues/Fields
  const venueMatches = text.match(
    /\b(Field\s+\d+|Court\s+\d+|Stadium|Arena|Gym|Gymnasium)\b/gi,
  );
  if (venueMatches) {
    venueMatches.forEach((match) => {
      entities.push({
        type: 'venue' as EntityType,
        value: match,
        confidence: 0.9,
      });
    });
  }

  return entities;
}

function parseTemporalConstraint(text: string) {
  const temporal = {
    days_of_week: [] as string[],
    excluded_dates: [] as string[],
    time_ranges: [] as any[],
  };

  // Extract days of week
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  days.forEach((day) => {
    if (text.includes(day) || text.includes(`${day}s`)) {
      temporal.days_of_week.push(day);
    }
  });

  return temporal;
}

function parseCapacityConstraint(text: string) {
  const capacity = {
    resource: 'games',
    max_concurrent: undefined as number | undefined,
    max_per_day: undefined as number | undefined,
    max_per_week: undefined as number | undefined,
  };

  // Extract maximum constraints
  const maxPatterns = [
    /no more than (\d+)/i,
    /maximum (\d+)/i,
    /at most (\d+)/i,
    /(\d+) or fewer/i,
  ];

  for (const pattern of maxPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (text.includes('per day')) {
        capacity.max_per_day = Number.parseInt(match[1]);
      } else if (text.includes('per week')) {
        capacity.max_per_week = Number.parseInt(match[1]);
      } else {
        capacity.max_concurrent = Number.parseInt(match[1]);
      }
      break;
    }
  }

  return capacity;
}

function parseLocationConstraint(text: string) {
  return {
    required_venue: undefined as string | undefined,
    excluded_venues: [] as string[],
    home_venue_required: undefined as boolean | undefined,
  };
}

function parseRestConstraint(text: string) {
  const rest = {
    min_hours: undefined as number | undefined,
    min_days: undefined as number | undefined,
    between_games: true,
  };

  const dayMatch = text.match(/(\d+)\s+days?\s+between/i);
  if (dayMatch) {
    rest.min_days = Number.parseInt(dayMatch[1]);
  }

  const hourMatch = text.match(/(\d+)\s+hours?\s+between/i);
  if (hourMatch) {
    rest.min_hours = Number.parseInt(hourMatch[1]);
  }

  return rest;
}

function extractTemporalConditions(text: string): Condition[] {
  const conditions: Condition[] = [];

  if (text.includes('cannot') || text.includes('not')) {
    conditions.push({
      operator: 'not_equals' as ConditionOperator,
      value: 'specified_time',
    });
  } else if (text.includes('must') || text.includes('only')) {
    conditions.push({
      operator: 'equals' as ConditionOperator,
      value: 'specified_time',
    });
  } else if (text.includes('before')) {
    conditions.push({
      operator: 'less_than' as ConditionOperator,
      value: 'specified_time',
    });
  } else if (text.includes('after')) {
    conditions.push({
      operator: 'greater_than' as ConditionOperator,
      value: 'specified_time',
    });
  }

  return conditions;
}

function extractCapacityConditions(text: string): Condition[] {
  const conditions: Condition[] = [];

  if (text.includes('no more than') || text.includes('maximum')) {
    conditions.push({
      operator: 'less_than_or_equal' as ConditionOperator,
      value: 'max_count',
    });
  } else if (text.includes('at least') || text.includes('minimum')) {
    conditions.push({
      operator: 'greater_than_or_equal' as ConditionOperator,
      value: 'min_count',
    });
  }

  return conditions;
}

function extractLocationConditions(text: string): Condition[] {
  const conditions: Condition[] = [];

  if (text.includes('must') && text.includes('home')) {
    conditions.push({
      operator: 'equals' as ConditionOperator,
      value: 'home_venue',
    });
  } else if (text.includes('cannot')) {
    conditions.push({
      operator: 'not_equals' as ConditionOperator,
      value: 'specified_venue',
    });
  }

  return conditions;
}

function extractRestConditions(text: string): Condition[] {
  const conditions: Condition[] = [];

  if (text.includes('at least') || text.includes('minimum')) {
    conditions.push({
      operator: 'greater_than_or_equal' as ConditionOperator,
      value: 'min_rest_period',
    });
  }

  return conditions;
}

function calculateConfidence(text: string, parsedResult: any): number {
  let confidence = 0.5; // Base confidence

  // Boost for entity recognition
  if (parsedResult.entities && parsedResult.entities.length > 0) {
    confidence += 0.2;
  }

  // Boost for condition extraction
  if (parsedResult.conditions && parsedResult.conditions.length > 0) {
    confidence += 0.2;
  }

  // Boost for specific keywords
  const textLower = text.toLowerCase();
  if (
    textLower.includes('cannot') ||
    textLower.includes('must') ||
    textLower.includes('no more than') ||
    textLower.includes('at least')
  ) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Map internal constraint types to the required constraint type categories
 */
function mapToRequiredConstraintType(internalType: string): string {
  const typeMapping: Record<string, string> = {
    temporal: 'temporal_restriction',
    capacity: 'capacity_limitation',
    location: 'venue_constraint',
    rest: 'rest_period_requirement',
    preference: 'optimization_preference',
    prohibition: 'hard_prohibition',
    assignment: 'resource_assignment',
  };

  return typeMapping[internalType] || 'general_constraint';
}

/**
 * Extract scope (affected teams/games) from parsed data
 */
function extractScope(parsedData: any): string[] {
  const scope: string[] = [];

  if (parsedData.entities) {
    // Extract team names
    const teams = parsedData.entities
      .filter((entity: any) => entity.type === 'team')
      .map((entity: any) => entity.value);
    scope.push(...teams);

    // If no specific teams mentioned, check for "all teams"
    if (teams.length === 0 && parsedData.conditions) {
      const hasAllTeams = parsedData.conditions.some((condition: any) =>
        condition.value?.toString().toLowerCase().includes('all'),
      );
      if (hasAllTeams) {
        scope.push('all_teams');
      }
    }
  }

  return scope;
}

/**
 * Extract parameters (specific values and conditions) from parsed data
 */
function extractParameters(parsedData: any): Record<string, any> {
  const parameters: Record<string, any> = {};

  switch (parsedData.type) {
    case 'temporal':
      if (parsedData.temporal) {
        if (parsedData.temporal.days_of_week?.length > 0) {
          parameters.restricted_days = parsedData.temporal.days_of_week;
          parameters.restriction_type = 'complete_ban';
        }
        if (parsedData.temporal.excluded_dates?.length > 0) {
          parameters.excluded_dates = parsedData.temporal.excluded_dates;
        }
        if (parsedData.temporal.time_ranges?.length > 0) {
          parameters.time_ranges = parsedData.temporal.time_ranges;
        }
      }
      break;

    case 'capacity':
      if (parsedData.capacity) {
        if (parsedData.capacity.max_concurrent) {
          parameters.max_concurrent_games = parsedData.capacity.max_concurrent;
        }
        if (parsedData.capacity.max_per_day) {
          parameters.max_games_per_day = parsedData.capacity.max_per_day;
        }
        if (parsedData.capacity.max_per_week) {
          parameters.max_games_per_week = parsedData.capacity.max_per_week;
        }
        parameters.resource_type = parsedData.capacity.resource || 'games';
      }
      break;

    case 'rest':
      if (parsedData.rest) {
        if (parsedData.rest.min_days) {
          parameters.minimum_rest_days = parsedData.rest.min_days;
        }
        if (parsedData.rest.min_hours) {
          parameters.minimum_rest_hours = parsedData.rest.min_hours;
        }
        parameters.applies_to = parsedData.rest.between_games
          ? 'between_games'
          : 'general';
      }
      break;

    case 'location':
      if (parsedData.location) {
        if (parsedData.location.required_venue) {
          parameters.required_venue = parsedData.location.required_venue;
        }
        if (parsedData.location.excluded_venues?.length > 0) {
          parameters.excluded_venues = parsedData.location.excluded_venues;
        }
        if (parsedData.location.home_venue_required !== undefined) {
          parameters.home_venue_required =
            parsedData.location.home_venue_required;
        }
      }
      break;

    case 'preference':
      if (parsedData.preference) {
        parameters.optimization_goal =
          parsedData.preference.optimization_goal || 'optimize';
        parameters.weight = parsedData.preference.weight || 1.0;
        parameters.description = parsedData.preference.description;
      }
      break;
  }

  // Add extracted numbers and conditions
  if (parsedData.entities) {
    const numbers = parsedData.entities
      .filter((entity: any) => entity.type === 'number')
      .map((entity: any) => Number.parseInt(entity.value, 10));
    if (numbers.length > 0) {
      parameters.numeric_values = numbers;
    }
  }

  if (parsedData.conditions && parsedData.conditions.length > 0) {
    parameters.conditions = parsedData.conditions.map((condition: any) => ({
      operator: condition.operator,
      value: condition.value,
      unit: condition.unit || 'count',
    }));
  }

  return parameters;
}

/**
 * Determine priority level (hard vs soft constraint) based on text analysis
 */
function determinePriority(text: string): 'hard' | 'soft' {
  const textLower = text.toLowerCase();

  // Hard constraint indicators
  const hardKeywords = [
    'cannot',
    'must not',
    'never',
    'prohibited',
    'forbidden',
    'must',
    'required',
    'mandatory',
    'essential',
    'critical',
  ];

  // Soft constraint indicators
  const softKeywords = [
    'prefer',
    'should',
    'minimize',
    'maximize',
    'optimize',
    'try to',
    'attempt to',
    'ideally',
    'if possible',
  ];

  const hasHardKeywords = hardKeywords.some((keyword) =>
    textLower.includes(keyword),
  );
  const hasSoftKeywords = softKeywords.some((keyword) =>
    textLower.includes(keyword),
  );

  if (hasHardKeywords) {
    return 'hard';
  } else if (hasSoftKeywords) {
    return 'soft';
  } else {
    // Default to hard for definitive statements, soft for vague ones
    return textLower.includes('no more than') || textLower.includes('at least')
      ? 'hard'
      : 'soft';
  }
}
