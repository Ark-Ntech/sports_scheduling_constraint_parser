const { HfInference } = require('@huggingface/inference');

async function testHuggingFaceDetailed() {
  console.log('🔍 DETAILED HuggingFace Investigation\n');

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const token = process.env.HUGGINGFACE_ACCESS_TOKEN;
  console.log('1. 🔑 Token verification:');
  console.log('- Token exists:', !!token);
  console.log('- Token length:', token?.length || 0);
  console.log(
    '- Token format:',
    token?.substring(0, 5) + '...' + token?.substring(token.length - 5),
  );

  // Test 1: Try direct API call without HfInference client
  console.log('\n2. 🌐 Testing direct API call...');
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Hello world',
          parameters: {
            max_new_tokens: 10,
            return_full_text: false,
          },
        }),
      },
    );

    console.log('Direct API status:', response.status);
    console.log(
      'Direct API headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct API works!');
      console.log('Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Direct API failed');
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Direct API error:', error.message);
  }

  // Test 2: Try HfInference with different configurations
  console.log('\n3. 🔧 Testing HfInference with different configs...');

  const hf = new HfInference(token);

  // Try with minimal parameters
  console.log('\nTrying minimal parameters...');
  try {
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Test',
      parameters: {
        max_new_tokens: 5,
      },
    });
    console.log('✅ Minimal parameters work!');
    console.log('Result:', result);
  } catch (error) {
    console.log('❌ Minimal parameters failed:', error.message);
    console.log('Error stack:', error.stack?.split('\n')[0]);
  }

  // Test 3: Check if it's a model loading issue
  console.log('\n4. ⏳ Testing with wait_for_model...');
  try {
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Test',
      parameters: {
        max_new_tokens: 5,
      },
      options: {
        wait_for_model: true,
        use_cache: false,
      },
    });
    console.log('✅ Wait for model works!');
    console.log('Result:', result);
  } catch (error) {
    console.log('❌ Wait for model failed:', error.message);
  }

  // Test 4: Try different model types
  console.log(
    '\n5. 🎯 Testing text classification (different API endpoint)...',
  );
  try {
    const result = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: 'I love this!',
    });
    console.log('✅ Text classification works!');
    console.log('Result:', result);
  } catch (error) {
    console.log('❌ Text classification failed:', error.message);
  }

  // Test 5: Check network/environment issues
  console.log('\n6. 🌍 Testing basic connectivity...');
  try {
    const response = await fetch('https://huggingface.co');
    console.log('HuggingFace main site status:', response.status);

    const apiResponse = await fetch(
      'https://api-inference.huggingface.co/models',
    );
    console.log('HuggingFace API status:', apiResponse.status);
  } catch (error) {
    console.log('❌ Connectivity issue:', error.message);
  }

  console.log('\n🎯 ANALYSIS:');
  console.log('The "blob fetch" error suggests:');
  console.log('1. Network/proxy issues');
  console.log('2. HuggingFace client library bug');
  console.log('3. Model loading timeout issues');
  console.log('4. API endpoint availability problems');
  console.log('');
  console.log('💡 POTENTIAL SOLUTIONS:');
  console.log('1. Use direct fetch() instead of HfInference client');
  console.log('2. Add retry logic with exponential backoff');
  console.log('3. Use OpenAI API as primary LLM provider');
  console.log('4. Implement HuggingFace as optional enhancement');
}

testHuggingFaceDetailed();
