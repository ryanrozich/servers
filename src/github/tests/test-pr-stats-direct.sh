#!/bin/bash

# Direct test script for PR statistics tools
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

# Make sure we're in the GitHub directory
cd "$(dirname "$0")/.." || exit 1

# Create a temporary test file
TEST_FILE="$(mktemp).js"

# Function to run a test and check the result
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
import { $tool } from './dist/operations/pr-statistics.js';

// Set up environment variable
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = '$GITHUB_PERSONAL_ACCESS_TOKEN';

// Parse parameters
const params = $params;

// Call the function
$tool(params.owner, params.repo, params.since, params.until, params.state, params.limit, params.base)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
EOF
  
  # Run the test script
  result=$(node --experimental-modules "$TEST_FILE")
  
  # Check if the command succeeded
  if [ $? -eq 0 ]; then
    echo "✅ Test passed!"
    echo "Result preview (truncated):"
    echo "${result:0:500}..."
  else
    echo "❌ Test failed!"
    echo "$result"
  fi
}

echo "\n🚀 Starting PR statistics tools tests\n"

# Make sure the code is built
echo "Building TypeScript code..."
npm run build

# Test PR velocity metrics
run_test "getPrVelocityMetrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Velocity Metrics - Basic"

run_test "getPrVelocityMetrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"since\":\"2023-01-01\",\"until\":\"2025-03-01\"}" \
  "PR Velocity Metrics - With Date Range"

# Test PR size distribution
run_test "getPrSizeDistribution" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Size Distribution - Basic"

run_test "getPrSizeDistribution" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"limit\":5}" \
  "PR Size Distribution - With Limit"

# Test PR review statistics
run_test "getPrReviewStatistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Review Statistics - Basic"

run_test "getPrReviewStatistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"state\":\"closed\"}" \
  "PR Review Statistics - Closed PRs Only"

# Clean up
rm -f "$TEST_FILE"

echo "\n🏁 All tests completed!\n"
