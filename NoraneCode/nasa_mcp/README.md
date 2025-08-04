# @noranekob/nasa-mcp-server

A Model Context Protocol (MCP) server for accessing NASA APIs - download space images, Mars rover photos, videos, and Near Earth Objects data.

## Features

- **APOD (Astronomy Picture of the Day)**: Download today's or random space images
- **Mars Rover Photos**: Access photos from Curiosity, Perseverance, Opportunity, and Spirit rovers
- **NASA Media Library**: Search and download images/videos from NASA's extensive collection
- **Near Earth Objects**: Get data about asteroids and comets near Earth

## Installation

### Using npx (Recommended)

```bash
# No installation needed, just configure and run
npx @noranekob/nasa-mcp-server
```

### Global Installation

```bash
npm install -g @noranekob/nasa-mcp-server
```

## Setup

### 1. Get your NASA API key

1. Visit [NASA API Portal](https://api.nasa.gov/)
2. Sign up for a free API key
3. Save your API key

### 2. Configure Claude Code

Add the following to your Claude Code settings file (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "nasa-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/nasa-mcp-server"],
      "env": {
        "NASA_API_KEY": "your-nasa-api-key-here"
      }
    }
  }
}
```

Replace `your-nasa-api-key-here` with your actual NASA API key.

## Available Tools

### 1. `download_apod`

Download Astronomy Picture of the Day images.

**Parameters:**
- `count` (number, optional): Number of images to download (1-100, default: 1)
- `order` (string, optional): Image selection order - "random", "latest", "oldest" (default: "random")

**Example:**
```
Download 5 random APOD images
```

### 2. `download_mars_photos`

Download photos from Mars rovers.

**Parameters:**
- `rover` (string, required): Rover name - "curiosity", "perseverance", "opportunity", "spirit"
- `sol` (number, optional): Martian day number
- `earth_date` (string, optional): Earth date in YYYY-MM-DD format
- `count` (number, optional): Number of photos (1-100, default: 5)
- `random` (boolean, optional): Select random sol day (default: false)

**Example:**
```
Download 10 photos from Curiosity rover on a random day
```

### 3. `download_nasa_media`

Search and download images/videos from NASA Image Library.

**Parameters:**
- `query` (string, required): Search keyword (e.g., "apollo", "mars", "nebula")
- `media_type` (string, optional): "image", "video", or "both" (default: "image")
- `count` (number, optional): Number of items (1-50, default: 5)
- `order` (string, optional): "latest", "random", or "oldest" (default: "latest")

**Popular Search Terms:**
- **Images**: mission, launch, crew, spacecraft, astronaut, orbit, shuttle, rocket
- **Videos**: mission, launch, earth, crew, spacecraft, astronaut, moon, exploration

**Example:**
```
Search for "apollo" videos and download 3
```

### 4. `get_neo_data`

Get Near Earth Objects data.

**Parameters:**
- `start_date` (string, optional): Start date in YYYY-MM-DD format (default: today)
- `days` (number, optional): Number of days to query (1-7, default: 7)

**Example:**
```
Get NEO data for the next 7 days
```

## Output

All downloaded files are saved to a timestamped directory in your current working directory:
- `nasa_downloads_YYYY-MM-DD_HH-mm-ss/`

The directory includes:
- Downloaded images/videos
- JSON metadata files with detailed information

## Requirements

- Node.js 18.0.0 or higher
- A valid NASA API key (free from [api.nasa.gov](https://api.nasa.gov/))

## Rate Limits

NASA API has the following rate limits:
- Hourly Limit: 1,000 requests per hour
- Daily Limit: Variable based on demand

## Troubleshooting

### "NASA_API_KEY not found in environment variables"

Make sure you've added your NASA API key to the Claude Code settings as shown in the setup section.

### "No results found"

Try different search terms. For best results:
- Use general terms like "mission", "launch", "spacecraft"
- Check the popular search terms listed above
- For Mars photos, try different sol numbers or use random mode

### Download Issues

If downloads fail:
- Check your internet connection
- Verify your API key is valid
- Ensure you haven't exceeded rate limits

## License

MIT

## Author

noranekob

## Links

- [GitHub Repository](https://github.com/noranekob/nasa-mcp-server)
- [Report Issues](https://github.com/noranekob/nasa-mcp-server/issues)
- [NASA API Documentation](https://api.nasa.gov/)
- [NASA Image and Video Library](https://images.nasa.gov/)