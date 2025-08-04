# @noranekob/fal-mcp-server

A Model Context Protocol (MCP) server for uploading images to fal.ai and obtaining remote URLs.

## Features

- Upload images to fal.ai cloud storage
- Get shareable remote URLs for uploaded images
- Support for common image formats (JPG, PNG, GIF, WebP, BMP)
- File size validation (max 100MB)

## Installation

### Using npx (Recommended)

```bash
# No installation needed, just configure and run
npx @noranekob/fal-mcp-server
```

### Global Installation

```bash
npm install -g @noranekob/fal-mcp-server
```

## Setup

### 1. Get your fal.ai API key

1. Sign up at [fal.ai](https://fal.ai)
2. Go to your dashboard and create an API key
3. Copy the API key

### 2. Configure Claude Code

Add the following to your Claude Code settings file (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "fal-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/fal-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

Replace `your-fal-api-key-here` with your actual fal.ai API key.

## Usage

Once configured, you can use the following tool in Claude Code:

### `upload_image_to_fal`

Upload an image to fal.ai and get a remote URL.

**Parameters:**
- `image_path` (string, required): Path to the image file to upload

**Example:**
```
Upload the image at /path/to/image.jpg to fal
```

## Requirements

- Node.js 18.0.0 or higher
- Python 3.x with `fal-client` package installed
- A valid fal.ai API key

### Installing Python Dependencies

```bash
pip install fal-client
```

## Supported Image Formats

- JPEG/JPG
- PNG
- GIF
- WebP
- BMP

## Limitations

- Maximum file size: 100MB
- Only image files are supported

## Troubleshooting

### "FAL_KEY not found in environment variables"

Make sure you've added your fal.ai API key to the Claude Code settings as shown in the setup section.

### "Python not found" or "ModuleNotFoundError: No module named 'fal_client'"

Install the required Python package:
```bash
pip install fal-client
```

## License

MIT

## Author

noranekob

## Links

- [GitHub Repository](https://github.com/noranekob/fal-mcp-server)
- [Report Issues](https://github.com/noranekob/fal-mcp-server/issues)
- [fal.ai Documentation](https://fal.ai/docs)