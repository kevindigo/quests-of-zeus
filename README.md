# Quests of Zeus PWA

A Progressive Web App implementation of the Quests of Zeus boardgame, built with
Deno 2.5.

The rules and gameplay concepts in this project were heavily inspired by the
board game The Oracle of Delphi, designed by Stefan Feld and copyright 2016 by
Hall Games. No copyrighted materials, trademarks, or proprietary assets from
that game are used. This project is entirely independent and not endorsed by or
associated with its creators or publishers.

Note: This app was initially developed via "vibe coding" with Deepseek AI. After
the basics were working, AI was reduced to occasional consultations.

## Getting Started

### Prerequisites

- [Deno 2.5](https://deno.land/) or later

### Installation

1. Clone this repository
2. Run the tests:

```bash
deno test
```

3. Build the game:

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
and gain favor with the gods. Complete 12 quests, and return to Zeus.

### Game Components

- **Map**: Hexagonal grid with sea, land, and special terrain
- **Oracle Dice**: 6 colors (red, pink, blue, black, green, yellow) that power
  actions
- **Storage System**: Each player has 2 storage slots that can hold either 1
  cube or 1 statue of any color
- **Cubes**: Collected from cube hexes, used for temple offering quests
- **Statues**: Picked up at cities, and dropped off on matching statue bases
- **Quests**: 4 types (temple_offering, monster, statue, cloud) - must complete
  3 of each type to win

## Project Structure

```
├── src/
├── index.html               # Main game interface
├── dist/                    # Compiled JavaScript files
├── tests/                   # Test files
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker
├── assets/                  # Static assets
├── deno.json               # Deno configuration
└── README.md               # This file
```

## Development Status

✅ **Completed Features**:

- Hexagonal map generation (radius 6)
- Interactive UI with player markers
- Players, cubes, monsters, and statue bases are placed in consistent positions
  within each hex, by color, to help with colorblind accessibility
- Procedural terrain placement and other setup
- Oracle dice, cards, and favor
- Player ship movement
- Interact with shrine (cloud) tiles
- Pick up and drop off cubes

🔄 **To be completed**:

- Various types of quests
- Indicate sea hex colors using symbols
- Injuries
- Gods
- Equipment
- Companions
- Game end

📋 **Possible future Features**:

- AI opponents
- Game state persistence
- Game statistics and analytics
- Sound effects and music
- Mobile optimization
- Multi-language support

## Game Rules Implementation

The game closely aligns with the official Oracle of Delphi rules by Stefan Feld,
but has variations:

- **Map**: Hexagonal grid with radius 6, and each feature is individually
  placed, rather than as part of larger tiles
- **Players**: Currently only allows 2 players (but theoretically supports 2-4)
- **Quests**: Monster and temple quests are never green or red, for
  accessibility

## Contributing

Providing any feedback is a form of contribution. If you want to help with the
code:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `deno test`
5. Submit a pull request

## License

GPL 3.0
