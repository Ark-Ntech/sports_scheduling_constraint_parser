/**
 * Test for authenticated parsing issue
 * This simulates what happens when you're logged in but parsing fails
 */

// You'll need to replace this with the actual domain you're using
const DOMAIN =
  'https://sportsschedulingconstraintparser-80kym56o6-ark-ntechs-projects.vercel.app';

async function debugAuthenticatedParsing() {
  console.log('🔍 Debugging authenticated parsing issue...');
  console.log('Domain:', DOMAIN);

  // Test simple constraint that should work
  const testConstraint = 'No more than 3 games per day';

  console.log('\n📝 Testing constraint:', testConstraint);

  try {
    const response = await fetch(`${DOMAIN}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testConstraint,
        parseMultiple: true,
      }),
    });

    console.log('\n📊 Response Analysis:');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log(
        '\n❌ Response not OK - this would trigger "Failed to parse constraint"',
      );

      if (response.status === 401) {
        console.log('🔐 Still getting 401 - authentication issue');
      } else if (response.status === 500) {
        console.log('💥 Server error - API is crashing');
      }

      try {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
      } catch (e) {
        console.log('Could not read error response body');
      }
      return;
    }

    // If response is OK, check the format
    const result = await response.json();
    console.log('\n📋 Response JSON:');
    console.log(JSON.stringify(result, null, 2));

    // Simulate frontend logic
    console.log('\n🔍 Frontend Logic Check:');
    console.log('result.success =', result.success);
    console.log('Type of success:', typeof result.success);

    if (result.success === true) {
      console.log('✅ SUCCESS: Frontend would accept this response');
      console.log('   isMultiple:', result.isMultiple);
      console.log('   totalConstraints:', result.totalConstraints);
    } else if (result.success === false) {
      console.log('❌ EXPLICIT FAILURE: result.success is false');
      console.log('   Error message:', result.error);
    } else if (result.success === undefined) {
      console.log(
        '❌ MISSING SUCCESS FIELD: Frontend would show "Failed to parse constraint"',
      );
      console.log(
        '   This looks like raw constraint data instead of wrapped response',
      );
      console.log('   Available fields:', Object.keys(result));

      // Check if this looks like raw constraint data
      if (result.type && result.confidence !== undefined) {
        console.log(
          '🔍 This appears to be raw constraint data from simple parser',
        );
        console.log('   Type:', result.type);
        console.log('   Confidence:', result.confidence);
      }
    }
  } catch (error) {
    console.log('\n💥 Network/Parse Error:', error.message);
    console.log('   This would also trigger "Failed to parse constraint"');
  }
}

// Also test a different constraint type
async function testDifferentConstraints() {
  console.log('\n\n🧪 Testing different constraint types...');

  const constraints = [
    'Team A cannot play on Mondays',
    'Basketball games must be in Gym 1',
    'Teams need 2 days rest between games',
  ];

  for (const constraint of constraints) {
    console.log(`\n📝 Testing: "${constraint}"`);

    try {
      const response = await fetch(`${DOMAIN}/api/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: constraint,
          parseMultiple: true,
        }),
      });

      console.log(`   Status: ${response.status}, OK: ${response.ok}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`   Success field: ${result.success}`);
        if (result.success) {
          console.log(`   ✅ This constraint works`);
        } else {
          console.log(
            `   ❌ This constraint fails: ${result.error || 'No success field'}`,
          );
        }
      } else {
        console.log(`   ❌ HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

// Run both tests
debugAuthenticatedParsing()
  .then(() => testDifferentConstraints())
  .catch(console.error);
