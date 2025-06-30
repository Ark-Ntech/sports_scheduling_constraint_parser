/**
 * Debug Production Parsing Issues
 * Test the constraint parsing API in production
 */

const PRODUCTION_URL = 'https://sportsschedulingconstraintparser.vercel.app';

async function testConstraintParsing() {
  console.log('🧪 Testing Production Constraint Parsing API\n');

  const testConstraints = [
    'No more than 3 games per day',
    'Teams need at least 2 days between games',
    'Eagles FC home games must be at Riverside Soccer Field',
  ];

  for (let i = 0; i < testConstraints.length; i++) {
    const constraint = testConstraints[i];
    console.log(`\n📝 Test ${i + 1}: "${constraint}"`);
    console.log('='.repeat(60));

    try {
      const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: constraint,
          parseMultiple: true,
        }),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error Response:', errorText);
        continue;
      }

      const result = await response.json();

      if (result.error) {
        console.log('❌ API Error:', result.error);
        if (result.details) {
          console.log('   Details:', result.details);
        }
      } else {
        console.log('✅ Success!');
        console.log(
          `   Constraints processed: ${result.totalConstraints || 1}`,
        );
        console.log(
          `   Parsing method: ${result.parsingMethod || result.statistics?.parsingMethod}`,
        );
        console.log(
          `   Average confidence: ${result.statistics?.averageConfidence ? (result.statistics.averageConfidence * 100).toFixed(1) + '%' : 'N/A'}`,
        );

        if (result.standardOutput) {
          console.log('   Standard output type:', result.standardOutput.type);
          console.log(
            '   Confidence:',
            (result.standardOutput.confidence * 100).toFixed(1) + '%',
          );
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('\n🔍 Testing without authentication...');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Simple test constraint',
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log(
        'ℹ️  Authentication required (expected for constraint saving)',
      );
    } else {
      const result = await response.json();
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testConstraintParsing().catch(console.error);
