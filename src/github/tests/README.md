# GitHub MCP Server Tests

This directory contains automated tests for the GitHub MCP server. The tests are organized into separate directories based on their type and purpose.

## Test Directory Structure

```
tests/
├── unit/            # Unit tests that mock dependencies
├── integration/     # Integration tests that interact with real APIs
├── e2e/             # End-to-end tests, including shell scripts
├── fixtures/        # Test data and mock responses
├── helpers/         # Shared test utilities
└── types/           # TypeScript type declarations for tests
```

## Test Types

### Unit Tests

Unit tests focus on testing individual functions in isolation by mocking all external dependencies. These tests are fast and reliable, making them ideal for continuous integration.

**Location:** `tests/unit/`

**Run with:**
```bash
npm test -- tests/unit
# Or using Jest directly
npx jest tests/unit
```

### Integration Tests

Integration tests interact with the real GitHub API to verify that our functions work correctly with the actual API responses. These tests require a valid GitHub token and may be affected by rate limiting.

**Location:** `tests/integration/`

**Run with:**
```bash
npm test -- tests/integration
# Or using Jest directly
npx jest tests/integration
```

### End-to-End Tests

End-to-end tests verify the entire system works together, including the CLI interface and Docker container. These tests use shell scripts to run commands and verify their output.

**Location:** `tests/e2e/`

**Run with:**
```bash
# Run all E2E tests
bash tests/e2e/run-all.sh

# Or run specific E2E tests
bash tests/e2e/test-pr-statistics.sh
bash tests/e2e/test-pr-stats-direct.sh
```

## Test Utilities

Shared test utilities are located in the `tests/helpers/` directory. These utilities include functions for retrieving GitHub tokens, formatting test output, and other common testing tasks.

## Test Fixtures

Test fixtures are located in the `tests/fixtures/` directory. These include mock API responses and other test data used by the unit tests.

## GitHub Token

Many tests require a valid GitHub token to interact with the GitHub API. You can provide this token in one of two ways:

1. Set the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable:
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   ```

2. Create a `.github_token` file in your home directory with the following content:
   ```
   GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   ```

## Handling GitHub API Rate Limits

Some tests interact with the GitHub API and may be affected by rate limiting. If you encounter rate limit issues, consider:

1. Using a personal access token with higher rate limits
2. Running fewer tests at once
3. Adding delays between tests

## Repository Statistics Computation

Some repository statistics endpoints in the GitHub API return a 202 status code when the statistics are being computed. The tests handle this by checking for this status code and providing appropriate feedback.

## Continuous Integration

The tests are designed to run in a CI environment. The unit tests can run without any external dependencies, while the integration and E2E tests require a valid GitHub token.
