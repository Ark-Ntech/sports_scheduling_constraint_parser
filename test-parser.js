// Test script for the constraint parser functionality
// Run with: node test-parser.js

const testConstraints = [
  'Team A cannot play on Mondays',
  'No more than 3 games per day on Field 1',
  'Teams need at least 2 days between games',
  'Basketball games cannot be scheduled after 9 PM',
  'Team B prefers weekend games',
];

// Import the parsing logic (simplified version)
function simpleConstraintParser(text) {
  const textLower = text.toLowerCase();

  // Initialize result structure
  const result = {
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

function classifyConstraintType(text) {
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

function extractEntities(text) {
  const entities = [];

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

function parseTemporalConstraint(text) {
  const temporal = {
    days_of_week: [],
    excluded_dates: [],
    time_ranges: [],
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
    if (text.includes(day) || text.includes(day + 's')) {
      temporal.days_of_week.push(day);
    }
  });

  return temporal;
}

function parseCapacityConstraint(text) {
  const capacity = {
    resource: 'games',
    max_concurrent: undefined,
    max_per_day: undefined,
    max_per_week: undefined,
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
        capacity.max_per_day = parseInt(match[1]);
      } else if (text.includes('per week')) {
        capacity.max_per_week = parseInt(match[1]);
      } else {
        capacity.max_concurrent = parseInt(match[1]);
      }
      break;
    }
  }

  return capacity;
}

function parseLocationConstraint(text) {
  return {
    required_venue: null,
    excluded_venues: [],
    home_away_preference: null,
  };
}

function parseRestConstraint(text) {
  const rest = {
    min_hours: null,
    min_days: null,
    between_games: true,
  };

  // Extract minimum days
  const dayPattern = /(\d+)\s*days?\s*between/i;
  const dayMatch = text.match(dayPattern);
  if (dayMatch) {
    rest.min_days = parseInt(dayMatch[1]);
  }

  // Extract minimum hours
  const hourPattern = /(\d+)\s*hours?\s*between/i;
  const hourMatch = text.match(hourPattern);
  if (hourMatch) {
    rest.min_hours = parseInt(hourMatch[1]);
  }

  return rest;
}

function extractTemporalConditions(text) {
  const conditions = [];

  if (text.includes('cannot') || text.includes('not')) {
    conditions.push({
      operator: 'not_equals',
      value: 'excluded_time',
    });
  }

  return conditions;
}

function extractCapacityConditions(text) {
  const conditions = [];

  if (text.includes('no more') || text.includes('maximum')) {
    conditions.push({
      operator: 'less_than_or_equal',
      value: 'max_capacity',
    });
  }

  return conditions;
}

function extractLocationConditions(text) {
  return [];
}

function extractRestConditions(text) {
  const conditions = [];

  if (text.includes('between')) {
    conditions.push({
      operator: 'greater_than_or_equal',
      value: 'min_rest_period',
    });
  }

  return conditions;
}

function calculateConfidence(text, parsedResult) {
  let confidence = 0.0;

  // Base confidence based on entities found
  const entityCount = parsedResult.entities.length;
  confidence += Math.min(entityCount * 0.2, 0.4);

  // Add confidence based on type classification
  if (parsedResult.type !== 'unknown') {
    confidence += 0.3;
  }

  // Add confidence based on conditions
  if (parsedResult.conditions.length > 0) {
    confidence += 0.3;
  }

  return Math.min(confidence, 1.0);
}

// Test the parser
console.log('🚀 Testing Constraint Parser\n');

testConstraints.forEach((constraint, index) => {
  console.log(`Test ${index + 1}: "${constraint}"`);
  const result = simpleConstraintParser(constraint);
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('---');
});

console.log('✅ Parser tests completed!');
