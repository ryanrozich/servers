import { z } from "zod";
import { githubRequest, getAllPaginatedResults } from "../common/utils.js";

// Schema for repository statistics endpoints
export const RepoStatsSchema = z.object({
  owner: z.string(),
  repo: z.string()
});

/**
 * Get the weekly commit activity
 * Returns a weekly aggregate of the number of additions and deletions pushed to a repository.
 * Note: This endpoint can only be used for repositories with fewer than 10,000 commits.
 */
export async function getWeeklyCommitActivity(owner: string, repo: string) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/stats/code_frequency`);
}

/**
 * Get the last year of commit activity
 * Returns the last year of commit activity grouped by week.
 */
export async function getYearlyCommitActivity(owner: string, repo: string) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`);
}

/**
 * Get all contributor commit activity
 * Returns the total number of commits authored by each contributor along with
 * weekly commit counts, additions, and deletions.
 */
export async function getContributorCommitActivity(owner: string, repo: string) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`);
}

/**
 * Get the weekly commit count
 * Returns the total commit counts for the owner and total commit counts in all.
 * All time counts are calculated from the repository's creation date to the present day.
 */
export async function getWeeklyCommitCount(owner: string, repo: string) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/stats/participation`);
}

/**
 * Get the hourly commit count for each day
 * Returns the number of commits per hour in each day.
 */
export async function getHourlyCommitCount(owner: string, repo: string) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/stats/punch_card`);
}
