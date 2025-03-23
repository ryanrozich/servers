#!/bin/bash

# Test script for PR statistics tools
# This script tests the PR statistics tools using the Docker container

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

# Function to run a test and check the result
run_test() {
  local tool=$1
  local params=$2
  local description=$3
  
  echo "\n🧪 Testing: $description"
  echo "Tool: $tool"
  echo "Parameters: $params"
  
  # Run the command using Docker
  result=$(docker run -i --rm \
    -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PERSONAL_ACCESS_TOKEN \
    mcp/github $tool $params)
  
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

# Build the Docker image if it doesn't exist
if ! docker images | grep -q "mcp/github"; then
  echo "Building Docker image..."
  # Navigate to the servers root directory to build with the correct context
  cd "$(dirname "$0")/../../.."
  echo "Building from $(pwd)"
  
  # Build the Docker image with the correct context
  docker build -t mcp/github -f src/github/Dockerfile .
  
  if [ $? -ne 0 ]; then
    echo "Failed to build Docker image. Exiting."
    exit 1
  fi
  
  # Return to the original directory
  cd - > /dev/null
fi

echo "\n🚀 Starting PR statistics tools tests\n"

# Test PR velocity metrics
run_test "get_pr_velocity_metrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Velocity Metrics - Basic"

run_test "get_pr_velocity_metrics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"since\":\"2023-01-01\",\"until\":\"2025-03-01\"}" \
  "PR Velocity Metrics - With Date Range"

# Test PR size distribution
run_test "get_pr_size_distribution" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Size Distribution - Basic"

run_test "get_pr_size_distribution" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"limit\":5}" \
  "PR Size Distribution - With Limit"

# Test PR review statistics
run_test "get_pr_review_statistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  "PR Review Statistics - Basic"

run_test "get_pr_review_statistics" "{\"owner\":\"$OWNER\",\"repo\":\"$REPO\",\"state\":\"closed\"}" \
  "PR Review Statistics - Closed PRs Only"

echo "\n🏁 All tests completed!\n"
