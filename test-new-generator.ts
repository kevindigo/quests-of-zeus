#!/usr/bin/env -S deno run

// Test script for the new map generator

import { NewMapGenerator } from './new-map-generator.ts';

console.log('Testing New Map Generator...\n');

// Test the new generator
const generator = new NewMapGenerator();
const grid = generator.getGrid();

// Count terrain types
const terrainCounts: Record<string, number> = {};
let totalCells = 0;

for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
  const row = grid[arrayQ];
  if (row) {
    for (let arrayR = 0; arrayR < row.length; arrayR++) {
      const cell = row[arrayR];
      if (cell) {
        terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
        totalCells++;
      }
    }
  }
}

console.log('Map Statistics:');
console.log(`Total cells: ${totalCells}`);
console.log('Terrain counts:');
Object.entries(terrainCounts).forEach(([terrain, count]) => {
  console.log(`  ${terrain}: ${count}`);
});

// Test for lakes (water tiles not connected to Zeus)
console.log('\nChecking for lakes...');
const zeusCell = grid[6]?.[6]; // Center cell (q=0, r=0)
if (zeusCell && zeusCell.terrain === 'zeus') {
  console.log('✓ Zeus tile found at center');
} else {
  console.log('✗ Zeus tile not found at center');
}

// Test for landlocked land tiles
console.log('\nChecking for landlocked land tiles...');
let landlockedCount = 0;
for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
  const row = grid[arrayQ];
  if (row) {
    for (let arrayR = 0; arrayR < row.length; arrayR++) {
      const cell = row[arrayR];
      if (cell && (cell.terrain === 'shallow' || cell.terrain === 'foundations')) {
        // Check if this land/shallow tile is adjacent to sea/shallows/zeus
        let hasSeaOrShallowsNeighbor = false;
        for (let direction = 0; direction < 6; direction++) {
          const adjacentCoords = generator.getAdjacent(cell.q, cell.r, direction);
          if (!adjacentCoords) continue;
          
          const adjacentCell = generator.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
          if (!adjacentCell) continue;
          
          if (adjacentCell.terrain === 'sea' || adjacentCell.terrain === 'shallow' || adjacentCell.terrain === 'zeus') {
            hasSeaOrShallowsNeighbor = true;
            break;
          }
        }
        
        if (!hasSeaOrShallowsNeighbor) {
          landlockedCount++;
          console.log(`✗ Landlocked tile found at (${cell.q}, ${cell.r}) - terrain: ${cell.terrain}`);
        }
      }
    }
  }
}

if (landlockedCount === 0) {
  console.log('✓ No landlocked land tiles found!');
} else {
  console.log(`✗ Found ${landlockedCount} landlocked land tiles`);
}

console.log('\nTest completed.');