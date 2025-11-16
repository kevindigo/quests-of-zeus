# Quests of Zeus PWA

A Progressive Web App implementation of the Quests of Zeus boardgame, built with
Deno 2.5.

The rules and gameplay concepts in this project were heavily inspired by the
board game The Oracle of Delphi, designed by Stefan Feld and copyright 2016 by
Hall Games. No copyrighted materials, trademarks, or proprietary assets from
that game are used. This project is entirely independent and not endorsed by or
associated with its creators or publishers.

Note: This app was developed with a lot of assistance from AI.

## Features

- 🎮 **Playable Board Game** - Full Quests of Zeus gameplay implementation
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

Quests of Zeus is a pick-up-and-deliver board game set in the era of Greek
mythology. Players sail their ships around the Greek islands to complete quests
and gain favor with the gods.

### Game Flow

1. **Oracle Phase**: Roll 3 oracle dice to determine available actions
2. **Action Phase**: Two-step process for all actions:
   - **Step 1**: Select an oracle die from your available dice
   - **Step 2**: Perform an action using the selected die:
     - **Move Ship** to a sea hex of matching color within range
     - **Collect Cubes** from cube hexes (requires empty storage slot)
     - **Fight Monsters** on monster hexes
     - **Build Temples** on temple hexes (requires cube of matching color)
     - **Build Statues** on statue hexes
     - **Complete Cloud Quests** on cloud hexes (requires statue of matching
       color)
   - **Note**: You can change your selected die before making a move

### Victory Condition

The first player to complete **3 of each quest type** (temple_offering, monster,
statue, and cloud) wins the game!

### Game Components

- **Oracle Dice**: 6 colors (red, pink, blue, black, green, yellow) that power
  actions
- **Storage System**: Each player has 2 storage slots that can hold either 1
  cube or 1 statue of any color
- **Cubes**: Collected from cube hexes, used for temple offering quests
- **Statues**: Used for cloud quests and placed on cities
- **Cities**: 6 cities, each with a unique color, can hold up to 3 statues of
  their color
- **Quests**: 4 types (temple_offering, monster, statue, cloud) - must complete
  3 of each type to win
- **Map**: Hexagonal grid with sea, land, and special terrain

### Storage System

Each player has exactly 2 storage slots. Each slot can hold:

- **1 Cube** of any color (collected from cube hexes)
- **1 Statue** of any color (used for cloud quests and placed on cities)
- **Nothing** (empty slot)

**Key Rules**:

- Players cannot exceed 2 total items in storage
- Cubes are consumed when building temples
- Statues are consumed when completing cloud quests
- Statues can be placed on cities of matching color
- Storage management becomes a strategic element of gameplay

### City Statue System

Each of the 6 cities on the map has a unique color and can hold up to 3 statues:

- **Statue Placement**: Players can place statues on cities when they are on the
  city hex
- **Color Matching**: Statues must match the city's color
- **Visual Representation**: Statues appear as tall thin rectangles (3:1 ratio)
  next to city icons
- **Completion**: Cities with all 3 statues placed are considered complete
- **Strategic Value**: Statue placement provides additional gameplay options and
  victory paths

## Project Structure

```
├── src/
│   ├── main.ts              # Game server
│   ├── hexmap-svg.ts        # SVG visualization
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

1. **HexMap** - Procedural map generation terrain
2. **GameEngine** - Core game mechanics, state management, and rules enforcement
3. **GameController** - UI management, user interactions, and game flow
4. **HexMapSVG** - Interactive SVG visualization with player markers

### Key Features

- **Procedural Generation**: Every game has a unique map layout
- **Rule Enforcement**: All game rules are properly implemented
- **Interactive UI**: Click-based movement and actions
- **Real-time Updates**: Game state updates immediately after actions
- **Multiplayer Ready**: Support for 2-4 players (currently 2 players
  implemented)

## Development Status

✅ **Completed Features**:

- Hexagonal map generation (radius 6)
- Procedural terrain placement and other setup
- All Quests of Zeus terrain types
- Player movement
- Interactive UI with player markers
- SVG-based map visualization

🔄 **In Progress**:

- Various types of quests
- Wounds
- Gods
- Equipment
- Companions
- Game end
- AI opponent implementation
- Enhanced UI/UX improvements
- Game state persistence

📋 **Possible future Features**:

- Advanced AI strategies
- Game statistics and analytics
- Sound effects and music
- Mobile optimization
- Multi-language support

## Game Rules Implementation

The game closely aligns with the official Oracle of Delphi rules by Stefan Feld,
but has variations:

- **Map**: Hexagonal grid with radius 6
- **Players**: 2-4 players (currently 2 implemented)
- **Phases**: Oracle → Action
- **Action Phase**: Two-step process - first select a die, then perform actions
- **Movement**: Land hexes free, sea hexes require matching oracle dice
- **Actions**: Collect cubes, fight monsters, build temples/statues, complete
  cloud quests
- **Victory**: First to complete 12 quests and return to Zeus wins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `deno task test`
5. Submit a pull request

## License

GPL 3.0
