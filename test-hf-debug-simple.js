const { HfInference } = require('@huggingface/inference');

async function testHuggingFaceDirectly() {
  console.log(
    '🔍 Testing HuggingFace API directly to debug blob fetch issues\n',
  );

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const token = process.env.HUGGINGFACE_ACCESS_TOKEN;
  console.log('1. 🔑 Token check:');
  console.log('- Token exists:', !!token);
  console.log('- Token length:', token?.length || 0);
  console.log('- Token starts with hf_:', token?.startsWith('hf_') || false);

  if (!token) {
    console.log('❌ No HuggingFace token found!');
    return;
  }

  const hf = new HfInference(token);

  // Test 1: Try the simplest possible model
  console.log('\n2. 🧪 Testing simplest model (gpt2)...');
  try {
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello world',
      parameters: {
        max_new_tokens: 10,
        return_full_text: false,
      },
    });
    console.log('✅ GPT-2 works!');
    console.log('Response:', result.generated_text);
  } catch (error) {
    console.log('❌ GPT-2 failed:', error.message);
    if (error.message.includes('blob')) {
      console.log('🔍 This is a blob fetch error - likely API or token issue');
    }
  }

  // Test 2: Try token validation endpoint
  console.log('\n3. 🔐 Testing token validity...');
  try {
    // Try to list models (this validates the token)
    const response = await fetch('https://huggingface.co/api/whoami', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token is valid');
      console.log('User:', data.name);
      console.log('Auth type:', data.auth?.type || 'unknown');
    } else {
      console.log('❌ Token validation failed');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Token validation error:', error.message);
  }

  // Test 3: Try different model types
  console.log('\n4. 🔬 Testing different model types...');

  const modelsToTest = [
    'distilbert-base-uncased', // Classification model
    'distilgpt2', // Small generation model
    'microsoft/DialoGPT-small', // Conversation model
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting ${model}...`);
    try {
      const result = await hf.textGeneration({
        model: model,
        inputs: 'Test input',
        parameters: {
          max_new_tokens: 5,
          return_full_text: false,
        },
        options: {
          use_cache: false,
          wait_for_model: true,
        },
      });
      console.log(`✅ ${model} works!`);
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message);

      if (error.message.includes('blob')) {
        console.log('   → Blob fetch error (API/network issue)');
      } else if (error.message.includes('unauthorized')) {
        console.log('   → Authorization error (token issue)');
      } else if (error.message.includes('rate')) {
        console.log('   → Rate limit error');
      }
    }
  }

  console.log('\n🎯 DIAGNOSIS:');
  console.log('If ALL models fail with blob errors:');
  console.log('- HuggingFace API might be having issues');
  console.log('- Token might need different permissions');
  console.log('- Network connectivity problems');
  console.log('');
  console.log('Next steps:');
  console.log('1. Try creating a new HuggingFace token');
  console.log('2. Check HuggingFace status page');
  console.log('3. Consider using OpenAI as primary LLM');
}

testHuggingFaceDirectly();
