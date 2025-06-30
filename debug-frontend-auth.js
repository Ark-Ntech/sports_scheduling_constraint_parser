/**
 * Debug Frontend Authentication Issues
 * Tests the exact authentication flow that the frontend uses
 */

const PRODUCTION_URL = 'https://sportsschedulingconstraintparser.vercel.app';

async function debugAuthenticationFlow() {
  console.log('🔍 Debugging Frontend Authentication Flow\n');

  // Step 1: Test unauthenticated request (should return 401)
  console.log('📊 Step 1: Test unauthenticated API call');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'No more than 3 games per day',
        parseMultiple: true,
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('✅ API correctly requires authentication');
      const errorResult = await response.json();
      console.log('   Error response:', errorResult);
    } else if (response.ok) {
      const result = await response.json();
      console.log('⚠️  API allowed unauthenticated access');
      console.log('   Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Unexpected error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Step 2: Test the login page
  console.log('\n📊 Step 2: Test login page access');
  try {
    const response = await fetch(`${PRODUCTION_URL}/login`);
    console.log(`Login page status: ${response.status}`);

    if (response.ok) {
      console.log('✅ Login page accessible');
    } else {
      console.log('❌ Login page error');
    }
  } catch (error) {
    console.log('❌ Login page error:', error.message);
  }

  // Step 3: Test Supabase auth endpoint
  console.log('\n📊 Step 3: Test Supabase auth endpoints');
  const authEndpoints = ['/auth/callback', '/auth/signout'];

  for (const endpoint of authEndpoints) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
        method: 'GET',
      });
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: ❌ Error - ${error.message}`);
    }
  }

  // Step 4: Test other API endpoints for consistency
  console.log('\n📊 Step 4: Test other API endpoints');
  const otherEndpoints = [
    '/api/sports',
    '/api/constraint-sets',
    '/api/parse-test',
  ];

  for (const endpoint of otherEndpoints) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        console.log('   ✅ Properly requiring authentication');
      } else if (response.status === 501) {
        console.log('   ⚠️  Not implemented (501)');
      } else if (response.ok) {
        console.log('   ℹ️  Accessible without auth');
      }
    } catch (error) {
      console.log(`${endpoint}: ❌ Error - ${error.message}`);
    }
  }

  console.log('\n🔍 ANALYSIS:');
  console.log('   The "Failed to parse constraint" error is likely caused by:');
  console.log('   1. Frontend making unauthenticated requests');
  console.log('   2. API returning 401 but frontend showing generic error');
  console.log('   3. Browser session not being maintained properly');
  console.log('\n💡 SOLUTION:');
  console.log('   1. Clear browser cache/cookies completely');
  console.log(
    '   2. Go to: https://sportsschedulingconstraintparser.vercel.app',
  );
  console.log('   3. Login with: noahbeh@gmail.com / M@rshm3lloW');
  console.log('   4. Check browser dev tools for actual error messages');
  console.log('   5. Ensure cookies are being sent with API requests');
}

// Run the debug
debugAuthenticationFlow().catch(console.error);
