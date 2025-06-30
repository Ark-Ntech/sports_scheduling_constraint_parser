/**
 * Test Frontend Constraint Parser Behavior
 * Simulates exactly what the React component does
 */

const PRODUCTION_URL = 'https://sportsschedulingconstraintparser.vercel.app';

async function testFrontendBehavior() {
  console.log('🧪 Testing Frontend Constraint Parser Behavior\n');

  // Simulate the exact request the frontend makes
  const inputText = 'No more than 3 games per day';
  const requestBody = {
    text: inputText,
    constraintSetId: undefined, // No constraint set selected
    parseMultiple: true,
  };

  console.log('📤 Frontend Request:');
  console.log('URL:', '/api/parse');
  console.log('Method: POST');
  console.log('Body:', JSON.stringify(requestBody, null, 2));
  console.log('Headers: Content-Type: application/json');

  try {
    // Make the exact same request as the frontend
    const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\n📊 Frontend Response Analysis:');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);

    // Simulate frontend logic: if (!response.ok) throw error
    if (!response.ok) {
      console.log('❌ FRONTEND ERROR: !response.ok triggered');
      console.log(
        '   This causes: throw new Error("Failed to parse constraint")',
      );
      console.log('   Status code:', response.status);

      // Try to get the error response
      try {
        const errorText = await response.text();
        console.log('   Error response body:', errorText);
      } catch (e) {
        console.log('   Could not read error response');
      }
      return;
    }

    // If response is OK, parse JSON
    const result = await response.json();
    console.log('\n📋 Response JSON:');
    console.log(JSON.stringify(result, null, 2));

    // Simulate frontend logic: if (result.success)
    console.log('\n🔍 Frontend Logic Simulation:');
    console.log('result.success =', result.success);

    if (result.success) {
      console.log('✅ FRONTEND SUCCESS: result.success is true');
      console.log('   Frontend would show parsed results');

      console.log('\n📊 Expected Frontend State:');
      console.log('   isMultiple:', result.isMultiple);
      console.log('   totalConstraints:', result.totalConstraints);
      console.log('   statistics:', !!result.statistics);
      console.log('   results array length:', result.results?.length || 0);
    } else {
      console.log('❌ FRONTEND ERROR: result.success is not true');
      console.log(
        '   This triggers: setError(result.error || "Failed to parse constraint")',
      );
      console.log(
        '   Error message would be:',
        result.error || 'Failed to parse constraint',
      );

      console.log('\n🔍 Debugging info:');
      console.log('   result.error:', result.error);
      console.log('   result.type:', result.type);
      console.log('   result.confidence:', result.confidence);
      console.log(
        '   This looks like raw constraint data, not wrapped response',
      );
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
    console.log(
      '   This triggers: setError("Failed to parse constraint. Please try again.")',
    );
  }
}

// Also test what happens with authentication
async function testAuthenticationIssue() {
  console.log('\n\n🔐 Testing Authentication Issue...');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test constraint',
      }),
    });

    console.log('Auth test status:', response.status);

    if (response.status === 401) {
      console.log('🔍 AUTHENTICATION REQUIRED');
      console.log('   Browser needs to be logged in to access /api/parse');
      console.log('   Unauthenticated requests return 401');
      console.log('   Frontend would see !response.ok = true');
      console.log('   This would trigger "Failed to parse constraint" error');

      const authResponse = await response.json();
      console.log('   Auth error response:', authResponse);
    } else {
      console.log('⚠️  No authentication required (unexpected)');
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
  }
}

// Run both tests
testFrontendBehavior()
  .then(() => testAuthenticationIssue())
  .catch(console.error);
