// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Configuration options for the Amazon Music API client
 */
export interface AmazonMusicConfig {
    /** Base URL of the Amazon Music API server (required) */
    apiUrl: string;
    /** Maximum number of search results (default: 5, max: 10) */
    searchLimit?: number;
    /** Custom user agent for HTTP requests */
    userAgent?: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
}

// ============================================================================
// Data Model Interfaces
// ============================================================================

/**
 * Artist information
 */
export interface Artist {
    name: string;
    url?: string;
}

/**
 * Album information
 */
export interface Album {
    name: string;
    url?: string;
}

/**
 * Track/Song information
 */
export interface Track {
    /** Track ID */
    id: string;
    /** Track name/title */
    name: string;
    /** Track title (alternative field) */
    title?: string;
    /** Artist information */
    artist: Artist;
    /** Duration in seconds */
    duration: number;
    /** Track URL */
    url: string;
    /** Cover/artwork image URL */
    image?: string;
    /** Album information */
    album: Album;
}

/**
 * Album with full track listing
 */
export interface AlbumFull {
    /** Album name */
    name: string;
    /** Album URL */
    url: string;
    /** Album artwork URL */
    image?: string;
    /** Artist information */
    artist: Artist;
    /** List of tracks in the album */
    songs: Track[];
    /** Total number of songs */
    totalSongs?: number;
}

/**
 * Artist with top tracks
 */
export interface ArtistFull {
    /** Artist name */
    name: string;
    /** Artist URL */
    url: string;
    /** Artist image/photo URL */
    image?: string;
    /** Top tracks by the artist */
    topSongs: Track[];
}

/**
 * Playlist information
 */
export interface Playlist {
    /** Playlist name */
    name: string;
    /** Playlist URL */
    url: string;
    /** Playlist artwork URL */
    image?: string;
    /** Creator/author of the playlist */
    createdBy?: string;
    /** List of tracks in the playlist */
    songs: Track[];
    /** Total number of songs */
    totalSongs?: number;
}



/**
 * URL parse result
 */
export interface ParsedUrl {
    type: 'tracks' | 'albums' | 'artists' | 'playlists' | 'user-playlists';
    id: string;
}

// ============================================================================
// Main Client Class
// ============================================================================

/**
 * Amazon Music API Client
 * 
 * Provides methods to interact with an Amazon Music API server for fetching
 * tracks, albums, artists, playlists, and search results.
 */
export class AmazonMusicClient {
    private readonly baseUrl: string;
    private readonly searchLimit: number;
    private readonly timeout: number;

