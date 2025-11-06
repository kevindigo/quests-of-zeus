/**
 * Debug script to visualize monster distribution
 */

import { OracleGameEngine } from "./src/game-engine.ts";

function debugMonsterDistribution(): void {
  console.log("=== Monster Distribution Debug ===\n");

  // Create game engine and initialize
  const engine = new OracleGameEngine();
  const state = engine.initializeGame();

  // Get monster hexes
  const monsterHexes = engine.getMonsterHexes();

  console.log("Monster Distribution Summary:");
  console.log(`Total monster hexes: ${monsterHexes.length}`);

  // Group by number of monsters
  const byMonsterCount: Record<number, number> = {};
  let totalMonsters = 0;

  for (const hex of monsterHexes) {
    const count = hex.monsterColors.length;
    byMonsterCount[count] = (byMonsterCount[count] || 0) + 1;
    totalMonsters += count;
  }

  console.log(`Total monsters: ${totalMonsters}`);
  console.log("Hexes by monster count:", byMonsterCount);

  // Count monsters by color
  const colorCounts: Record<string, number> = {};

  for (const hex of monsterHexes) {
    for (const color of hex.monsterColors) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  console.log("\nMonsters per color:");
  for (const [color, count] of Object.entries(colorCounts)) {
    console.log(`  ${color}: ${count}`);
  }

  // Detailed hex information
  console.log("\nDetailed Monster Hex Information:");
  console.log("================================");

  for (const hex of monsterHexes) {
    const isMarked = hex.monsterColors.length === 2;
    const marker = isMarked ? "[MARKED]" : "[NORMAL]";
    console.log(
      `Hex (${hex.q}, ${hex.r}) ${marker}: ${hex.monsterColors.join(", ")}`,
    );
  }

  // Verify rules
  console.log("\nRule Verification:");
  console.log("==================");

  // Rule 1: Exactly 3 marked hexes (2 monsters each)
  const markedHexes = monsterHexes.filter((hex) =>
    hex.monsterColors.length === 2
  );
  console.log(
    `✅ Marked hexes: ${markedHexes.length}/3 ${
      markedHexes.length === 3 ? "✓" : "✗"
    }`,
  );

  // Rule 2: No duplicate colors on any hex
  let noDuplicates = true;
  for (const hex of monsterHexes) {
    const uniqueColors = new Set(hex.monsterColors);
    if (uniqueColors.size !== hex.monsterColors.length) {
      noDuplicates = false;
      console.log(`✗ Hex (${hex.q}, ${hex.r}) has duplicate colors`);
    }
  }
  if (noDuplicates) {
    console.log("✅ No duplicate colors on any hex ✓");
  }

  // Rule 3: Total monsters per color = number of players
  const playerCount = state.players.length;
  let correctColorDistribution = true;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count !== playerCount) {
      correctColorDistribution = false;
      console.log(`✗ Color ${color}: expected ${playerCount}, got ${count}`);
    }
  }
  if (correctColorDistribution) {
    console.log(`✅ Correct distribution (${playerCount} per color) ✓`);
  }

  console.log("\n=== Debug Complete ===");
}

// Run if this file is executed directly
if (import.meta.main) {
  debugMonsterDistribution();
}
