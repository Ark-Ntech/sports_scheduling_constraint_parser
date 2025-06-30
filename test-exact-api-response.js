/**
 * Test Exact API Response Structure
 * Compare what we expect vs what we get
 */

const PRODUCTION_URL = 'https://sportsschedulingconstraintparser.vercel.app';

async function testExactAPIResponse() {
  console.log('🧪 Testing Exact API Response Structure\n');

  const testPayload = {
    text: 'No more than 3 games per day',
    parseMultiple: true,
  };

  console.log('📤 Request payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n🔍 Making request to /api/parse...\n');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`,
    );
    console.log('📊 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    const responseText = await response.text();
    console.log('\n📥 Raw Response:');
    console.log(responseText);

    // Try to parse as JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n📋 Parsed Response Structure:');
      console.log('   success:', responseJson.success);
      console.log('   error:', responseJson.error);
      console.log('   type:', responseJson.type);
      console.log('   isMultiple:', responseJson.isMultiple);
      console.log('   data:', !!responseJson.data);
      console.log('   results:', !!responseJson.results);
      console.log('   statistics:', !!responseJson.statistics);

      console.log('\n🎯 DIAGNOSIS:');
      if (responseJson.success === true) {
        console.log('   ✅ API returns correct "success: true" structure');
        console.log('   ✅ This should work with the frontend');
      } else if (responseJson.success === undefined && responseJson.type) {
        console.log('   ❌ API returns old structure WITHOUT "success: true"');
        console.log(
          '   ❌ This causes frontend to show "Failed to parse constraint"',
        );
        console.log(
          '   🔧 SOLUTION: API code not deployed yet OR wrong endpoint',
        );
      } else if (responseJson.error) {
        console.log('   ❌ API returns error:', responseJson.error);
        console.log('   🔧 SOLUTION: Check authentication or API logic');
      } else {
        console.log('   ❓ Unknown response structure');
      }
    } catch (parseError) {
      console.log('\n❌ Response is not valid JSON:', parseError.message);
      console.log('   Raw response:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Also test the expected frontend call format
  console.log('\n🌐 Testing frontend-style request...');
  try {
    const frontendResponse = await fetch(`${PRODUCTION_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In browser, this would include cookies automatically
      },
      body: JSON.stringify({
        text: 'Teams need at least 2 days between games',
        constraintSetId: undefined,
        parseMultiple: true,
      }),
    });

    console.log(`Frontend-style status: ${frontendResponse.status}`);

    if (frontendResponse.ok) {
      const result = await frontendResponse.json();
      console.log('Frontend-style success field:', result.success);
      if (result.success) {
        console.log('✅ Frontend call would succeed');
      } else {
        console.log(
          '❌ Frontend call would fail with:',
          result.error || 'No error message',
        );
      }
    }
  } catch (error) {
    console.log('❌ Frontend-style error:', error.message);
  }
}

// Run the test
testExactAPIResponse().catch(console.error);
