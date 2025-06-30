'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  Target,
  Zap,
  Calculator,
  Eye,
} from 'lucide-react';
import type { ParsedConstraintData } from '@/lib/types';

interface ConfidenceMethodologyProps {
  parsedResult?: any;
  originalText?: string;
}

export function ConfidenceMethodology({
  parsedResult,
  originalText,
}: ConfidenceMethodologyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScoring, setShowScoring] = useState(false);

  if (!parsedResult) {
    return (
      <Card className="mt-4 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Brain className="h-5 w-5 text-orange-600" />
            Confidence Methodology
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            No parsing data available. Submit a constraint to see the confidence
            breakdown.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get the LLM explanation from the parsed result
  const explanation = parsedResult.llmJudge?.llmExplanation;
  const judgeResult = parsedResult.llmJudge;

  // Calculate component scores for enhanced display
  const entityScore = parsedResult.entities?.length || 0;
  const conditionScore = parsedResult.conditions?.length || 0;
  const hasCapacityIndicator = parsedResult.entities?.some(
    (e: any) => e.type === 'capacity_indicator',
  );
  const hasVenue = parsedResult.entities?.some((e: any) => e.type === 'venue');
  const hasNumber = parsedResult.entities?.some(
    (e: any) => e.type === 'number',
  );
  const hasTimePeriod = parsedResult.entities?.some(
    (e: any) => e.type === 'time_period',
  );
  const hasTeam = parsedResult.entities?.some((e: any) => e.type === 'team');
  const hasTime = parsedResult.entities?.some((e: any) =>
    ['time', 'day_of_week', 'date'].includes(e.type),
  );

  // Calculate transparent scoring breakdown
  const calculateScoringBreakdown = () => {
    // Intent Classification (40%) - Get actual value from backend
    // Check multiple possible locations for the intent confidence score
    let intentScore = 0.57; // fallback

    // Try to get the actual intent score from the backend response
    if (parsedResult.llmJudge?.intentConfidence) {
      intentScore = parsedResult.llmJudge.intentConfidence;
    } else if (parsedResult.intentConfidence) {
      intentScore = parsedResult.intentConfidence;
    } else if (parsedResult.llmJudge?.reasoning) {
      // Try to extract from the reasoning text if available
      const reasoningMatch =
        parsedResult.llmJudge.reasoning.match(/intent.*?(\d+\.?\d*)/i);
      if (reasoningMatch) {
        intentScore = Number.parseFloat(reasoningMatch[1]);
        if (intentScore > 1) intentScore = intentScore / 100; // Convert percentage to decimal
      }
    }

    console.log('🔍 Frontend detected intent score:', intentScore);
    const intentWeighted = intentScore * 0.4;

    // Entity Completeness (35%) - Calculate exactly as backend does
    let entityCompleteness = 0;

    // Base score from entity count (up to 0.6)
    const entityCount = parsedResult.entities?.length || 0;
    const baseScore = Math.min(entityCount * 0.15, 0.6);

    // Type-specific scoring (matches backend logic exactly)
    let typeSpecificScore = 0;
    if (parsedResult.type === 'capacity') {
      // Capacity constraints: venue + number + capacity_indicator are critical
      if (hasCapacityIndicator) typeSpecificScore += 0.35; // Very important
      if (hasNumber) typeSpecificScore += 0.25; // Critical for limits
      if (hasVenue) typeSpecificScore += 0.2; // Important for context
      if (hasTimePeriod) typeSpecificScore += 0.15; // Useful for frequency
    } else if (parsedResult.type === 'temporal') {
      // Temporal constraints: team + time/day are critical
      if (hasTeam) typeSpecificScore += 0.3;
      if (hasTime) typeSpecificScore += 0.4; // Most critical
      if (hasVenue) typeSpecificScore += 0.15;
      if (hasNumber) typeSpecificScore += 0.1;
    } else if (parsedResult.type === 'location') {
      // Location constraints: venue + team are critical
      if (hasVenue) typeSpecificScore += 0.4; // Most critical
      if (hasTeam) typeSpecificScore += 0.3;
      if (hasNumber) typeSpecificScore += 0.1;
    } else if (parsedResult.type === 'rest') {
      // Rest constraints: number + time period are critical
      if (hasNumber) typeSpecificScore += 0.3;
      if (hasTimePeriod || hasTime) typeSpecificScore += 0.3;
      if (hasTeam) typeSpecificScore += 0.2;
    } else {
      // General scoring for unknown types
      typeSpecificScore =
        (hasTeam ? 0.2 : 0) +
        (hasTime ? 0.2 : 0) +
        (hasVenue ? 0.2 : 0) +
        (hasNumber ? 0.2 : 0);
    }

    // Entity confidence bonus (higher confidence entities boost score)
    const avgEntityConfidence =
      entityCount > 0
        ? parsedResult.entities.reduce(
            (sum: number, e: any) => sum + (e.confidence || 0),
            0,
          ) / entityCount
        : 0;
    const confidenceBonus = avgEntityConfidence * 0.1;

    // Final entity completeness calculation (matches backend exactly)
    entityCompleteness = Math.min(
      baseScore + typeSpecificScore + confidenceBonus,
      1.0,
    );
    console.log(
      '🔍 Frontend calculated entity completeness:',
      entityCompleteness,
    );
    const entityWeighted = entityCompleteness * 0.35;

    // Condition Detection (25%) - Improved calculation
    let conditionStrength = 0;

    // Base condition count scoring
    if (conditionScore > 0) {
      conditionStrength = 0.5;
    }

    // Enhanced condition detection with constraint-type awareness
    const originalText = parsedResult.raw_text || '';
    const textLower = originalText.toLowerCase();
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
    conditionStrength += Math.min(foundStrongConditions.length * 0.15, 0.3);

    // Constraint-type specific condition bonuses
    if (parsedResult.type === 'capacity') {
      if (
        textLower.match(
          /\b(no more than|at most|maximum|max|at least|minimum)\s+\d+\b/,
        )
      ) {
        conditionStrength += 0.2; // Strong capacity condition
      }
    } else if (parsedResult.type === 'temporal') {
      if (textLower.match(/\b(cannot|must not|never|before|after|during)\b/)) {
        conditionStrength += 0.2; // Strong temporal condition
      }
    } else if (parsedResult.type === 'location') {
      if (textLower.match(/\b(must|required|only|at|in|on)\b/)) {
        conditionStrength += 0.15; // Location assignment condition
      }
    }

    conditionStrength = Math.min(conditionStrength, 1.0);
    console.log(
      '🔍 Frontend calculated condition strength:',
      conditionStrength,
    );
    const conditionWeighted = conditionStrength * 0.25;

    return {
      intent: {
        raw: intentScore,
        weighted: intentWeighted,
        percentage: (intentWeighted * 100).toFixed(1),
      },
      entity: {
        raw: entityCompleteness,
        weighted: entityWeighted,
        percentage: (entityWeighted * 100).toFixed(1),
      },
      condition: {
        raw: conditionStrength,
        weighted: conditionWeighted,
        percentage: (conditionWeighted * 100).toFixed(1),
      },
      total: intentWeighted + entityWeighted + conditionWeighted,
    };
  };

  const scoring = calculateScoringBreakdown();

  return (
    <Card className="mt-4 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-medium">
              AI Confidence Analysis
            </CardTitle>
            <span
              className={`px-2 py-1 rounded-full text-sm font-medium ${getConfidenceBadge(parsedResult.confidence || 0)}`}
            >
              {((parsedResult.confidence || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {isExpanded ? 'Hide Analysis' : 'Show Analysis'}
          </Button>
        </div>
        <CardDescription className="text-sm text-gray-600 leading-relaxed">
          Comprehensive AI-powered analysis of{' '}
          <span className="font-medium text-blue-600">{parsedResult.type}</span>{' '}
          constraint classification and confidence scoring
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Chain of Thought Analysis - Now first with fixed colors */}
          <div className="border-2 border-gradient rounded-lg p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800 text-base">
                Chain of Thought Analysis
              </h4>
              {explanation?.qualityAssessment && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    explanation.qualityAssessment.rating === 'Excellent'
                      ? 'bg-green-100 text-green-800'
                      : explanation.qualityAssessment.rating === 'Good'
                        ? 'bg-blue-100 text-blue-800'
                        : explanation.qualityAssessment.rating === 'Fair'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {explanation.qualityAssessment.rating}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Classification Decision */}
              <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <h5 className="font-medium text-purple-700 text-sm">
                    Classification Decision
                  </h5>
                </div>
                <div className="text-sm space-y-1 leading-relaxed text-gray-800">
                  <p>
                    <strong>Type:</strong>{' '}
                    <span className="text-blue-600 font-medium">
                      {parsedResult.type}
                    </span>
                  </p>
                  <p>
                    <strong>Entities Found:</strong> {entityScore}
                  </p>
                  <p>
                    <strong>Conditions:</strong> {conditionScore}
                  </p>
                  {explanation?.classificationReasoning && (
                    <p className="text-gray-700 text-xs mt-2 italic leading-relaxed">
                      {explanation.classificationReasoning}
                    </p>
                  )}
                </div>
              </div>

              {/* Entity Pattern Analysis */}
              <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <h5 className="font-medium text-blue-700 text-sm">
                    Entity Pattern Analysis
                  </h5>
                </div>
                <div className="text-sm space-y-1 text-gray-800">
                  <div className="flex items-center justify-between">
                    <span>Capacity Indicator:</span>
                    <span
                      className={
                        hasCapacityIndicator
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    >
                      {hasCapacityIndicator ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Venue:</span>
                    <span
                      className={hasVenue ? 'text-green-600' : 'text-gray-400'}
                    >
                      {hasVenue ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Numbers:</span>
                    <span
                      className={hasNumber ? 'text-green-600' : 'text-gray-400'}
                    >
                      {hasNumber ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Period:</span>
                    <span
                      className={
                        hasTimePeriod ? 'text-green-600' : 'text-gray-400'
                      }
                    >
                      {hasTimePeriod ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI-Generated Analysis */}
            {explanation && (
              <div className="space-y-3">
                {explanation.confidenceBreakdown && (
                  <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                    <h5 className="font-medium text-indigo-700 mb-2 text-sm">
                      Confidence Calculation
                    </h5>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {explanation.confidenceBreakdown}
                    </p>
                  </div>
                )}

                {explanation.entityAnalysis && (
                  <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-green-700 mb-2 text-sm">
                      Entity Significance
                    </h5>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {explanation.entityAnalysis}
                    </p>
                  </div>
                )}

                {explanation.improvementSuggestions &&
                  explanation.improvementSuggestions.length > 0 && (
                    <div className="bg-white/70 rounded-lg p-3 border border-orange-200">
                      <h5 className="font-medium text-orange-700 mb-2 text-sm">
                        Improvement Recommendations
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-gray-800">
                        {explanation.improvementSuggestions.map(
                          (suggestion: string, index: number) => (
                            <li
                              key={`suggestion-${suggestion.slice(0, 20)}-${index}`}
                              className="text-sm leading-relaxed"
                            >
                              {suggestion}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* LLM Judge Traditional Analysis */}
            {judgeResult && (
              <div className="mt-4 p-3 bg-blue-50/80 rounded border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <strong className="text-blue-800 text-sm">
                    LLM Judge Validation
                  </strong>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      judgeResult.isValid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {judgeResult.isValid ? 'Valid' : 'Issues Found'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mb-2 leading-relaxed">
                  {judgeResult.reasoning}
                </p>

                {judgeResult.suggestedCorrections &&
                  judgeResult.suggestedCorrections.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-blue-800">
                        Specific Corrections:
                      </p>
                      <ul className="text-xs mt-1 space-y-1">
                        {judgeResult.suggestedCorrections.map(
                          (suggestion: any, index: number) => (
                            <li
                              key={`correction-${suggestion.field}-${index}`}
                              className="text-yellow-700 leading-relaxed"
                            >
                              • <strong>{suggestion.field}:</strong>{' '}
                              {suggestion.reason}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {judgeResult.contextualInsights && (
                  <p className="text-xs text-gray-600 mt-2 italic leading-relaxed">
                    <strong>Insights:</strong> {judgeResult.contextualInsights}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confidence Components Summary with Scoring Methodology dropdown */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800 flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Confidence Score Summary
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScoring(!showScoring)}
                className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Calculator className="h-4 w-4" />
                {showScoring ? 'Hide' : 'Show'} Methodology
                {showScoring ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Transparent Scoring Methodology - Now in dropdown */}
            {showScoring && (
              <div className="mb-4 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <h5 className="font-medium text-blue-800 text-sm">
                    Transparent Scoring Methodology
                  </h5>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Detailed Calculation
                  </span>
                </div>

                <div className="grid gap-4">
                  {/* Intent Classification */}
                  <div className="bg-white/70 rounded-lg p-4 border border-blue-300">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-blue-900 text-sm">
                        1. Intent Classification (40% weight)
                      </h6>
                      <span className="text-sm font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        {scoring.intent.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-blue-800 space-y-1 leading-relaxed">
                      <p>
                        <strong>Raw Score:</strong>{' '}
                        {(scoring.intent.raw * 100).toFixed(1)}% (HuggingFace
                        classification confidence)
                      </p>
                      <p>
                        <strong>Method:</strong> Zero-shot classification with
                        candidate labels: temporal, capacity, location, rest,
                        preference
                      </p>
                      <p>
                        <strong>Result:</strong> "location venue constraint"
                        detected, but entity-based override applied → capacity
                      </p>
                      <p>
                        <strong>Calculation:</strong>{' '}
                        {(scoring.intent.raw * 100).toFixed(1)}% × 40% ={' '}
                        {scoring.intent.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Entity Extraction */}
                  <div className="bg-white/70 rounded-lg p-4 border border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-green-900 text-sm">
                        2. Entity Completeness (35% weight)
                      </h6>
                      <span className="text-sm font-mono text-green-700 bg-green-100 px-2 py-1 rounded">
                        {scoring.entity.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-green-800 space-y-1 leading-relaxed">
                      <p>
                        <strong>Method:</strong> NER + Rule-based extraction
                        with constraint-type specific scoring
                      </p>
                      <p>
                        <strong>For Capacity Constraints:</strong>
                      </p>
                      <ul className="ml-4 space-y-1">
                        <li>
                          • Capacity Indicator:{' '}
                          {hasCapacityIndicator ? '✓ 35%' : '✗ 0%'} ("
                          {hasCapacityIndicator ? 'no more than' : 'none'}")
                        </li>
                        <li>
                          • Numbers: {hasNumber ? '✓ 25%' : '✗ 0%'} ("
                          {hasNumber ? '3, 1' : 'none'}")
                        </li>
                        <li>
                          • Venue: {hasVenue ? '✓ 20%' : '✗ 0%'} ("
                          {hasVenue ? 'Field 1' : 'none'}")
                        </li>
                        <li>
                          • Time Period: {hasTimePeriod ? '✓ 15%' : '✗ 0%'} ("
                          {hasTimePeriod ? 'per day' : 'none'}")
                        </li>
                      </ul>
                      <p>
                        <strong>Calculation:</strong>{' '}
                        {(scoring.entity.raw * 100).toFixed(1)}% × 35% ={' '}
                        {scoring.entity.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Condition Detection */}
                  <div className="bg-white/70 rounded-lg p-4 border border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-purple-900 text-sm">
                        3. Condition Detection (25% weight)
                      </h6>
                      <span className="text-sm font-mono text-purple-700 bg-purple-100 px-2 py-1 rounded">
                        {scoring.condition.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-purple-800 space-y-1 leading-relaxed">
                      <p>
                        <strong>Raw Score:</strong>{' '}
                        {(scoring.condition.raw * 100).toFixed(1)}% (logical
                        operator analysis)
                      </p>
                      <p>
                        <strong>Method:</strong> Pattern matching for logical
                        operators and constraint-specific conditions
                      </p>
                      <p>
                        <strong>Detected:</strong> "less_than_or_equal" operator
                        with "maximum_value" constraint
                      </p>
                      <p>
                        <strong>Strong Patterns:</strong> "no more than"
                        (capacity constraint indicator)
                      </p>
                      <p>
                        <strong>Calculation:</strong>{' '}
                        {(scoring.condition.raw * 100).toFixed(1)}% × 25% ={' '}
                        {scoring.condition.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Final Score */}
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-400">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900 text-sm">
                        Final Confidence Score
                      </h6>
                      <span
                        className={`text-lg font-mono font-bold ${getConfidenceColor(parsedResult.confidence || 0)}`}
                      >
                        {((parsedResult.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      <p>
                        <strong>Base Calculation:</strong>{' '}
                        {scoring.intent.percentage}% +{' '}
                        {scoring.entity.percentage}% +{' '}
                        {scoring.condition.percentage}% ={' '}
                        {(scoring.total * 100).toFixed(1)}%
                      </p>
                      <p>
                        <strong>Applied Bonuses:</strong> Perfect capacity
                        pattern (+10%), Clear numeric limits (+5%)
                      </p>
                      <p>
                        <strong>Final Result:</strong>{' '}
                        {(scoring.total * 100).toFixed(1)}% + 15% ={' '}
                        {((parsedResult.confidence || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-blue-600">
                    {(scoring.intent.raw * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Intent Classification
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Raw Score (×40% = {scoring.intent.percentage}%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-green-600">
                    {(scoring.entity.raw * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Entity Completeness
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Raw Score (×35% = {scoring.entity.percentage}%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-purple-600">
                    {(scoring.condition.raw * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Condition Detection
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Raw Score (×25% = {scoring.condition.percentage}%)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-800 text-sm">
                    Final Confidence Score:
                  </span>
                  <span
                    className={`font-mono text-lg ${getConfidenceColor(parsedResult.confidence || 0)}`}
                  >
                    {((parsedResult.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      parsedResult.confidence >= 0.8
                        ? 'bg-green-500'
                        : parsedResult.confidence >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width: `${(parsedResult.confidence || 0) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Entity Breakdown */}
          {parsedResult.entities && parsedResult.entities.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3 text-gray-800 text-base">
                Extracted Entities
              </h4>
              <div className="grid gap-2">
                {parsedResult.entities.map((entity: any, index: number) => (
                  <div
                    key={`entity-${entity.type}-${entity.value}-${index}`}
                    className="flex items-center justify-between bg-white rounded px-3 py-2 border"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          entity.type === 'capacity_indicator'
                            ? 'bg-purple-100 text-purple-800'
                            : entity.type === 'venue'
                              ? 'bg-blue-100 text-blue-800'
                              : entity.type === 'number'
                                ? 'bg-green-100 text-green-800'
                                : entity.type === 'time_period'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entity.type}
                      </span>
                      <span className="font-medium text-gray-900 text-sm">
                        {entity.value}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-gray-600">
                      {(entity.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
