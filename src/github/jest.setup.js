// Load environment variables from .env file
require('dotenv').config();

// Mock universal-user-agent to avoid ESM issues
jest.mock('universal-user-agent', () => ({
  getUserAgent: jest.fn().mockReturnValue('test-user-agent')
}));

// Log if GitHub token is available
if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  console.log('GitHub token found and will be used for API requests');
} else {
  console.warn('No GitHub token found in environment variables');
}
