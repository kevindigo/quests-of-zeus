/**
 * Unit tests for simplified monster distribution
 * Uses proper assertions as per ai.md guidelines
 */

import { assertEquals, assert } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";
import { ALL_COLORS } from "../src/hexmap.ts";

// Helper function to test monster distribution for the actual player count
function testMonsterDistributionForActualPlayerCount(): void {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  const monsterHexes = engine.getMonsterHexes();

  // Test 1: Should have exactly 9 monster hexes
  assertEquals(
    monsterHexes.length,
    9,
    `Expected 9 monster hexes, got ${monsterHexes.length}`
  );

  // Test 2: Total monsters should be 2 * number of colors (since we have 2 players)
  const totalMonsters = monsterHexes.reduce(
    (sum: number, hex: any) => sum + hex.monsterColors.length,
    0
  );
  const expectedTotalMonsters = 2 * ALL_COLORS.length;
  assertEquals(
    totalMonsters,
    expectedTotalMonsters,
    `Expected ${expectedTotalMonsters} total monsters for 2 players, got ${totalMonsters}`
  );

  // Test 3: Each color should appear exactly 2 times (2 players)
  const colorCounts: Record<string, number> = {};
  for (const hex of monsterHexes) {
    for (const color of hex.monsterColors) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  for (const color of ALL_COLORS) {
    assertEquals(
      colorCounts[color],
      2,
      `Expected 2 monsters of color ${color}, got ${colorCounts[color]}`
    );
  }

  // Test 4: No hex should have duplicate colors
  for (const hex of monsterHexes) {
    const uniqueColors = new Set(hex.monsterColors);
    assertEquals(
      uniqueColors.size,
      hex.monsterColors.length,
      `Hex (${hex.q},${hex.r}) has duplicate colors: ${hex.monsterColors.join(", ")}`
    );
  }

  // Test 5: Monsters should be evenly distributed (difference ≤ 1)
  const monstersPerHex = monsterHexes.map((hex: any) => hex.monsterColors.length);
  const minMonsters = Math.min(...monstersPerHex);
  const maxMonsters = Math.max(...monstersPerHex);
  assert(
    maxMonsters - minMonsters <= 1,
    `Monster distribution not even: min=${minMonsters}, max=${maxMonsters}, difference=${maxMonsters - minMonsters}`
  );

  // Test 6: No hex should have more than 2 monsters (theoretical maximum)
  assert(
    maxMonsters <= 2,
    `Some hex has ${maxMonsters} monsters (should be ≤ 2)`
  );
}

// Test the distribution algorithm multiple times to ensure consistency
Deno.test("MonsterDistribution - distribution consistency", () => {
  const playerCount = 2;
  const testRuns = 10;
  
  for (let run = 0; run < testRuns; run++) {
    const engine = new OracleGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    // Verify basic invariants
    const totalMonsters = monsterHexes.reduce(
      (sum: number, hex: any) => sum + hex.monsterColors.length,
      0
    );
    assertEquals(
      totalMonsters,
      playerCount * ALL_COLORS.length,
      `Run ${run + 1}: Total monsters incorrect`
    );
    
    // Verify even distribution
    const monstersPerHex = monsterHexes.map((hex: any) => hex.monsterColors.length);
    const minMonsters = Math.min(...monstersPerHex);
    const maxMonsters = Math.max(...monstersPerHex);
    assert(
      maxMonsters - minMonsters <= 1,
      `Run ${run + 1}: Distribution not even (difference: ${maxMonsters - minMonsters})`
    );
  }
});

// Test edge cases
Deno.test("MonsterDistribution - edge cases", () => {
  // Test with the actual player count (2)
  testMonsterDistributionForActualPlayerCount();
});