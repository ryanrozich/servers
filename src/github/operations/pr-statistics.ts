import { z } from "zod";
import { getAllPaginatedResults } from "../common/utils.js";
import * as pulls from "./pulls.js";

// Base schema for PR statistics endpoints
export const PrStatsBaseSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name")
});

// Schema for time-based PR statistics
export const PrTimeRangeStatsSchema = PrStatsBaseSchema.extend({
  since: z.string().optional().describe("Start date in ISO 8601 format (YYYY-MM-DD)"),
  until: z.string().optional().describe("End date in ISO 8601 format (YYYY-MM-DD)")
});

// Schema for PR velocity metrics
export const PrVelocityStatsSchema = PrTimeRangeStatsSchema.extend({
  state: z.enum(['open', 'closed', 'all']).optional().default('all').describe("State of PRs to analyze"),
  base: z.string().optional().describe("Filter by base branch name")
});

// Schema for PR size distribution
export const PrSizeStatsSchema = PrTimeRangeStatsSchema.extend({
  state: z.enum(['open', 'closed', 'all']).optional().default('closed').describe("State of PRs to analyze"),
  limit: z.number().optional().default(100).describe("Maximum number of PRs to analyze")
});

// Schema for PR review statistics
export const PrReviewStatsSchema = PrTimeRangeStatsSchema.extend({
  state: z.enum(['open', 'closed', 'all']).optional().default('closed').describe("State of PRs to analyze"),
  limit: z.number().optional().default(100).describe("Maximum number of PRs to analyze")
});

/**
 * Get PR velocity metrics including time to merge, time to first review, and PR throughput
 * @param owner Repository owner
 * @param repo Repository name
 * @param options Additional options including time range and filters
 * @returns PR velocity metrics
 */
