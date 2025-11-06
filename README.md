# Oracle of Delphi PWA

A Progressive Web App implementation of the Oracle of Delphi boardgame with AI
opponents, built with Deno 2.5.

## Features

- 🎮 **Playable Board Game** - Full Oracle of Delphi gameplay implementation
- 🗺️ **Procedural Map Generation** - Hexagonal map with authentic terrain
- 🎲 **Game Mechanics** - Oracle dice, movement, quests, and combat
- 🤖 **Multiplayer Support** - 2-4 player game (AI coming soon)
- 📱 **Progressive Web App** - Installable and works offline
- ⚡ **Modern Tech Stack** - Built with Deno 2.5 and TypeScript
- 🎨 **Interactive UI** - SVG-based hex map with player markers

## Getting Started

### Prerequisites

- [Deno 2.5](https://deno.land/) or later

### Installation

1. Clone this repository
2. Build the game:

```bash
deno task build
```

3. Run the development server:

```bash
deno task dev
```

4. Open your browser to `http://localhost:8000`

### Available Tasks

- `deno task dev` - Start development server with file watching
- `deno task start` - Start production server
- `deno task build` - Build TypeScript to JavaScript
- `deno task test` - Run tests
- `deno task lint` - Run linter
- `deno task fmt` - Format code

## How to Play

Oracle of Delphi is a pick-up-and-deliver board game set in Greek mythology. Players sail their ships around the Greek islands to complete quests and gain favor with the gods.

### Game Flow

1. **Oracle Phase**: Roll 3 oracle dice to determine available actions
2. **Movement Phase**: Move your ship using oracle dice for sea movement
3. **Action Phase**: Perform actions based on your location:
   - **Collect Offerings** from cube hexes
   - **Fight Monsters** on monster hexes
   - **Build Temples** on temple hexes
   - **Build Foundations** on foundation hexes

### Victory Condition

The first player to complete **3 of each quest type** (offering, monster, temple, foundation, and cloud) wins the game!

### Game Components

- **Oracle Dice**: 6 colors (red, pink, blue, black, green, yellow) that power actions
- **Offerings**: Resources collected from cube hexes
- **Quests**: 5 types (offering, monster, temple, foundation, cloud) - must complete 3 of each type to win
- **Map**: Hexagonal grid with sea, land, and special terrain

## Project Structure

```
├── src/
│   ├── main.ts              # Game server
│   ├── hexmap.ts            # Hex map generation and terrain
│   ├── hexmap-svg.ts        # SVG visualization
│   ├── game-engine.ts       # Core game mechanics
│   └── game-controller.ts   # UI controller
├── index.html               # Main game interface
├── dist/                    # Compiled JavaScript files
├── tests/                   # Test files
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker
├── assets/                  # Static assets
├── deno.json               # Deno configuration
└── README.md               # This file
```

## Game Architecture

### Core Components

1. **HexMap** - Procedural map generation with authentic Oracle of Delphi terrain
2. **GameEngine** - Core game mechanics, state management, and rules enforcement
3. **GameController** - UI management, user interactions, and game flow
4. **HexMapSVG** - Interactive SVG visualization with player markers

### Key Features

- **Procedural Generation**: Every game has a unique map layout
- **Rule Enforcement**: All game rules are properly implemented
- **Interactive UI**: Click-based movement and actions
- **Real-time Updates**: Game state updates immediately after actions
- **Multiplayer Ready**: Support for 2-4 players (currently 2 players implemented)

## Development Status

✅ **Completed Features**:
- Hexagonal map generation (radius 6)
- Procedural terrain placement
- All Oracle of Delphi terrain types
- Core game engine with rules
- Player movement and actions
- Quest system with victory points
- Interactive UI with player markers
- SVG-based map visualization

🔄 **In Progress**:
- AI opponent implementation
- Enhanced UI/UX improvements
- Game state persistence

📋 **Planned Features**:
- Advanced AI strategies
- Game statistics and analytics
- Sound effects and music
- Mobile optimization
- Multi-language support

## Game Rules Implementation

The game follows the official Oracle of Delphi rules by Stefan Feld:

- **Map**: Hexagonal grid with radius 6
- **Players**: 2-4 players (currently 2 implemented)
- **Phases**: Oracle → Movement → Action
- **Movement**: Land hexes free, sea hexes require matching oracle dice
- **Actions**: Collect offerings, fight monsters, build temples/foundations
- **Victory**: First to complete 3 of each quest type wins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `deno task test`
5. Submit a pull request

## License

MIT