import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AmazonMusicClient } from './amazonmusic';
import { openapi } from './openapi';

// Create Hono app
const app = new Hono();

// Enable CORS for all routes
app.use('/*', cors());

// Swagger UI and OpenAPI
app.get('/', (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Amazon Music API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/swagger.json',
                dom_id: '#swagger-ui',
            });
        };
    </script>
</body>
</html>
    `);
});

app.get('/swagger.json', (c) => {
    return c.json(openapi);
});

// Initialize client (you can configure this via environment variables)
const getClient = () => {
    return new AmazonMusicClient({
        apiUrl: 'https://music.amazon.com', // This should be your actual API URL
        searchLimit: 10,
        timeout: 10000
    });
};

// Get track by ID
app.get('/api/songs/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const client = getClient();
        const track = await client.getTrack(id);

        if (!track) {
            return c.json({ success: false, error: 'Track not found' }, 404);
        }

        return c.json({ success: true, data: track });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get album by ID
app.get('/api/albums/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const client = getClient();
        const album = await client.getAlbum(id);

        if (!album) {
            return c.json({ success: false, error: 'Album not found' }, 404);
        }

        return c.json({ success: true, data: album });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get artist by ID
app.get('/api/artists/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const client = getClient();
        const artist = await client.getArtist(id);

        if (!artist) {
            return c.json({ success: false, error: 'Artist not found' }, 404);
        }

        return c.json({ success: true, data: artist });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get playlist by ID
app.get('/api/playlists/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const client = getClient();
        const playlist = await client.getPlaylist(id);

        if (!playlist) {
            return c.json({ success: false, error: 'Playlist not found' }, 404);
        }

        return c.json({ success: true, data: playlist });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Get user/community playlist by ID
app.get('/api/community-playlists/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const client = getClient();
        const playlist = await client.getUserPlaylist(id);

        if (!playlist) {
            return c.json({ success: false, error: 'User playlist not found' }, 404);
        }

        return c.json({ success: true, data: playlist });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Search for songs
app.get('/api/search/songs', async (c) => {
    try {
        const query = c.req.query('query');
        const limit = parseInt(c.req.query('limit') || '5');

        if (!query) {
            return c.json({ success: false, error: 'Query parameter is required' }, 400);
        }

        const client = getClient();
        const tracks = await client.search(query, limit);

        return c.json({ success: true, data: tracks });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Parse Amazon Music URL
app.get('/api/parse-url', async (c) => {
    try {
        const url = c.req.query('url');

        if (!url) {
            return c.json({ success: false, error: 'URL parameter is required' }, 400);
        }

        const client = getClient();
        const parsed = client.parseUrl(url);

        if (!parsed) {
            return c.json({ success: false, error: 'Invalid Amazon Music URL' }, 400);
        }

        return c.json({ success: true, data: parsed });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Debug fetch endpoint
app.get('/api/debug-fetch', async (c) => {
    try {
        const response = await fetch('http://httpbin.org/headers', {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
            }
        });
        const data = await response.json();
        return c.json({ success: true, data });
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});

// Load content from Amazon Music URL
app.get('/api/load-url', async (c) => {
    try {
        const url = c.req.query('url');

        if (!url) {
            return c.json({ success: false, error: 'URL parameter is required' }, 400);
        }

        const client = getClient();
        const content = await client.loadFromUrl(url);

        if (!content) {
            return c.json({ success: false, error: 'Could not load content from URL' }, 404);
        }

        return c.json({ success: true, data: content });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Export for Cloudflare Workers
export default app;
