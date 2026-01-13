# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install typescript @types/node @types/express --save-dev && \
    npm run build && \
    npm prune --production

# Create default serve directory
RUN mkdir -p /app/public

# Expose the default port
EXPOSE 3000

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV SERVE_DIR=/data

# Start the server
CMD ["node", "dist/server.js"]
