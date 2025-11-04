// Simple test script to verify terrain distribution
import { HexMap } from './dist/hexmap.js';

function testTerrainDistribution() {
  console.log("Testing terrain distribution for 5 generated maps...\n");
  
  for (let i = 0; i < 5; i++) {
    console.log(`=== Map ${i + 1} ===`);
    
    const map = new HexMap();
    const grid = map.getGrid();
    
    const terrainCounts = {};
    let totalCells = 0;
    
    // Count all terrain types
    for (let q = 0; q < map.width; q++) {
      for (let r = 0; r < map.height; r++) {
        const cell = grid[q]?.[r];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          totalCells++;
        }
      }
    }
    
    // Expected counts
    const expectedCounts = {
      "zeus": 1,
      "sea": 6,
      "cubes": 6,
      "temple": 6,
      "foundations": 6,
      "monsters": 9,
      "clouds": 12
    };
    
    console.log("Terrain Distribution:");
    for (const [terrain, count] of Object.entries(terrainCounts)) {
      const expected = expectedCounts[terrain];
      const status = expected !== undefined && count === expected ? "✓" : "✗";
      console.log(`  ${status} ${terrain}: ${count}${expected ? ` (expected: ${expected})` : ''}`);
    }
    
    console.log(`  Total cells: ${totalCells}\n`);
    
    // Verify center 7 hexes
    const centerCell = map.getCell(0, 0);
    const surroundingHexes = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    let centerValid = true;
    if (centerCell?.terrain !== "zeus") {
      console.log("  ✗ Center cell is not zeus!");
      centerValid = false;
    }
    
    for (const [dq, dr] of surroundingHexes) {
      const cell = map.getCell(dq, dr);
      if (cell?.terrain !== "sea") {
        console.log(`  ✗ Cell (${dq}, ${dr}) is not sea!`);
        centerValid = false;
      }
    }
    
    if (centerValid) {
      console.log("  ✓ Center 7 hexes are correctly placed\n");
    }
  }
}

// Run the test
testTerrainDistribution();