export async function getPrVelocityMetrics(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof PrVelocityStatsSchema>, 'owner' | 'repo'> = { state: 'all' }
) {
  const { since, until, state, base } = options;
  
  // Build query parameters
  const params: Record<string, string> = {
    state: state ?? 'all',
    sort: 'updated',
    direction: 'desc',
    per_page: '100'
  };
  
  if (base) params.base = base;
  
  // Get PRs within the time range
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  const allPRs = await getAllPaginatedResults(url, params);
  
  // Filter PRs by date if specified
  let filteredPRs = allPRs;
  if (since || until) {
    const sinceDate = since ? new Date(since) : new Date(0);
    const untilDate = until ? new Date(until) : new Date();
    
    filteredPRs = allPRs.filter(pr => {
      const createdAt = new Date(pr.created_at);
      return createdAt >= sinceDate && createdAt <= untilDate;
    });
  }
  
  // Calculate metrics
  const mergedPRs = filteredPRs.filter(pr => pr.merged_at);
  
  // Time to merge (in hours)
  const timeToMerge = mergedPRs.map(pr => {
    const created = new Date(pr.created_at).getTime();
    const merged = new Date(pr.merged_at).getTime();
    return (merged - created) / (1000 * 60 * 60); // Convert ms to hours
  });
  
  // Calculate statistics
  const avgTimeToMerge = timeToMerge.length > 0 
    ? timeToMerge.reduce((sum, time) => sum + time, 0) / timeToMerge.length 
    : 0;
  
  // PR throughput (PRs per week)
  const oldestPR = filteredPRs.length > 0 
    ? new Date(Math.min(...filteredPRs.map(pr => new Date(pr.created_at).getTime())))
    : new Date();
  const newestPR = filteredPRs.length > 0 
    ? new Date(Math.max(...filteredPRs.map(pr => new Date(pr.created_at).getTime())))
    : new Date();
  
  const weeksDiff = Math.max(1, (newestPR.getTime() - oldestPR.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const throughput = mergedPRs.length / weeksDiff;
  
  return {
    total_prs: filteredPRs.length,
    merged_prs: mergedPRs.length,
    open_prs: filteredPRs.filter(pr => pr.state === 'open').length,
    closed_prs: filteredPRs.filter(pr => pr.state === 'closed' && !pr.merged_at).length,
    avg_time_to_merge_hours: avgTimeToMerge,
    avg_time_to_merge_days: avgTimeToMerge / 24,
    pr_throughput_per_week: throughput,
    time_range: {
      since: since ?? oldestPR.toISOString().split('T')[0],
      until: until ?? newestPR.toISOString().split('T')[0],
    }
  };
}

/**
 * Get PR size distribution metrics including file changes, additions, and deletions
 * @param owner Repository owner
 * @param repo Repository name
 * @param options Additional options including time range and filters
 * @returns PR size distribution metrics
 */
export async function getPrSizeDistribution(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof PrSizeStatsSchema>, 'owner' | 'repo'> = { state: 'closed', limit: 100 }
) {
  const { since, until, state, limit } = options;
  
  // Build query parameters
  const params: Record<string, string> = {
    state: state ?? 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: limit?.toString() ?? '100'
  };
  
  // Get PRs within the time range
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  const allPRs = await getAllPaginatedResults(url, params);
  
  // Filter PRs by date if specified
  let filteredPRs = allPRs;
  if (since || until) {
    const sinceDate = since ? new Date(since) : new Date(0);
    const untilDate = until ? new Date(until) : new Date();
    
    filteredPRs = allPRs.filter(pr => {
      const createdAt = new Date(pr.created_at);
      return createdAt >= sinceDate && createdAt <= untilDate;
    });
  }
  
  // Limit the number of PRs to analyze to avoid excessive API calls
  const prsToAnalyze = filteredPRs.slice(0, limit ?? 100);
  
  // Get detailed file information for each PR
  const prSizes = await Promise.all(
    prsToAnalyze.map(async pr => {
      try {
        const files = await pulls.getPullRequestFiles(owner, repo, pr.number);
        const totalFiles = files.length;
        const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
        const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
        const totalChanges = files.reduce((sum, file) => sum + file.changes, 0);
        
        return {
          pr_number: pr.number,
          title: pr.title,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          files_changed: totalFiles,
          additions: totalAdditions,
          deletions: totalDeletions,
          total_changes: totalChanges
        };
      } catch (error) {
        console.error(`Error getting files for PR #${pr.number}:`, error);
        return {
          pr_number: pr.number,
          title: pr.title,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          files_changed: 0,
          additions: 0,
          deletions: 0,
          total_changes: 0,
          error: 'Failed to retrieve file data'
        };
      }
    })
  );
  
  // Calculate statistics
  const avgFilesChanged = prSizes.length > 0 ? prSizes.reduce((sum, pr) => sum + pr.files_changed, 0) / prSizes.length : 0;
  const avgAdditions = prSizes.length > 0 ? prSizes.reduce((sum, pr) => sum + pr.additions, 0) / prSizes.length : 0;
  const avgDeletions = prSizes.length > 0 ? prSizes.reduce((sum, pr) => sum + pr.deletions, 0) / prSizes.length : 0;
  const avgTotalChanges = prSizes.length > 0 ? prSizes.reduce((sum, pr) => sum + pr.total_changes, 0) / prSizes.length : 0;
  
  // Group PRs by size categories
  const sizeCategories = {
    xs: prSizes.filter(pr => pr.total_changes < 10).length,
    small: prSizes.filter(pr => pr.total_changes >= 10 && pr.total_changes < 50).length,
    medium: prSizes.filter(pr => pr.total_changes >= 50 && pr.total_changes < 250).length,
    large: prSizes.filter(pr => pr.total_changes >= 250 && pr.total_changes < 1000).length,
    xl: prSizes.filter(pr => pr.total_changes >= 1000).length
  };
  
  return {
    analyzed_prs: prSizes.length,
    avg_files_changed: avgFilesChanged,
    avg_additions: avgAdditions,
    avg_deletions: avgDeletions,
    avg_total_changes: avgTotalChanges,
    size_distribution: {
      xs: sizeCategories.xs,
      small: sizeCategories.small,
      medium: sizeCategories.medium,
      large: sizeCategories.large,
      xl: sizeCategories.xl
    },
    size_distribution_percentage: {
      xs: prSizes.length > 0 ? (sizeCategories.xs / prSizes.length) * 100 : 0,
      small: prSizes.length > 0 ? (sizeCategories.small / prSizes.length) * 100 : 0,
      medium: prSizes.length > 0 ? (sizeCategories.medium / prSizes.length) * 100 : 0,
      large: prSizes.length > 0 ? (sizeCategories.large / prSizes.length) * 100 : 0,
      xl: prSizes.length > 0 ? (sizeCategories.xl / prSizes.length) * 100 : 0
    },
    pr_details: prSizes,
    time_range: {
      since: since ?? (filteredPRs.length > 0 ? new Date(filteredPRs[filteredPRs.length - 1].created_at).toISOString().split('T')[0] : ''),
      until: until ?? (filteredPRs.length > 0 ? new Date(filteredPRs[0].created_at).toISOString().split('T')[0] : '')
    }
  };
}

/**
 * Get PR review statistics including approval rates, review times, and comment density
 * @param owner Repository owner
 * @param repo Repository name
 * @param options Additional options including time range and filters
 * @returns PR review statistics
 */
export async function getPrReviewStatistics(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof PrReviewStatsSchema>, 'owner' | 'repo'> = { state: 'closed', limit: 100 }
) {
  const { since, until, state, limit } = options;
  
  // Build query parameters
  const params: Record<string, string> = {
    state: state ?? 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: limit?.toString() ?? '100'
  };
  
  // Get PRs within the time range
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  const allPRs = await getAllPaginatedResults(url, params);
  
  // Filter PRs by date if specified
  let filteredPRs = allPRs;
  if (since || until) {
    const sinceDate = since ? new Date(since) : new Date(0);
    const untilDate = until ? new Date(until) : new Date();
    
    filteredPRs = allPRs.filter(pr => {
      const createdAt = new Date(pr.created_at);
      return createdAt >= sinceDate && createdAt <= untilDate;
    });
  }
  
  // Limit the number of PRs to analyze to avoid excessive API calls
  const prsToAnalyze = filteredPRs.slice(0, limit ?? 100);
  
  // Get review data for each PR
  const prReviews = await Promise.all(
    prsToAnalyze.map(async pr => {
      try {
        const reviews = await pulls.getPullRequestReviews(owner, repo, pr.number);
        const prComments = await pulls.getPullRequestComments(owner, repo, pr.number);
        
        // Calculate time to first review (in hours)
        let timeToFirstReview = null;
        if (reviews.length > 0) {
          const created = new Date(pr.created_at).getTime();
          const firstReview = new Date(reviews[0].submitted_at ?? pr.created_at).getTime();
          timeToFirstReview = (firstReview - created) / (1000 * 60 * 60); // Convert ms to hours
        }
        
        // Count review states
        const approvals = reviews.filter(r => r.state === 'APPROVED').length;
        const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED').length;
        const commentReviews = reviews.filter(r => r.state === 'COMMENTED').length;
        
        return {
          pr_number: pr.number,
          title: pr.title,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          closed_at: pr.closed_at,
          review_count: reviews.length,
          comment_count: prComments.length,
          time_to_first_review_hours: timeToFirstReview,
          approvals,
          changes_requested: changesRequested,
          comment_only_reviews: commentReviews,
          was_approved: approvals > 0,
          had_changes_requested: changesRequested > 0
        };
      } catch (error) {
        console.error(`Error getting reviews for PR #${pr.number}:`, error);
        return {
          pr_number: pr.number,
          title: pr.title,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          closed_at: pr.closed_at,
          review_count: 0,
          comment_count: 0,
          time_to_first_review_hours: null,
          approvals: 0,
          changes_requested: 0,
          comment_only_reviews: 0,
          was_approved: false,
          had_changes_requested: false,
          error: 'Failed to retrieve review data'
        };
      }
    })
  );
  
  // Calculate statistics
  const prsWithReviews = prReviews.filter(pr => pr.review_count > 0);
  const avgReviewCount = prsWithReviews.reduce((sum, pr) => sum + pr.review_count, 0) / prsWithReviews.length || 0;
  const avgCommentCount = prsWithReviews.reduce((sum, pr) => sum + pr.comment_count, 0) / prsWithReviews.length || 0;
  
  // Time to first review
  const prsWithFirstReview = prReviews.filter(pr => pr.time_to_first_review_hours !== null);
  const avgTimeToFirstReview = prsWithFirstReview.length > 0 ? prsWithFirstReview.reduce((sum, pr) => sum + (pr.time_to_first_review_hours ?? 0), 0) / prsWithFirstReview.length : 0;
  
  // Approval rates
  const approvalRate = prReviews.length > 0 ? (prReviews.filter(pr => pr.was_approved).length / prReviews.length) * 100 : 0;
  const changesRequestedRate = prReviews.length > 0 ? (prReviews.filter(pr => pr.had_changes_requested).length / prReviews.length) * 100 : 0;
  
  return {
    analyzed_prs: prReviews.length,
    prs_with_reviews: prsWithReviews.length,
    avg_reviews_per_pr: avgReviewCount,
    avg_comments_per_pr: avgCommentCount,
    avg_time_to_first_review_hours: avgTimeToFirstReview,
    avg_time_to_first_review_days: avgTimeToFirstReview / 24,
    approval_rate_percentage: approvalRate,
    changes_requested_rate_percentage: changesRequestedRate,
    pr_details: prReviews,
    time_range: {
      since: since ?? (filteredPRs.length > 0 ? new Date(filteredPRs[filteredPRs.length - 1].created_at).toISOString().split('T')[0] : ''),
      until: until ?? (filteredPRs.length > 0 ? new Date(filteredPRs[0].created_at).toISOString().split('T')[0] : '')
    }
  };
}
