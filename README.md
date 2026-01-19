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
- 🎮 Riot Games API Reverse Proxy (with automatic API key injection)

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

#### Basic Server Configuration

- **PORT**: Port number for the server (default: `3000`)
- **HOST**: Host address to bind to (default: `0.0.0.0`)
  - Use `0.0.0.0` to listen on all network interfaces
  - Use `localhost` or `127.0.0.1` for local access only
- **SERVE_DIR**: Directory to serve files from (default: `./public`)
  - Can be an absolute or relative path
- **URL_PREFIX**: URL prefix for accessing files (default: `/latest`)
  - Files will be accessible at `http://host:port/latest/filename`
  - Should start with `/` (will be added automatically if missing)

#### Riot API Proxy Configuration

- **RIOT_API_KEY**: Your Riot Games API Key (required for proxy functionality)
  - Get your key at: https://developer.riotgames.com/
  - Example: `RGAPI-12345678-abcd-1234-abcd-123456789abc`
- **RIOT_API_BASE_URL**: Riot API base URL (default: `https://euw1.api.riotgames.com`)
  - Available regions: `euw1`, `na1`, `kr`, `br1`, `eun1`, `jp1`, `la1`, `la2`, `oc1`, `tr1`, `ru`
- **PROXY_PREFIX**: URL prefix for the proxy endpoint (default: `/riot-api`)
  - API calls will be accessible at `http://host:port/riot-api/lol/summoner/v4/...`

### Example Configuration

```env
# Basic Server
PORT=8080
HOST=0.0.0.0
SERVE_DIR=./files
URL_PREFIX=/latest

# Riot API Proxy
RIOT_API_KEY=RGAPI-12345678-abcd-1234-abcd-123456789abc
RIOT_API_BASE_URL=https://euw1.api.riotgames.com
PROXY_PREFIX=/riot-api
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

## Using the Riot API Proxy

The Riot API proxy allows you to make requests to the Riot Games API without exposing your API key to clients. The server automatically injects your API key into all proxied requests.

### Making API Calls

Instead of calling the Riot API directly, route your requests through hexserve:

**Direct Riot API (exposes your key):**
```bash
curl -X GET "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Faker" \
  -H "X-Riot-Token: YOUR-API-KEY"
```

**Via hexserve Proxy (key hidden):**
```bash
curl -X GET "http://localhost:3000/riot-api/lol/summoner/v4/summoners/by-name/Faker"
```

### Supported Endpoints

All Riot Games API endpoints are supported. Simply replace the base URL:

- Original: `https://euw1.api.riotgames.com/lol/summoner/v4/...`
- Proxied: `http://localhost:3000/riot-api/lol/summoner/v4/...`

#### Dynamic Base URL with `?requestBasePath`

The Riot API uses different base URLs for different API types:
- **Platform APIs** (Summoner, Champion-Mastery, League, etc.): `https://euw1.api.riotgames.com`
- **Regional APIs** (Match-v5, Account-v1): `https://europe.api.riotgames.com`

You can specify the target base URL dynamically using the `?requestBasePath` query parameter:

```
http://localhost:3000/riot-api/endpoint?requestBasePath=https://BASE_URL
```

### Examples

#### Platform APIs (default base URL)
```bash
# Get summoner by name (uses default RIOT_API_BASE_URL from config)
curl http://localhost:3000/riot-api/lol/summoner/v4/summoners/by-name/Faker

# Get champion masteries
curl http://localhost:3000/riot-api/lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}

# Or explicitly specify platform URL
curl "http://localhost:3000/riot-api/lol/summoner/v4/summoners/by-name/Faker?requestBasePath=https://euw1.api.riotgames.com"
```

#### Regional APIs (with requestBasePath parameter)
```bash
# Get match details (requires regional base URL)
curl "http://localhost:3000/riot-api/lol/match/v5/matches/EUW1_1234567890?requestBasePath=https://europe.api.riotgames.com"

# Get match timeline
curl "http://localhost:3000/riot-api/lol/match/v5/matches/EUW1_1234567890/timeline?requestBasePath=https://europe.api.riotgames.com"

# Get account by PUUID
curl "http://localhost:3000/riot-api/riot/account/v1/accounts/by-puuid/{puuid}?requestBasePath=https://europe.api.riotgames.com"
```

#### Available Base URLs

**Regional (for Match-v5, Account-v1):**
- Europe: `https://europe.api.riotgames.com`
- Americas: `https://americas.api.riotgames.com`
- Asia: `https://asia.api.riotgames.com`
- SEA: `https://sea.api.riotgames.com`

**Platform (for other APIs):**
- EUW: `https://euw1.api.riotgames.com`
- NA: `https://na1.api.riotgames.com`
- KR: `https://kr.api.riotgames.com`
- And more... (see `.env.example` for full list)

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
│   ├── fileServer/
│   │   └── router.ts          # File browser & static file serving
│   ├── riotProxy/
│   │   ├── router.ts          # Riot API reverse proxy
│   │   └── validators.ts      # Request validation for Riot API
│   ├── middleware/
│   │   ├── errorHandler.ts    # 404 and 500 error handlers
│   │   ├── pathTraversal.ts   # Path traversal protection
│   │   └── requestLogger.ts   # HTTP request logging
│   ├── routes/
│   │   ├── health.ts          # Health check endpoint
│   │   └── root.ts            # Root directory listing
│   ├── config.ts              # Configuration management
│   ├── logger.ts              # Winston logger setup
│   └── server.ts              # Main application entry point
├── logs/                       # Application logs (auto-created, Docker volume)
├── public/                     # Default directory for served files (local)
│   └── sample.txt              # Sample file
├── data/                       # Default directory for Docker volume mount
├── dist/                       # Compiled JavaScript (generated)
├── .env                        # Environment configuration
├── .env.example                # Example environment configuration
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Docker Compose configuration
├── .dockerignore               # Docker build exclusions
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
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
- **API Key Security**: The Riot API key is stored server-side and never exposed to clients
- **Rate Limiting**: Consider implementing rate limiting for production use
- **HTTPS**: For production deployments, use HTTPS (e.g., behind nginx or with a reverse proxy)

## Troubleshooting

### Riot API Proxy Issues

**Problem**: API requests return 401 Forbidden
- **Solution**: Check that your `RIOT_API_KEY` is valid and not expired
- API keys can be obtained at https://developer.riotgames.com/

**Problem**: API requests return 404
- **Solution**: Verify the `RIOT_API_BASE_URL` matches your region
- Different regions have different base URLs (euw1, na1, etc.)

### General Issues

**Problem**: Server won't start
- **Solution**: Check that the port is not already in use
- Try changing the `PORT` in your `.env` file

**Problem**: Files not found
- **Solution**: Verify that `SERVE_DIR` points to the correct directory
- Check file permissions

## License

MIT
