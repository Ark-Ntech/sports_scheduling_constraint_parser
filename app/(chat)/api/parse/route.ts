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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, constraintSetId, parseMultiple = true } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
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

    // Use HuggingFace parser for advanced NLP (with fallback to rule-based)
    const hfParser = new HuggingFaceConstraintParser();

    // Parse each constraint individually
    const parsedResults = await Promise.all(
      constraintTexts.map(async (constraintText, index) => {
        console.log(`🔍 Parsing constraint ${index + 1}: "${constraintText}"`);
        const parsedData = await hfParser.parseConstraint(
          constraintText.trim(),
        );

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

    // Calculate overall statistics
    const totalConfidence = parsedResults.reduce(
      (sum, result) => sum + result.parsedData.confidence,
      0,
    );
    const averageConfidence = totalConfidence / parsedResults.length;
    const savedCount = parsedResults.filter((result) => result.saved).length;

    // Prepare enhanced response
    const response: any = {
      success: true,
      isMultiple: isMultipleConstraints,
      totalConstraints: parsedResults.length,
      results: parsedResults,
      statistics: {
        totalConstraints: parsedResults.length,
        averageConfidence,
        savedCount,
        parsingMethod: hfParser.isConfigured ? 'huggingface' : 'rule-based',
        constraintTypes: parsedResults.map((r) => r.parsedData.type),
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
      response.parsingMethod = hfParser.isConfigured
        ? 'huggingface'
        : 'rule-based';

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
  // Common separators for multiple constraints
  const separators = [
    /\s+and\s+(?=\w)/gi, // "and" followed by a word (not "AND" in team names)
    /\s*;\s*/g, // semicolon
    /\s*\.\s*(?=[A-Z])/g, // period followed by capital letter (new sentence)
    /\s*,\s*(?=(?:team|no|maximum|minimum|at\s+least|at\s+most|field|court|venue)\s)/gi, // comma before constraint keywords
  ];

  let constraints = [text];

  // Apply each separator
  for (const separator of separators) {
    const newConstraints: string[] = [];
    for (const constraint of constraints) {
      const split = constraint.split(separator);
      if (split.length > 1) {
        // Only split if we get meaningful constraints (not just splitting team names)
        const validSplits = split.filter((part) => {
          const trimmed = part.trim();
          return (
            trimmed.length > 10 && // Must be substantial
            (trimmed.toLowerCase().includes('team') ||
              trimmed.toLowerCase().includes('field') ||
              trimmed.toLowerCase().includes('game') ||
              trimmed.toLowerCase().includes('no more') ||
              trimmed.toLowerCase().includes('maximum') ||
              trimmed.toLowerCase().includes('cannot') ||
              trimmed.toLowerCase().includes('must'))
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

  // Clean up and filter results
  return constraints
    .map((constraint) => constraint.trim())
    .filter((constraint) => constraint.length > 5) // Filter out very short fragments
    .filter((constraint) => {
      // Filter out fragments that don't look like complete constraints
      const lower = constraint.toLowerCase();
      return (
        lower.includes('team') ||
        lower.includes('field') ||
        lower.includes('game') ||
        lower.includes('no more') ||
        lower.includes('maximum') ||
        lower.includes('cannot') ||
        lower.includes('must') ||
        lower.includes('at least') ||
        lower.includes('before') ||
        lower.includes('after')
      );
    });
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
  let score = 0.0;

  // Base score for successful type classification
  if (parsedResult.type !== 'unknown') {
    score += 0.3;
  }

  // Score for entities found
  const entityCount = parsedResult.entities.length;
  if (entityCount > 0) {
    score += Math.min(0.3, entityCount * 0.1);
  }

  // Score for conditions found
  const conditionCount = parsedResult.conditions.length;
  if (conditionCount > 0) {
    score += Math.min(0.2, conditionCount * 0.1);
  }

  // Score for specific constraint data
  const constraintData = parsedResult[parsedResult.type];
  if (
    constraintData &&
    Object.values(constraintData).some(
      (v) =>
        v !== null &&
        v !== undefined &&
        (Array.isArray(v) ? v.length > 0 : true),
    )
  ) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}
