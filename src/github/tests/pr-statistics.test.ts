import { jest } from '@jest/globals';
import * as pulls from '../operations/pulls.js';
import {
  getPrVelocityMetrics,
  getPrSizeDistribution,
  getPrReviewStatistics
} from '../operations/pr-statistics.js';
import { getAllPaginatedResults } from '../common/utils.js';

// Mock the dependencies
jest.mock('../common/utils.js', () => ({
  getAllPaginatedResults: jest.fn()
}));

jest.mock('../operations/pulls.js', () => ({
  getPullRequestFiles: jest.fn(),
  getPullRequestReviews: jest.fn(),
  getPullRequestComments: jest.fn()
}));

// Properly type the mocked functions
const mockedGetAllPaginatedResults = getAllPaginatedResults as jest.Mocked<typeof getAllPaginatedResults>;
const mockedGetPullRequestFiles = pulls.getPullRequestFiles as jest.Mocked<typeof pulls.getPullRequestFiles>;
const mockedGetPullRequestReviews = pulls.getPullRequestReviews as jest.Mocked<typeof pulls.getPullRequestReviews>;
const mockedGetPullRequestComments = pulls.getPullRequestComments as jest.Mocked<typeof pulls.getPullRequestComments>;

describe('PR Statistics Tools', () => {
  const mockOwner = 'testOwner';
  const mockRepo = 'testRepo';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrVelocityMetrics', () => {
    it('should calculate PR velocity metrics correctly', async () => {
      // Mock data
      const mockPRs = [
        {
          number: 1,
          title: 'Test PR 1',
          state: 'closed',
          created_at: '2025-01-01T10:00:00Z',
          merged_at: '2025-01-02T10:00:00Z',
          closed_at: '2025-01-02T10:00:00Z'
        },
        {
          number: 2,
          title: 'Test PR 2',
          state: 'open',
          created_at: '2025-01-03T10:00:00Z',
          merged_at: null,
          closed_at: null
        },
        {
          number: 3,
          title: 'Test PR 3',
          state: 'closed',
          created_at: '2025-01-04T10:00:00Z',
          merged_at: '2025-01-05T10:00:00Z',
          closed_at: '2025-01-05T10:00:00Z'
        }
      ];

      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue(mockPRs);

      // Call the function
      const result = await getPrVelocityMetrics(mockOwner, mockRepo);

      // Assertions
      expect(getAllPaginatedResults).toHaveBeenCalledWith(
        `https://api.github.com/repos/${mockOwner}/${mockRepo}/pulls`,
        expect.any(Object)
      );
      
      expect(result).toEqual({
        total_prs: 3,
        merged_prs: 2,
        open_prs: 1,
        closed_prs: 0,
        avg_time_to_merge_hours: 24, // 24 hours average (1 day each PR)
        avg_time_to_merge_days: 1,
        pr_throughput_per_week: expect.any(Number),
        time_range: expect.any(Object)
      });
    });

    it('should handle empty PR list', async () => {
      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue([]);

      // Call the function
      const result = await getPrVelocityMetrics(mockOwner, mockRepo);

      // Assertions
      expect(result).toEqual({
        total_prs: 0,
        merged_prs: 0,
        open_prs: 0,
        closed_prs: 0,
        avg_time_to_merge_hours: 0,
        avg_time_to_merge_days: 0,
        pr_throughput_per_week: 0,
        time_range: expect.any(Object)
      });
    });
  });

  describe('getPrSizeDistribution', () => {
    it('should calculate PR size distribution correctly', async () => {
      // Mock data
      const mockPRs = [
        {
          number: 1,
          title: 'Small PR',
          state: 'closed',
          created_at: '2025-01-01T10:00:00Z',
          merged_at: '2025-01-02T10:00:00Z'
        },
        {
          number: 2,
          title: 'Medium PR',
          state: 'closed',
          created_at: '2025-01-03T10:00:00Z',
          merged_at: '2025-01-04T10:00:00Z'
        },
        {
          number: 3,
          title: 'Large PR',
          state: 'closed',
          created_at: '2025-01-05T10:00:00Z',
          merged_at: '2025-01-06T10:00:00Z'
        }
      ];

      const mockFiles = [
        // Small PR (1) - 5 files, 20 changes
        [
          { 
            filename: 'file1.ts', 
            additions: 10, 
            deletions: 2, 
            changes: 12, 
            status: 'modified' as const, 
            sha: 'abc123', 
            blob_url: 'https://github.com/blob/abc123', 
            raw_url: 'https://github.com/raw/abc123', 
            contents_url: 'https://api.github.com/contents/file1.ts' 
          },
          { 
            filename: 'file2.ts', 
            additions: 5, 
            deletions: 3, 
            changes: 8, 
            status: 'modified' as const, 
            sha: 'def456', 
            blob_url: 'https://github.com/blob/def456', 
            raw_url: 'https://github.com/raw/def456', 
            contents_url: 'https://api.github.com/contents/file2.ts' 
          }
        ],
        // Medium PR (2) - 10 files, 100 changes
        [
          { 
            filename: 'file3.ts', 
            additions: 50, 
            deletions: 20, 
            changes: 70, 
            status: 'modified' as const, 
            sha: 'ghi789', 
            blob_url: 'https://github.com/blob/ghi789', 
            raw_url: 'https://github.com/raw/ghi789', 
            contents_url: 'https://api.github.com/contents/file3.ts' 
          },
          { 
            filename: 'file4.ts', 
            additions: 20, 
            deletions: 10, 
            changes: 30, 
            status: 'modified' as const, 
            sha: 'jkl012', 
            blob_url: 'https://github.com/blob/jkl012', 
            raw_url: 'https://github.com/raw/jkl012', 
            contents_url: 'https://api.github.com/contents/file4.ts' 
          }
        ],
        // Large PR (3) - 15 files, 500 changes
        [
          { 
            filename: 'file5.ts', 
            additions: 300, 
            deletions: 100, 
            changes: 400, 
            status: 'modified' as const, 
            sha: 'mno345', 
            blob_url: 'https://github.com/blob/mno345', 
            raw_url: 'https://github.com/raw/mno345', 
            contents_url: 'https://api.github.com/contents/file5.ts' 
          },
          { 
            filename: 'file6.ts', 
            additions: 80, 
            deletions: 20, 
            changes: 100, 
            status: 'modified' as const, 
            sha: 'pqr678', 
            blob_url: 'https://github.com/blob/pqr678', 
            raw_url: 'https://github.com/raw/pqr678', 
            contents_url: 'https://api.github.com/contents/file6.ts' 
          }
        ]
      ];

      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue(mockPRs);
      mockedGetPullRequestFiles
        .mockResolvedValueOnce(mockFiles[0])
        .mockResolvedValueOnce(mockFiles[1])
        .mockResolvedValueOnce(mockFiles[2]);

      // Call the function
      const result = await getPrSizeDistribution(mockOwner, mockRepo);

      // Assertions
      expect(getAllPaginatedResults).toHaveBeenCalledWith(
        `https://api.github.com/repos/${mockOwner}/${mockRepo}/pulls`,
        expect.any(Object)
      );
      
      expect(pulls.getPullRequestFiles).toHaveBeenCalledTimes(3);
      
      expect(result).toEqual({
        analyzed_prs: 3,
        avg_files_changed: 2, // 2 files per PR
        avg_additions: expect.any(Number),
        avg_deletions: expect.any(Number),
        avg_total_changes: expect.any(Number),
        size_distribution: expect.any(Object),
        size_distribution_percentage: expect.any(Object),
        pr_details: expect.any(Array),
        time_range: expect.any(Object)
      });
    });

    it('should handle empty PR list', async () => {
      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue([]);

      // Call the function
      const result = await getPrSizeDistribution(mockOwner, mockRepo);

      // Assertions
      expect(result).toEqual({
        analyzed_prs: 0,
        avg_files_changed: 0,
        avg_additions: 0,
        avg_deletions: 0,
        avg_total_changes: 0,
        size_distribution: expect.any(Object),
        size_distribution_percentage: expect.any(Object),
        pr_details: [],
        time_range: expect.any(Object)
      });
    });
  });

  describe('getPrReviewStatistics', () => {
    it('should calculate PR review statistics correctly', async () => {
      // Mock data
      const mockPRs = [
        {
          number: 1,
          title: 'PR with approvals',
          state: 'closed',
          created_at: '2025-01-01T10:00:00Z',
          merged_at: '2025-01-02T10:00:00Z',
          closed_at: '2025-01-02T10:00:00Z'
        },
        {
          number: 2,
          title: 'PR with changes requested',
          state: 'closed',
          created_at: '2025-01-03T10:00:00Z',
          merged_at: '2025-01-04T10:00:00Z',
          closed_at: '2025-01-04T10:00:00Z'
        }
      ];

      const mockReviews = [
        // PR 1 reviews
        [
          { 
            id: 1, 
            node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3MQ==', 
            state: 'APPROVED' as const, 
            submitted_at: '2025-01-01T12:00:00Z',
            html_url: 'https://github.com/reviews/1',
            user: {
              id: 123,
              login: 'reviewer1',
              avatar_url: 'https://github.com/avatar/reviewer1',
              url: 'https://api.github.com/users/reviewer1',
              html_url: 'https://github.com/reviewer1'
            },
            body: 'Looks good!',
            commit_id: 'abc123',
            author_association: 'CONTRIBUTOR',
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/1'
          },
          { 
            id: 2, 
            node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3Mg==', 
            state: 'APPROVED' as const, 
            submitted_at: '2025-01-01T14:00:00Z',
            html_url: 'https://github.com/reviews/2',
            user: {
              id: 456,
              login: 'reviewer2',
              avatar_url: 'https://github.com/avatar/reviewer2',
              url: 'https://api.github.com/users/reviewer2',
              html_url: 'https://github.com/reviewer2'
            },
            body: 'LGTM',
            commit_id: 'def456',
            author_association: 'MEMBER',
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/1'
          }
        ],
        // PR 2 reviews
        [
          { 
            id: 3, 
            node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3Mw==', 
            state: 'CHANGES_REQUESTED' as const, 
            submitted_at: '2025-01-03T12:00:00Z',
            html_url: 'https://github.com/reviews/3',
            user: {
              id: 789,
              login: 'reviewer3',
              avatar_url: 'https://github.com/avatar/reviewer3',
              url: 'https://api.github.com/users/reviewer3',
              html_url: 'https://github.com/reviewer3'
            },
            body: 'Please fix these issues',
            commit_id: 'ghi789',
            author_association: 'MEMBER',
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/2'
          },
          { 
            id: 4, 
            node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3NA==', 
            state: 'APPROVED' as const, 
            submitted_at: '2025-01-03T16:00:00Z',
            html_url: 'https://github.com/reviews/4',
            user: {
              id: 101,
              login: 'reviewer4',
              avatar_url: 'https://github.com/avatar/reviewer4',
              url: 'https://api.github.com/users/reviewer4',
              html_url: 'https://github.com/reviewer4'
            },
            body: 'Looks good now',
            commit_id: 'jkl012',
            author_association: 'CONTRIBUTOR',
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/2'
          }
        ]
      ];

      const mockComments = [
        // PR 1 comments
        [
          { 
            id: 1, 
            node_id: 'MDExOlB1bGxSZXF1ZXN0Q29tbWVudDE=',
            path: 'file1.ts',
            created_at: '2025-01-01T11:00:00Z',
            url: 'https://api.github.com/comments/1',
            html_url: 'https://github.com/comments/1',
            user: {
              id: 123,
              login: 'reviewer1',
              avatar_url: 'https://github.com/avatar/reviewer1',
              url: 'https://api.github.com/users/reviewer1',
              html_url: 'https://github.com/reviewer1'
            },
            body: 'This looks good',
            _links: { 
              self: { href: 'https://api.github.com/comments/1' },
              html: { href: 'https://github.com/comments/1' },
              pull_request: { href: 'https://api.github.com/repos/testOwner/testRepo/pulls/1' }
            },
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/1',
            commit_id: 'abc123',
            author_association: 'CONTRIBUTOR',
            pull_request_review_id: 1,
            diff_hunk: '@@ -1,1 +1,1 @@',
            position: 1,
            original_position: 1,
            start_line: null,
            line: 1,
            original_line: 1,
            original_commit_id: 'abc123',
            updated_at: '2025-01-01T11:05:00Z'
          }, 
          { 
            id: 2, 
            node_id: 'MDExOlB1bGxSZXF1ZXN0Q29tbWVudDI=',
            path: 'file2.ts',
            created_at: '2025-01-01T13:00:00Z',
            url: 'https://api.github.com/comments/2',
            html_url: 'https://github.com/comments/2',
            user: {
              id: 456,
              login: 'reviewer2',
              avatar_url: 'https://github.com/avatar/reviewer2',
              url: 'https://api.github.com/users/reviewer2',
              html_url: 'https://github.com/reviewer2'
            },
            body: 'Nice work',
            _links: { 
              self: { href: 'https://api.github.com/comments/2' },
              html: { href: 'https://github.com/comments/2' },
              pull_request: { href: 'https://api.github.com/repos/testOwner/testRepo/pulls/1' }
            },
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/1',
            commit_id: 'def456',
            author_association: 'MEMBER',
            pull_request_review_id: 2,
            diff_hunk: '@@ -1,1 +1,1 @@',
            position: 1,
            original_position: 1,
            start_line: null,
            line: 1,
            original_line: 1,
            original_commit_id: 'abc123',
            updated_at: '2025-01-01T13:05:00Z'
          }
        ],
        // PR 2 comments
        [
          { 
            id: 3, 
            node_id: 'MDExOlB1bGxSZXF1ZXN0Q29tbWVudDM=',
            path: 'file3.ts',
            created_at: '2025-01-03T11:00:00Z',
            url: 'https://api.github.com/comments/3',
            html_url: 'https://github.com/comments/3',
            user: {
              id: 789,
              login: 'reviewer3',
              avatar_url: 'https://github.com/avatar/reviewer3',
              url: 'https://api.github.com/users/reviewer3',
              html_url: 'https://github.com/reviewer3'
            },
            body: 'Please fix this',
            _links: { 
              self: { href: 'https://api.github.com/comments/3' },
              html: { href: 'https://github.com/comments/3' },
              pull_request: { href: 'https://api.github.com/repos/testOwner/testRepo/pulls/2' }
            },
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/2',
            commit_id: 'ghi789',
            author_association: 'MEMBER',
            pull_request_review_id: 3,
            diff_hunk: '@@ -1,1 +1,1 @@',
            position: 1,
            original_position: 1,
            start_line: null,
            line: 1,
            original_line: 1,
            original_commit_id: 'ghi789',
            updated_at: '2025-01-03T11:05:00Z'
          }, 
          { 
            id: 4, 
            node_id: 'MDExOlB1bGxSZXF1ZXN0Q29tbWVudDQ=',
            path: 'file4.ts',
            created_at: '2025-01-03T13:00:00Z',
            url: 'https://api.github.com/comments/4',
            html_url: 'https://github.com/comments/4',
            user: {
              id: 101,
              login: 'reviewer4',
              avatar_url: 'https://github.com/avatar/reviewer4',
              url: 'https://api.github.com/users/reviewer4',
              html_url: 'https://github.com/reviewer4'
            },
            body: 'This could be improved',
            _links: { 
              self: { href: 'https://api.github.com/comments/4' },
              html: { href: 'https://github.com/comments/4' },
              pull_request: { href: 'https://api.github.com/repos/testOwner/testRepo/pulls/2' }
            },
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/2',
            commit_id: 'jkl012',
            author_association: 'CONTRIBUTOR',
            pull_request_review_id: 4,
            diff_hunk: '@@ -1,1 +1,1 @@',
            position: 1,
            original_position: 1,
            start_line: null,
            line: 1,
            original_line: 1,
            original_commit_id: 'jkl012',
            updated_at: '2025-01-03T13:05:00Z'
          },
          { 
            id: 5, 
            node_id: 'MDExOlB1bGxSZXF1ZXN0Q29tbWVudDU=',
            path: 'file4.ts',
            created_at: '2025-01-03T14:00:00Z',
            url: 'https://api.github.com/comments/5',
            html_url: 'https://github.com/comments/5',
            user: {
              id: 789,
              login: 'reviewer3',
              avatar_url: 'https://github.com/avatar/reviewer3',
              url: 'https://api.github.com/users/reviewer3',
              html_url: 'https://github.com/reviewer3'
            },
            body: 'Consider refactoring this',
            _links: { 
              self: { href: 'https://api.github.com/comments/5' },
              html: { href: 'https://github.com/comments/5' },
              pull_request: { href: 'https://api.github.com/repos/testOwner/testRepo/pulls/2' }
            },
            pull_request_url: 'https://api.github.com/repos/testOwner/testRepo/pulls/2',
            commit_id: 'jkl012',
            author_association: 'MEMBER',
            pull_request_review_id: 3,
            diff_hunk: '@@ -1,1 +1,1 @@',
            position: 2,
            original_position: 2,
            start_line: null,
            line: 2,
            original_line: 2,
            original_commit_id: 'jkl012',
            updated_at: '2025-01-03T14:05:00Z'
          }
        ]
      ];

      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue(mockPRs);
      mockedGetPullRequestReviews
        .mockResolvedValueOnce(mockReviews[0])
        .mockResolvedValueOnce(mockReviews[1]);
      mockedGetPullRequestComments
        .mockResolvedValueOnce(mockComments[0])
        .mockResolvedValueOnce(mockComments[1]);

      // Call the function
      const result = await getPrReviewStatistics(mockOwner, mockRepo);

      // Assertions
      expect(getAllPaginatedResults).toHaveBeenCalledWith(
        `https://api.github.com/repos/${mockOwner}/${mockRepo}/pulls`,
        expect.any(Object)
      );
      
      expect(pulls.getPullRequestReviews).toHaveBeenCalledTimes(2);
      expect(pulls.getPullRequestComments).toHaveBeenCalledTimes(2);
      
      expect(result).toEqual({
        analyzed_prs: 2,
        total_reviews: 4,
        avg_reviews_per_pr: 2,
        avg_comments_per_pr: 2.5, // (2 + 3) / 2
        avg_time_to_first_review_hours: expect.any(Number),
        prs_with_approvals: 2,
        prs_with_changes_requested: 1,
        approval_rate_percentage: 100, // Both PRs were approved
        changes_requested_rate_percentage: 50, // 1 of 2 PRs had changes requested
        pr_details: expect.any(Array),
        time_range: expect.any(Object)
      });
    });

    it('should handle empty PR list', async () => {
      // Setup mocks
      mockedGetAllPaginatedResults.mockResolvedValue([]);

      // Call the function
      const result = await getPrReviewStatistics(mockOwner, mockRepo);

      // Assertions
      expect(result).toEqual({
        analyzed_prs: 0,
        total_reviews: 0,
        avg_reviews_per_pr: 0,
        avg_comments_per_pr: 0,
        avg_time_to_first_review_hours: 0,
        prs_with_approvals: 0,
        prs_with_changes_requested: 0,
        approval_rate_percentage: 0,
        changes_requested_rate_percentage: 0,
        pr_details: [],
        time_range: expect.any(Object)
      });
    });
  });
});
