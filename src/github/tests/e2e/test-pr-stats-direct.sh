#!/bin/bash

# E2E direct test script for PR statistics tools
# This script tests the PR statistics tools directly using Node.js

# Check if GitHub token is provided
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  # Check if ~/.github_token exists and try to source it
  if [ -f "$HOME/.github_token" ]; then
    echo "Found ~/.github_token file, attempting to load token..."
    # Read the token from the file
    TOKEN_LINE=$(grep GITHUB_PERSONAL_ACCESS_TOKEN ~/.github_token)
    if [ -n "$TOKEN_LINE" ]; then
      # Extract the token value (everything after the = sign)
      export GITHUB_PERSONAL_ACCESS_TOKEN="${TOKEN_LINE#*=}"
      echo "Successfully loaded GitHub token from ~/.github_token"
    else
      echo "Error: Could not find GITHUB_PERSONAL_ACCESS_TOKEN in ~/.github_token"
      echo "Please ensure the file contains: GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>"
      exit 1
    fi
  else
    echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set."
    echo "Please set your GitHub token using: export GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>"
    echo "Or create a ~/.github_token file with: GITHUB_PERSONAL_ACCESS_TOKEN=<your_token>"
    exit 1
  fi
fi

# Repository to test with
OWNER="modelcontextprotocol"
REPO="servers"

# Create a temporary file for the test script with .js extension
TEST_FILE="$(mktemp).js"

# Get the project root directory (3 levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "$0")/../../" && pwd)"

run_test() {
  local tool=$1
  local params=$2
  local description=$3
  
  echo "\n🧪 Testing: $description"
  echo "Tool: $tool"
  echo "Parameters: $params"
  
  # Create a temporary test script
  cat > "$TEST_FILE" << EOF
// Test script for $tool
import { $tool } from '${PROJECT_ROOT}/dist/operations/pr-statistics.js';

// Set up environment variable
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = '$GITHUB_PERSONAL_ACCESS_TOKEN';

// Parse parameters
const params = $params;

// Measure execution time
console.time('$tool');

// Call the function
$tool(params.owner, params.repo, params.since, params.until, params.state, params.limit, params.base)
  .then(result => {
    console.timeEnd('$tool');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.timeEnd('$tool');
    console.error('Error:', error.message);
    process.exit(1);
  });
EOF
  
  # Start timing
  start_time=$(date +%s)
  
  # Run the test script
  result=$(node --experimental-modules "$TEST_FILE")
  
  # End timing
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  # Check if the command succeeded
  if [ $? -eq 0 ]; then
    echo "✅ Test passed! (took ${duration}s)"
    echo "Result preview (truncated):"
    echo "${result:0:500}..."
  else
    echo "❌ Test failed! (took ${duration}s)"
    echo "$result"
  fi
}

echo "\n🚀 Starting PR statistics tools direct E2E tests\n"

# Make sure the code is built
echo "Building TypeScript code..."
cd "$PROJECT_ROOT" && npx tsc

# Test PR Velocity Metrics
run_test "getPrVelocityMetrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
"PR Velocity Metrics - Basic"

run_test "getPrVelocityMetrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"since\":\"2023-01-01\",\"until\":\"2025-03-01\"}" \
"PR Velocity Metrics - With Date Range"

# Test PR Size Distribution
run_test "getPrSizeDistribution" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"limit\":10}" \
"PR Size Distribution - With Small Limit"

# Test PR Review Statistics
run_test "getPrReviewStatistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
"PR Review Statistics - Basic"

run_test "getPrReviewStatistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"state\":\"closed\"}" \
"PR Review Statistics - Closed PRs Only"

echo "\n🏁 All direct E2E tests completed!\n"

# Clean up
rm -f "$TEST_FILE"

# Return to original directory
cd - > /dev/null