    /** URL pattern for Amazon Music URLs */
    private static readonly URL_PATTERN = /https?:\/\/music\.amazon\.[^/]+\/(?<type>albums|tracks|artists|playlists|user-playlists)\/(?<id>[A-Za-z0-9]+)(?:\/[^/?#]+)?(?:[/?].*)?$/i;

    /**
     * Create a new Amazon Music API client
     * 
     * @param config - Configuration options
     * @throws Error if apiUrl is not provided
     */
    constructor(config: AmazonMusicConfig) {
        if (!config.apiUrl || config.apiUrl.trim() === '') {
            throw new Error('Amazon Music API URL must be set');
        }

        // Remove trailing slash from base URL
        this.baseUrl = config.apiUrl.endsWith('/')
            ? config.apiUrl.substring(0, config.apiUrl.length - 1)
            : config.apiUrl;

        // Set search limit (min: 1, max: 10, default: 5)
        this.searchLimit = config.searchLimit
            ? Math.max(1, Math.min(config.searchLimit, 10))
            : 5;

        this.timeout = config.timeout || 10000;
    }

    /**
     * Fetch page content and extract metadata using OpenGraph tags
     * 
     * @param path - API endpoint path or full URL
     * @returns Parsed metadata
     */
    private async fetchMetadata(path: string): Promise<any> {
        try {
            // Construct URL
            let url = path;
            if (!path.startsWith('http')) {
                // Normalize path
                if (!path.startsWith('/')) {
                    path = '/' + path;
                }
                // Handle /api prefix removal if present
                if (this.baseUrl.endsWith('/api') && path.startsWith('/api')) {
                    path = path.substring(4);
                }
                url = this.baseUrl + path;
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                console.log(`Fetching metadata from: ${url}`);
                // Use Facebook User-Agent to get OpenGraph tags
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    },
                    signal: controller.signal,
                });

                console.log(`Response status: ${response.status}`);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                return this.parseOpenGraph(html, url);
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${this.timeout}ms`);
                }
                throw new Error(`Request failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Parse OpenGraph tags and additional metadata from HTML
     */
    private parseOpenGraph(html: string, url: string): any {
        const metadata: any = {
            url: url,
            title: '',
            description: '',
            image: '',
            type: '',
            site_name: '',
            audio: '',
            artist: '',
            album: ''
        };

        // Regex to match meta tags
        const metaRegex = /\u003cmeta\s+property="og:([^"]+)"\s+content="([^"]*)"/g;
        let match;

        while ((match = metaRegex.exec(html)) !== null) {
            const property = match[1];
            const content = match[2];

            switch (property) {
                case 'title':
                    metadata.title = content;
                    break;
                case 'description':
                    metadata.description = content;
                    break;
                case 'image':
                case 'image:secure_url':
                    if (!metadata.image) metadata.image = content;
                    break;
                case 'type':
                    metadata.type = content;
                    break;
                case 'site_name':
                    metadata.site_name = content;
                    break;
                case 'audio':
                case 'audio:url':
                case 'audio:secure_url':
                    if (!metadata.audio) metadata.audio = content;
                    break;
            }
        }

        // Fallback for title if not found in OG
        if (!metadata.title) {
            const titleMatch = /\u003ctitle\u003e([^\u003c]*)\u003c\/title\u003e/i.exec(html);
            if (titleMatch) {
                metadata.title = titleMatch[1].replace(' | Amazon Music', '').trim();
            }
        }

        // Try to extract artist and album from JSON-LD structured data
        const jsonLdMatch = /\u003cscript type="application\/ld\+json"\u003e([\s\S]*?)\u003c\/script\u003e/i.exec(html);
        if (jsonLdMatch) {
            try {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                if (jsonLd['@type'] === 'MusicRecording') {
                    if (jsonLd.byArtist) {
                        metadata.artist = jsonLd.byArtist.name || jsonLd.byArtist['@id'] || '';
                    }
                    if (jsonLd.inAlbum) {
                        metadata.album = jsonLd.inAlbum.name || '';
                    }
                }
            } catch (e) {
                // JSON-LD parsing failed, continue
            }
        }

        // If artist not found, try to extract from page title (format: "Song - Artist")
        if (!metadata.artist && metadata.title && metadata.title.includes(' - ')) {
            const parts = metadata.title.split(' - ');
            if (parts.length >= 2) {
                metadata.artist = parts[1].trim();
            }
        }

        return metadata;
    }

    /**
     * Get a single track by ID
     * 
     * @param id - Track ID
     * @returns Track information or null if not found
     */
    async getTrack(id: string): Promise<Track | null> {
        const metadata = await this.fetchMetadata(`/tracks/${id}`);

        if (!metadata.title) {
            return null;
        }

        return {
            id: id,
            name: metadata.title,
            title: metadata.title,
            artist: {
                name: metadata.artist || 'Unknown Artist',
                url: metadata.artist ? `https://music.amazon.com/search/${encodeURIComponent(metadata.artist)}` : ''
            },
            duration: 0, // Duration not available via OpenGraph scraping
            url: metadata.url,
            image: metadata.image,
            album: {
                name: metadata.album || 'Unknown Album',
                url: metadata.album ? `https://music.amazon.com/search/${encodeURIComponent(metadata.album)}` : ''
            }
        };
    }

    /**
     * Get an album with all its tracks
     * 
     * @param id - Album ID
     * @returns Album information or null if not found
     */
    async getAlbum(id: string): Promise<AlbumFull | null> {
        const metadata = await this.fetchMetadata(`/albums/${id}`);

        if (!metadata.title) {
            return null;
        }

        return {
            name: metadata.title,
            url: metadata.url,
            image: metadata.image,
            artist: {
                name: metadata.description.replace('On Amazon Music', '').trim() || 'Unknown Artist',
                url: ''
            },
            songs: [], // Track list not available in OG tags
            totalSongs: 0
        };
    }

    /**
     * Get an artist with their top tracks
     * 
     * @param id - Artist ID
     * @returns Artist information or null if not found
     */
    async getArtist(id: string): Promise<ArtistFull | null> {
        const metadata = await this.fetchMetadata(`/artists/${id}`);

        if (!metadata.title) {
            return null;
        }

        return {
            name: metadata.title,
            url: metadata.url,
            image: metadata.image,
            topSongs: [] // Top songs not available in OG tags
        };
    }

    /**
     * Get a playlist with all its tracks
     * 
     * @param id - Playlist ID
     * @returns Playlist information or null if not found
     */
    async getPlaylist(id: string): Promise<Playlist | null> {
        const metadata = await this.fetchMetadata(`/playlists/${id}`);

        if (!metadata.title) {
            return null;
        }

        return {
            name: metadata.title,
            url: metadata.url,
            image: metadata.image,
            createdBy: 'Amazon Music',
            songs: [], // Songs not available in OG tags
            totalSongs: 0
        };
    }

    /**
     * Get a user/community playlist with all its tracks
     * 
     * @param id - User playlist ID
     * @returns Playlist information or null if not found
     */
    async getUserPlaylist(id: string): Promise<Playlist | null> {
        const metadata = await this.fetchMetadata(`/user-playlists/${id}`);

        if (!metadata.title) {
            return null;
        }

        return {
            name: metadata.title,
            url: metadata.url,
            image: metadata.image,
            createdBy: 'User',
            songs: [], // Songs not available in OG tags
            totalSongs: 0
        };
    }

    /**
     * Search for tracks only
     * 
     * @param query - Search query string
     * @param limit - Maximum number of results (optional, default 20)
     * @returns Array of matching tracks only
     */
    async search(query: string, limit: number = 20): Promise<Track[]> {
        try {
            // First try: Search specifically for tracks
            let searchUrl = `https://search.yahoo.com/search?p=site:music.amazon.com/tracks+${encodeURIComponent(query)}&nojs=1`;
            console.log(`Searching Yahoo: ${searchUrl}`);

            let response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                }
            });

            if (!response.ok) {
                console.error(`Yahoo search failed: ${response.status} ${response.statusText}`);
                return [];
            }

            let html = await response.text();
            let results: Track[] = [];

            // Regex to find Yahoo redirect links containing music.amazon.com
            const linkRegex = /href="https:\/\/r\.search\.yahoo\.com\/[^"]*RU=([^"\/]+)\//g;

            let match;
            const processedIds = new Set<string>();

            while ((match = linkRegex.exec(html)) !== null) {
                if (results.length >= limit) break;

                try {
                    const encodedUrl = match[1];
                    const decodedUrl = decodeURIComponent(encodedUrl);

                    if (!decodedUrl.includes('music.amazon.com')) continue;

                    const parsed = this.parseUrl(decodedUrl);

                    // Only process tracks
                    if (parsed && parsed.type === 'tracks' && !processedIds.has(parsed.id)) {
                        processedIds.add(parsed.id);

                        results.push({
                            id: parsed.id,
                            name: `Result ${parsed.id}`,
                            url: `https://music.amazon.com/${parsed.type}/${parsed.id}`,
                            artist: { name: 'Unknown' },
                            album: { name: 'Unknown' },
                            duration: 0
                        } as Track);
                    }
                } catch (e) {
                    console.error('Error parsing search result:', e);
                }
            }

            // If no results found with /tracks/, try broader search
            if (results.length === 0) {
                console.log('No results with /tracks/, trying broader search...');
                searchUrl = `https://search.yahoo.com/search?p=site:music.amazon.com+${encodeURIComponent(query)}&nojs=1`;

                response = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*'
                    }
                });

