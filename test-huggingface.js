// Test script to verify Hugging Face integration
// Run with: node test-huggingface.js

async function testHuggingFace() {
  console.log('🧪 Testing Hugging Face Integration...\n');

  // Test different environment variable names
  const possibleTokens = [
    process.env.HUGGINGFACE_API_KEY,
    process.env.HF_TOKEN,
    process.env.HUGGINGFACE_ACCESS_TOKEN,
    process.env.HF_ACCESS_TOKEN,
  ];

  const token = possibleTokens.find((t) => t && t.length > 0);

  if (!token) {
    console.log('❌ No Hugging Face token found in environment variables:');
    console.log('   - HUGGINGFACE_API_KEY');
    console.log('   - HF_TOKEN');
    console.log('   - HUGGINGFACE_ACCESS_TOKEN');
    console.log('   - HF_ACCESS_TOKEN');
    console.log('\n📝 Please set one of these in your .env.local file');
    return;
  }

  console.log('✅ Found Hugging Face token');
  console.log(`   Token format: ${token.substring(0, 10)}...`);

  // Test API call
  try {
    const testText = 'Team A cannot play on Mondays';

    console.log(`\n🔍 Testing constraint: "${testText}"`);

    const response = await fetch('http://localhost:3001/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({
        text: testText,
      }),
    });

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Response: ${errorText}`);
      return;
    }

    const result = await response.json();

    console.log('✅ Parse successful!');
    console.log(`   Method: ${result.parsingMethod || 'unknown'}`);
    console.log(`   Confidence: ${result.data?.confidence || 'unknown'}`);
    console.log(`   Type: ${result.data?.type || 'unknown'}`);
    console.log(`   Entities: ${result.data?.entities?.length || 0}`);

    if (result.parsingMethod === 'huggingface') {
      console.log('\n🎉 Hugging Face models are working!');
      if (result.data?.llmJudge) {
        console.log(
          `   LLM Judge: ${result.data.llmJudge.isValid ? 'Valid' : 'Invalid'}`,
        );
        console.log(`   Reasoning: ${result.data.llmJudge.reasoning}`);
      }
    } else {
      console.log('\n⚠️  Using fallback rule-based parsing');
      console.log('   This means Hugging Face models are not working');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run if this is the main module
if (require.main === module) {
  testHuggingFace();
}
