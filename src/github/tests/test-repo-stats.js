// Simple test script for repository statistics tools
// This script uses the compiled JavaScript files in the dist directory
import { 
  getWeeklyCommitActivity,
  getYearlyCommitActivity,
  getContributorCommitActivity,
  getWeeklyCommitCount,
  getHourlyCommitCount
} from '../dist/operations/statistics.js';

// We don't need a retry function anymore since the API now returns a structured response for 202 status

// Check if GitHub token is provided
if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  console.error('Error: GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.');
  console.error('Please set your GitHub token using: export GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>');
  process.exit(1);
}

// Repository to test with
const owner = 'brkthru';
const repo = 'media-tool';

// Function to run a test and log the result
async function runTest(name, fn, params) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('Parameters:', params);
  
  try {
    const result = await fn(...params);
    console.log('✅ Test passed!');
    console.log('Result preview:');
    
    // Check if this is a 202 computing response
    if (result && typeof result === 'object' && 'isComputing' in result && result.isComputing) {
      console.log(`🕐 ${result.message}`);
      console.log(`URL: ${result.url}`);
      console.log(`Status: ${result.status}`);
      console.log('To get results, wait a few minutes and run the test again.');
      return true;
    }
    
    // Check if this is an empty statistics response
    if (result && typeof result === 'object' && 'isEmpty' in result && result.isEmpty) {
      console.log(`🕐 ${result.message}`);
      console.log(`URL: ${result.url}`);
      console.log(`Status: ${result.status}`);
      console.log('This could be because GitHub is still computing the statistics or there is no data available.');
      console.log('If you believe there should be data, wait a few minutes and run the test again.');
      return true;
    }
    
    // Handle different result formats appropriately
    if (Array.isArray(result)) {
      if (result.length === 0) {
        console.log(`API returned an empty array. This may be because:
- The repository is new or has limited history
- GitHub has not yet computed these statistics
- There is no data available for this metric`);
      } else {
        console.log(`Array with ${result.length} items. First few items:`);
        console.log(JSON.stringify(result.slice(0, 2), null, 2) + '...');
      }
    } else if (typeof result === 'object' && Object.keys(result).length === 0) {
      console.log(`API returned an empty object. This may be because:
- The repository is new or has limited history
- GitHub has not yet computed these statistics
- There is no data available for this metric`);
    } else {
      console.log(JSON.stringify(result, null, 2).substring(0, 500) + '...');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.message);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Repository statistics tools tests\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test weekly commit activity
  totalTests++;
  if (await runTest(
    'Weekly Commit Activity',
    getWeeklyCommitActivity,
    [owner, repo]
  )) passedTests++;
  
  // Test yearly commit activity
  totalTests++;
  if (await runTest(
    'Yearly Commit Activity',
    getYearlyCommitActivity,
    [owner, repo]
  )) passedTests++;
  
  // Test contributor commit activity
  totalTests++;
  if (await runTest(
    'Contributor Commit Activity',
    getContributorCommitActivity,
    [owner, repo]
  )) passedTests++;
  
  // Test weekly commit count
  totalTests++;
  if (await runTest(
    'Weekly Commit Count',
    getWeeklyCommitCount,
    [owner, repo]
  )) passedTests++;
  
  // Test hourly commit count
  totalTests++;
  if (await runTest(
    'Hourly Commit Count',
    getHourlyCommitCount,
    [owner, repo]
  )) passedTests++;
  
  // Print summary
  console.log(`\n🏁 Tests completed: ${passedTests}/${totalTests} passed\n`);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
