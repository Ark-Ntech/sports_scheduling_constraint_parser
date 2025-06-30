// Debug script to test Hugging Face token
// Run with: node debug-hf-token.js

const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: '.env.local' });

async function testToken() {
  console.log('🔍 Testing Hugging Face Token...\n');

  // Check all possible environment variables
  const tokens = {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
    HUGGINGFACE_ACCESS_TOKEN: process.env.HUGGINGFACE_ACCESS_TOKEN,
    HF_ACCESS_TOKEN: process.env.HF_ACCESS_TOKEN,
  };

  console.log('📋 Environment Variables:');
  for (const [name, value] of Object.entries(tokens)) {
    if (value) {
      console.log(`   ✅ ${name}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`   ❌ ${name}: not set`);
    }
  }

  const token = Object.values(tokens).find((t) => t && t.length > 0);

  if (!token) {
    console.log('\n❌ No token found. Please set one in .env.local file:');
    console.log('   HF_TOKEN=hf_your_token_here');
    return;
  }

  // Validate token format
  console.log(`\n🔍 Token Analysis:`);
  console.log(`   Format: ${token.substring(0, 10)}...`);
  console.log(`   Length: ${token.length}`);
  console.log(`   Starts with 'hf_': ${token.startsWith('hf_') ? '✅' : '❌'}`);

  if (!token.startsWith('hf_')) {
    console.log('\n⚠️  Warning: Hugging Face tokens should start with "hf_"');
    console.log(
      '   Make sure you copied the token correctly from https://huggingface.co/settings/tokens',
    );
  }

  // Test the token
  console.log('\n🧪 Testing API call...');
  try {
    const hf = new HfInference(token);

    const result = await hf.zeroShotClassification({
      inputs: 'Team A cannot play on Monday',
      parameters: {
        candidate_labels: ['temporal constraint', 'capacity constraint'],
      },
    });

    console.log('✅ SUCCESS! Token is working');
    console.log(`   Classification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log('❌ FAILED! Token authentication error:');
    console.log(`   Error: ${error.message}`);

    if (error.message.includes('Invalid credentials')) {
      console.log('\n💡 Troubleshooting:');
      console.log(
        '   1. Check your token at: https://huggingface.co/settings/tokens',
      );
      console.log('   2. Make sure it starts with "hf_"');
      console.log('   3. Ensure it has "Inference API" permissions');
      console.log('   4. Try creating a new token');
    }
  }
}

testToken().catch(console.error);
