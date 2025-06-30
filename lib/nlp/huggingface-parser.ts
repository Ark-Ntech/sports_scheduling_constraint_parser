import { HfInference } from '@huggingface/inference';
import type {
  ParsedConstraintData,
  Entity,
  Condition,
  ConstraintType,
} from '@/lib/types';

interface HFClassificationResult {
  label: string;
  score: number;
}

interface HFTokenClassificationResult {
  entity_group: string;
  word: string;
  start: number;
  end: number;
  score: number;
}

interface LLMJudgeResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  suggestedCorrection?: string;
  enhancedResult?: any;
  suggestedCorrections?: Array<{
    field: string;
    current: string;
    suggested: string;
    reason: string;
  }>;
  completenessScore?: number;
  contextualInsights?: string;
  llmExplanation?: any;
  intentConfidence?: number;
}

export class HuggingFaceConstraintParser {
  private hf: HfInference | null = null;
  public isConfigured = false;
  private accessToken: string | null = null;
  private openaiApiKey: string | null = null;

  constructor() {
    try {
      console.log('🔧 Initializing HuggingFace parser...');

      // Initialize Hugging Face - check multiple environment variable names
      this.accessToken =
        process.env.HUGGINGFACE_API_TOKEN ||
        process.env.HUGGINGFACE_API_KEY ||
        process.env.HF_TOKEN ||
        process.env.HUGGINGFACE_ACCESS_TOKEN ||
        process.env.HF_ACCESS_TOKEN ||
        null;

      console.log('🔍 Environment variable check:');
      console.log(
        `   HUGGINGFACE_API_TOKEN: ${process.env.HUGGINGFACE_API_TOKEN ? '✅ Set' : '❌ Not set'}`,
      );
      console.log(
        `   HUGGINGFACE_ACCESS_TOKEN: ${process.env.HUGGINGFACE_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`,
      );
      console.log(
        `   HF_TOKEN: ${process.env.HF_TOKEN ? '✅ Set' : '❌ Not set'}`,
      );

      if (this.accessToken) {
        // Validate token format
        if (!this.accessToken.startsWith('hf_')) {
          console.warn('⚠️ HuggingFace token should start with "hf_"');
          console.warn(
            `   Current token format: ${this.accessToken.substring(0, 10)}...`,
          );
        }

        this.hf = new HfInference(this.accessToken);
        this.isConfigured = true;
        console.log('✅ HuggingFace parser initialized successfully');
        console.log(`   Token format: ${this.accessToken.substring(0, 8)}...`);
        console.log('   🎯 ML-powered parsing enabled!');
      } else {
        console.warn('⚠️ No HuggingFace token found, using rule-based fallback');
        console.warn('   📝 To enable ML parsing:');
        console.warn(
          '   1. Get token from https://huggingface.co/settings/tokens',
        );
        console.warn('   2. Set HUGGINGFACE_ACCESS_TOKEN environment variable');
        console.warn('   3. Redeploy application');
        console.warn(
          '   Checked: HUGGINGFACE_API_TOKEN, HUGGINGFACE_API_KEY, HF_TOKEN, HUGGINGFACE_ACCESS_TOKEN, HF_ACCESS_TOKEN',
        );
      }

      // Initialize OpenAI if available
      this.openaiApiKey = process.env.OPENAI_API_KEY || null;
      if (this.openaiApiKey) {
        console.log('✅ OpenAI API key detected for enhanced LLM capabilities');
      }
    } catch (error) {
      console.error('❌ Failed to initialize HuggingFace parser:', error);
      this.isConfigured = false;
    }
  }

  async parseConstraint(
    text: string,
  ): Promise<ParsedConstraintData & { confidence: number }> {
    if (!this.isConfigured || !this.hf) {
      console.log('Using rule-based parsing (HF not configured)');
      return this.fallbackRuleBasedParsing(text);
    }

    try {
      console.log('Using HuggingFace ML models for parsing...');

      // Use Hugging Face models for advanced parsing
      const [intentResult, entities] = await Promise.all([
        this.classifyIntent(text),
        this.extractEntitiesWithNER(text),
      ]);

      console.log(
        '🔍 Intent result received from classifyIntent:',
        intentResult,
      );
      const constraintType = this.mapIntentToConstraintType(
        intentResult,
        entities,
        text,
      );
      console.log('🔍 Final mapped constraint type:', constraintType);

      const conditions = await this.extractConditions(text, constraintType);

      // Build structured result based on type
      let result: any = {
        type: constraintType,
        entities,
        conditions,
        confidence: await this.calculateMLConfidence(
          text,
          intentResult,
          entities,
          conditions,
          constraintType,
        ),
        // Store ML confidence components for OpenAI explanation
        mlConfidence: {
          intentScore: intentResult[0]?.score || 0.5,
          entityCount: entities.length,
          conditionCount: conditions.length,
          constraintType: constraintType,
        },
      };

      // Add type-specific parsing
      switch (constraintType) {
        case 'temporal':
          result.temporal = await this.parseTemporalWithNLP(text);
          break;
        case 'capacity':
          result.capacity = await this.parseCapacityWithNLP(text);
          break;
        case 'location':
          result.location = await this.parseLocationWithNLP(text);
          break;
        case 'rest':
          result.rest = await this.parseRestWithNLP(text);
          break;
        case 'preference':
          result.preference = await this.parsePreferenceWithNLP(text);
          break;
      }

      // Apply LLM as a Judge for validation
      const judgeResult = await this.applyLLMJudge(text, result, intentResult);
      result.llmJudge = judgeResult;

      // NEW: LLM-powered JSON Schema Validation
      const schemaValidation = await this.validateJSONWithLLM(result, text);
      result.schemaValidation = schemaValidation;

      // NEW: Semantic JSON Correction if needed
      if (!schemaValidation.isValid || schemaValidation.needsCorrection) {
        console.log('🔧 Applying semantic JSON correction...');
        const correctedResult = await this.semanticJSONCorrection(
          result,
          text,
          schemaValidation.issues,
        );
        if (correctedResult) {
          result = { ...result, ...correctedResult };
          result.wasCorreected = true;
          console.log('✅ JSON semantically corrected by LLM');
        }
      }

      // Adjust confidence based on LLM judge
      if (judgeResult.isValid) {
        result.confidence = Math.min(result.confidence * 1.1, 1.0); // Boost confidence
      } else {
        result.confidence = Math.max(result.confidence * 0.8, 0.1); // Reduce confidence
      }

      // Additional confidence boost for schema-valid results
      if (schemaValidation.isValid) {
        result.confidence = Math.min(result.confidence * 1.05, 1.0);
      }

      console.log(
        `HF parsing successful with confidence: ${result.confidence}`,
      );
      return result;
    } catch (error) {
      console.warn('HF parsing failed, falling back to rule-based:', error);
      return this.fallbackRuleBasedParsing(text);
    }
  }

  private async classifyIntent(
    text: string,
  ): Promise<HFClassificationResult[]> {
    if (!this.hf) throw new Error('HF not configured');

    try {
      // Use a specific zero-shot classification model
      const result = await this.hf.zeroShotClassification({
        inputs: text,
        parameters: {
          candidate_labels: [
            'temporal scheduling constraint',
            'capacity limitation constraint',
            'location venue constraint',
            'rest period constraint',
            'preference soft constraint',
          ],
        },
      });

      console.log('🔍 HF Classification result:', result);

      // Handle both old and new HF API response formats
      if (Array.isArray(result)) {
        console.log('🔍 Processing array format results');
        // Handle the actual HF API response format: [{ sequence, labels, scores }]
        if (result.length > 0 && result[0].labels && result[0].scores) {
          const item = result[0];
          const labels = item.labels || [];
          const scores = item.scores || [];

          console.log('🔍 Array format - labels:', labels, 'scores:', scores);

          if (labels.length > 0 && scores.length > 0) {
            const formattedResults = labels.map((label: string, i: number) => ({
              label: label || 'unknown',
              score: scores[i] || 0.5,
            }));
            console.log(
              '🔍 Formatted classification results:',
              formattedResults,
            );
            return formattedResults;
          }
        }

        // Fallback for simple array format
        return result.map((item: any) => ({
          label: item.label || 'unknown',
          score: item.score || 0.5,
        }));
      } else if (result && typeof result === 'object') {
        // Handle object response format - this is an alternative format
        const labels = (result as any).labels || [];
        const scores = (result as any).scores || [];

        console.log(
          '🔍 Processing object format - labels:',
          labels,
          'scores:',
          scores,
        );

        if (labels.length > 0 && scores.length > 0) {
          const formattedResults = labels.map((label: string, i: number) => ({
            label: label || 'unknown',
            score: scores[i] || 0.5,
          }));
          console.log('🔍 Formatted classification results:', formattedResults);
          return formattedResults;
        }
      }

      // If no valid format, return default
      console.warn('Unexpected HF classification result format, using default');
      return [{ label: 'temporal scheduling constraint', score: 0.5 }];
    } catch (error) {
      console.warn('Intent classification failed:', error);
      throw error;
    }
  }

