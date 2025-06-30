const FRESH_PRODUCTION =
  'https://sportsschedulingconstraintparser-62qpmszzf-ark-ntechs-projects.vercel.app';

async function testFreshDeployment() {
  console.log('🚀 Testing FRESH production deployment...');
  console.log('URL:', FRESH_PRODUCTION);

  // Test 1: Diagnostic endpoint (should work now)
  console.log('\n1. 🔍 Testing diagnostic endpoint...');
  try {
    const diagResponse = await fetch(`${FRESH_PRODUCTION}/api/diagnostic`);
    console.log('Diagnostic status:', diagResponse.status);

    if (diagResponse.ok) {
      const diagData = await diagResponse.json();
      console.log('✅ LATEST CODE DEPLOYED!');
      console.log('Version:', diagData.version);
      console.log('Auth enabled:', diagData.features?.authenticationEnabled);
    } else {
      console.log('❌ Diagnostic failed');
    }
  } catch (error) {
    console.log('❌ Diagnostic error:', error.message);
  }

  // Test 2: Parse endpoint structure (should return proper format now)
  console.log('\n2. 📝 Testing parse endpoint with latest code...');
  try {
    const parseResponse = await fetch(`${FRESH_PRODUCTION}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'No more than 3 games per day',
        parseMultiple: true,
      }),
    });

    console.log('Parse status:', parseResponse.status);
    console.log('Parse OK:', parseResponse.ok);

    if (parseResponse.status === 401) {
      console.log('🔐 Authentication required (expected with latest code)');
      const authData = await parseResponse.json();
      console.log('Auth response:', authData);
      console.log('✅ This confirms latest code with proper auth is deployed!');
    } else if (parseResponse.ok) {
      const parseData = await parseResponse.json();
      console.log('\n📊 Parse Response:');
      console.log('Has success field:', 'success' in parseData);
      console.log('success value:', parseData.success);

      if (parseData.success === true) {
        console.log('🎉 SUCCESS! Latest API format working!');
        console.log('isMultiple:', parseData.isMultiple);
        console.log('totalConstraints:', parseData.totalConstraints);
      } else if (parseData.success === false) {
        console.log('⚠️ API working but parsing failed:', parseData.error);
      } else {
        console.log('❌ Still getting old format (success field missing)');
      }
    } else {
      console.log('❌ Unexpected status:', parseResponse.status);
    }
  } catch (error) {
    console.log('❌ Parse error:', error.message);
  }
}

testFreshDeployment();
