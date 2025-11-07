/**
 * Test for simplified monster distribution logic
 * Verifies that monsters are distributed evenly across all hexes
 * without the marked/unmarked distinction
 */

import { assertEquals, assert } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";
import { ALL_COLORS } from "../src/hexmap.ts";

// Test with the actual player count (2 players)
Deno.test("MonsterDistribution - simplified distribution", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  const monsterHexes = engine.getMonsterHexes();

  // Verify we have exactly 9 monster hexes
  assertEquals(monsterHexes.length, 9, "Should have 9 monster hexes");

  // Count monsters by color
  const colorCounts: Record<string, number> = {};
  let totalMonsters = 0;

  for (const hex of monsterHexes) {
    totalMonsters += hex.monsterColors.length;

    for (const color of hex.monsterColors) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  // Verify total monsters per color = player count (2)
  const expectedPerColor = 2;
  for (const color of ALL_COLORS) {
    assertEquals(
      colorCounts[color],
      expectedPerColor,
      `Expected ${expectedPerColor} monsters for color ${color} but got ${colorCounts[color]}`
    );
  }

  // Verify no hex has duplicate colors
  for (const hex of monsterHexes) {
    const uniqueColors = new Set(hex.monsterColors);
    assertEquals(
      uniqueColors.size,
      hex.monsterColors.length,
      `Hex (${hex.q},${hex.r}) has duplicate colors: ${hex.monsterColors.join(", ")}`
    );
  }

  // Verify even distribution across hexes
  const monstersPerHex = monsterHexes.map(hex => hex.monsterColors.length);
  const minMonsters = Math.min(...monstersPerHex);
  const maxMonsters = Math.max(...monstersPerHex);
  
  // With simplified distribution, difference should be at most 1
  assert(
    maxMonsters - minMonsters <= 1,
    `Monster distribution is not even enough (difference: ${maxMonsters - minMonsters})`
  );

  // Verify total monsters is correct
  const expectedTotalMonsters = 2 * ALL_COLORS.length;
  assertEquals(
    totalMonsters,
    expectedTotalMonsters,
    `Expected ${expectedTotalMonsters} total monsters but got ${totalMonsters}`
  );
});

// Test edge cases
Deno.test("MonsterDistribution - edge cases", () => {
  // Test with the actual player count (2)
  const engine = new OracleGameEngine();
  engine.initializeGame();
  const monsterHexes = engine.getMonsterHexes();
  
  const totalMonsters = monsterHexes.reduce((sum: number, hex: any) => sum + hex.monsterColors.length, 0);
  assertEquals(totalMonsters, 2 * ALL_COLORS.length, "Total monsters for 2 players should be correct");
  
  // Verify no hex has more than 2 monsters (theoretical maximum)
  const maxMonstersPerHex = Math.max(...monsterHexes.map((hex: any) => hex.monsterColors.length));
  assert(maxMonstersPerHex <= 2, `Some hex has ${maxMonstersPerHex} monsters (should be ≤ 2)`);
});