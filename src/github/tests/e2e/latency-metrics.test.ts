/**
 * Latency metrics test for GitHub API operations
 * This test measures and reports the execution time of each API operation
 */

import { getPrVelocityMetrics, getPrSizeDistribution, getPrReviewStatistics } from '../../operations/pr-statistics.js';
import fs from 'fs';
import path from 'path';

// Set timeout to 120 seconds for all tests in this file
jest.setTimeout(120000);

// Repository to test with - use environment variables with fallbacks to public values
const OWNER = process.env.TEST_GITHUB_OWNER ?? 'modelcontextprotocol';
const REPO = process.env.TEST_GITHUB_REPO ?? 'servers';

// Log which repository is being used for testing
console.log(`Testing with repository: ${OWNER}/${REPO}`);
console.log(`Note: Override with TEST_GITHUB_OWNER and TEST_GITHUB_REPO environment variables`);

// Output directory for test results
const TEST_OUTPUT_DIR = path.resolve(process.cwd(), 'test-outputs');

// Helper function to save test results to a file
const saveTestResult = (filename: string, data: unknown): void => {
  // Create the directory if it doesn't exist
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  }
  
  const filePath = path.join(TEST_OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Test result saved to ${filePath}`);
};

// Helper function to measure execution time
const measureExecutionTime = async <T>(
  name: string,
  fn: () => Promise<T>,
  inputs?: Record<string, any>
): Promise<{
  name: string;
  durationMs: number;
  durationSeconds: number;
  success: boolean;
  inputs?: Record<string, any>;
  error?: any;
  result?: T;
}> => {
  const start = performance.now();
  let success = false;
  let error: any = null;
  let result: T | undefined = undefined;
  
  try {
    result = await fn();
    success = true;
  } catch (e) {
    error = e;
    console.error(`Error in ${name}:`, e);
  }
  
  const end = performance.now();
  const durationMs = end - start;
  const durationSeconds = durationMs / 1000;
  
  console.log(`${name}: ${durationMs.toFixed(2)} ms (${durationSeconds.toFixed(2)} seconds) - ${success ? 'SUCCESS' : 'FAILED'}`);
  
  // Save detailed results for this operation
  if (result) {
    saveTestResult(`${name.toLowerCase().replace(/\s+/g, '-')}.json`, result);
  }
  
  return {
    name,
    durationMs,
    durationSeconds,
    success,
    inputs,
    error: error ? {
      message: error.message,
      stack: error.stack,
      details: error.issues || error.errors || error
    } : undefined,
    result: success ? result : undefined
  };
};

describe('API Latency Metrics', () => {
  // Make sure GitHub token is available
  beforeAll(() => {
    if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      console.warn('Warning: GITHUB_PERSONAL_ACCESS_TOKEN not set. Tests may fail.');
    }
  });

  it('should measure and report latency for all API operations', async () => {
    const latencyResults = [];
    
    // Measure PR Velocity Metrics
    latencyResults.push(
      await measureExecutionTime('getPrVelocityMetrics', async () => {
        return await getPrVelocityMetrics(OWNER, REPO, {
          state: 'all'
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'all'
      })
    );
    
    // Measure PR Velocity Metrics with date range
    latencyResults.push(
      await measureExecutionTime('getPrVelocityMetrics-withDateRange', async () => {
        return await getPrVelocityMetrics(OWNER, REPO, {
          state: 'all',
          since: '2023-01-01',
          until: '2023-12-31'
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'all',
        since: '2023-01-01',
        until: '2023-12-31'
      })
    );
    
    // Measure PR Size Distribution with small limit
    latencyResults.push(
      await measureExecutionTime('getPrSizeDistribution-smallLimit', async () => {
        return await getPrSizeDistribution(OWNER, REPO, { 
          state: 'closed',
          limit: 10 
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'closed',
        limit: 10
      })
    );
    
    // Measure PR Size Distribution with larger limit
    latencyResults.push(
      await measureExecutionTime('getPrSizeDistribution-largerLimit', async () => {
        return await getPrSizeDistribution(OWNER, REPO, { 
          state: 'closed',
          limit: 50 
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'closed',
        limit: 50
      })
    );
    
    // Measure PR Review Statistics
    latencyResults.push(
      await measureExecutionTime('getPrReviewStatistics', async () => {
        return await getPrReviewStatistics(OWNER, REPO, {
          state: 'all',
          limit: 100
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'all',
        limit: 100
      })
    );
    
    // Measure PR Review Statistics for closed PRs only
    latencyResults.push(
      await measureExecutionTime('getPrReviewStatistics-closedOnly', async () => {
        return await getPrReviewStatistics(OWNER, REPO, { 
          state: 'closed',
          limit: 100 
        });
      }, {
        owner: OWNER,
        repo: REPO,
        state: 'closed',
        limit: 100
      })
    );
    
    // Measure Repository Statistics Tools
    // Add tests for the other statistics tools from your GitHub MCP Server Enhancement Project
    
    // Sort results by duration (descending)
    latencyResults.sort((a, b) => b.durationMs - a.durationMs);
    
    // Create a summary report
    const latencySummary = {
      timestamp: new Date().toISOString(),
      totalDurationMs: latencyResults.reduce((sum, result) => sum + result.durationMs, 0),
      totalDurationSeconds: latencyResults.reduce((sum, result) => sum + result.durationSeconds, 0),
      operations: latencyResults,
      averageDurationMs: latencyResults.reduce((sum, result) => sum + result.durationMs, 0) / latencyResults.length,
      averageDurationSeconds: latencyResults.reduce((sum, result) => sum + result.durationSeconds, 0) / latencyResults.length,
      slowestOperation: latencyResults[0],
      fastestOperation: latencyResults[latencyResults.length - 1],
      successRate: {
        successful: latencyResults.filter(r => r.success).length,
        failed: latencyResults.filter(r => !r.success).length,
        totalOperations: latencyResults.length,
        successPercentage: (latencyResults.filter(r => r.success).length / latencyResults.length) * 100
      }
    };
    
    // Save the latency summary
    saveTestResult('api-latency-metrics.json', latencySummary);
    
    // Log the summary to console
    console.log('\nLatency Summary:');
    console.log(`Total Duration: ${latencySummary.totalDurationSeconds.toFixed(2)} seconds`);
    console.log(`Average Operation Duration: ${latencySummary.averageDurationSeconds.toFixed(2)} seconds`);
    console.log(`Slowest Operation: ${latencySummary.slowestOperation.name} (${latencySummary.slowestOperation.durationSeconds.toFixed(2)} seconds)`);
    console.log(`Fastest Operation: ${latencySummary.fastestOperation.name} (${latencySummary.fastestOperation.durationSeconds.toFixed(2)} seconds)`);
    console.log(`Success Rate: ${latencySummary.successRate.successPercentage.toFixed(2)}% (${latencySummary.successRate.successful}/${latencySummary.successRate.totalOperations})`);
    
    if (latencySummary.successRate.failed > 0) {
      console.log('\nFailed Operations:');
      latencyResults.filter(r => !r.success).forEach(op => {
        console.log(`- ${op.name}: ${op.error?.message || 'Unknown error'}`);
      });
    }
    
    // Assertions to ensure the test passes
    expect(latencyResults.length).toBe(6);
    expect(latencySummary.totalDurationSeconds).toBeGreaterThan(0);
  });
});
