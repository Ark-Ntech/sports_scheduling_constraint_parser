import { HuggingFaceConstraintParser } from './lib/nlp/huggingface-parser.js';

// Test OpenAI integration
async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI Integration with Constraint Parser\n');

  // Check if OpenAI API key is available
  console.log('Environment variables check:');
  console.log(
    'OPENAI_API_KEY:',
    process.env.OPENAI_API_KEY ? '✅ Present' : '❌ Missing',
  );
  console.log(
    'HUGGINGFACE_ACCESS_TOKEN:',
    process.env.HUGGINGFACE_ACCESS_TOKEN ? '✅ Present' : '❌ Missing',
  );
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OpenAI API key not found in environment variables.');
    console.log(
      '📝 Please set OPENAI_API_KEY environment variable and restart the shell.\n',
    );
    return;
  }

  // Initialize parser
  const parser = new HuggingFaceConstraintParser();

  // Test constraint
  const testConstraint = 'Team A cannot play on Mondays for the month of March';

  console.log(`🎯 Testing constraint: "${testConstraint}"\n`);

  try {
    const result = await parser.parseConstraint(testConstraint);

    console.log('📊 PARSING RESULTS:');
    console.log('Type:', result.type);
    console.log('Confidence:', `${(result.confidence * 100).toFixed(1)}%`);
    console.log('Entities found:', result.entities?.length || 0);
    console.log('');

    if (result.llmJudge?.llmExplanation) {
      console.log('🤖 OPENAI EXPLANATION:');
      console.log(
        'Confidence Breakdown:',
        result.llmJudge.llmExplanation.confidenceBreakdown,
      );
      console.log(
        'Entity Analysis:',
        result.llmJudge.llmExplanation.entityAnalysis,
      );
      console.log(
        'Classification Reasoning:',
        result.llmJudge.llmExplanation.classificationReasoning,
      );
      console.log(
        'Quality Assessment:',
        result.llmJudge.llmExplanation.qualityAssessment,
      );
      console.log('');
      console.log('✅ OpenAI integration working successfully!');
    } else {
      console.log('⚠️ No OpenAI explanation generated, using fallback.');
    }

    console.log('\n📋 FULL RESULT:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error testing constraint parser:', error);
  }
}

testOpenAIIntegration();