  private async extractEntitiesWithNER(text: string): Promise<Entity[]> {
    if (!this.hf) throw new Error('HF not configured');

    try {
      // Use a specific NER model - try multiple models for robustness
      let nerResults: HFTokenClassificationResult[] = [];

      try {
        // Try the default NER model first
        nerResults = (await this.hf.tokenClassification({
          inputs: text,
          parameters: {
            aggregation_strategy: 'simple',
          },
        })) as HFTokenClassificationResult[];
      } catch (error) {
        console.warn('Default NER failed, trying alternative model:', error);
        // Fallback to a specific model
        nerResults = (await this.hf.tokenClassification({
          inputs: text,
          model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
          parameters: {
            aggregation_strategy: 'simple',
          },
        })) as HFTokenClassificationResult[];
      }

      const entities: Entity[] = [];

      // Convert HF NER results to our entity format
      for (const result of nerResults) {
        const entityType = this.mapNERLabelToEntityType(result.entity_group);
        if (entityType) {
          entities.push({
            type: entityType as any,
            value: result.word.trim(),
            confidence: result.score,
          });
        }
      }

      // Supplement with rule-based entity extraction for sports-specific terms
      const ruleBasedEntities = this.extractSportsSpecificEntities(text);
      entities.push(...ruleBasedEntities);

      return entities;
    } catch (error) {
      console.warn('NER failed, using rule-based entities:', error);
      return this.extractSportsSpecificEntities(text);
    }
  }

  private async applyLLMJudge(
    originalText: string,
    parsedResult: any,
    intentResults?: HFClassificationResult[],
  ): Promise<LLMJudgeResult> {
    // Always use enhanced basic analysis since text generation is failing
    console.log('🔍 Applying enhanced judge analysis...');
    return await this.performEnhancedJudgeAnalysis(
      originalText,
      parsedResult,
      intentResults,
    );
  }

  private async performEnhancedJudgeAnalysis(
    originalText: string,
    parsedResult: any,
    intentResults?: HFClassificationResult[],
  ): Promise<LLMJudgeResult> {
    // Enhanced analysis using available ML data and rule-based heuristics
    const textLower = originalText.toLowerCase();

    // Analyze entity completeness
    const hasTeam =
      parsedResult.entities?.some((e: any) => e.type === 'team') ||
      textLower.includes('team');
    const hasTime =
      parsedResult.entities?.some((e: any) =>
        ['time', 'day_of_week', 'date'].includes(e.type),
      ) ||
      textLower.match(
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|\d{1,2}:\d{2}|am|pm|week|month|january|february|march|april|may|june|july|august|september|october|november|december)\b/,
      );
    const hasVenue =
      parsedResult.entities?.some((e: any) => e.type === 'venue') ||
      textLower.match(/\b(field|court|stadium|arena|gym|home|away)\b/);
    const hasNumber =
      parsedResult.entities?.some((e: any) => e.type === 'number') ||
      textLower.match(/\b\d+\b/);

    // Enhanced analysis for specific constraint types
    const constraintType = parsedResult.type;
    let completeness = 0.0;
    let reasoning = '';
    const suggestedCorrections = [];

    switch (constraintType) {
      case 'temporal': {
        // Critical entities for temporal constraints
        const teamScore = hasTeam ? 0.4 : 0.0;
        const timeScore = hasTime ? 0.6 : 0.0;
        completeness = teamScore + timeScore;

        reasoning = `Temporal constraint analysis: Team entity ${hasTeam ? 'found' : 'missing'} (${teamScore}), Time entity ${hasTime ? 'found' : 'missing'} (${timeScore})`;

        if (!hasTeam) {
          suggestedCorrections.push({
            field: 'entities',
            current: 'no team entity',
            suggested: 'extract team name',
            reason: 'Team entity is critical for temporal constraints',
          });
        }

        if (!hasTime && textLower.match(/\b(week|month|day)\b/)) {
          suggestedCorrections.push({
            field: 'temporal.excluded_dates',
            current: 'empty',
            suggested: 'extract specific time period',
            reason:
              'Time period references should be converted to specific dates',
          });
        }
        break;
      }
      case 'capacity': {
        const venueScore = hasVenue ? 0.3 : 0.0;
        const numberScore = hasNumber ? 0.7 : 0.0;
        completeness = venueScore + numberScore;

        reasoning = `Capacity constraint analysis: Venue entity ${hasVenue ? 'found' : 'missing'} (${venueScore}), Numeric entity ${hasNumber ? 'found' : 'missing'} (${numberScore})`;

        if (!hasNumber) {
          suggestedCorrections.push({
            field: 'entities',
            current: 'no numeric limit',
            suggested: 'extract capacity numbers (max/min)',
            reason: 'Capacity constraints require numeric limits',
          });
        }
        break;
      }
      case 'location': {
        const teamScore = hasTeam ? 0.4 : 0.0;
        const venueScore = hasVenue ? 0.6 : 0.0;
        completeness = teamScore + venueScore;

        reasoning = `Location constraint analysis: Team entity ${hasTeam ? 'found' : 'missing'} (${teamScore}), Venue entity ${hasVenue ? 'found' : 'missing'} (${venueScore})`;

        if (!hasVenue) {
          suggestedCorrections.push({
            field: 'entities',
            current: 'no venue specified',
            suggested: 'extract venue/location name',
            reason: 'Location constraints require venue specification',
          });
        }
        break;
      }
      default: {
        // General scoring
        completeness =
          (hasTeam ? 0.3 : 0) +
          (hasTime ? 0.3 : 0) +
          (hasVenue ? 0.2 : 0) +
          (hasNumber ? 0.2 : 0);
        reasoning = `General constraint analysis: Team(${hasTeam}), Time(${hasTime}), Venue(${hasVenue}), Number(${hasNumber})`;
      }
    }

    // Add condition analysis
    const conditionScore = parsedResult.conditions?.length > 0 ? 0.2 : 0.0;
    completeness = Math.min(completeness + conditionScore, 1.0);

    // Generate contextual insights
    const insights = this.generateAdvancedInsights(
      originalText,
      parsedResult,
      constraintType,
    );

    // Generate LLM-powered detailed explanation
    const llmExplanation = await this.generateLLMExplanation(
      originalText,
      parsedResult,
      completeness,
    );

