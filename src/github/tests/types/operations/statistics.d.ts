/**
 * Type declarations for repository statistics operations
 */

declare module '../../dist/operations/statistics.js' {
  /**
   * Get weekly additions and deletions for a repository
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @returns Weekly commit activity data
   */
  export function getWeeklyCommitActivity(
    owner: string,
    repo: string
  ): Promise<any>;

  /**
   * Get the last year of commit activity grouped by week
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @returns Yearly commit activity data
   */
  export function getYearlyCommitActivity(
    owner: string,
    repo: string
  ): Promise<any>;

  /**
   * Get commit statistics for each contributor to a repository
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @returns Contributor statistics data
   */
  export function getContributorCommitActivity(
    owner: string,
    repo: string
  ): Promise<any>;

  /**
   * Get weekly commit counts for the repository owner and all contributors
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @returns Weekly commit count data
   */
  export function getWeeklyCommitCount(
    owner: string,
    repo: string
  ): Promise<any>;

  /**
   * Get hourly commit counts for each day of the week
   * @param owner Repository owner (username or organization)
   * @param repo Repository name
   * @returns Hourly commit count data
   */
  export function getHourlyCommitCount(
    owner: string,
    repo: string
  ): Promise<any>;
}
