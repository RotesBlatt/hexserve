# Static File Server

A simple, configurable static file server built with TypeScript and Express.js that serves files from a specified directory via HTTP GET requests.

## Features

- ✅ Serves static files over HTTP
- ✅ Fully configurable via environment variables
- ✅ TypeScript for type safety
- ✅ Express.js for robust HTTP handling
- ✅ Automatic directory creation
- ✅ Request logging
- ✅ Error handling

## Requirements

### Local Development
- Node.js (v18 or higher recommended)
- npm or yarn

### Docker Deployment
- Docker
- Docker Compose

## Installation

### Option 1: Local Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

## Configuration

Configuration is done through environment variables. Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

### Environment Variables

- **PORT**: Port number for the server (default: `3000`)
- **HOST**: Host address to bind to (default: `0.0.0.0`)
  - Use `0.0.0.0` to listen on all network interfaces
  - Use `localhost` or `127.0.0.1` for local access only
- **SERVE_DIR**: Directory to serve files from (default: `./public`)
  - Can be an absolute or relative path
- **URL_PREFIX**: URL prefix for accessing files (default: `/latest`)
  - Files will be accessible at `http://host:port/latest/filename`
  - Should start with `/` (will be added automatically if missing)

### Example Configuration

```env
PORT=8080
HOST=0.0.0.0
SERVE_DIR=./files
URL_PREFIX=/latest
```

## Usage

### Development Mode

Run with auto-reload on file changes:

```bash
npm run dev
```

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Option 2: Docker Deployment

#### Prerequisites

This server is configured to serve files from the [lolstaticdata](https://github.com/RotesBlatt/lolstaticdata.git) service. You need to:

1. Clone and start the lolstaticdata service first:
```bash
git clone https://github.com/RotesBlatt/lolstaticdata.git
cd lolstaticdata
docker-compose up -d
```

2. Verify the volume was created:
```bash
docker volume ls | grep lol-static-data
```

#### Starting the Server

Once the lolstaticdata service is running, start this file server:

```bash
docker-compose up -d
```

This will:
- Build the Docker image
- Start the container in detached mode
- Expose the server on port 3000
- Mount the `lolstaticdata_lol-static-data` volume in read-only mode

#### Docker Commands

```bash
# Start the server
docker-compose up -d

# Stop the server
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build
```

#### Customizing the Volume Mount

The server is currently configured to use the external volume from the lolstaticdata service:

```yaml
volumes:
  lolstaticdata_lol-static-data:
    external: true  # Uses volume from lolstaticdata service
```

To serve files from a different source, you can modify [docker-compose.yml](docker-compose.yml):

**Option A: Use a local directory**
```yaml
volumes:
  # Replace the external volume with a local directory
  - ./data:/data
  # Or use an absolute path
  - /path/to/your/files:/data
```

**Option B: Use a different external volume**
```yaml
volumes:
  # Mount from another container's volume
  - other-service-data:/data

volumes:
  other-service-data:
    external: true
```

#### Changing the Port

To use a different port, set the `PORT` environment variable:

```bash
PORT=8080 docker-compose up -d
```

Or modify [docker-compose.yml](docker-compose.yml):

```yaml
ports:
  - "8080:3000"  # External:Internal
```

## Accessing Files

Files are served at the configured URL prefix (default: `/latest`).

Once the server is running, files can be accessed via HTTP GET requests:

```
http://localhost:3000/latest/sample.txt
http://localhost:3000/latest/path/to/your/file.pdf
```

Replace `localhost:3000` with your configured HOST and PORT, and `/latest` with your configured URL_PREFIX.

### Example with curl

```bash
curl http://localhost:3000/latest/sample.txt
```

### Example with wget

```bash
wget http://localhost:3000/latest/sample.txt
```

## Project Structure

```
.
├── src/
│   ├── config.ts       # Configuration management
│   └── server.ts       # Main server file
├── public/             # Default directory for served files (local)
│   └── sample.txt      # Sample file
├── data/               # Default directory for Docker volume mount
├── dist/               # Compiled JavaScript (generated)
├── .env                # Environment configuration
├── .env.example        # Example environment configuration
├── Dockerfile          # Docker image definition
├── docker-compose.yml  # Docker Compose configuration
├── .dockerignore       # Docker build exclusions
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Adding Files to Serve

### Local Development

Simply place any files you want to serve in the configured `SERVE_DIR` directory (default: `./public`). The files will be immediately available at:

```
http://your-host:port/filename
```

### Docker Deployment

Place files in the `./data` directory (or your custom mounted directory). The files will be immediately available without restarting the container.

## Security Notes

- Hidden files (dotfiles) are not served
- Directory listings are disabled
- Configure `HOST` appropriately for your use case:
  - For internet access: Use `0.0.0.0`
  - For local-only access: Use `localhost` or `127.0.0.1`

## License

ISC
