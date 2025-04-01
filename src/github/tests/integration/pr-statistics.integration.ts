/**
 * Integration tests for PR statistics tools
 * These tests make real API calls to GitHub
 */

// Import the functions dynamically to avoid TypeScript errors
// @ts-ignore
import { getGitHubToken, formatTestOutput, testRepos } from '../helpers/test-utils.js';

// Set up environment variable
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = getGitHubToken();

// Repository to test with
const { owner, repo } = testRepos.alternative;

// Dynamically import the functions we want to test
let getPrVelocityMetrics: any;
let getPrSizeDistribution: any;
let getPrReviewStatistics: any;

// Import the functions before running tests
async function importFunctions() {
  // @ts-ignore - Ignore missing type declarations for the imported module
  const module = await import('../../operations/pr-statistics.js');
  getPrVelocityMetrics = module.getPrVelocityMetrics;
  getPrSizeDistribution = module.getPrSizeDistribution;
  getPrReviewStatistics = module.getPrReviewStatistics;
}

/**
 * Run a test and log the result
 * @param name Test name
 * @param fn Function to test
 * @param params Parameters to pass to the function
 * @returns Promise resolving to a boolean indicating if the test passed
 */
async function runTest(name: string, fn: Function, params: any[]): Promise<boolean> {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('Parameters:', params);
  
  try {
    const result = await fn(...params);
    console.log('✅ Test passed!');
    console.log('Result preview:');
    console.log(formatTestOutput(result));
    return true;
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting PR statistics tools integration tests\n');
  
  // First import the functions
  await importFunctions();
  
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
    [owner, repo, { since: '2023-01-01', until: '2025-03-01' }]
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
    [owner, repo, { limit: 5 }]
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
    [owner, repo, { state: 'closed' }]
  )) passedTests++;
  
  // Print summary
  console.log(`\n🏁 Tests completed: ${passedTests}/${totalTests} passed\n`);
  
  // Return non-zero exit code if any tests failed
  if (passedTests < totalTests) {
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
