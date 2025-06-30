import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

interface ExplanationData {
  confidenceBreakdown: string;
  entityAnalysis: string;
  classificationReasoning: string;
  improvementSuggestions: string[];
  qualityAssessment: {
    rating: string;
    explanation: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { parsedResult, originalText } = await request.json();

    if (!parsedResult || !originalText) {
      return NextResponse.json(
        { error: 'Missing required fields: parsedResult and originalText' },
        { status: 400 },
      );
    }

    // Initialize HuggingFace client
    const accessToken =
      process.env.HUGGINGFACE_ACCESS_TOKEN ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HuggingFace access token not configured' },
        { status: 500 },
      );
    }

    const hf = new HfInference(accessToken);

    const prompt = `You are an expert in sports scheduling constraint analysis. Analyze the following constraint parsing result and provide a detailed confidence methodology explanation.

Original Constraint: "${originalText}"

Parsing Result:
- Type: ${parsedResult.type}
- Confidence Score: ${(parsedResult.confidence * 100).toFixed(1)}%
- Entities Found: ${JSON.stringify(parsedResult.entities, null, 2)}
- Conditions: ${JSON.stringify(parsedResult.conditions, null, 2)}
- LLM Judge Result: ${JSON.stringify(parsedResult.llmJudge, null, 2)}

Please provide a detailed analysis with the following sections:

1. CONFIDENCE BREAKDOWN: Explain exactly how the ${(parsedResult.confidence * 100).toFixed(1)}% confidence score was calculated, breaking down each component (intent classification, entity extraction, condition detection).

2. ENTITY ANALYSIS: Analyze each entity found and explain why it was identified with its confidence level.

3. CLASSIFICATION REASONING: Explain why this constraint was classified as "${parsedResult.type}" and not other types.

4. IMPROVEMENT SUGGESTIONS: Provide 3-5 specific suggestions for what additional information or clarification would improve the confidence score.

5. QUALITY ASSESSMENT: Rate the overall parsing quality as Excellent (90-100%), Good (70-89%), Fair (50-69%), or Poor (<50%) and explain why.

Provide clear, technical explanations that would help users understand how the AI parsing works.`;

    try {
      // Use HuggingFace text generation
      const result = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.3,
          do_sample: true,
          top_p: 0.9,
          return_full_text: false,
        },
      });

      let explanation: ExplanationData;
      try {
        // Try to parse as JSON first
        explanation = JSON.parse(result.generated_text);
      } catch {
        // If not JSON, structure the text response
        const text = result.generated_text;

        explanation = {
          confidenceBreakdown:
            extractSection(text, 'CONFIDENCE BREAKDOWN') ||
            `The confidence score of ${(parsedResult.confidence * 100).toFixed(1)}% reflects the system's assessment of parsing accuracy based on multiple factors including intent classification, entity completeness, and condition detection.`,
          entityAnalysis:
            extractSection(text, 'ENTITY ANALYSIS') ||
            `Found ${parsedResult.entities?.length || 0} entities with varying confidence levels, indicating ${parsedResult.entities?.length > 3 ? 'strong' : 'moderate'} entity extraction performance.`,
          classificationReasoning:
            extractSection(text, 'CLASSIFICATION REASONING') ||
            `Classified as "${parsedResult.type}" constraint based on entity patterns and linguistic indicators in the original text.`,
          improvementSuggestions: extractSuggestions(text) || [
            'Add more specific temporal details (exact dates, times)',
            'Clarify the scope and context of the constraint',
            'Provide additional entity information (team names, specific venues)',
            'Include explicit condition operators (must, cannot, should)',
            'Add quantitative details where applicable',
          ],
          qualityAssessment: {
            rating: getQualityRating(parsedResult.confidence),
            explanation:
              extractSection(text, 'QUALITY ASSESSMENT') ||
              `Based on the ${(parsedResult.confidence * 100).toFixed(1)}% confidence score, this represents ${getQualityRating(parsedResult.confidence).toLowerCase()} parsing quality.`,
          },
        };
      }

      return NextResponse.json({ explanation });
    } catch (hfError) {
      console.error('HuggingFace API error:', hfError);

      // Fallback to rule-based explanation
      const fallbackExplanation = generateFallbackExplanation(
        parsedResult,
        originalText,
      );
      return NextResponse.json({ explanation: fallbackExplanation });
    }
  } catch (error) {
    console.error('Error generating confidence explanation:', error);
    return NextResponse.json(
      { error: 'Failed to generate confidence explanation' },
      { status: 500 },
    );
  }
}

function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(
    `${sectionName}:?\\s*([\\s\\S]*?)(?=\\d+\\.|$)`,
    'i',
  );
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractSuggestions(text: string): string[] | null {
  const suggestions = extractSection(text, 'IMPROVEMENT SUGGESTIONS');
  if (!suggestions) return null;

  // Extract bullet points or numbered items
  const items =
    suggestions.match(/[-•]\s*([^\n]+)/g) ||
    suggestions.match(/\d+\.\s*([^\n]+)/g);

  return items
    ? items.map((item) => item.replace(/^[-•]\s*|\d+\.\s*/, '').trim())
    : null;
}

function getQualityRating(confidence: number): string {
  if (confidence >= 0.9) return 'Excellent';
  if (confidence >= 0.7) return 'Good';
  if (confidence >= 0.5) return 'Fair';
  return 'Poor';
}

function generateFallbackExplanation(
  parsedResult: any,
  originalText: string,
): ExplanationData {
  const confidence = parsedResult.confidence * 100;
  const entityCount = parsedResult.entities?.length || 0;
  const conditionCount = parsedResult.conditions?.length || 0;

  return {
    confidenceBreakdown: `The confidence score of ${confidence.toFixed(1)}% is calculated from three main components: Intent Classification (40%), Entity Extraction (35%), and Condition Detection (25%). The system identified this as a "${parsedResult.type}" constraint with ${entityCount} entities and ${conditionCount} conditions.`,

    entityAnalysis: `Detected ${entityCount} entities: ${parsedResult.entities?.map((e: any) => `${e.type} ("${e.value}" - ${(e.confidence * 100).toFixed(1)}% confidence)`).join(', ') || 'none'}. Entity extraction quality appears ${entityCount > 3 ? 'strong' : entityCount > 1 ? 'moderate' : 'weak'}.`,

    classificationReasoning: `This constraint was classified as "${parsedResult.type}" based on entity patterns and linguistic analysis. ${parsedResult.llmJudge?.isValid ? 'The LLM judge validated this classification as correct.' : 'The LLM judge flagged potential classification issues.'}`,

    improvementSuggestions: [
      entityCount < 2
        ? 'Add more specific entities (teams, venues, times)'
        : 'Entities are well-detected',
      conditionCount < 1
        ? 'Include explicit conditions (must, cannot, before, after)'
        : 'Conditions are present',
      confidence < 70
        ? 'Provide more context and specific details'
        : 'Good overall specificity',
      'Consider adding temporal context (dates, days of week)',
      'Specify quantitative limits more clearly',
    ].filter(
      (s) =>
        !s.includes('are well-detected') &&
        !s.includes('are present') &&
        !s.includes('Good overall'),
    ),

    qualityAssessment: {
      rating: getQualityRating(parsedResult.confidence),
      explanation: `With ${confidence.toFixed(1)}% confidence, this represents ${getQualityRating(parsedResult.confidence).toLowerCase()} parsing quality. ${parsedResult.llmJudge?.isValid ? 'The constraint structure is well-formed and interpretable.' : 'There may be ambiguities that could benefit from clarification.'}`,
    },
  };
}
