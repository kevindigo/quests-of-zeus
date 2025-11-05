// Test script to verify terrain distribution after 100% shallows to sea conversion
import { HexMap } from "./dist/hexmap.js";

interface TerrainCounts {
  [key: string]: number;
}

interface ExpectedCounts {
  [key: string]: number;
}

function testTerrainDistribution(): void {
  console.log("Testing terrain distribution for 5 generated maps...");
  console.log(
    "Note: 100% of remaining shallows are converted to sea in the final step (ALL shallows become sea)\n",
  );

  for (let i = 0; i < 5; i++) {
    console.log(`=== Map ${i + 1} ===`);

    const map = new HexMap();
    const grid = map.getGrid();

    const terrainCounts: TerrainCounts = {};
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

    // Expected counts (after 100% shallows to sea conversion)
    const expectedCounts: ExpectedCounts = {
      "zeus": 1,
      "cubes": 6,
      "temple": 6,
      "foundations": 6,
      "monsters": 9,
      "clouds": 12,
      "city": 6,
    };

    console.log("Terrain Distribution:");
    for (const [terrain, count] of Object.entries(terrainCounts)) {
      const expected = expectedCounts[terrain];
      const status = expected !== undefined && count === expected ? "✓" : "✗";
      console.log(
        `  ${status} ${terrain}: ${count}${
          expected ? ` (expected: ${expected})` : ""
        }`,
      );
    }

    // Verify that ALL shallows have been converted to sea (100% conversion)
    const seaCount = terrainCounts["sea"] || 0;
    const shallowCount = terrainCounts["shallow"] || 0;
    console.log(`  Sea vs Shallows: ${seaCount} sea, ${shallowCount} shallows`);

    if (shallowCount === 0) { // ALL shallows should be converted to sea
      console.log(
        "  ✓ ALL shallows converted to sea (100% conversion working)",
      );
    } else {
      console.log("  ✗ ALL shallows should be converted to sea");
    }

    console.log(`  Total cells: ${totalCells}\n`);

    // Verify center 7 hexes
    const centerCell = map.getCell(0, 0);
    const surroundingHexes: [number, number][] = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
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