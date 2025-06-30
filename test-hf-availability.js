// Test HuggingFace availability in production
const FINAL_URL =
  'https://sportsschedulingconstraintparser-3wi9f8wt6-ark-ntechs-projects.vercel.app';

async function testHFAvailability() {
  console.log('🔍 Testing HuggingFace availability in production...');

  // Test a simple constraint to see parsing method
  const testConstraint = 'Team Eagles cannot play on Mondays';

  try {
    const response = await fetch(`${FINAL_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testConstraint,
        parseMultiple: true,
      }),
    });

    console.log('Status:', response.status);

    if (response.ok) {
      const result = await response.json();

      console.log('\n📊 Response Analysis:');
      console.log('Type:', result.type);
      console.log('Confidence:', result.confidence);
      console.log('Entities found:', result.entities?.length || 0);

      // Check for signs of HF vs simple parser
      if (result.llmJudge) {
        console.log('✅ HuggingFace parser used (has llmJudge)');
        console.log('LLM Judge available:', !!result.llmJudge);
      } else {
        console.log('❌ Simple parser used (no llmJudge)');
        console.log('This means HuggingFace is not working');
      }

      // Check entities
      if (result.entities && result.entities.length > 0) {
        console.log('\n🔍 Entities found:');
        result.entities.forEach((entity, i) => {
          console.log(
            `  ${i + 1}. ${entity.type}: "${entity.value}" (${entity.confidence})`,
          );
        });

        // Look for team entity
        const teamEntity = result.entities.find((e) => e.type === 'team');
        if (teamEntity) {
          console.log('✅ Team entity detected correctly');
        } else {
          console.log('❌ Team entity missing (should detect "Eagles")');
        }
      }

      // The key insight: if this is wrapped with success:true, it's new API
      // If it's raw constraint data, it's old API or fallback
      if (result.success !== undefined) {
        console.log('\n✅ NEW API: Wrapped response format');
      } else {
        console.log('\n❌ OLD API: Raw constraint format');
        console.log('   This confirms HuggingFace parser is failing');
        console.log('   Likely environment variable issues');
      }
    } else {
      console.log('❌ Request failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testHFAvailability();
