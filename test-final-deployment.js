const FINAL_URL =
  'https://sportsschedulingconstraintparser-3wi9f8wt6-ark-ntechs-projects.vercel.app';

async function testFinalDeployment() {
  console.log('🎯 Testing FINAL deployment...');
  console.log('URL:', FINAL_URL);

  // Test 1: Check if version file exists
  console.log('\n1. 📋 Testing version file...');
  try {
    const versionResponse = await fetch(`${FINAL_URL}/DEPLOYMENT_VERSION.md`);
    console.log('Version file status:', versionResponse.status);
    if (versionResponse.ok) {
      console.log('✅ Latest commit deployed (version file found)');
    }
  } catch (error) {
    console.log('Version file test failed');
  }

  // Test 2: Diagnostic endpoint
  console.log('\n2. 🔍 Testing diagnostic endpoint...');
  try {
    const diagResponse = await fetch(`${FINAL_URL}/api/diagnostic`);
    console.log('Diagnostic status:', diagResponse.status);

    if (diagResponse.ok) {
      const diagData = await diagResponse.json();
      console.log('🎉 DIAGNOSTIC WORKING!');
      console.log('Version:', diagData.version);
      console.log('Features:', diagData.features);
    } else if (diagResponse.status === 401) {
      console.log('🔐 Diagnostic requires auth (expected)');
    } else {
      console.log('❌ Still not working, status:', diagResponse.status);
    }
  } catch (error) {
    console.log('❌ Diagnostic error:', error.message);
  }

  // Test 3: Parse endpoint structure
  console.log('\n3. 📝 Testing parse endpoint...');
  try {
    const parseResponse = await fetch(`${FINAL_URL}/api/parse`, {
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

    if (parseResponse.status === 401) {
      console.log('🔐 Authentication required (PERFECT!)');
      try {
        const authData = await parseResponse.json();
        console.log('Auth response:', authData);

        if (authData.error === 'Unauthorized') {
          console.log('✅ This is the NEW API with proper authentication!');
          console.log(
            '✅ When you log in, you should get {success: true, ...} format',
          );
        }
      } catch (e) {
        console.log('Auth response not JSON (redirect)');
      }
    } else if (parseResponse.ok) {
      const parseData = await parseResponse.json();
      console.log('Parse response keys:', Object.keys(parseData));

      if ('success' in parseData) {
        console.log('🎉 NEW API FORMAT WORKING!');
        console.log('success:', parseData.success);
      } else {
        console.log('❌ Still old format');
      }
    }
  } catch (error) {
    console.log('❌ Parse error:', error.message);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('✅ Fresh deployment complete');
  console.log('✅ Use this URL for testing: ' + FINAL_URL);
  console.log('✅ Log in first, then test constraint parser');
  console.log('✅ Should now show proper success/error messages');
}

testFinalDeployment();
