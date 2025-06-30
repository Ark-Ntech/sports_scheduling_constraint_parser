import { type NextRequest, NextResponse } from 'next/server';

// Simple test route to verify parsing functionality without authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Parse the constraint using the same logic
    const parsedData = simpleConstraintParser(text);

    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'Parsing successful (test mode)',
    });
  } catch (error) {
    console.error('Parse test API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

function simpleConstraintParser(text: string) {
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

  return result;
}

function classifyConstraintType(text: string) {
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
  return topType || 'temporal';
}

function extractEntities(text: string) {
  const entities: any[] = [];

  // Team names (capitalized words)
  const teamMatches = text.match(
    /\b(Team\s+[A-Z]\w*|[A-Z]\w+\s+Team|[A-Z]\w+s)\b/g,
  );
  if (teamMatches) {
    teamMatches.forEach((match) => {
      entities.push({
        type: 'team',
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
        type: 'day_of_week',
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
        type: 'time',
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
        type: 'number',
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
        type: 'venue',
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

function extractTemporalConditions(text: string) {
  const conditions: any[] = [];

  if (text.includes('cannot') || text.includes('not')) {
    conditions.push({
      operator: 'not_equals',
      value: 'specified_time',
    });
  } else if (text.includes('must') || text.includes('only')) {
    conditions.push({
      operator: 'equals',
      value: 'specified_time',
    });
  } else if (text.includes('before')) {
    conditions.push({
      operator: 'less_than',
      value: 'specified_time',
    });
  } else if (text.includes('after')) {
    conditions.push({
      operator: 'greater_than',
      value: 'specified_time',
    });
  }

  return conditions;
}

function extractCapacityConditions(text: string) {
  const conditions: any[] = [];

  if (text.includes('no more than') || text.includes('maximum')) {
    conditions.push({
      operator: 'less_than_or_equal',
      value: 'max_count',
    });
  } else if (text.includes('at least') || text.includes('minimum')) {
    conditions.push({
      operator: 'greater_than_or_equal',
      value: 'min_count',
    });
  }

  return conditions;
}

function extractLocationConditions(text: string) {
  const conditions: any[] = [];

  if (text.includes('must') && text.includes('home')) {
    conditions.push({
      operator: 'equals',
      value: 'home_venue',
    });
  } else if (text.includes('cannot')) {
    conditions.push({
      operator: 'not_equals',
      value: 'specified_venue',
    });
  }

  return conditions;
}

function extractRestConditions(text: string) {
  const conditions: any[] = [];

  if (text.includes('at least') || text.includes('minimum')) {
    conditions.push({
      operator: 'greater_than_or_equal',
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
