# Oracle of Delphi PWA

A Progressive Web App implementation of the Oracle of Delphi boardgame with AI opponents, built with Deno 2.5.

## Features

- 🎮 Board game implementation
- 🤖 AI opponents
- 📱 Progressive Web App (PWA)
- ⚡ Built with Deno 2.5
- 🎨 Modern web technologies

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
├── main.ts              # Main server entry point
├── index.html           # Main HTML file
├── manifest.json        # PWA manifest
├── sw.js               # Service Worker
├── assets/             # Static assets (icons, images)
├── deno.json           # Deno configuration
└── README.md           # This file
```

## Development

This project follows an incremental development approach. The current state is a basic PWA skeleton with:

- ✅ Deno 2.5 server setup
- ✅ PWA manifest and service worker
- ✅ Basic HTML structure
- ✅ Development tasks configured
- ✅ Testing setup

## Next Steps

1. Implement basic game state management
2. Add game board visualization
3. Implement core game mechanics
4. Add AI opponent logic
5. Enhance UI/UX

## License

MIT