                if (response.ok) {
                    html = await response.text();
                    const linkRegex2 = /href="https:\/\/r\.search\.yahoo\.com\/[^"]*RU=([^"\/]+)\//g;

                    while ((match = linkRegex2.exec(html)) !== null) {
                        if (results.length >= limit) break;

                        try {
                            const encodedUrl = match[1];
                            const decodedUrl = decodeURIComponent(encodedUrl);

                            if (!decodedUrl.includes('music.amazon.com')) continue;

                            const parsed = this.parseUrl(decodedUrl);

                            // Only process tracks
                            if (parsed && parsed.type === 'tracks' && !processedIds.has(parsed.id)) {
                                processedIds.add(parsed.id);

                                results.push({
                                    id: parsed.id,
                                    name: `Result ${parsed.id}`,
                                    url: `https://music.amazon.com/${parsed.type}/${parsed.id}`,
                                    artist: { name: 'Unknown' },
                                    album: { name: 'Unknown' },
                                    duration: 0
                                } as Track);
                            }
                        } catch (e) {
                            console.error('Error parsing search result:', e);
                        }
                    }
                }
            }

            return results;

        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Parse an Amazon Music URL and extract type and ID
     * 
     * @param url - Amazon Music URL
     * @returns Parsed URL information or null if invalid
     */
    parseUrl(url: string): ParsedUrl | null {
        const match = url.trim().match(AmazonMusicClient.URL_PATTERN);
        if (!match || !match.groups) {
            return null;
        }

        const { type, id } = match.groups;
        if (!type || !id) {
            return null;
        }

        return {
            type: type as ParsedUrl['type'],
            id: id,
        };
    }

    /**
     * Load content from an Amazon Music URL
     * 
     * @param url - Amazon Music URL
     * @returns Track, Album, Artist, or Playlist based on URL type
     */
    async loadFromUrl(url: string): Promise<Track | AlbumFull | ArtistFull | Playlist | null> {
        const parsed = this.parseUrl(url);
        if (!parsed) {
            return null;
        }

        switch (parsed.type) {
            case 'tracks':
                return this.getTrack(parsed.id);
            case 'albums':
                return this.getAlbum(parsed.id);
            case 'artists':
                return this.getArtist(parsed.id);
            case 'playlists':
                return this.getPlaylist(parsed.id);
            case 'user-playlists':
                return this.getUserPlaylist(parsed.id);
            default:
                return null;
        }
    }

    /**
     * Get the configured search limit
     */
    getSearchLimit(): number {
        return this.searchLimit;
    }

    /**
     * Get the base API URL
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
}

export default AmazonMusicClient;
