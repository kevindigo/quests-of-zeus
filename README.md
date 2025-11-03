# Oracle of Delphi PWA

A Progressive Web App implementation of the Oracle of Delphi boardgame with AI opponents, built with Deno 2.5.

## Features

- 🎮 Board game implementation
- 🤖 AI opponents
- 📱 Progressive Web App (PWA)
- ⚡ Built with Deno 2.5
- 🎨 Modern web technologies
- 💻 **Now entirely client-side!**

## Getting Started

### Prerequisites

- [Deno 2.5](https://deno.land/) or later

### Installation

1. Clone this repository
2. Run the development server:

```bash
deno task dev
```

### Available Tasks

- `deno task dev` - Start development server with file watching
- `deno task start` - Start production server
- `deno task test` - Run tests
- `deno task lint` - Run linter
- `deno task fmt` - Format code

### Project Structure

```
├── main.ts              # Simple static file server (development only)
├── index.html           # Main HTML file with game UI
├── game.js              # Client-side game logic
├── manifest.json        # PWA manifest
├── sw.js               # Service Worker
├── assets/             # Static assets (icons, images)
├── deno.json           # Deno configuration
└── README.md           # This file
```

## Development

This project follows an incremental development approach. The current state is a basic PWA skeleton with:

- ✅ Deno 2.5 server setup (static files only)
- ✅ PWA manifest and service worker
- ✅ **Client-side game logic**
- ✅ Hex map generation (21x21 grid)
- ✅ Procedural terrain generation
- ✅ Special locations (oracles, ports, sanctuaries)
- ✅ Development tasks configured
- ✅ Testing setup

## Architecture

**Client-Side Only**: The game now runs entirely in the browser:
- Game logic is implemented in JavaScript/TypeScript
- No server-side API dependencies
- Map generation happens in the browser
- Works offline with service worker caching

**Key Components**:
- `game.js` - Core game logic, hex map, terrain generation
- `index.html` - Game UI and controls
- `main.ts` - Simple static file server (development)

## Game Features

- **21x21 Hex Map**: Procedurally generated terrain
- **Terrain Types**: Sea, coast, plains, hills, mountains, forest, desert
- **Special Locations**: Oracle temples, ports, sanctuaries, offering sites
- **Movement System**: Different movement costs per terrain
- **Resource System**: Gold, offerings, divine favor

## Next Steps

1. Add interactive hex map visualization
2. Implement player movement and actions
3. Add game state management
4. Implement core game mechanics
5. Add AI opponent logic
6. Enhance UI/UX

## License

MIT