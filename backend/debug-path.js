const path = require('path');

// Simulate what happens in the compiled MCP client
const simulatedDirname = '/Users/wnp/Desktop/scribe-tree/backend/dist/backend/src/services/mcp';

console.log('__dirname:', __dirname);
console.log('simulatedDirname:', simulatedDirname);
console.log('Environment path:', process.env.MCP_EDUCATOR_ALERTS_PATH);

const defaultPath = path.join(simulatedDirname, '../../../../mcp-servers/educator-alerts/dist/index.js');
console.log('Default resolved path:', defaultPath);

const envPath = process.env.MCP_EDUCATOR_ALERTS_PATH || defaultPath;
console.log('Final path:', envPath);

// Check if file exists
const fs = require('fs');
console.log('File exists:', fs.existsSync(envPath));

// Show correct path
const correctPath = '/Users/wnp/Desktop/scribe-tree/mcp-servers/educator-alerts/dist/index.js';
console.log('Correct path exists:', fs.existsSync(correctPath));