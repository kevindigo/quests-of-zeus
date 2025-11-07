/**
 * Comprehensive test for the monster distribution algorithm
 * Tests edge cases and validates the improved algorithm
 */

import { assertEquals, assert } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";
import { ALL_COLORS } from "../src/hexmap.ts";

// Test that the algorithm completes within reasonable time
Deno.test("MonsterDistribution - algorithm completeness", () => {
  // Test with the actual player count (2 players)
  const playerCount = 2;
  
  for (let run = 0; run < 10; run++) {
    // Create a new engine instance for each test
    const engine = new OracleGameEngine();
    
    // Initialize game and get monster hexes
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    // Verify all monsters were placed
    const totalMonsters = monsterHexes.reduce(
      (sum: number, hex: any) => sum + hex.monsterColors.length,
      0
    );
    const expectedTotal = playerCount * ALL_COLORS.length;
    
    assertEquals(totalMonsters, expectedTotal, `Run ${run + 1}: Expected ${expectedTotal} monsters, got ${totalMonsters}`);
    
    // Verify no duplicate colors on any hex
    for (const hex of monsterHexes) {
      const uniqueColors = new Set(hex.monsterColors);
      assertEquals(uniqueColors.size, hex.monsterColors.length, `Run ${run + 1}: Hex (${hex.q},${hex.r}) has duplicate colors`);
    }
  }
});

// Test that distribution is always even
Deno.test("MonsterDistribution - even distribution", () => {
  const playerCount = 2;
  
  for (let run = 0; run < 20; run++) {
    const engine = new OracleGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    const monstersPerHex = monsterHexes.map((hex: any) => hex.monsterColors.length);
    const min = Math.min(...monstersPerHex);
    const max = Math.max(...monstersPerHex);
    
    // Distribution should be even (difference ≤ 1)
    assert(max - min <= 1, `Run ${run + 1}: Distribution not even (min=${min}, max=${max})`);
  }
});

// Test color distribution is correct
Deno.test("MonsterDistribution - color distribution", () => {
  const playerCount = 2;
  
  for (let run = 0; run < 5; run++) {
    const engine = new OracleGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    // Count colors
    const colorCounts: Record<string, number> = {};
    for (const hex of monsterHexes) {
      for (const color of hex.monsterColors) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
    
    // Each color should appear exactly playerCount times
    for (const color of ALL_COLORS) {
      assertEquals(colorCounts[color], playerCount, `Run ${run + 1}: Color ${color} appears ${colorCounts[color]} times, expected ${playerCount}`);
    }
  }
});

// Test that no hex has more than 2 monsters
Deno.test("MonsterDistribution - max monsters per hex", () => {
  const playerCount = 2;
  
  for (let run = 0; run < 10; run++) {
    const engine = new OracleGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    const maxMonsters = Math.max(...monsterHexes.map((hex: any) => hex.monsterColors.length));
    
    // No hex should have more than 2 monsters
    assert(maxMonsters <= 2, `Run ${run + 1}: Some hex has ${maxMonsters} monsters (should be ≤ 2)`);
  }
});

// Test the algorithm with the actual player count
Deno.test("MonsterDistribution - actual player count (2 players)", () => {
  const playerCount = 2;
  
  // 2 players * 6 colors = 12 monsters total
  // With 9 hexes, average is 12/9 ≈ 1.33
  // So distribution should be mostly 1s and 2s
  
  for (let run = 0; run < 50; run++) {
    const engine = new OracleGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();
    
    const monstersPerHex = monsterHexes.map((hex: any) => hex.monsterColors.length);
    
    // Verify all constraints
    const totalMonsters = monstersPerHex.reduce((sum: number, count: number) => sum + count, 0);
    assertEquals(totalMonsters, 12, `Run ${run + 1}: Total monsters should be 12`);
    
    const min = Math.min(...monstersPerHex);
    const max = Math.max(...monstersPerHex);
    assert(max - min <= 1, `Run ${run + 1}: Distribution not even`);
    assert(max <= 2, `Run ${run + 1}: Max monsters should be ≤ 2`);
  }
});