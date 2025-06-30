const LATEST_DOMAIN =
  'https://sportsschedulingconstraintparser-80kym56o6-ark-ntechs-projects.vercel.app';

async function testLatestDeployment() {
  console.log('🔍 Testing latest deployment:', LATEST_DOMAIN);

  try {
    // Test diagnostic endpoint
    console.log('\n1. Testing diagnostic endpoint...');
    const diagResponse = await fetch(`${LATEST_DOMAIN}/api/diagnostic`);
    console.log('Diagnostic status:', diagResponse.status);

    if (diagResponse.ok) {
      const diagData = await diagResponse.json();
      console.log('✅ Diagnostic found - Latest code deployed!');
      console.log('Version:', diagData.version);
      console.log('Features:', diagData.features);
    } else {
      console.log('❌ Diagnostic endpoint not found');
    }

    // Test parse endpoint without auth (should get 401)
    console.log('\n2. Testing parse endpoint authentication...');
    const parseResponse = await fetch(`${LATEST_DOMAIN}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'No more than 3 games per day',
      }),
    });

    console.log('Parse status:', parseResponse.status);

    if (parseResponse.status === 401) {
      console.log('✅ Authentication working correctly!');
      try {
        const authData = await parseResponse.json();
        console.log('Auth response:', authData);
      } catch (e) {
        console.log('Auth response is not JSON (redirect to login)');
      }
    } else {
      console.log('❌ Authentication not working as expected');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testLatestDeployment();
