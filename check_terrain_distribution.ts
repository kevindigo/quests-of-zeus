import { HexMap } from "./hexmap.ts";

// Create a hex map and check terrain distribution
const hexMap = new HexMap();
const grid = hexMap.getGrid();

const terrainCounts: Record<string, number> = {};

// Count occurrences of each terrain type
let totalCells = 0;
for (let q = 0; q < hexMap.width; q++) {
  for (let r = 0; r < hexMap.height; r++) {
    const cell = grid[q]?.[r];
    if (cell) {
      const terrain = cell.terrain;
      terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1;
      totalCells++;
    }
  }
}

console.log("Terrain Distribution in Hexagon Map (radius 11):");
console.log("========================================");

const expectedTerrainTypes = ["zeus", "sea", "shallow", "monsters", "cubes", "temple", "clouds", "city", "foundations"];

for (const terrainType of expectedTerrainTypes) {
  const count = terrainCounts[terrainType] || 0;
  const percentage = ((count / totalCells) * 100).toFixed(1);
  console.log(`${terrainType.padEnd(12)}: ${count.toString().padStart(3)} cells (${percentage}%)`);
}

console.log("\nTotal cells:", totalCells);

// Verify all types are present
const missingTypes = expectedTerrainTypes.filter(type => !terrainCounts[type] || terrainCounts[type] === 0);
if (missingTypes.length > 0) {
  console.log("\n❌ MISSING TERRAIN TYPES:", missingTypes);
} else {
  console.log("\n✅ All 9 terrain types from ai.md are properly represented!");
}