async function testDiagnosticNow() {
  const DOMAIN =
    'https://sportsschedulingconstraintparser-80kym56o6-ark-ntechs-projects.vercel.app';

  try {
    console.log('🔍 Testing diagnostic endpoint...');
    const response = await fetch(`${DOMAIN}/api/diagnostic`);
    console.log('Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Latest code IS deployed!');
      console.log('Version:', data.version);
      console.log('Features:', JSON.stringify(data.features, null, 2));
    } else {
      console.log('❌ Diagnostic endpoint not found - old code still deployed');
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDiagnosticNow();
