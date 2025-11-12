// Hexagonal map representation for Quests of Zeus
// The game uses a hexagon-shaped grid with radius 6 and various terrain types

import { HexMap } from './hexmap/HexMap.ts';
import type { HexColor } from './types.ts';

// Game state
let gameMap: HexMap = new HexMap();

// Export the current game map instance for SVG generation
export function getCurrentMap(): HexMap {
  return gameMap;
}

// UI Functions
export function generateNewMap(): HexMap {
  gameMap = new HexMap();
  return gameMap;
}

export function getMapStatistics() {
  const terrainCounts: Record<string, number> = {};
  const seaColorCounts: Record<HexColor, number> = {
    none: 0,
    red: 0,
    pink: 0,
    blue: 0,
    black: 0,
    green: 0,
    yellow: 0,
  };
  const grid = gameMap.getGrid();
  let totalCells = 0;

  // The grid is a jagged array (hexagon shape), so we need to iterate through each row
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;

          // Count sea tiles by color
          if (cell.terrain === 'sea' && cell.color !== 'none') {
            seaColorCounts[cell.color] = (seaColorCounts[cell.color] || 0) + 1;
          }

          totalCells++;
        }
      }
    }
  }

  return {
    dimensions: {
      width: gameMap.width,
      height: gameMap.height,
    },
    terrainCounts,
    seaColorCounts,
    totalCells,
  };
}

export function getMap() {
  return {
    map: gameMap.serialize(),
    dimensions: {
      width: gameMap.width,
      height: gameMap.height,
    },
  };
}

// Re-export the HexMap class for backward compatibility
export { HexMap } from './hexmap/HexMap.ts';
