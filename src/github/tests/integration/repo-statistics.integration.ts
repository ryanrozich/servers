/**
 * Integration tests for repository statistics tools
 * These tests make real API calls to GitHub
 */

// Import the functions dynamically to avoid TypeScript errors
// @ts-ignore
import { getGitHubToken, formatTestOutput, testRepos, isComputingStatistics } from '../helpers/test-utils.js';

// Set up environment variable
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = getGitHubToken();

// Repository to test with
const { owner, repo } = testRepos.alternative;

// Dynamically import the functions we want to test
let getWeeklyCommitActivity: any;
let getYearlyCommitActivity: any;
let getContributorCommitActivity: any;
let getWeeklyCommitCount: any;
let getHourlyCommitCount: any;

// Import the functions before running tests
async function importFunctions() {
  // @ts-ignore - Ignore missing type declarations for the imported module
  const module = await import('../../operations/statistics.js');
  getWeeklyCommitActivity = module.getWeeklyCommitActivity;
  getYearlyCommitActivity = module.getYearlyCommitActivity;
  getContributorCommitActivity = module.getContributorCommitActivity;
  getWeeklyCommitCount = module.getWeeklyCommitCount;
  getHourlyCommitCount = module.getHourlyCommitCount;
}

/**
 * Run a test and log the result
 * @param name Test name
 * @param fn Function to test
 * @param params Parameters to pass to the function
 * @returns Promise resolving to a boolean indicating if the test passed
 */
async function runTest(name: string, fn: Function, params: any[]): Promise<boolean> {
  console.log(`\nud83euddea Testing: ${name}`);
  console.log('Parameters:', params);
  
  try {
    const result = await fn(...params);
    console.log('u2705 Test passed!');
    console.log('Result preview:');
    
    // Check if this is a 202 computing response
    if (isComputingStatistics(result)) {
      console.log(`ud83dudd52 ${result.message || 'GitHub is computing statistics. Please try again later.'}`);
      if (result.url) console.log(`URL: ${result.url}`);
      if (result.status) console.log(`Status: ${result.status}`);
      console.log('To get results, wait a few minutes and run the test again.');
      return true;
    }
    
    // Handle different result formats appropriately
    console.log(formatTestOutput(result));
    return true;
  } catch (error) {
    console.error('u274c Test failed!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log('\nud83dude80 Starting Repository statistics tools integration tests\n');
  
  // First import the functions
  await importFunctions();
  
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
  console.log(`\nud83cudfc1 Tests completed: ${passedTests}/${totalTests} passed\n`);
  
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
