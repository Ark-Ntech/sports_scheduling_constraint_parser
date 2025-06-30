const NEW_DOMAIN =
  'https://sportsschedulingconstraintparser-3yuo9t5sk-ark-ntechs-projects.vercel.app';

async function testNewDomain() {
  console.log('🔍 Testing new domain:', NEW_DOMAIN);

  try {
    // Test diagnostic endpoint
    console.log('\n1. Testing diagnostic endpoint...');
    const diagResponse = await fetch(`${NEW_DOMAIN}/api/diagnostic`);
    console.log('Diagnostic status:', diagResponse.status);

    if (diagResponse.ok) {
      const diagData = await diagResponse.json();
      console.log('✅ Diagnostic found:', diagData.version);
      console.log('Features:', diagData.features);
    } else {
      console.log('❌ Diagnostic endpoint not found');
    }

    // Test the parse endpoint structure
    console.log('\n2. Testing parse endpoint structure...');
    const parseResponse = await fetch(`${NEW_DOMAIN}/api/parse`, {
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

    if (parseResponse.ok) {
      const parseData = await parseResponse.json();
      console.log('\n📊 Parse Response Structure:');
      console.log('Has success field:', 'success' in parseData);
      console.log('success value:', parseData.success);
      console.log('Has isMultiple field:', 'isMultiple' in parseData);
      console.log('Response keys:', Object.keys(parseData));

      if (parseData.success) {
        console.log('✅ NEW API FORMAT - Working correctly!');
        console.log('isMultiple:', parseData.isMultiple);
        console.log('totalConstraints:', parseData.totalConstraints);
      } else {
        console.log('❌ Still old format');
      }
    } else if (parseResponse.status === 401) {
      console.log('🔐 Authentication required (expected for new code)');
      const authError = await parseResponse.json();
      console.log('Auth error:', authError);
    } else {
      console.log('❌ Unexpected error');
      const errorText = await parseResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testNewDomain();
