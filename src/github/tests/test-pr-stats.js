// Simple test script for GitHub statistics tools
// This script uses the compiled JavaScript files in the dist directory
import { getPrVelocityMetrics, getPrSizeDistribution, getPrReviewStatistics } from '../dist/operations/pr-statistics.js';
import { 
  getWeeklyCommitActivity,
  getYearlyCommitActivity,
  getContributorCommitActivity,
  getWeeklyCommitCount,
  getHourlyCommitCount
} from '../dist/operations/statistics.js';

// Check if GitHub token is provided
if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  console.error('Error: GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.');
  console.error('Please set your GitHub token using: export GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>');
  process.exit(1);
}

// Repository to test with
// const owner = 'modelcontextprotocol';
// const repo = 'servers';
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
    
    // Handle different result formats appropriately
    if (Array.isArray(result)) {
      console.log(`Array with ${result.length} items. First few items:`);
      console.log(JSON.stringify(result.slice(0, 2), null, 2) + '...');
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
  console.log('\n🚀 Starting PR statistics tools tests\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test PR velocity metrics
  totalTests++;
  if (await runTest(
    'PR Velocity Metrics - Basic',
    getPrVelocityMetrics,
    [owner, repo]
  )) passedTests++;
  
  totalTests++;
  if (await runTest(
    'PR Velocity Metrics - With Date Range',
    getPrVelocityMetrics,
    [owner, repo, '2023-01-01', '2025-03-01']
  )) passedTests++;
  
  // Test PR size distribution
  totalTests++;
  if (await runTest(
    'PR Size Distribution - Basic',
    getPrSizeDistribution,
    [owner, repo]
  )) passedTests++;
  
  totalTests++;
  if (await runTest(
    'PR Size Distribution - With Limit',
    getPrSizeDistribution,
    [owner, repo, undefined, undefined, undefined, 5]
  )) passedTests++;
  
  // Test PR review statistics
  totalTests++;
  if (await runTest(
    'PR Review Statistics - Basic',
    getPrReviewStatistics,
    [owner, repo]
  )) passedTests++;
  
  totalTests++;
  if (await runTest(
    'PR Review Statistics - Closed PRs Only',
    getPrReviewStatistics,
    [owner, repo, undefined, undefined, 'closed']
  )) passedTests++;
  
  // Print summary
  console.log(`\n🏁 Tests completed: ${passedTests}/${totalTests} passed\n`);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
