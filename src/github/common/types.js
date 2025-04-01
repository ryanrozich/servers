"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPullRequestSchema = exports.GitHubPullRequestRefSchema = exports.GitHubSearchResponseSchema = exports.GitHubIssueSchema = exports.GitHubMilestoneSchema = exports.GitHubLabelSchema = exports.GitHubIssueAssigneeSchema = exports.GitHubReferenceSchema = exports.GitHubListCommitsSchema = exports.GitHubCommitSchema = exports.GitHubTreeSchema = exports.GitHubTreeEntrySchema = exports.GitHubContentSchema = exports.GitHubDirectoryContentSchema = exports.GitHubFileContentSchema = exports.GithubFileContentLinks = exports.GitHubRepositorySchema = exports.GitHubOwnerSchema = exports.GitHubAuthorSchema = void 0;
var zod_1 = require("zod");
// Base schemas for common types
exports.GitHubAuthorSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    date: zod_1.z.string(),
});
exports.GitHubOwnerSchema = zod_1.z.object({
    login: zod_1.z.string(),
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    avatar_url: zod_1.z.string(),
    url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    type: zod_1.z.string(),
});
exports.GitHubRepositorySchema = zod_1.z.object({
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    name: zod_1.z.string(),
    full_name: zod_1.z.string(),
    private: zod_1.z.boolean(),
    owner: exports.GitHubOwnerSchema,
    html_url: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    fork: zod_1.z.boolean(),
    url: zod_1.z.string(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    pushed_at: zod_1.z.string(),
    git_url: zod_1.z.string(),
    ssh_url: zod_1.z.string(),
    clone_url: zod_1.z.string(),
    default_branch: zod_1.z.string(),
});
exports.GithubFileContentLinks = zod_1.z.object({
    self: zod_1.z.string(),
    git: zod_1.z.string().nullable(),
    html: zod_1.z.string().nullable()
});
exports.GitHubFileContentSchema = zod_1.z.object({
    name: zod_1.z.string(),
    path: zod_1.z.string(),
    sha: zod_1.z.string(),
    size: zod_1.z.number(),
    url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    git_url: zod_1.z.string(),
    download_url: zod_1.z.string(),
    type: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    encoding: zod_1.z.string().optional(),
    _links: exports.GithubFileContentLinks
});
exports.GitHubDirectoryContentSchema = zod_1.z.object({
    type: zod_1.z.string(),
    size: zod_1.z.number(),
    name: zod_1.z.string(),
    path: zod_1.z.string(),
    sha: zod_1.z.string(),
    url: zod_1.z.string(),
    git_url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    download_url: zod_1.z.string().nullable(),
});
exports.GitHubContentSchema = zod_1.z.union([
    exports.GitHubFileContentSchema,
    zod_1.z.array(exports.GitHubDirectoryContentSchema),
]);
exports.GitHubTreeEntrySchema = zod_1.z.object({
    path: zod_1.z.string(),
    mode: zod_1.z.enum(["100644", "100755", "040000", "160000", "120000"]),
    type: zod_1.z.enum(["blob", "tree", "commit"]),
    size: zod_1.z.number().optional(),
    sha: zod_1.z.string(),
    url: zod_1.z.string(),
});
exports.GitHubTreeSchema = zod_1.z.object({
    sha: zod_1.z.string(),
    url: zod_1.z.string(),
    tree: zod_1.z.array(exports.GitHubTreeEntrySchema),
    truncated: zod_1.z.boolean(),
});
exports.GitHubCommitSchema = zod_1.z.object({
    sha: zod_1.z.string(),
    node_id: zod_1.z.string(),
    url: zod_1.z.string(),
    author: exports.GitHubAuthorSchema,
    committer: exports.GitHubAuthorSchema,
    message: zod_1.z.string(),
    tree: zod_1.z.object({
        sha: zod_1.z.string(),
        url: zod_1.z.string(),
    }),
    parents: zod_1.z.array(zod_1.z.object({
        sha: zod_1.z.string(),
        url: zod_1.z.string(),
    })),
});
exports.GitHubListCommitsSchema = zod_1.z.array(zod_1.z.object({
    sha: zod_1.z.string(),
    node_id: zod_1.z.string(),
    commit: zod_1.z.object({
        author: exports.GitHubAuthorSchema,
        committer: exports.GitHubAuthorSchema,
        message: zod_1.z.string(),
        tree: zod_1.z.object({
            sha: zod_1.z.string(),
            url: zod_1.z.string()
        }),
        url: zod_1.z.string(),
        comment_count: zod_1.z.number(),
    }),
    url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    comments_url: zod_1.z.string()
}));
exports.GitHubReferenceSchema = zod_1.z.object({
    ref: zod_1.z.string(),
    node_id: zod_1.z.string(),
    url: zod_1.z.string(),
    object: zod_1.z.object({
        sha: zod_1.z.string(),
        type: zod_1.z.string(),
        url: zod_1.z.string(),
    }),
});
// User and assignee schemas
exports.GitHubIssueAssigneeSchema = zod_1.z.object({
    login: zod_1.z.string(),
    id: zod_1.z.number(),
    avatar_url: zod_1.z.string(),
    url: zod_1.z.string(),
    html_url: zod_1.z.string(),
});
// Issue-related schemas
exports.GitHubLabelSchema = zod_1.z.object({
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    url: zod_1.z.string(),
    name: zod_1.z.string(),
    color: zod_1.z.string(),
    default: zod_1.z.boolean(),
    description: zod_1.z.string().nullable().optional(),
});
exports.GitHubMilestoneSchema = zod_1.z.object({
    url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    labels_url: zod_1.z.string(),
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    number: zod_1.z.number(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    state: zod_1.z.string(),
});
exports.GitHubIssueSchema = zod_1.z.object({
    url: zod_1.z.string(),
    repository_url: zod_1.z.string(),
    labels_url: zod_1.z.string(),
    comments_url: zod_1.z.string(),
    events_url: zod_1.z.string(),
    html_url: zod_1.z.string(),
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    number: zod_1.z.number(),
    title: zod_1.z.string(),
    user: exports.GitHubIssueAssigneeSchema,
    labels: zod_1.z.array(exports.GitHubLabelSchema),
    state: zod_1.z.string(),
    locked: zod_1.z.boolean(),
    assignee: exports.GitHubIssueAssigneeSchema.nullable(),
    assignees: zod_1.z.array(exports.GitHubIssueAssigneeSchema),
    milestone: exports.GitHubMilestoneSchema.nullable(),
    comments: zod_1.z.number(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    closed_at: zod_1.z.string().nullable(),
    body: zod_1.z.string().nullable(),
});
// Search-related schemas
exports.GitHubSearchResponseSchema = zod_1.z.object({
    total_count: zod_1.z.number(),
    incomplete_results: zod_1.z.boolean(),
    items: zod_1.z.array(exports.GitHubRepositorySchema),
});
// Pull request schemas
exports.GitHubPullRequestRefSchema = zod_1.z.object({
    label: zod_1.z.string(),
    ref: zod_1.z.string(),
    sha: zod_1.z.string(),
    user: exports.GitHubIssueAssigneeSchema,
    repo: exports.GitHubRepositorySchema,
});
exports.GitHubPullRequestSchema = zod_1.z.object({
    url: zod_1.z.string(),
    id: zod_1.z.number(),
    node_id: zod_1.z.string(),
    html_url: zod_1.z.string(),
    diff_url: zod_1.z.string(),
    patch_url: zod_1.z.string(),
    issue_url: zod_1.z.string(),
    number: zod_1.z.number(),
    state: zod_1.z.string(),
    locked: zod_1.z.boolean(),
    title: zod_1.z.string(),
    user: exports.GitHubIssueAssigneeSchema,
    body: zod_1.z.string().nullable(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    closed_at: zod_1.z.string().nullable(),
    merged_at: zod_1.z.string().nullable(),
    merge_commit_sha: zod_1.z.string().nullable(),
    assignee: exports.GitHubIssueAssigneeSchema.nullable(),
    assignees: zod_1.z.array(exports.GitHubIssueAssigneeSchema),
    requested_reviewers: zod_1.z.array(exports.GitHubIssueAssigneeSchema),
    labels: zod_1.z.array(exports.GitHubLabelSchema),
    head: exports.GitHubPullRequestRefSchema,
    base: exports.GitHubPullRequestRefSchema,
});
