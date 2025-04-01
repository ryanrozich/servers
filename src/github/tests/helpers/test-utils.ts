/**
 * Shared test utilities for GitHub MCP server tests
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Get GitHub token from environment variable or token file
 * @returns GitHub token string
 */
export function getGitHubToken(): string {
  // First try environment variable
  const envToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (envToken) return envToken;

  // Then try token file
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir) {
    throw new Error('Could not determine home directory');
  }

  const tokenFile = path.join(homeDir, '.github_token');
  if (fs.existsSync(tokenFile)) {
    const content = fs.readFileSync(tokenFile, 'utf8');
    const match = RegExp(/GITHUB_PERSONAL_ACCESS_TOKEN=(.+)/).exec(content);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  throw new Error(
    'GitHub token not found. Please set GITHUB_PERSONAL_ACCESS_TOKEN environment variable or create ~/.github_token file.'
  );
}

/**
 * Format test output for display
 * @param result Result object to format
 * @returns Formatted string
 */
export function formatTestOutput(result: any): string {
  if (Array.isArray(result)) {
    return `Array with ${result.length} items. First few items:\n${JSON.stringify(result.slice(0, 2), null, 2)}...`;
  }
  
  if (typeof result === 'object' && result !== null) {
    return JSON.stringify(result, null, 2).substring(0, 500) + '...';
  }
  
  return String(result);
}

/**
 * Check if GitHub is still computing statistics
 * @param result API response to check
 * @returns True if GitHub is computing statistics
 */
export function isComputingStatistics(result: any): boolean {
  // Check for 202 Accepted response with message about computing statistics
  if (result && (result.status === 202 || result.message?.includes('computing'))) {
    return true;
  }
  return false;
}

/**
 * Standard test repositories to use in tests
 */
export const testRepos = {
  main: {
    owner: 'modelcontextprotocol',
    repo: 'servers'
  },
  alternative: {
    owner: 'brkthru',
    repo: 'media-tool'
  }
};
