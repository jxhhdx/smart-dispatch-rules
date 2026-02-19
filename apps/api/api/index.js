// Vercel Serverless Function Entry Point
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const serverlessHttp = require('serverless-http');

// Import the AppModule
const { AppModule } = require('../dist/app.module');

// Create Express server
const server = express();
let isInitialized = false;

async function bootstrap() {
  if (isInitialized) return;

  try {
    const adapter = new ExpressAdapter(server);
    const app = await NestFactory.create(AppModule, adapter);

    // Enable CORS
    app.enableCors({
      origin: '*',
      credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Initialize the app
    await app.init();
    
    isInitialized = true;
    console.log('NestJS application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize NestJS application:', error);
    throw error;
  }
}

// Create serverless handler
const handler = serverlessHttp(server);

// Export the Vercel serverless function
module.exports = async (req, res) => {
  try {
    // Ensure app is initialized
    await bootstrap();
    
    // Handle the request
    return handler(req, res);
  } catch (error) {
    console.error('Request handling error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message
    });
  }
};
