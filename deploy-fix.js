const https = require('https');

// Your Vercel deployment URL
const BASE_URL = 'https://sports-scheduling-constraint-parser.vercel.app';

// Test endpoints
const endpoints = [
  '/api/health',
  '/api/parse',
  '/api/teams',
  '/api/sports',
  '/api/leagues',
];

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
                  : data
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
            rawData: data,
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

      // Check for Vercel serverless function indicators
      if (result.headers['x-vercel-cache']) {
        console.log(`⚡ Vercel Cache: ${result.headers['x-vercel-cache']}`);
      }
      if (result.headers['x-vercel-id']) {
        console.log(`🔗 Vercel ID: ${result.headers['x-vercel-id']}`);
      }

      // Analyze response type
      if (result.contentType?.includes('text/html')) {
        console.log(
          '⚠️  WARNING: Received HTML instead of JSON - API route not recognized as serverless function!',
        );
        if (result.data && typeof result.data === 'string') {
          if (result.data.includes('404')) {
            console.log('🚨 API route not found - deployment issue detected');
          } else if (result.data.includes('Vercel')) {
            console.log(
              '📄 Receiving Vercel error page instead of API response',
            );
          }
        }
      } else if (result.contentType?.includes('application/json')) {
        console.log('✅ Correct JSON response - API route working');
        if (result.data) {
          console.log(`📦 Response:`, JSON.stringify(result.data, null, 2));
        }
      }

      // Check for 501 errors (unsupported method)
      if (result.status === 501) {
        console.log(
          '🚨 501 UNSUPPORTED METHOD - API route not recognized as serverless function!',
        );
        console.log(
          '   This indicates Vercel is not building API routes properly.',
        );
      }
    }

    console.log('-'.repeat(40));
  }

  console.log('\n📋 DEPLOYMENT DIAGNOSIS:');
  console.log('If you see:');
  console.log(
    '  • HTML responses instead of JSON → API routes not built as serverless functions',
  );
  console.log('  • 501 errors → Vercel not recognizing route handlers');
  console.log('  • 404 errors → Routes not found in deployment');
  console.log('  • JSON responses with data → Routes working correctly ✅');

  console.log('\n🔧 POTENTIAL FIXES:');
  console.log('  1. Downgrade Next.js to stable version (14.x)');
  console.log('  2. Update vercel.json with explicit function configuration');
  console.log('  3. Remove experimental features from next.config.ts');
  console.log('  4. Ensure all API routes export proper HTTP methods');
  console.log('  5. Clear Vercel build cache and redeploy');
}

// Run the test
runDeploymentTest().catch(console.error);
