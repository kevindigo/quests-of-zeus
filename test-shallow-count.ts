#!/usr/bin/env -S deno run

// Test script to check shallow count with the new parameters

import { NewMapGenerator } from './new-map-generator.ts';

console.log('Testing New Map Generator with adjusted parameters...\n');

// Run multiple tests to get average shallow count
const testCount = 10;
let totalShallowCount = 0;
let totalExtraFoundations = 0;

for (let test = 0; test < testCount; test++) {
  const generator = new NewMapGenerator();
  const grid = generator.getGrid();

  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  let foundationsCount = 0;

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          if (cell.terrain === "foundations") {
            foundationsCount++;
          }
        }
      }
    }
  }

  const shallowCount = terrainCounts["shallow"] || 0;
  totalShallowCount += shallowCount;
  totalExtraFoundations += foundationsCount;
  
  console.log(`Test ${test + 1}:`);
  console.log(`  Shallow tiles: ${shallowCount}`);
  console.log(`  Foundations left: ${foundationsCount}`);
}

const avgShallowCount = totalShallowCount / testCount;
const avgFoundations = totalExtraFoundations / testCount;

console.log('\nAverage Results:');
console.log(`Average shallow tiles: ${avgShallowCount.toFixed(1)}`);
console.log(`Average foundations left: ${avgFoundations.toFixed(1)}`);

if (avgShallowCount <= 10) {
  console.log('✓ Target achieved: About 10 extra shallow tiles');
} else {
  console.log(`✗ Target not achieved: ${avgShallowCount.toFixed(1)} is more than 10`);
}