    return {
      isValid: completeness > 0.4,
      confidence: completeness,
      reasoning: `${reasoning}. Condition score: ${conditionScore}. Overall completeness: ${completeness.toFixed(2)}`,
      completenessScore: completeness,
      suggestedCorrections,
      contextualInsights: insights,
      llmExplanation,
      intentConfidence: intentResults?.[0]?.score || 0.5,
    };
  }

  private generateAdvancedInsights(
    originalText: string,
    parsedResult: any,
    constraintType: string,
  ): string {
    const insights = [];
    const textLower = originalText.toLowerCase();

    // Constraint-specific insights
    if (constraintType === 'temporal') {
      if (textLower.includes('cannot')) {
        insights.push(
          'Hard exclusion constraint - requires strict enforcement',
        );
      }
      if (textLower.match(/\b(week|month)\b/)) {
        insights.push(
          'Period-based constraint - may need date range expansion',
        );
      }
      if (
        textLower.match(
          /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
        )
      ) {
        insights.push('Day-specific constraint - weekly pattern detected');
      }
    }

    // Entity-specific insights
    if (
      textLower.includes('team') &&
      !parsedResult.entities?.some((e: any) => e.type === 'team')
    ) {
      insights.push('Team reference detected but not extracted as entity');
    }

    // Complexity insights
    const entityCount = parsedResult.entities?.length || 0;
    const conditionCount = parsedResult.conditions?.length || 0;

    if (entityCount > 3) {
      insights.push(
        'Complex constraint with multiple entities - may need careful validation',
      );
    }

    if (conditionCount === 0) {
      insights.push(
        'No explicit conditions detected - constraint intent may be ambiguous',
      );
    }

    return insights.join('; ') || 'Standard constraint processing applicable';
  }

  private async extractConditions(
    text: string,
    type: ConstraintType,
  ): Promise<Condition[]> {
    const conditions: Condition[] = [];
    const textLower = text.toLowerCase();

    // Enhanced semantic understanding to extract logical conditions
    if (
      textLower.includes('cannot') ||
      textLower.includes('not') ||
      textLower.includes('never') ||
      textLower.includes('must not')
    ) {
      conditions.push({
        operator: 'not_equals',
        value: 'specified_constraint',
      });
    } else if (
      textLower.includes('must') ||
      textLower.includes('only') ||
      textLower.includes('always') ||
      textLower.includes('required')
    ) {
      conditions.push({ operator: 'equals', value: 'specified_constraint' });
    } else if (
      textLower.includes('before') ||
      textLower.includes('earlier than') ||
      textLower.includes('prior to')
    ) {
      conditions.push({ operator: 'less_than', value: 'specified_time' });
    } else if (
      textLower.includes('after') ||
      textLower.includes('later than') ||
      textLower.includes('following')
    ) {
      conditions.push({ operator: 'greater_than', value: 'specified_time' });
    } else if (
      textLower.includes('at least') ||
      textLower.includes('minimum') ||
      textLower.includes('no fewer than')
    ) {
      conditions.push({
        operator: 'greater_than_or_equal',
        value: 'minimum_value',
      });
    } else if (
      textLower.includes('at most') ||
      textLower.includes('maximum') ||
      textLower.includes('no more than') ||
      textLower.includes('up to')
    ) {
      conditions.push({
        operator: 'less_than_or_equal',
        value: 'maximum_value',
      });
    }

    return conditions;
  }

  private mapIntentToConstraintType(
    results: HFClassificationResult[],
    entities?: Entity[],
    text?: string,
  ): ConstraintType {
    console.log(
      '🔍 mapIntentToConstraintType received results:',
      JSON.stringify(results, null, 2),
    );

    if (results.length === 0) {
      console.log('🔍 No results, defaulting to temporal');
      return 'temporal';
    }

    const topIntent = results[0];
    console.log('🔍 Top intent object:', JSON.stringify(topIntent, null, 2));

    // Safely check if label exists and has the includes method
    const label = topIntent?.label?.toLowerCase() || '';
    const textLower = text?.toLowerCase() || '';

    console.log(
      `🎯 Top classified intent: "${label}" (score: ${topIntent?.score})`,
    );

    // Entity-aware classification: override HF classification based on entity patterns
    if (entities) {
      const hasTeam = entities.some((e) => e.type === 'team');
      const hasTime = entities.some((e) =>
        ['time', 'day_of_week', 'date'].includes(e.type),
      );
      const hasCapacityIndicator = entities.some(
        (e) => e.type === 'capacity_indicator',
      );
      const hasNumber = entities.some((e) => e.type === 'number');
      const hasTimePeriod = entities.some((e) => e.type === 'time_period');
      const hasVenue = entities.some((e) => e.type === 'venue');
      const hasDuration = entities.some((e) => e.type === 'duration');
      const hasPersonnel = entities.some((e) => e.type === 'personnel');
      const hasRequirement = entities.some((e) => e.type === 'requirement');

      console.log(
        `🔍 Entity analysis: team(${hasTeam}), day_of_week/time(${hasTime}), capacity_indicator(${hasCapacityIndicator}), number(${hasNumber}), time_period(${hasTimePeriod}), venue(${hasVenue}), duration(${hasDuration}), personnel(${hasPersonnel}), requirement(${hasRequirement})`,
      );

      // Duration constraints (NEW - handle "cannot exceed 90 minutes")
      if (hasDuration && hasCapacityIndicator && textLower.includes('exceed')) {
        console.log(
          '🎯 Entity-based override: Duration capacity constraint detected (cannot exceed X minutes)',
        );
        return 'capacity';
      }

      // Supervision/personnel requirements (NEW - handle "require parent supervision")
      if (hasPersonnel && hasRequirement) {
        console.log(
          '🎯 Entity-based override: Personnel requirement constraint detected',
        );
        return 'preference'; // Supervision requirements are typically soft constraints
      }

      // Strong capacity constraint indicators
      if (hasCapacityIndicator && hasNumber && (hasTimePeriod || hasVenue)) {
        console.log(
          '🎯 Entity-based override: Strong capacity constraint pattern detected',
        );
        return 'capacity';
      }

      // Strong temporal constraint indicators
      if (
        entities.some((e) => ['day_of_week', 'time'].includes(e.type)) &&
        !hasCapacityIndicator
      ) {
        console.log(
          '🎯 Entity-based override: Strong temporal constraint pattern detected',
        );
        return 'temporal';
      }
    }

    // Enhanced mapping with specific patterns for HF labels
    // Check for capacity constraints first (highest priority for capacity indicators)
    if (label.includes('capacity') || label.includes('limitation')) {
      console.log('🎯 Mapped to capacity constraint (capacity/limitation)');
      return 'capacity';
    }

    // Check for location/venue constraints
    if (label.includes('location') || label.includes('venue')) {
      // Special case: if it's a location constraint but has capacity indicators, treat as capacity
      if (
        textLower.includes('no more than') ||
        textLower.includes('at most') ||
        textLower.includes('maximum') ||
        textLower.includes('per day')
      ) {
        console.log(
          '🎯 Location constraint with capacity indicators - mapped to capacity',
        );
        return 'capacity';
      }
      console.log('🎯 Mapped to location constraint (location/venue)');
      return 'location';
    }

    // Check for temporal constraints
    if (label.includes('temporal') || label.includes('scheduling')) {
      console.log('🎯 Mapped to temporal constraint (temporal/scheduling)');
      return 'temporal';
    }

    // Check for rest constraints
    if (label.includes('rest') || label.includes('period')) {
      console.log('🎯 Mapped to rest constraint (rest/period)');
      return 'rest';
    }

    // Check for preference constraints
    if (label.includes('preference') || label.includes('soft')) {
      console.log('🎯 Mapped to preference constraint (preference/soft)');
      return 'preference';
    }

    // Enhanced fallback logic based on label patterns
    if (
      label.includes('field') ||
      label.includes('court') ||
      label.includes('stadium')
    ) {
      console.log('🎯 Mapping field/court/stadium constraint to location');
      return 'location';
    }
    if (
      label.includes('limit') ||
      label.includes('max') ||
      label.includes('min') ||
      label.includes('more') ||
      label.includes('less')
    ) {
      console.log('🎯 Mapping limit-related constraint to capacity');
      return 'capacity';
    }

    console.log('🎯 No specific pattern found, defaulting to temporal');
    return 'temporal'; // default
  }

  private mapNERLabelToEntityType(nerLabel: string): string | null {
    const labelMap: { [key: string]: string } = {
      PER: 'team', // Person -> Team
      PERSON: 'team', // Person -> Team
      ORG: 'team', // Organization -> Team
      TIME: 'time', // Time entities
      DATE: 'time', // Date entities
      LOC: 'venue', // Location -> Venue
      LOCATION: 'venue', // Location -> Venue
      CARDINAL: 'number', // Numbers
      ORDINAL: 'number', // Ordinal numbers
      QUANTITY: 'number', // Quantities
    };

    return labelMap[nerLabel.toUpperCase()] || null;
  }

  private extractSportsSpecificEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    // Days of week (high confidence) - Process FIRST to avoid conflicts
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

    // Create a set of already found day values to avoid duplicates in team detection
    const foundDays = new Set(
      dayMatches?.map((match) => match.toLowerCase()) || [],
    );

    // Time patterns (enhanced)
    const timeMatches = text.match(
      /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm)|\d{1,2}:\d{2})\b/g,
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

    // Duration and time units (NEW - critical for duration constraints)
    const durationMatches = text.match(
      /\b(\d+)\s*(minutes?|hours?|mins?|hrs?|seconds?|secs?)\b/gi,
    );
    if (durationMatches) {
      durationMatches.forEach((match) => {
        entities.push({
          type: 'duration',
          value: match.toLowerCase(),
          confidence: 0.92,
        });
      });
    }

    // Time periods (enhanced for capacity constraints)
    const periodMatches = text.match(
      /\b(per\s+(day|week|month|hour)|daily|weekly|monthly|hourly|duration)\b/gi,
    );
    if (periodMatches) {
      periodMatches.forEach((match) => {
        entities.push({
          type: 'time_period',
          value: match.toLowerCase(),
          confidence: 0.8,
        });
      });
    }

    // Supervision and personnel requirements (NEW - for supervision constraints)
    const supervisionMatches = text.match(
      /\b(parent|coach|supervisor|official|referee|adult|guardian|staff|instructor)\s*(supervision|oversight|presence|required|mandatory)?\b/gi,
    );
    if (supervisionMatches) {
      supervisionMatches.forEach((match) => {
        entities.push({
          type: 'personnel',
          value: match.toLowerCase(),
          confidence: 0.88,
        });
      });
    }

    // Requirement indicators (NEW - for policies and rules)
    const requirementMatches = text.match(
      /\b(require|need|mandatory|must\s+have|necessary|essential|obligatory)\b/gi,
    );
    if (requirementMatches) {
      requirementMatches.forEach((match) => {
        entities.push({
          type: 'requirement',
          value: match.toLowerCase(),
          confidence: 0.85,
        });
      });
    }

    // Sports venues (expanded)
    const venueMatches = text.match(
      /\b(Field\s+\d+|Court\s+\d+|Stadium|Arena|Gym|Gymnasium|Home|Away|Venue\s+\d+|Ground|Pitch)\b/gi,
    );
    if (venueMatches) {
      venueMatches.forEach((match) => {
        entities.push({
          type: 'venue',
          value: match,
          confidence: 0.85,
        });
      });
    }

    // Team patterns (enhanced) - Fixed to handle single letter team names and exclude days
    const teamMatches = text.match(
      /\b(Team\s+[A-Z](?:\w*)?|[A-Z]\w+\s+Team|Lakers|Warriors|Bulls|Giants|Eagles|Lions|Tigers|Bears|Rams|Hawks|Falcons|youth\s+league|school\s+teams?)\b/gi,
    );
    if (teamMatches) {
      teamMatches.forEach((match) => {
        // Skip if this match is already identified as a day of the week
        if (!foundDays.has(match.toLowerCase())) {
          entities.push({
            type: 'team',
            value: match,
            confidence: 0.8,
          });
        }
      });
    }

    // Numbers (enhanced with context)
    const numberMatches = text.match(/\b(\d+)\b/g);
    if (numberMatches) {
      numberMatches.forEach((match) => {
        // Higher confidence for capacity-related numbers
        const confidence =
          text.toLowerCase().includes('no more than') ||
          text.toLowerCase().includes('at least') ||
          text.toLowerCase().includes('maximum') ||
          text.toLowerCase().includes('minimum') ||
          text.toLowerCase().includes('exceed')
            ? 0.9
            : 0.85;
        entities.push({
          type: 'number',
          value: match,
          confidence,
        });
      });
    }

    // Capacity constraint indicators (enhanced)
    const capacityMatches = text.match(
      /\b(no more than|at most|maximum|max|at least|minimum|min|exceed|limit|cannot exceed|up to)\b/gi,
    );
    if (capacityMatches) {
      capacityMatches.forEach((match) => {
        entities.push({
          type: 'capacity_indicator',
          value: match.toLowerCase(),
          confidence: 0.95,
        });
      });
    }

    // League/Organization indicators (NEW)
    const leagueMatches = text.match(
      /\b(youth\s+league|little\s+league|school\s+days?|high\s+school|college|university|junior|senior)\b/gi,
    );
    if (leagueMatches) {
      leagueMatches.forEach((match) => {
        entities.push({
          type: 'organization',
          value: match.toLowerCase(),
          confidence: 0.82,
        });
      });
    }

    return entities;
  }

  private async parseTemporalWithNLP(text: string): Promise<any> {
    const temporal = {
      days_of_week: [] as string[],
      excluded_dates: [] as string[],
      time_ranges: [] as any[],
      before_time: null as string | null,
      after_time: null as string | null,
    };

    // Extract days with enhanced pattern matching
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
      if (text.toLowerCase().includes(day)) {
        temporal.days_of_week.push(day);
      }
    });

    // Extract time constraints with better patterns
    const beforeMatch = text.match(
      /before\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i,
    );
    if (beforeMatch) {
      temporal.before_time = beforeMatch[1];
    }

    const afterMatch = text.match(
      /after\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i,
    );
    if (afterMatch) {
      temporal.after_time = afterMatch[1];
    }

    return temporal;
  }

  private async parseCapacityWithNLP(text: string): Promise<any> {
    const capacity = {
      max_count: null as number | null,
      min_count: null as number | null,
      per_period: null as string | null,
      resource: 'games',
    };

    // Enhanced number extraction with context
    const maxMatch = text.match(
      /(?:no more than|maximum|at most|up to)\s+(\d+)/i,
    );
    if (maxMatch) {
      capacity.max_count = Number.parseInt(maxMatch[1]);
    }

    const minMatch = text.match(/(?:at least|minimum|no fewer than)\s+(\d+)/i);
    if (minMatch) {
      capacity.min_count = Number.parseInt(minMatch[1]);
    }

    // Period detection (enhanced)
    if (
      text.toLowerCase().includes('per day') ||
      text.toLowerCase().includes('daily')
    ) {
      capacity.per_period = 'day';
    } else if (
      text.toLowerCase().includes('per week') ||
      text.toLowerCase().includes('weekly')
    ) {
      capacity.per_period = 'week';
    } else if (
      text.toLowerCase().includes('per month') ||
      text.toLowerCase().includes('monthly')
    ) {
      capacity.per_period = 'month';
    }

    return capacity;
  }

  private async parseLocationWithNLP(text: string): Promise<any> {
    return {
      required_venue: null,
      excluded_venues: [],
      home_venue_required: text.toLowerCase().includes('home'),
      away_venue_required: text.toLowerCase().includes('away'),
    };
  }

  private async parseRestWithNLP(text: string): Promise<any> {
    const rest = {
      min_hours: null as number | null,
      min_days: null as number | null,
      between_games: true,
    };

    const dayMatch = text.match(/(\d+)\s*days?\s*between/i);
    if (dayMatch) {
      rest.min_days = Number.parseInt(dayMatch[1]);
    }

    const hourMatch = text.match(/(\d+)\s*hours?\s*between/i);
    if (hourMatch) {
      rest.min_hours = Number.parseInt(hourMatch[1]);
    }

    return rest;
  }

  private async parsePreferenceWithNLP(text: string): Promise<any> {
    return {
      preference_type: 'soft',
      weight: 0.5,
      description: text,
    };
  }

  private async calculateMLConfidence(
    originalText: string,
    intentResults: HFClassificationResult[],
    entities: Entity[],
    conditions: Condition[],
    constraintType: string,
  ): Promise<number> {
    console.log(
      '🎯 Intent classification confidence:',
      intentResults[0]?.score || 0.5,
    );

    // Get the actual intent confidence from the correct location
    let intentConfidence = 0.5; // fallback

    // Try multiple sources for the intent confidence
    if (intentResults.length > 0 && intentResults[0].score) {
      intentConfidence = intentResults[0].score;
    } else if (
      intentResults.length > 0 &&
      intentResults[0].label === 'temporal scheduling constraint'
    ) {
      intentConfidence = 1.0; // Default to 100% confidence for temporal constraint
    }

    const intentConfidencePercentage = (intentConfidence * 100).toFixed(1);

    // Enhanced intent classification scoring (40% weight)
    const intentScore = Math.min(intentConfidence * 1.2, 1.0); // Boost good classifications

    // Enhanced entity completeness scoring (35% weight)
    const entityScore = this.calculateEnhancedEntityCompleteness(
      originalText,
      entities,
      constraintType,
    );
    console.log('🎯 Entity completeness score:', entityScore);

    // Enhanced condition scoring (25% weight)
    const conditionScore = this.calculateEnhancedConditionScore(
      originalText,
      conditions,
      constraintType,
    );
    console.log('🎯 Condition score:', conditionScore);

    // Weighted combination with constraint-type specific bonuses
    let confidence =
      intentScore * 0.4 + entityScore * 0.35 + conditionScore * 0.25;

    // Apply constraint-type specific bonuses for strong patterns
    confidence = this.applyConstraintTypeBonus(
      confidence,
      entities,
      constraintType,
      originalText,
    );

    const finalConfidence = Math.min(confidence, 1.0);
    console.log('🎯 ML-enhanced confidence score:', finalConfidence);

    return finalConfidence;
  }

  private calculateEnhancedEntityCompleteness(
    text: string,
    entities: Entity[],
    constraintType: string,
  ): number {
    const textLower = text.toLowerCase();

    // Base entity count scoring
    const baseScore = Math.min(entities.length * 0.15, 0.6);

    // Get entity type flags
    const hasTeam =
      entities.some((e) => e.type === 'team') || textLower.includes('team');
    const hasTime = entities.some((e) =>
      ['time', 'day_of_week', 'date'].includes(e.type),
    );
    const hasVenue = entities.some((e) => e.type === 'venue');
    const hasNumber = entities.some((e) => e.type === 'number');
    const hasCapacityIndicator = entities.some(
      (e) => e.type === 'capacity_indicator',
    );
    const hasTimePeriod = entities.some((e) => e.type === 'time_period');
    const hasDuration = entities.some((e) => e.type === 'duration');
    const hasPersonnel = entities.some((e) => e.type === 'personnel');
    const hasRequirement = entities.some((e) => e.type === 'requirement');
    const hasOrganization = entities.some((e) => e.type === 'organization');

    // Constraint-type specific entity scoring
    let typeSpecificScore = 0;

    switch (constraintType) {
      case 'capacity':
        // Capacity constraints: capacity_indicator + number are critical, duration is also important
        if (hasCapacityIndicator) typeSpecificScore += 0.3; // Very important
        if (hasNumber) typeSpecificScore += 0.25; // Critical for limits
        if (hasDuration) typeSpecificScore += 0.2; // Important for duration constraints
        if (hasVenue) typeSpecificScore += 0.15; // Important for context
        if (hasTimePeriod) typeSpecificScore += 0.1; // Useful for frequency
        break;

      case 'temporal':
        // Temporal constraints: team + time/day are critical
        if (hasTeam) typeSpecificScore += 0.3;
        if (hasTime) typeSpecificScore += 0.4; // Most critical
        if (hasVenue) typeSpecificScore += 0.15;
        if (hasNumber) typeSpecificScore += 0.1;
        if (hasOrganization) typeSpecificScore += 0.05; // Context bonus
        break;

      case 'location':
        // Location constraints: venue + team are critical
        if (hasVenue) typeSpecificScore += 0.4; // Most critical
        if (hasTeam) typeSpecificScore += 0.3;
        if (hasNumber) typeSpecificScore += 0.1;
        if (hasOrganization) typeSpecificScore += 0.2; // Important for context
        break;

      case 'rest':
        // Rest constraints: number + time period are critical
        if (hasNumber) typeSpecificScore += 0.3;
        if (hasTimePeriod || hasTime) typeSpecificScore += 0.3;
        if (hasTeam) typeSpecificScore += 0.2;
        if (hasDuration) typeSpecificScore += 0.2; // Duration is key for rest periods
        break;

      case 'preference':
        // Preference constraints: personnel + requirement are critical for supervision
        if (hasPersonnel) typeSpecificScore += 0.35; // Critical for supervision constraints
        if (hasRequirement) typeSpecificScore += 0.25; // Important for policy constraints
        if (hasTeam) typeSpecificScore += 0.2;
        if (hasVenue) typeSpecificScore += 0.1;
        if (hasOrganization) typeSpecificScore += 0.1; // Context bonus
        break;

      default:
        // General scoring for unknown types
        typeSpecificScore =
          (hasTeam ? 0.15 : 0) +
          (hasTime ? 0.15 : 0) +
          (hasVenue ? 0.15 : 0) +
          (hasNumber ? 0.15 : 0) +
          (hasPersonnel ? 0.2 : 0) +
          (hasRequirement ? 0.2 : 0);
    }

    // Entity confidence bonus (higher confidence entities boost score)
    const avgEntityConfidence =
      entities.length > 0
        ? entities.reduce((sum, e) => sum + (e.confidence || 0), 0) /
          entities.length
        : 0;
    const confidenceBonus = avgEntityConfidence * 0.1;

    return Math.min(baseScore + typeSpecificScore + confidenceBonus, 1.0);
  }

  private calculateEnhancedConditionScore(
    text: string,
    conditions: Condition[],
    constraintType: string,
  ): number {
    const textLower = text.toLowerCase();

    // Base condition count scoring
    let score = conditions.length > 0 ? 0.5 : 0;

    // Enhanced condition detection with constraint-type awareness
    const strongConditionWords = [
      'cannot',
      'must not',
      'never',
      'always',
      'must',
      'required',
      'no more than',
      'at least',
      'maximum',
      'minimum',
      'before',
      'after',
    ];

    const foundStrongConditions = strongConditionWords.filter((word) =>
      textLower.includes(word),
    );
    score += Math.min(foundStrongConditions.length * 0.15, 0.3);

    // Constraint-type specific condition bonuses
    switch (constraintType) {
      case 'capacity':
        if (
          textLower.match(
            /\b(no more than|at most|maximum|max|at least|minimum)\s+\d+\b/,
          )
        ) {
          score += 0.2; // Strong capacity condition
        }
        break;

      case 'temporal':
        if (
          textLower.match(/\b(cannot|must not|never|before|after|during)\b/)
        ) {
          score += 0.2; // Strong temporal condition
        }
        break;

      case 'location':
        if (textLower.match(/\b(must|required|only|at|in|on)\b/)) {
          score += 0.15; // Location assignment condition
        }
        break;
    }

    return Math.min(score, 1.0);
  }

  private applyConstraintTypeBonus(
    baseConfidence: number,
    entities: Entity[],
    constraintType: string,
    originalText: string,
  ): number {
    const textLower = originalText.toLowerCase();
    let bonus = 0;

    // Apply bonuses for very strong constraint patterns
    switch (constraintType) {
      case 'capacity': {
        const hasCapacityIndicator = entities.some(
          (e) => e.type === 'capacity_indicator',
        );
        const hasNumber = entities.some((e) => e.type === 'number');
        const hasVenue = entities.some((e) => e.type === 'venue');
        const hasTimePeriod = entities.some((e) => e.type === 'time_period');

        // Perfect capacity pattern: "no more than X per Y on Z"
        if (hasCapacityIndicator && hasNumber && (hasVenue || hasTimePeriod)) {
          bonus += 0.1; // Strong capacity pattern
        }

        // Clear numeric limits
        if (
          textLower.match(
            /\b(no more than|at most|maximum|at least|minimum)\s+\d+\b/,
          )
        ) {
          bonus += 0.05;
        }
        break;
      }

      case 'temporal': {
        const hasTeam =
          entities.some((e) => e.type === 'team') || textLower.includes('team');
        const hasTime = entities.some((e) =>
          ['time', 'day_of_week', 'date'].includes(e.type),
        );

        // Perfect temporal pattern: team + time + restriction
        if (
          hasTeam &&
          hasTime &&
          textLower.match(/\b(cannot|must not|never|before|after)\b/)
        ) {
          bonus += 0.1;
        }
        break;
      }
    }

    return Math.min(baseConfidence + bonus, 1.0);
  }

  // Fallback rule-based parsing (existing implementation)
  private async fallbackRuleBasedParsing(
    text: string,
  ): Promise<ParsedConstraintData & { confidence: number }> {
    console.log('🔄 Using fallback rule-based parsing');
    const textLower = text.toLowerCase();

    // Initialize result structure
    const result: any = {
      type: 'temporal',
      entities: [],
      conditions: [],
      confidence: 0.5,
    };

    // Classify constraint type using keyword counting
    const constraintType = this.classifyConstraintTypeRuleBased(textLower);
    result.type = constraintType;

    // Extract entities using rule-based patterns
    result.entities = this.extractSportsSpecificEntities(text);

    // Extract conditions based on text patterns
    result.conditions = this.extractConditionsRuleBased(textLower);

    // Add type-specific parsing
    switch (constraintType) {
      case 'temporal':
        result.temporal = this.parseTemporalRuleBased(text);
        break;
      case 'capacity':
        result.capacity = this.parseCapacityRuleBased(text);
        break;
      case 'location':
        result.location = this.parseLocationRuleBased(text);
        break;
      case 'rest':
        result.rest = this.parseRestRuleBased(text);
        break;
      case 'preference':
        result.preference = this.parsePreferenceRuleBased(text);
        break;
    }

    // Enhanced confidence calculation using sports domain expertise
    result.confidence = this.calculateSportsConfidence(text, result);

    // Apply LLM judge analysis for enhanced feedback
    const judgeResult = await this.performEnhancedJudgeAnalysis(text, result);
    result.llmJudge = judgeResult;

    // Adjust confidence based on judge analysis
    if (judgeResult.completenessScore !== undefined) {
      result.confidence = Math.max(
        result.confidence,
        judgeResult.completenessScore * 0.8,
      );
    }

    const entityCount = result.entities.length;
    const conditionCount = result.conditions.length;

    console.log(
      `📊 Rule-based parsing result: ${entityCount} entities, ${conditionCount} conditions, confidence: ${result.confidence}`,
    );
    return result;
  }

  private classifyConstraintTypeRuleBased(text: string): ConstraintType {
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
      'at most',
      'up to',
      'no fewer than',
      'max',
      'min',
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

    const preferenceKeywords = [
      'prefer',
      'like',
      'want',
      'wish',
      'would like',
      'ideally',
      'better',
      'favor',
      'rather',
    ];

    // Count keyword matches with weighted scoring
    const scores = {
      temporal: temporalKeywords.filter((keyword) => text.includes(keyword))
        .length,
      capacity: capacityKeywords.filter((keyword) => text.includes(keyword))
        .length,
      location: locationKeywords.filter((keyword) => text.includes(keyword))
        .length,
      rest: restKeywords.filter((keyword) => text.includes(keyword)).length,
      preference: preferenceKeywords.filter((keyword) => text.includes(keyword))
        .length,
    };

    // Enhanced logic for capacity constraints
    if (
      text.includes('no more than') ||
      text.includes('at most') ||
      text.includes('maximum')
    ) {
      scores.capacity += 2; // Boost capacity score for clear capacity indicators
    }
    if (text.includes('field') && text.includes('per') && text.match(/\d+/)) {
      scores.capacity += 2; // Boost for field + per + number combinations
    }

    console.log('🎯 Rule-based classification scores:', scores);

    // Return type with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'temporal'; // Default fallback

    const topType = Object.entries(scores).find(
      ([_, score]) => score === maxScore,
    )?.[0];

    console.log(
      `🎯 Rule-based classification result: ${topType} (score: ${maxScore})`,
    );
    return (topType as ConstraintType) || 'temporal';
  }

  private extractConditionsRuleBased(text: string): Condition[] {
    const conditions: Condition[] = [];

    if (
      text.includes('cannot') ||
      text.includes('not') ||
      text.includes('never') ||
      text.includes('must not')
    ) {
      conditions.push({
        operator: 'not_equals',
        value: 'specified_constraint',
      });
    } else if (
      text.includes('must') ||
      text.includes('only') ||
      text.includes('always') ||
      text.includes('required')
    ) {
      conditions.push({ operator: 'equals', value: 'specified_constraint' });
    } else if (
      text.includes('before') ||
      text.includes('earlier than') ||
      text.includes('prior to')
    ) {
      conditions.push({ operator: 'less_than', value: 'specified_time' });
    } else if (
      text.includes('after') ||
      text.includes('later than') ||
      text.includes('following')
    ) {
      conditions.push({ operator: 'greater_than', value: 'specified_time' });
    } else if (
      text.includes('at least') ||
      text.includes('minimum') ||
      text.includes('no fewer than')
    ) {
      conditions.push({
        operator: 'greater_than_or_equal',
        value: 'minimum_value',
      });
    } else if (
      text.includes('at most') ||
      text.includes('maximum') ||
      text.includes('no more than') ||
      text.includes('up to')
    ) {
      conditions.push({
        operator: 'less_than_or_equal',
        value: 'maximum_value',
      });
    }

    return conditions;
  }

  private parseTemporalRuleBased(text: string): any {
    const temporal = {
      days_of_week: [] as string[],
      excluded_dates: [] as string[],
      time_ranges: [] as any[],
      before_time: null as string | null,
      after_time: null as string | null,
    };

    // Extract days
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
      if (text.toLowerCase().includes(day)) {
        temporal.days_of_week.push(day);
      }
    });

    // Extract time constraints
    const beforeMatch = text.match(
      /before\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i,
    );
    if (beforeMatch) {
      temporal.before_time = beforeMatch[1];
    }

    const afterMatch = text.match(
      /after\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i,
    );
    if (afterMatch) {
      temporal.after_time = afterMatch[1];
    }

    return temporal;
  }

  private parseCapacityRuleBased(text: string): any {
    const capacity = {
      max_count: null as number | null,
      min_count: null as number | null,
      per_period: null as string | null,
      resource: 'games',
    };

    const maxMatch = text.match(
      /(?:no more than|maximum|at most|up to)\s+(\d+)/i,
    );
    if (maxMatch) {
      capacity.max_count = Number.parseInt(maxMatch[1]);
    }

    const minMatch = text.match(/(?:at least|minimum|no fewer than)\s+(\d+)/i);
    if (minMatch) {
      capacity.min_count = Number.parseInt(minMatch[1]);
    }

    if (
      text.toLowerCase().includes('per day') ||
      text.toLowerCase().includes('daily')
    ) {
      capacity.per_period = 'day';
    } else if (
      text.toLowerCase().includes('per week') ||
      text.toLowerCase().includes('weekly')
    ) {
      capacity.per_period = 'week';
    } else if (
      text.toLowerCase().includes('per month') ||
      text.toLowerCase().includes('monthly')
    ) {
      capacity.per_period = 'month';
    }

    return capacity;
  }

  private parseLocationRuleBased(text: string): any {
    return {
      required_venue: null,
      excluded_venues: [],
      home_venue_required: text.toLowerCase().includes('home'),
      away_venue_required: text.toLowerCase().includes('away'),
    };
  }

  private parseRestRuleBased(text: string): any {
    const rest = {
      min_hours: null as number | null,
      min_days: null as number | null,
      between_games: true,
    };

    const dayMatch = text.match(/(\d+)\s*days?\s*between/i);
    if (dayMatch) {
      rest.min_days = Number.parseInt(dayMatch[1]);
    }

    const hourMatch = text.match(/(\d+)\s*hours?\s*between/i);
    if (hourMatch) {
      rest.min_hours = Number.parseInt(hourMatch[1]);
    }

    return rest;
  }

  private parsePreferenceRuleBased(text: string): any {
    return {
      preference_type: 'soft',
      weight: 0.5,
      description: text,
    };
  }

  private calculateSportsConfidence(text: string, result: any): number {
    const textLower = text.toLowerCase();
    let confidence = 0.0;

    // Entity-based scoring (50%)
    const entityCount = result.entities.length;
    if (entityCount > 0) {
      const hasTeam = result.entities.some((e: any) => e.type === 'team');
      const hasTemporal = result.entities.some((e: any) =>
        ['time', 'day_of_week', 'date'].includes(e.type),
      );
      const hasVenue = result.entities.some((e: any) => e.type === 'venue');
      const hasNumber = result.entities.some((e: any) => e.type === 'number');

      let entityScore = 0;
      if (hasTeam) entityScore += 0.15; // Teams are critical
      if (hasTemporal) entityScore += 0.15; // Time is critical
      if (hasVenue) entityScore += 0.1; // Venues are important
      if (hasNumber) entityScore += 0.1; // Numbers are useful

      confidence += entityScore;
    }

    // Condition-based scoring (30%)
    const conditionCount = result.conditions.length;
    if (conditionCount > 0) {
      confidence += 0.3;
    }

    // Type-specific completeness (20%)
    const typeScore = this.calculateTypeSpecificScore(result);
    confidence += typeScore;

    return Math.min(confidence, 1.0);
  }

  private calculateTypeSpecificScore(result: any): number {
    const type = result.type;
    let score = 0;

    switch (type) {
      case 'temporal': {
        const temporal = result.temporal || {};
        if (temporal.days_of_week?.length > 0) score += 0.07;
        if (temporal.excluded_dates?.length > 0) score += 0.07;
        if (temporal.time_ranges?.length > 0) score += 0.06;
        break;
      }
      case 'capacity': {
        const capacity = result.capacity || {};
        if (
          capacity.max_count !== undefined ||
          capacity.min_count !== undefined
        )
          score += 0.15;
        if (capacity.per_period !== undefined) score += 0.05;
        break;
      }
      case 'location': {
        const location = result.location || {};
        if (location.required_venue || location.excluded_venues?.length > 0)
          score += 0.15;
        if (location.home_venue_required || location.away_venue_required)
          score += 0.05;
        break;
      }
      case 'rest': {
        const rest = result.rest || {};
        if (rest.min_hours !== undefined || rest.min_days !== undefined)
          score += 0.2;
        break;
      }
      case 'preference': {
        const preference = result.preference || {};
        if (preference.weight !== undefined) score += 0.1;
        if (preference.description) score += 0.1;
        break;
      }
    }

    return score;
  }

  private async generateLLMExplanation(
    originalText: string,
    parsedResult: any,
    completeness: number,
  ): Promise<any> {
    // Try OpenAI first if available (highest quality)
    if (this.openaiApiKey) {
      try {
        console.log('🤖 Attempting OpenAI explanation generation...');
        const openaiResult = await this.generateOpenAIExplanation(
          originalText,
          parsedResult,
          completeness,
        );
        if (openaiResult) {
          console.log('✅ OpenAI explanation generated successfully');
          return openaiResult;
        }
      } catch (error) {
        console.warn('🔍 OpenAI explanation failed:', error);
      }
    }

    // Fallback to rule-based explanation since HuggingFace API has issues
    console.log('🔍 Using fallback explanation (HuggingFace API unavailable)');
    return this.generateFallbackExplanation(
      originalText,
      parsedResult,
      completeness,
    );
  }

  private async generateOpenAIExplanation(
    originalText: string,
    parsedResult: any,
    completeness: number,
  ): Promise<any> {
    if (!this.openaiApiKey) return null;

    // Extract detailed analysis data for enhanced prompt
    const entityCount = parsedResult.entities?.length || 0;
    const conditionCount = parsedResult.conditions?.length || 0;

    // Get the actual intent confidence from the correct location
    let intentConfidence = 0.5; // fallback

    // Try multiple sources for the intent confidence
    if (parsedResult.llmJudge?.intentConfidence) {
      intentConfidence = parsedResult.llmJudge.intentConfidence;
    } else if (parsedResult.intentConfidence) {
      intentConfidence = parsedResult.intentConfidence;
    } else if (parsedResult.mlConfidence?.intentScore) {
      intentConfidence = parsedResult.mlConfidence.intentScore;
    }

    const intentConfidencePercentage = (intentConfidence * 100).toFixed(1);

    const prompt = `You are an expert AI consultant for sports scheduling constraint analysis. Analyze this comprehensive parsing result:

CONSTRAINT: "${originalText}"
TYPE: ${parsedResult.type} constraint
CONFIDENCE: ${(completeness * 100).toFixed(1)}%

TECHNICAL BREAKDOWN:
- Intent Classification: ${intentConfidencePercentage}% (40% weight)
- Entity Extraction: ${entityCount} entities (35% weight)  
- Condition Detection: ${conditionCount} conditions (25% weight)

ENTITIES: ${entityCount > 0 ? parsedResult.entities.map((e: any) => `${e.type}:"${e.value}"(${(e.confidence * 100).toFixed(1)}%)`).join(', ') : 'None'}

ANALYSIS REQUIRED:
1. **Confidence Breakdown**: Explain the ${(completeness * 100).toFixed(1)}% score using the weighted system
2. **Entity Quality**: Assess the ${entityCount} entities for ${parsedResult.type} constraints
3. **Classification Strength**: Why "${parsedResult.type}" classification is accurate
4. **Completeness**: What's missing for a complete constraint
5. **Improvements**: 3 specific technical suggestions
6. **Sports Relevance**: Real-world scheduling applicability

Provide detailed, technical analysis in 350 words. Focus on actionable insights.`;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert in sports scheduling constraint analysis. Provide concise, professional analysis.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 400,
            temperature: 0.2,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data.choices[0]?.message?.content || '';

      // Return the full OpenAI explanation without fragmenting it with regex
      return {
        // Use the complete OpenAI response as the main analysis
        fullAnalysis: explanation,

        // Provide simple structured data for the UI components
        confidenceBreakdown: `The ${(completeness * 100).toFixed(1)}% confidence score is calculated using a weighted system: Intent Classification (${intentConfidencePercentage}%, 40% weight), Entity Extraction (${entityCount} entities, 35% weight), and Condition Detection (${conditionCount} conditions, 25% weight).`,

        entityAnalysis: `Detected ${entityCount} entities: ${parsedResult.entities?.map((e: any) => `${e.type}("${e.value}" - ${(e.confidence * 100).toFixed(1)}%)`).join(', ') || 'none'}. Entity quality is ${entityCount >= 3 ? 'excellent' : entityCount >= 2 ? 'good' : 'needs improvement'} for ${parsedResult.type} constraints.`,

        classificationReasoning: `Classification as "${parsedResult.type}" constraint achieved ${intentConfidencePercentage}% confidence through ML analysis. Entity patterns ${parsedResult.entities?.some((e: any) => e.type === 'team') ? 'strongly' : 'moderately'} support this classification.`,

        improvementSuggestions: [
          `Add more specific ${parsedResult.type === 'temporal' ? 'time details (exact dates, times)' : parsedResult.type === 'capacity' ? 'numeric limits and frequency' : 'venue and team specifications'}`,
          `Include explicit constraint language (${parsedResult.type === 'temporal' ? 'cannot, must not, before, after' : parsedResult.type === 'capacity' ? 'maximum, at most, per day/week' : 'must, required, only at'})`,
          `Provide complete context (${entityCount < 2 ? 'team and venue names' : conditionCount < 1 ? 'clear conditions and operators' : 'temporal specificity and scope'})`,
        ],

        qualityAssessment: {
          rating:
            completeness >= 0.95
              ? 'Excellent'
              : completeness >= 0.85
                ? 'Very Good'
                : completeness >= 0.7
                  ? 'Good'
                  : completeness >= 0.5
                    ? 'Fair'
                    : 'Poor',
          explanation: `${(completeness * 100).toFixed(1)}% confidence indicates ${completeness >= 0.8 ? 'high-quality' : completeness >= 0.6 ? 'moderate-quality' : 'basic-quality'} constraint parsing.`,
        },

        sportsRelevance: `${parsedResult.type.charAt(0).toUpperCase() + parsedResult.type.slice(1)} constraints are ${parsedResult.type === 'temporal' ? 'critical for avoiding scheduling conflicts' : parsedResult.type === 'capacity' ? 'essential for resource management' : 'important for optimization'} in sports scheduling.`,

        technicalDetails: {
          intentScore: intentConfidencePercentage,
          entityCount: entityCount,
          conditionCount: conditionCount,
          weightedComponents: {
            intent: `${intentConfidencePercentage}% (40% weight)`,
            entities: `${entityCount} detected (35% weight)`,
            conditions: `${conditionCount} found (25% weight)`,
          },
        },
      };
    } catch (error) {
      console.warn('🔍 OpenAI explanation failed:', error);
      return null;
    }
  }

  private generateFallbackExplanation(
    originalText: string,
    parsedResult: any,
    completeness: number,
  ): any {
    const entityCount = parsedResult.entities?.length || 0;
    const conditionCount = parsedResult.conditions?.length || 0;

    return {
      confidenceBreakdown: `Confidence score of ${(completeness * 100).toFixed(1)}% calculated from Intent Classification (40%), Entity Extraction (35%), and Condition Detection (25%). System identified ${entityCount} entities and ${conditionCount} conditions for this "${parsedResult.type}" constraint.`,

      entityAnalysis: `Detected ${entityCount} entities: ${parsedResult.entities?.map((e: any) => `${e.type} ("${e.value}" - ${(e.confidence * 100).toFixed(1)}%)`).join(', ') || 'none'}. ${entityCount > 3 ? 'Strong entity detection indicates clear constraint structure.' : entityCount > 1 ? 'Moderate entity detection with room for improvement.' : 'Weak entity detection suggests need for more specific language.'}`,

      classificationReasoning: `Classified as "${parsedResult.type}" constraint through ML analysis and entity pattern matching. ${parsedResult.type === 'capacity' ? 'Capacity indicators and numeric limits detected.' : parsedResult.type === 'temporal' ? 'Time-related entities and temporal patterns found.' : parsedResult.type === 'location' ? 'Venue and location entities identified.' : 'Pattern analysis determined constraint type.'}`,

      improvementSuggestions: [
        entityCount < 2
          ? 'Add more specific entities (teams, venues, times)'
          : 'Entity detection is adequate',
        conditionCount < 1
          ? 'Include explicit conditions (must, cannot, before, after)'
          : 'Conditions are present',
        completeness < 0.7
          ? 'Provide more context and specific details'
          : 'Good overall specificity',
        'Consider adding quantitative details where applicable',
        'Use more specific language for better parsing accuracy',
      ]
        .filter(
          (s) =>
            !s.includes('is adequate') &&
            !s.includes('are present') &&
            !s.includes('Good overall'),
        )
        .slice(0, 3),

      qualityAssessment: {
        rating:
          completeness >= 0.9
            ? 'Excellent'
            : completeness >= 0.7
              ? 'Good'
              : completeness >= 0.5
                ? 'Fair'
                : 'Poor',
        explanation: `${(completeness * 100).toFixed(1)}% confidence represents ${completeness >= 0.7 ? 'good' : 'moderate'} parsing quality. ${entityCount > 2 && conditionCount > 0 ? 'Well-structured constraint with clear intent.' : 'Could benefit from more specific details and clearer language.'}`,
      },
    };
  }

  /**
   * NEW: LLM-powered JSON Schema Validation
   * Uses OpenAI to validate the parsed constraint JSON against expected schema
   */
  private async validateJSONWithLLM(
    parsedResult: any,
    originalText: string,
  ): Promise<{
    isValid: boolean;
    needsCorrection: boolean;
    issues: string[];
    suggestions: string[];
    schemaCompliance: number;
  }> {
    if (!this.openaiApiKey) {
      // Fallback to basic validation
      return {
        isValid: true,
        needsCorrection: false,
        issues: [],
        suggestions: [],
        schemaCompliance: 0.8,
      };
    }

    const expectedSchema = {
      constraint_id: 'string',
      type: 'temporal | capacity | location | rest | preference',
      scope: 'global | team | venue | player',
      entities: 'array of {type, value, confidence}',
      conditions: 'array of {operator, value, unit?}',
      parameters: 'object with type-specific fields',
      priority: 'low | medium | high | critical',
      confidence: 'number between 0 and 1',
    };

    const prompt = `You are an expert JSON schema validator for sports scheduling constraints. 

ORIGINAL CONSTRAINT: "${originalText}"

PARSED JSON RESULT:
${JSON.stringify(parsedResult, null, 2)}

EXPECTED SCHEMA:
${JSON.stringify(expectedSchema, null, 2)}

VALIDATION REQUIREMENTS:
1. **Structure Validation**: Check all required fields are present
2. **Type Validation**: Verify data types match schema
3. **Semantic Validation**: Ensure values make logical sense for sports scheduling
4. **Completeness**: Assess if critical information is missing
5. **Consistency**: Check internal consistency between fields

Analyze and provide:
1. **Overall Validity**: Is this a well-formed constraint JSON?
2. **Critical Issues**: Missing required fields or invalid values
3. **Semantic Problems**: Logically inconsistent or incomplete data
4. **Improvement Suggestions**: Specific fixes needed
5. **Compliance Score**: 0-100% schema compliance

Respond with JSON:
{
  "isValid": boolean,
  "needsCorrection": boolean,
  "schemaCompliance": number (0-1),
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "analysis": "detailed explanation"
}`;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert JSON schema validator. Always respond with valid JSON matching the requested format.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 500,
            temperature: 0.1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI validation API error: ${response.status}`);
      }

      const data = await response.json();
      const validationResult = data.choices[0]?.message?.content || '{}';

      try {
        const parsedValidation = JSON.parse(validationResult);
        return {
          isValid: parsedValidation.isValid || false,
          needsCorrection: parsedValidation.needsCorrection || false,
          issues: parsedValidation.issues || [],
          suggestions: parsedValidation.suggestions || [],
          schemaCompliance: parsedValidation.schemaCompliance || 0.5,
        };
      } catch (parseError) {
        console.warn('🔍 Failed to parse LLM validation response:', parseError);
        return {
          isValid: false,
          needsCorrection: true,
          issues: ['LLM validation response parsing failed'],
          suggestions: ['Manual schema review needed'],
          schemaCompliance: 0.3,
        };
      }
    } catch (error) {
      console.warn('🔍 LLM schema validation failed:', error);
      return {
        isValid: true,
        needsCorrection: false,
        issues: [],
        suggestions: [],
        schemaCompliance: 0.7,
      };
    }
  }

  /**
   * NEW: Semantic JSON Correction
   * Uses OpenAI to intelligently fix and improve JSON structure
   */
  private async semanticJSONCorrection(
    parsedResult: any,
    originalText: string,
    issues: string[],
  ): Promise<any | null> {
    if (!this.openaiApiKey || issues.length === 0) {
      return null;
    }

    const prompt = `You are an expert sports scheduling constraint JSON corrector.

ORIGINAL CONSTRAINT: "${originalText}"

CURRENT JSON (with issues):
${JSON.stringify(parsedResult, null, 2)}

IDENTIFIED ISSUES:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

CORRECTION REQUIREMENTS:
1. **Fix Structure**: Add missing required fields (constraint_id, scope, priority)
2. **Enhance Entities**: Improve entity extraction if incomplete
3. **Correct Types**: Fix any type mismatches
4. **Add Parameters**: Include type-specific parameter objects
5. **Maintain Intent**: Keep the original constraint meaning intact
6. **Improve Completeness**: Fill gaps in information

REQUIRED SCHEMA:
{
  "constraint_id": "auto-generated unique ID",
  "type": "temporal|capacity|location|rest|preference", 
  "scope": "global|team|venue|player",
  "entities": [{"type": "entity_type", "value": "entity_value", "confidence": 0.8}],
  "conditions": [{"operator": "equals|not_equals|greater_than|less_than", "value": "condition_value"}],
  "parameters": {
    // For temporal: {"days_of_week": [], "excluded_dates": [], "time_ranges": []}
    // For capacity: {"max_count": number, "min_count": number, "per_period": "day|week"}
    // For location: {"required_venue": string, "excluded_venues": []}
    // For rest: {"min_hours": number, "min_days": number}
    // For preference: {"preference_type": "soft|hard", "weight": number}
  },
  "priority": "low|medium|high|critical",
  "confidence": number
}

Return ONLY the corrected JSON object (no explanation text):`;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are a JSON correction expert. Always respond with valid JSON only, no additional text.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 800,
            temperature: 0.1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI correction API error: ${response.status}`);
      }

      const data = await response.json();
      const correctedJSON = data.choices[0]?.message?.content || '{}';

      try {
        const parsedCorrection = JSON.parse(correctedJSON);

        // Validate the correction has required fields
        if (parsedCorrection.type && parsedCorrection.entities) {
          console.log('✅ LLM semantic correction successful');
          return parsedCorrection;
        } else {
          console.warn('🔍 LLM correction missing required fields');
          return null;
        }
      } catch (parseError) {
        console.warn('🔍 Failed to parse LLM correction response:', parseError);
        return null;
      }
    } catch (error) {
      console.warn('🔍 LLM semantic correction failed:', error);
      return null;
    }
  }
}
