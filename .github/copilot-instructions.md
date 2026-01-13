<!-- Workspace Instructions for Static File Server -->

## Project Overview
This is a Node.js static file server built with TypeScript and Express. It serves files from a configurable directory via HTTP GET requests.

## Tech Stack
- Node.js
- TypeScript
- Express.js

## Configuration
The server uses environment variables for configuration:
- PORT: Server port (default: 3000)
- SERVE_DIR: Directory to serve files from (default: ./public)
- HOST: Server host (default: 0.0.0.0)

## Development Guidelines
- Use TypeScript for all source files
- Follow Express.js best practices
- Keep configuration external and environment-based
- Ensure proper error handling for file operations
