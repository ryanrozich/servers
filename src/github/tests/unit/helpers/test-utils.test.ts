/**
 * Unit tests for test utilities
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { getGitHubToken, formatTestOutput, isComputingStatistics, testRepos } from '../../helpers/test-utils.js';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('Test Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getGitHubToken', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Save original process.env
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original process.env
      process.env = originalEnv;
    });

    test('should return token from environment variable', () => {
      // Setup
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'test-token-from-env';

      // Execute
      const token = getGitHubToken();

      // Verify
      expect(token).toBe('test-token-from-env');
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    test('should return token from token file if environment variable is not set', () => {
      // Setup
      delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      process.env.HOME = '/home/user';
      
      // Mock path.join to return a predictable path
      jest.mocked(path.join).mockReturnValue('/home/user/.github_token');
      
      // Mock fs.existsSync to return true
      jest.mocked(fs.existsSync).mockReturnValue(true);
      
      // Mock fs.readFileSync to return a token
      jest.mocked(fs.readFileSync).mockReturnValue('GITHUB_PERSONAL_ACCESS_TOKEN=test-token-from-file');

      // Execute
      const token = getGitHubToken();

      // Verify
      expect(token).toBe('test-token-from-file');
      expect(fs.existsSync).toHaveBeenCalledWith('/home/user/.github_token');
      expect(fs.readFileSync).toHaveBeenCalledWith('/home/user/.github_token', 'utf8');
    });

    test('should throw error if token is not found', () => {
      // Setup
      delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      process.env.HOME = '/home/user';
      
      // Mock path.join to return a predictable path
      jest.mocked(path.join).mockReturnValue('/home/user/.github_token');
      
      // Mock fs.existsSync to return false
      jest.mocked(fs.existsSync).mockReturnValue(false);

      // Execute & Verify
      expect(() => getGitHubToken()).toThrow('GitHub token not found');
    });

    test('should throw error if home directory cannot be determined', () => {
      // Setup
      delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      delete process.env.HOME;
      delete process.env.USERPROFILE;

      // Execute & Verify
      expect(() => getGitHubToken()).toThrow('Could not determine home directory');
    });
  });

  describe('formatTestOutput', () => {
    test('should format array output', () => {
      // Setup
      const arrayData = [1, 2, 3, 4, 5];

      // Execute
      const formatted = formatTestOutput(arrayData);

      // Verify
      expect(formatted).toContain('Array with 5 items');
      expect(formatted).toContain('1');
      expect(formatted).toContain('2');
    });

    test('should format object output', () => {
      // Setup
      const objectData = { a: 1, b: 2, c: { d: 3 } };

      // Execute
      const formatted = formatTestOutput(objectData);

      // Verify
      expect(formatted).toContain('"a": 1');
      expect(formatted).toContain('"b": 2');
      expect(formatted).toContain('"c"');
    });

    test('should handle primitive values', () => {
      // Setup & Execute
      const stringFormatted = formatTestOutput('test string');
      const numberFormatted = formatTestOutput(42);
      const booleanFormatted = formatTestOutput(true);

      // Verify
      expect(stringFormatted).toBe('test string');
      expect(numberFormatted).toBe('42');
      expect(booleanFormatted).toBe('true');
    });
  });

  describe('isComputingStatistics', () => {
    test('should return true for 202 status response', () => {
      // Setup
      const response = { status: 202, message: 'GitHub is computing statistics' };

      // Execute
      const result = isComputingStatistics(response);

      // Verify
      expect(result).toBe(true);
    });

    test('should return true for response with computing message', () => {
      // Setup
      const response = { message: 'GitHub is computing statistics for this repository' };

      // Execute
      const result = isComputingStatistics(response);

      // Verify
      expect(result).toBe(true);
    });

    test('should return false for regular response', () => {
      // Setup
      const response = { data: [1, 2, 3] };

      // Execute
      const result = isComputingStatistics(response);

      // Verify
      expect(result).toBe(false);
    });

    test('should handle null or undefined input', () => {
      // Execute & Verify
      expect(isComputingStatistics(null)).toBe(false);
      expect(isComputingStatistics(undefined)).toBe(false);
    });
  });

  describe('testRepos', () => {
    test('should have main and alternative repositories defined', () => {
      // Verify
      expect(testRepos).toHaveProperty('main');
      expect(testRepos).toHaveProperty('alternative');
      expect(testRepos.main).toHaveProperty('owner');
      expect(testRepos.main).toHaveProperty('repo');
      expect(testRepos.alternative).toHaveProperty('owner');
      expect(testRepos.alternative).toHaveProperty('repo');
    });
  });
});
