/**
 * E2E tests for PR statistics tools
 * These tests directly call the PR statistics functions with real GitHub API calls
 */

import { getPrVelocityMetrics, getPrSizeDistribution, getPrReviewStatistics } from '../../operations/pr-statistics.js';
import fs from 'fs';
import path from 'path';

// Set timeout to 30 seconds for all tests in this file
jest.setTimeout(30000);

// Repository to test with
const OWNER = 'modelcontextprotocol';
const REPO = 'servers';

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

describe('PR Statistics E2E Tests', () => {
  // Make sure GitHub token is available
  beforeAll(() => {
    // Check if GitHub token is provided
    if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      console.warn('Warning: GITHUB_PERSONAL_ACCESS_TOKEN not set. Tests may fail.');
    }
  });

  describe('PR Velocity Metrics', () => {
    it('should return velocity metrics for a repository', async () => {
      console.time('getPrVelocityMetrics');
      const result = await getPrVelocityMetrics(OWNER, REPO);
      console.timeEnd('getPrVelocityMetrics');
      
      // Save the result to a file
      saveTestResult('pr-velocity-metrics.json', result);
      
      expect(result).toBeDefined();
      expect(result.total_prs).toBeGreaterThan(0);
      expect(result.time_range).toBeDefined();
    });

    it('should return velocity metrics with date range', async () => {
      console.time('getPrVelocityMetrics-withDateRange');
      const result = await getPrVelocityMetrics(
        OWNER, 
        REPO, 
        { since: '2023-01-01', until: '2025-03-01', state: 'all' }
      );
      console.timeEnd('getPrVelocityMetrics-withDateRange');
      
      // Save the result to a file
      saveTestResult('pr-velocity-metrics-with-date-range.json', result);
      
      expect(result).toBeDefined();
      expect(result.time_range.since).toBe('2023-01-01');
      expect(result.time_range.until).toBe('2025-03-01');
    });
  });

  describe('PR Size Distribution', () => {
    it('should return size distribution with a small limit', async () => {
      console.time('getPrSizeDistribution-smallLimit');
      const result = await getPrSizeDistribution(OWNER, REPO, { limit: 10, state: 'closed' });
      console.timeEnd('getPrSizeDistribution-smallLimit');
      
      // Save the result to a file
      saveTestResult('pr-size-distribution-small-limit.json', result);
      
      expect(result).toBeDefined();
      expect(result.analyzed_prs).toBeLessThanOrEqual(10);
      expect(result.size_distribution).toBeDefined();
    });
  });

  describe('PR Review Statistics', () => {
    it('should return review statistics for a repository', async () => {
      console.time('getPrReviewStatistics');
      const result = await getPrReviewStatistics(OWNER, REPO);
      console.timeEnd('getPrReviewStatistics');
      
      // Save the result to a file
      saveTestResult('pr-review-statistics.json', result);
      
      expect(result).toBeDefined();
      expect(result.analyzed_prs).toBeGreaterThanOrEqual(0);
    });

    it('should return review statistics for closed PRs only', async () => {
      console.time('getPrReviewStatistics-closedOnly');
      const result = await getPrReviewStatistics(OWNER, REPO, { state: 'closed', limit: 100 });
      console.timeEnd('getPrReviewStatistics-closedOnly');
      
      // Save the result to a file
      saveTestResult('pr-review-statistics-closed-only.json', result);
      
      expect(result).toBeDefined();
      expect(result.analyzed_prs).toBeGreaterThanOrEqual(0);
    });
  });
});
