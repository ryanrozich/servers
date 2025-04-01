/**
 * Type declarations for PR statistics operations
 */

declare module '../../dist/operations/pr-statistics.js' {
  /**
   * Get PR velocity metrics including time to merge, time to first review, and PR throughput
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @param since Start date in ISO 8601 format (YYYY-MM-DD)
   * @param until End date in ISO 8601 format (YYYY-MM-DD)
   * @param state State of PRs to analyze ('open', 'closed', 'all')
   * @param base Filter by base branch name
   * @returns PR velocity metrics
   */
  export function getPrVelocityMetrics(
    owner: string,
    repo: string,
    since?: string,
    until?: string,
    state?: 'open' | 'closed' | 'all',
    base?: string
  ): Promise<any>;

  /**
   * Get PR size distribution metrics including file changes, additions, and deletions
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @param since Start date in ISO 8601 format (YYYY-MM-DD)
   * @param until End date in ISO 8601 format (YYYY-MM-DD)
   * @param state State of PRs to analyze ('open', 'closed', 'all')
   * @param limit Maximum number of PRs to analyze
   * @returns PR size distribution metrics
   */
  export function getPrSizeDistribution(
    owner: string,
    repo: string,
    since?: string,
    until?: string,
    state?: 'open' | 'closed' | 'all',
    limit?: number
  ): Promise<any>;

  /**
   * Get PR review statistics including approval rates, review times, and comment density
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @param since Start date in ISO 8601 format (YYYY-MM-DD)
   * @param until End date in ISO 8601 format (YYYY-MM-DD)
   * @param state State of PRs to analyze ('open', 'closed', 'all')
   * @param limit Maximum number of PRs to analyze
   * @returns PR review statistics
   */
  export function getPrReviewStatistics(
    owner: string,
    repo: string,
    since?: string,
    until?: string,
    state?: 'open' | 'closed' | 'all',
    limit?: number
  ): Promise<any>;
}
