export const openapi = {
    "openapi": "3.0.0",
    "info": {
        "title": "Amazon Music API",
        "version": "1.0.0",
        "description": "API for scraping and retrieving metadata from Amazon Music using OpenGraph tags and Yahoo search."
    },
    "servers": [
        {
            "url": "https://amazonmusic-api.ryanwtf.workers.dev",
            "description": "Production Server"
        },
        {
            "url": "http://localhost:8787",
            "description": "Local Development"
        }
    ],
    "paths": {
        "/api/search/songs": {
            "get": {
                "summary": "Search for tracks only",
                "description": "Search Amazon Music for tracks/songs only. Uses Yahoo search to find track URLs.",
                "parameters": [
                    {
                        "name": "query",
                        "in": "query",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Search query (e.g., 'imagine dragons')",
                        "example": "imagine dragons"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "required": false,
                        "schema": { "type": "integer", "default": 20, "maximum": 50 },
                        "description": "Number of results to return (max 50)",
                        "example": 5
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful search results",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean", "example": true },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": { "type": "string", "example": "B079TPJ3G4" },
                                                    "name": { "type": "string", "example": "Result B079TPJ3G4" },
                                                    "url": { "type": "string", "example": "https://music.amazon.com/tracks/B079TPJ3G4" },
                                                    "artist": {
                                                        "type": "object",
                                                        "properties": {
                                                            "name": { "type": "string", "example": "Unknown" }
                                                        }
                                                    },
                                                    "album": {
                                                        "type": "object",
                                                        "properties": {
                                                            "name": { "type": "string", "example": "Unknown" }
                                                        }
                                                    },
                                                    "duration": { "type": "integer", "example": 0 }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/songs/{id}": {
            "get": {
                "summary": "Get track details by ID",
                "description": "Fetch track metadata using OpenGraph scraping",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Amazon Music Track ID (ASIN)",
                        "example": "B079TPJ3G4"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Track details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": { "type": "string" },
                                                "name": { "type": "string" },
                                                "url": { "type": "string" },
                                                "artist": { "type": "object" },
                                                "album": { "type": "object" },
                                                "image": { "type": "string" },
                                                "duration": { "type": "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Track not found" }
                }
            }
        },
        "/api/albums/{id}": {
            "get": {
                "summary": "Get album details by ID",
                "description": "Fetch album metadata using OpenGraph scraping",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Amazon Music Album ID (ASIN)",
                        "example": "B0DJQ7HNNG"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Album details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": { "type": "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Album not found" }
                }
            }
        },
        "/api/artists/{id}": {
            "get": {
                "summary": "Get artist details by ID",
                "description": "Fetch artist metadata using OpenGraph scraping",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Amazon Music Artist ID (ASIN)",
                        "example": "B003AM1Q94"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Artist details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": { "type": "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Artist not found" }
                }
            }
        },
        "/api/playlists/{id}": {
            "get": {
                "summary": "Get playlist details by ID",
                "description": "Fetch playlist metadata using OpenGraph scraping",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Amazon Music Playlist ID (ASIN)",
                        "example": "B074J96K3Y"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Playlist details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": { "type": "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Playlist not found" }
                }
            }
        },
        "/api/community-playlists/{id}": {
            "get": {
                "summary": "Get user/community playlist details by ID",
                "description": "Fetch user playlist metadata using OpenGraph scraping",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Amazon Music User Playlist ID",
                        "example": "ffc23696628d4be99f6a8c70d3c9e2ebsune"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "User playlist details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": { "type": "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Playlist not found" }
                }
            }
        },
        "/api/parse-url": {
            "get": {
                "summary": "Parse an Amazon Music URL",
                "description": "Extract type and ID from an Amazon Music URL",
                "parameters": [
                    {
                        "name": "url",
                        "in": "query",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Full Amazon Music URL",
                        "example": "https://music.amazon.com/tracks/B079TPJ3G4"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Parsed URL components",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "type": { "type": "string", "enum": ["tracks", "albums", "artists", "playlists", "user-playlists"] },
                                                "id": { "type": "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": { "description": "Invalid URL" }
                }
            }
        },
        "/api/load-url": {
            "get": {
                "summary": "Load content from an Amazon Music URL",
                "description": "Parse URL and fetch the corresponding content details",
                "parameters": [
                    {
                        "name": "url",
                        "in": "query",
                        "required": true,
                        "schema": { "type": "string" },
                        "description": "Full Amazon Music URL",
                        "example": "https://music.amazon.com/albums/B0DJQ7HNNG"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Content details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": { "type": "boolean" },
                                        "data": { "type": "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { "description": "Content not found" }
                }
            }
        }
    }
};
