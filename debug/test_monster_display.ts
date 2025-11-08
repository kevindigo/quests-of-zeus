/**
 * Test script to verify monster display functionality
 */

import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import { HexMapSVG } from "../src/hexmap-svg.ts";

function testMonsterDisplay(): void {
  console.log("=== Monster Display Test ===\n");

  // Create game engine and initialize
  const engine = new QuestsZeusGameEngine();
  const state = engine.initializeGame();

  // Get monster hexes
  const monsterHexes = engine.getMonsterHexes();

  console.log("Monster Distribution:");
  for (const hex of monsterHexes) {
    console.log(`Hex (${hex.q}, ${hex.r}): ${hex.monsterColors.join(", ")}`);
  }

  // Create HexMapSVG with monster hex data
  const hexMapSVG = new HexMapSVG({
    cellSize: 30,
    showCoordinates: false,
    showTerrainLabels: false,
    interactive: false,
    cubeHexes: state.cubeHexes,
    monsterHexes: monsterHexes,
  });

  // Generate SVG
  const grid = state.map.serialize();
  const svg = hexMapSVG.generateSVG(grid);

  // Check if SVG contains monster elements
  const hasMonsterElements = svg.includes("colored-monster") ||
    svg.includes("monster-count");

  console.log("\nSVG Generation Test:");
  console.log(`✅ SVG generated successfully: ${svg.length > 0 ? "✓" : "✗"}`);
  console.log(
    `✅ Monster elements found in SVG: ${hasMonsterElements ? "✓" : "✗"}`,
  );

  // Count colored monsters in SVG
  const monsterCount = (svg.match(/colored-monster/g) || []).length;
  console.log(
    `✅ Colored monsters rendered: ${monsterCount} (expected: ${
      monsterHexes.reduce((sum, hex) => sum + hex.monsterColors.length, 0)
    })`,
  );

  // Check for specific monster hexes
  for (const hex of monsterHexes) {
    if (hex.monsterColors.length > 0) {
      const hasMonsterCount = svg.includes(
        `monster-count">${hex.monsterColors.length}`,
      );
      console.log(
        `✅ Hex (${hex.q}, ${hex.r}) monster count displayed: ${
          hasMonsterCount ? "✓" : "✗"
        }`,
      );
    }
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  testMonsterDisplay();
}
