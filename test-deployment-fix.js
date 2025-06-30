const https = require('https');

// Your Vercel deployment URL
const BASE_URL = 'https://sports-scheduling-constraint-parser.vercel.app';

// Test endpoints
const endpoints = ['/api/health', '/api/parse', '/api/teams', '/api/sports'];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'sports-scheduling-constraint-parser.vercel.app',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Test-Script/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            endpoint,
            status: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            data:
              data.length > 0
                ? res.headers['content-type']?.includes('application/json')
                  ? JSON.parse(data)
                  : data.substring(0, 200)
                : null,
          };
          resolve(result);
        } catch (error) {
          resolve({
            endpoint,
            status: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            error: 'Failed to parse response',
            rawData: data.substring(0, 200),
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        error: error.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        endpoint,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

async function runDeploymentTest() {
  console.log('🔍 Testing Vercel Deployment - API Routes Recognition');
  console.log('='.repeat(60));

  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
    } else {
      console.log(`📊 Status: ${result.status}`);
      console.log(`📋 Content-Type: ${result.contentType}`);

      // Check for 501 errors (unsupported method)
      if (result.status === 501) {
        console.log(
          '🚨 501 UNSUPPORTED METHOD - API route not recognized as serverless function!',
        );
      }

      // Analyze response type
      if (result.contentType?.includes('text/html')) {
        console.log(
          '⚠️  WARNING: Received HTML instead of JSON - API route not working!',
        );
      } else if (result.contentType?.includes('application/json')) {
        console.log('✅ Correct JSON response - API route working');
        if (result.data) {
          console.log(`📦 Response:`, JSON.stringify(result.data, null, 2));
        }
      }
    }

    console.log('-'.repeat(40));
  }

  console.log('\n🔧 NEXT STEPS:');
  console.log('If APIs still failing after fixes:');
  console.log('1. Downgrade Next.js: npm install next@14.2.18');
  console.log('2. Clear Vercel cache and redeploy');
  console.log('3. Check build logs for serverless function recognition');
}

// Run the test
runDeploymentTest().catch(console.error);
