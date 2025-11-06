/**
 * Test for monster distribution logic
 * Verifies that monsters are distributed according to game rules
 */

import { OracleGameEngine } from "../src/game-engine.ts";

function testMonsterDistribution(): void {
  console.log("Testing monster distribution...\n");

  // Test with 2 players (default)
  console.log("=== Testing with 2 players ===");
  const engine2p = new OracleGameEngine();
  const state2p = engine2p.initializeGame();

  const monsterHexes2p = engine2p.getMonsterHexes();
  console.log(`Total monster hexes: ${monsterHexes2p.length}`);

  // Verify we have exactly 9 monster hexes
  if (monsterHexes2p.length !== 9) {
    console.error(
      `❌ Expected 9 monster hexes but got ${monsterHexes2p.length}`,
    );
    return;
  }
  console.log("✅ Correct number of monster hexes (9)");

  // Count monsters by color
  const colorCounts2p: Record<string, number> = {};
  let totalMonsters2p = 0;

  for (const hex of monsterHexes2p) {
    totalMonsters2p += hex.monsterColors.length;

    for (const color of hex.monsterColors) {
      colorCounts2p[color] = (colorCounts2p[color] || 0) + 1;
    }
  }

  console.log(`Total monsters: ${totalMonsters2p}`);
  console.log("Monsters per color:", colorCounts2p);

  // Verify total monsters per color = player count (2)
  const expectedPerColor2p = 2;
  let colorDistributionValid2p = true;

  for (const color of Object.keys(colorCounts2p)) {
    if (colorCounts2p[color] !== expectedPerColor2p) {
      console.error(
        `❌ Expected ${expectedPerColor2p} monsters for color ${color} but got ${
          colorCounts2p[color]
        }`,
      );
      colorDistributionValid2p = false;
    }
  }

  if (colorDistributionValid2p) {
    console.log("✅ Correct monster distribution per color");
  }

  // Verify no hex has duplicate colors
  let noDuplicates2p = true;
  for (const hex of monsterHexes2p) {
    const uniqueColors = new Set(hex.monsterColors);
    if (uniqueColors.size !== hex.monsterColors.length) {
      console.error(
        `❌ Hex (${hex.q},${hex.r}) has duplicate colors: ${
          hex.monsterColors.join(", ")
        }`,
      );
      noDuplicates2p = false;
    }
  }

  if (noDuplicates2p) {
    console.log("✅ No duplicate colors on any hex");
  }

  // Verify marked hexes have exactly 2 monsters
  const markedHexes2p = monsterHexes2p.filter((hex) =>
    hex.monsterColors.length === 2
  );
  console.log(`Marked hexes (2 monsters): ${markedHexes2p.length}`);

  if (markedHexes2p.length === 3) {
    console.log("✅ Correct number of marked hexes (3)");
  } else {
    console.error(`❌ Expected 3 marked hexes but got ${markedHexes2p.length}`);
  }

  // Verify non-marked hexes have 1 or 2 monsters
  const nonMarkedHexes2p = monsterHexes2p.filter((hex) =>
    hex.monsterColors.length !== 2
  );
  console.log(`Non-marked hexes: ${nonMarkedHexes2p.length}`);

  const validNonMarkedCounts2p = nonMarkedHexes2p.every((hex) =>
    hex.monsterColors.length === 1 || hex.monsterColors.length === 2
  );

  if (validNonMarkedCounts2p) {
    console.log("✅ Non-marked hexes have valid monster counts (1 or 2)");
  } else {
    console.error("❌ Some non-marked hexes have invalid monster counts");
  }

  console.log("\n=== Monster Distribution Test Complete ===");
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testMonsterDistribution();
}
