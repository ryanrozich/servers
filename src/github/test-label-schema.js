"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_js_1 = require("./common/types.js");
// Test data with null description
var testLabel = {
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
    var validatedLabel = types_js_1.GitHubLabelSchema.parse(testLabel);
    console.log('Validation succeeded!');
    console.log('Validated label:', validatedLabel);
}
catch (error) {
    console.error('Validation failed:', error);
}
