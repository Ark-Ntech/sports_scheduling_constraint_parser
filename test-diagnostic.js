async function testDiagnostic() {
  try {
    const response = await fetch(
      'https://sportsschedulingconstraintparser.vercel.app/api/diagnostic',
    );
    console.log('Diagnostic status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Diagnostic data:', JSON.stringify(data, null, 2));

      // Check if this matches our latest code
      if (data.version === '2024-12-30-auth-enabled') {
        console.log('✅ Latest code is deployed');
      } else {
        console.log('❌ Old code is still deployed');
      }
    } else {
      console.log('❌ Diagnostic endpoint not found - old code deployed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDiagnostic();
