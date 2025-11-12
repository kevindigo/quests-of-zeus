#!/usr/bin/env -S deno run --allow-read --allow-write

import { QuestsZeusGameEngine } from '../src/game-engine.ts';
import { HexMapSVG } from '../src/hexmap-svg.ts';

async function generateSVGToFile() {
  console.log('Generating SVG map...');

  // Initialize the game to get a proper map
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const gameState = engine.getGameState();
  const grid = gameState.map.serialize();

  console.log('Grid structure:', {
    length: grid.length,
    firstRowLength: grid[0]?.length,
    firstCell: grid[0]?.[0],
    gridType: typeof grid,
    hasReduce: typeof grid.reduce === 'function',
  });

  // Create the SVG
  const hexMapSVG = new HexMapSVG({
    cellSize: 30,
    showCoordinates: true,
    showTerrainLabels: true,
    interactive: false,
    cityHexes: gameState.cityHexes,
    cubeHexes: gameState.cubeHexes,
    monsterHexes: gameState.monsterHexes,
  });

  const { svg } = hexMapSVG.generateInteractiveSVG(grid);

  // Write to file
  const filename = 'debug-map.svg';
  await Deno.writeTextFile(filename, svg);

  console.log(`✅ SVG map saved to ${filename}`);

  // Calculate total cells safely
  let totalCells = 0;
  if (Array.isArray(grid) && typeof grid.reduce === 'function') {
    totalCells = grid.reduce((sum, row) => sum + row.length, 0);
  } else if (Array.isArray(grid)) {
    totalCells = grid.reduce(
      (sum, row) => sum + (Array.isArray(row) ? row.length : 0),
      0,
    );
  } else {
    console.warn('⚠️ Grid is not a proper array structure');
    totalCells = 0;
  }

  console.log(
    `📊 Grid info: ${grid.length} rows, ${totalCells} total cells`,
  );

  // Debug: Check if (-1, 1) exists in the grid
  const cellAtNeg1_1 = gameState.map.getCell(-1, 1);
  console.log(`🔍 Cell at (-1, 1):`, cellAtNeg1_1);

  // Debug: List all cells to verify grid structure
  console.log('\n🔍 Grid structure analysis:');
  grid.forEach((row, qIndex) => {
    console.log(`Row ${qIndex}: ${row.length} cells`);
    row.forEach((cell) => {
      if (cell.q === -1 && cell.r === 1) {
        console.log(`   FOUND (-1, 1):`, cell);
      }
    });
  });
}

// Run the utility
if (import.meta.main) {
  await generateSVGToFile();
}
