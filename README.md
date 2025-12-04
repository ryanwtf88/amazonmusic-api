# Amazon Music API

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Serverless Amazon Music metadata scraper deployed on Cloudflare Workers.

## Features

- Serverless deployment on Cloudflare Workers edge network
- Yahoo Search integration for track discovery
- OpenGraph metadata scraping
- CORS enabled for frontend integration
- Interactive Swagger UI documentation

## Quick Start

```bash
npm install
npm run dev  # Local development at http://localhost:8787
npm run deploy  # Deploy to Cloudflare Workers
```

## API Endpoints

Base URL: `https://amazonmusic-api.ryanwtf.workers.dev`

### Search Tracks

```http
GET /api/search/songs?query={query}&limit={limit}
```

**Parameters:**
- `query` (required) - Search term
- `limit` (optional) - Results count (default: 20, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "B079TPJ3G4",
      "name": "Result B079TPJ3G4",
      "url": "https://music.amazon.com/tracks/B079TPJ3G4",
      "artist": { "name": "Unknown" },
      "album": { "name": "Unknown" },
      "duration": 0
    }
  ]
}
```

### Get Track

```http
GET /api/songs/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "B079TPJ3G4",
    "name": "Whatever It Takes",
    "title": "Whatever It Takes",
    "artist": {
      "name": "Unknown Artist",
      "url": ""
    },
    "duration": 0,
    "url": "https://music.amazon.com/tracks/B079TPJ3G4",
    "image": "https://m.media-amazon.com/images/I/617AJXTR5HL.jpg",
    "album": {
      "name": "Unknown Album",
      "url": ""
    }
  }
}
```

### Get Album

```http
GET /api/albums/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Album Title",
    "url": "https://music.amazon.com/albums/B0DJQ7HNNG",
    "image": "https://m.media-amazon.com/images/I/...",
    "artist": {
      "name": "Artist Name",
      "url": ""
    },
    "songs": []
  }
}
```

### Get Artist

```http
GET /api/artists/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Artist Name",
    "url": "https://music.amazon.com/artists/B003AM1Q94",
    "image": "https://m.media-amazon.com/images/I/...",
    "topSongs": []
  }
}
```

### Get Playlist

```http
GET /api/playlists/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Playlist Name",
    "url": "https://music.amazon.com/playlists/B074J96K3Y",
    "image": "https://m.media-amazon.com/images/I/...",
    "createdBy": "Amazon Music",
    "songs": []
  }
}
```

### Get User Playlist

```http
GET /api/community-playlists/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "User Playlist",
    "url": "https://music.amazon.com/user-playlists/...",
    "image": "https://m.media-amazon.com/images/I/...",
    "songs": []
  }
}
```

### Parse URL

```http
GET /api/parse-url?url={url}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "tracks",
    "id": "B079TPJ3G4"
  }
}
```

### Load from URL

```http
GET /api/load-url?url={url}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "B079TPJ3G4",
    "name": "Track Name",
    "url": "https://music.amazon.com/tracks/B079TPJ3G4",
    "image": "https://m.media-amazon.com/images/I/..."
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Limitations

Due to Amazon Music's client-side rendering:
- Artist and album metadata may show as "Unknown"
- Duration always returns 0 (not available in OpenGraph tags)
- Search relies on Yahoo indexing (may not include all tracks)

## Documentation

Interactive API documentation available at:
- Swagger UI: `https://amazonmusic-api.ryanwtf.workers.dev/`
- OpenAPI Spec: `https://amazonmusic-api.ryanwtf.workers.dev/swagger.json`

## TypeScript Client

```typescript
import { AmazonMusicClient } from './amazonmusic';

const client = new AmazonMusicClient({
  apiUrl: 'https://music.amazon.com',
  searchLimit: 20,
  timeout: 10000
});

// Search
const tracks = await client.search('imagine dragons', 5);

// Get track
const track = await client.getTrack('B079TPJ3G4');

// Parse URL
const parsed = client.parseUrl('https://music.amazon.com/tracks/B079TPJ3G4');
```

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Local development server
npm run deploy   # Deploy to Cloudflare Workers
```

## License

MIT

## Author

RY4N
