// Vercel Serverless Function Entry Point
const path = require('path');

// Set up paths for the compiled application
const distPath = path.join(__dirname, '..', 'dist');

// Import the serverless handler
const serverless = require('./serverless-wrapper.js');

module.exports = serverless;
