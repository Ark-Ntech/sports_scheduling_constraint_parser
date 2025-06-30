// Production Environment Debugging Script
// Test this against your deployed Vercel URL

const VERCEL_URL = 'https://sports-scheduling-constraint-parser.vercel.app';

async function testProductionDeployment() {
  console.log('🚀 Testing Vercel Production Deployment...\n');

  // Test 1: Basic connectivity
  console.log('1. Testing basic connectivity...');
  try {
    const response = await fetch(`${VERCEL_URL}/`);
    console.log(`✅ Homepage: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Homepage failed: ${error.message}`);
  }

  // Test 2: API health check
  console.log('\n2. Testing API health...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/health`);
    const data = await response.text();
    console.log(
      `✅ Health API: ${response.status} - ${data.substring(0, 100)}...`,
    );
  } catch (error) {
    console.log(`❌ Health API failed: ${error.message}`);
  }

  // Test 3: Diagnostic endpoint
  console.log('\n3. Testing diagnostic endpoint...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/diagnostic`);
    const data = await response.json();
    console.log(`✅ Diagnostic: ${response.status}`);
    console.log('Environment check:', data.environment);
    console.log('Database:', data.database?.status);
    console.log('HuggingFace:', data.huggingface?.status);
  } catch (error) {
    console.log(`❌ Diagnostic failed: ${error.message}`);
  }

  // Test 4: Parse API (without auth)
  console.log('\n4. Testing parse API...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Team A cannot play on Mondays',
      }),
    });

    const data = await response.text();
    console.log(`Parse API: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('🔒 Authentication required (expected)');
    } else if (response.status === 200) {
      console.log('✅ Parse API working');
    } else {
      console.log(`❌ Unexpected response: ${data.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ Parse API failed: ${error.message}`);
  }

  // Test 5: Constraint sets API
  console.log('\n5. Testing constraint-sets API...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/constraint-sets`);
    console.log(
      `Constraint-sets API: ${response.status} ${response.statusText}`,
    );

    if (response.status === 401) {
      console.log('🔒 Authentication required (expected)');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log(
        `✅ Data received: ${JSON.stringify(data).substring(0, 100)}...`,
      );
    }
  } catch (error) {
    console.log(`❌ Constraint-sets API failed: ${error.message}`);
  }

  console.log('\n📊 Debug Summary:');
  console.log('If you see 401 errors for authenticated endpoints, check:');
  console.log('- Supabase environment variables in Vercel');
  console.log('- Supabase Site URL configuration');
  console.log('- CORS settings in Supabase');

  console.log('\nIf you see 500 errors, check:');
  console.log('- All environment variables are set in Vercel');
  console.log('- HuggingFace token is valid');
  console.log('- OpenAI API key is valid');
  console.log('- Vercel function timeout settings');
}

// Run the test
testProductionDeployment().catch(console.error);
