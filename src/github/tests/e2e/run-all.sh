#!/bin/bash

# Run all E2E tests for GitHub MCP server

echo "🚀 Running all GitHub MCP server E2E tests..."

# Store the current directory
CURRENT_DIR=$(pwd)

# Change to the script directory
cd "$(dirname "$0")" || exit 1

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0

# Run Docker-based PR statistics tests
echo "\n📋 Running Docker-based PR statistics tests..."
if bash ./test-pr-statistics.sh; then
  echo "✅ Docker-based PR statistics tests passed"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Docker-based PR statistics tests failed"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Run direct PR statistics tests
echo "\n📋 Running direct PR statistics tests..."
if bash ./test-pr-stats-direct.sh; then
  echo "✅ Direct PR statistics tests passed"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Direct PR statistics tests failed"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Return to the original directory
cd "$CURRENT_DIR" || exit 1

# Print summary
echo "\n🏁 E2E tests completed: $PASSED_TESTS/$TOTAL_TESTS passed\n"

# Return non-zero exit code if any tests failed
if [ $PASSED_TESTS -lt $TOTAL_TESTS ]; then
  exit 1
fi

exit 0
