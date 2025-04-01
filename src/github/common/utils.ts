import { getUserAgent } from "universal-user-agent";
import { createGitHubError } from "./errors.js";
import { VERSION } from "./version.js";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

export function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

const USER_AGENT = `modelcontextprotocol/servers/github/v${VERSION} ${getUserAgent()}`;

/**
 * Make a request to the GitHub API with retry logic for transient errors
 * @param url The URL to request
 * @param options Request options
 * @returns The response body
 */
export async function githubRequest(
  url: string,
  options: RequestOptions = {}
): Promise<unknown> {
  // Default options
  const timeout = options.timeout ?? 30000; // 30 seconds default timeout
  const maxRetries = options.retries ?? 3; // Default to 3 retries
  const retryDelay = options.retryDelay ?? 1000; // Default to 1 second delay between retries
  
  let lastError: Error | null = null;
  
  // Retry loop
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Only log retry attempts after the first failure
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries - 1} for ${url}`);
      }
      
      const headers: Record<string, string> = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github.v3+json",
        ...options.headers,
      };

      if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          method: options.method || "GET",
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);

        const responseBody = await parseResponseBody(response);

        // Special handling for 202 responses (common with statistics endpoints)
        if (response.status === 202) {
          return {
            status: 202,
            message: "GitHub is computing statistics. This may take some time. Please try again later.",
            isComputing: true,
            url: url
          };
        }

        // Handle error responses
        if (!response.ok) {
          // Check if we should retry based on status code
          const shouldRetry = [429, 500, 502, 503, 504].includes(response.status);
          
          if (shouldRetry && attempt < maxRetries - 1) {
            // For rate limiting, use the Retry-After header if available
            if (response.status === 429) {
              const retryAfter = response.headers.get("Retry-After");
              const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay * (attempt + 1);
              console.log(`Rate limited. Waiting ${waitTime}ms before retry.`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue; // Skip to next retry attempt
            } else {
              // Exponential backoff for server errors
              const waitTime = retryDelay * Math.pow(2, attempt);
              console.log(`Server error (${response.status}). Waiting ${waitTime}ms before retry.`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue; // Skip to next retry attempt
            }
          }
          
          // If we shouldn't retry or we're out of retries, throw the error
          throw createGitHubError(response.status, responseBody);
        }

        return responseBody;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout or network error that we should retry
      const isAbortError = error.name === "AbortError";
      const isNetworkError = error.message?.includes("fetch failed") || 
                            error.code === "UND_ERR_CONNECT_TIMEOUT" ||
                            error.code === "ECONNRESET";
      
      if ((isAbortError || isNetworkError) && attempt < maxRetries - 1) {
        // Exponential backoff for network errors
        const waitTime = retryDelay * Math.pow(2, attempt);
        console.log(`Network error: ${error.message}. Waiting ${waitTime}ms before retry.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Skip to next retry attempt
      }
      
      // If we're out of retries or it's not a retryable error, rethrow
      throw error;
    }
  }
  
  // This should never happen, but TypeScript wants it
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

export function validateBranchName(branch: string): string {
  const sanitized = branch.trim();
  if (!sanitized) {
    throw new Error("Branch name cannot be empty");
  }
  if (sanitized.includes("..")) {
    throw new Error("Branch name cannot contain '..'");
  }
  if (/[\s~^:?*[\\\]]/.test(sanitized)) {
    throw new Error("Branch name contains invalid characters");
  }
  if (sanitized.startsWith("/") || sanitized.endsWith("/")) {
    throw new Error("Branch name cannot start or end with '/'");
  }
  if (sanitized.endsWith(".lock")) {
    throw new Error("Branch name cannot end with '.lock'");
  }
  return sanitized;
}

export function validateRepositoryName(name: string): string {
  const sanitized = name.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Repository name cannot be empty");
  }
  if (!/^[a-z0-9_.-]+$/.test(sanitized)) {
    throw new Error(
      "Repository name can only contain lowercase letters, numbers, hyphens, periods, and underscores"
    );
  }
  if (sanitized.startsWith(".") || sanitized.endsWith(".")) {
    throw new Error("Repository name cannot start or end with a period");
  }
  return sanitized;
}

export function validateOwnerName(owner: string): string {
  const sanitized = owner.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Owner name cannot be empty");
  }
  if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(sanitized)) {
    throw new Error(
      "Owner name must start with a letter or number and can contain up to 39 characters"
    );
  }
  return sanitized;
}

export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`
    );
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function checkUserExists(username: string): Promise<boolean> {
  try {
    await githubRequest(`https://api.github.com/users/${username}`);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Fetch all paginated results from a GitHub API endpoint
 * @param url Base URL for the API endpoint
 * @param params URL parameters as URLSearchParams or Record
 * @returns Array of all items across all pages
 */
export async function getAllPaginatedResults(url: string, params?: URLSearchParams | Record<string, string>): Promise<any[]> {
  let currentUrl = url;
  let allResults: any[] = [];
  let hasNextPage = true;
  let page = 1;
  
  // Convert params object to URLSearchParams if needed
  let searchParams: URLSearchParams;
  if (params instanceof URLSearchParams) {
    searchParams = params;
  } else if (params) {
    searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  } else {
    searchParams = new URLSearchParams();
  }
  
  // Ensure we have a page parameter
  if (!searchParams.has('page')) {
    searchParams.append('page', '1');
  }
  
  while (hasNextPage) {
    // Update page parameter
    searchParams.set('page', page.toString());
    
    // Build URL with parameters
    const urlWithParams = `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}${searchParams.toString()}`;
    
    // Make request
    const response = await fetch(urlWithParams, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": USER_AGENT,
        "Authorization": process.env.GITHUB_PERSONAL_ACCESS_TOKEN ? 
          `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}` : ''
      }
    });
    
    if (!response.ok) {
      const responseBody = await parseResponseBody(response);
      throw createGitHubError(response.status, responseBody);
    }
    
    // Parse response
    const results = await response.json();
    
    // Add results to collection
    if (Array.isArray(results)) {
      allResults = allResults.concat(results);
      
      // Check if we have more pages
      if (results.length === 0) {
        hasNextPage = false;
      } else {
        // Check for Link header
        const linkHeader = response.headers.get('Link');
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
          hasNextPage = false;
        } else {
          page++;
        }
      }
    } else {
      // If not an array, just return this result
      return [results];
    }
  }
  
  return allResults;
}