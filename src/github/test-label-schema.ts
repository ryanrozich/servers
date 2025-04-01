import { GitHubLabelSchema } from './common/types.js';

// Test data with null description
const testLabel = {
  id: 7166562219,
  node_id: "LA_kwDOMAhkMs8AAAABqykPqw",
  url: "https://api.github.com/repos/brkthru/media-tool/labels/automated%20pr",
  name: "automated pr",
  color: "ededed",
  default: false,
  description: null
};

// Validate the test data against our schema
try {
  const validatedLabel = GitHubLabelSchema.parse(testLabel);
  console.log('Validation succeeded!');
  console.log('Validated label:', validatedLabel);
} catch (error) {
  console.error('Validation failed:', error);
}
