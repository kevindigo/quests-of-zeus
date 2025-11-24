/**
 * Edge case tests for monster distribution algorithm
 * Focuses on algorithm robustness, performance, and boundary conditions
 */

import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import { COLOR_WHEEL } from '../src/types.ts';

// Test algorithm performance and timing
Deno.test('MonsterDistribution - algorithm performance', () => {
  const startTime = performance.now();

  // Run multiple iterations to test performance
  const iterations = 50;
  for (let i = 0; i < iterations; i++) {
    const manager = new GameManager();
    const monsterHexes = manager.getGameState().getMonsterHexes();

    // Basic validation
    assertEquals(monsterHexes.length, 9);
    const totalMonsters = monsterHexes.reduce(
      (sum: number, hex: { monsterColors: string[] }) =>
        sum + hex.monsterColors.length,
      0,
    );
    assertEquals(totalMonsters, 2 * COLOR_WHEEL.length);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Algorithm should complete quickly
  // (under 2 seconds for 50 iterations, even with test coverage enabled)
  assert(
    duration < 2000,
    `Algorithm took ${duration}ms for ${iterations} iterations (should be < 1000ms)`,
  );
});

// Test that algorithm always produces valid results
Deno.test('MonsterDistribution - always valid results', () => {
  const testRuns = 100;
  let validRuns = 0;

  for (let run = 0; run < testRuns; run++) {
    try {
      const manager = new GameManager();
      const monsterHexes = manager.getGameState().getMonsterHexes();

      // All constraints must be satisfied
      assertEquals(monsterHexes.length, 9);

      const totalMonsters = monsterHexes.reduce(
        (sum: number, hex: { monsterColors: string[] }) =>
          sum + hex.monsterColors.length,
        0,
      );
      assertEquals(totalMonsters, 2 * COLOR_WHEEL.length);

      // Check color distribution
      const colorCounts: Record<string, number> = {};
      for (const hex of monsterHexes) {
        for (const color of hex.monsterColors) {
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
      }

      for (const color of COLOR_WHEEL) {
        assertEquals(colorCounts[color], 2);
      }

      // Check even distribution
      const monstersPerHex = monsterHexes.map((
        hex: { monsterColors: string[] },
      ) => hex.monsterColors.length);
      const min = Math.min(...monstersPerHex);
      const max = Math.max(...monstersPerHex);
      assert(max - min <= 1);
      assert(max <= 2);

      // Check no duplicates
      for (const hex of monsterHexes) {
        const uniqueColors = new Set(hex.monsterColors);
        assertEquals(uniqueColors.size, hex.monsterColors.length);
      }

      validRuns++;
    } catch (error) {
      // If any test fails, the algorithm is not robust
      throw new Error(
        `Algorithm failed on run ${run + 1}: ${(error as Error).message}`,
      );
    }
  }

  assertEquals(
    validRuns,
    testRuns,
    `Algorithm should produce valid results 100% of the time, but only ${validRuns}/${testRuns} runs were valid`,
  );
});

// Test distribution statistics over many runs
Deno.test('MonsterDistribution - statistical analysis', () => {
  const runs = 100;
  const distributionStats = {
    totalRuns: runs,
    validRuns: 0,
    distributionPatterns: new Map<string, number>(),
    minMonstersPerHex: 0,
    maxMonstersPerHex: 0,
    averageMonstersPerHex: 0,
  };

  let totalMonstersAcrossRuns = 0;

  for (let run = 0; run < runs; run++) {
    const manager = new GameManager();
    const monsterHexes = manager.getGameState().getMonsterHexes();

    const monstersPerHex = monsterHexes.map((
      hex: { monsterColors: string[] },
    ) => hex.monsterColors.length);
    const pattern = monstersPerHex.sort().join('');
    distributionStats.distributionPatterns.set(
      pattern,
      (distributionStats.distributionPatterns.get(pattern) || 0) + 1,
    );

    totalMonstersAcrossRuns += monstersPerHex.reduce(
      (sum: number, count: number) => sum + count,
      0,
    );
    distributionStats.validRuns++;
  }

  distributionStats.averageMonstersPerHex = totalMonstersAcrossRuns /
    (runs * 9);

  // Verify we get consistent results
  assertEquals(distributionStats.validRuns, runs);

  // With 2 players, the sorted distribution pattern should always be "111111222"
  // (6 hexes with 1 monster, 3 hexes with 2 monsters)
  const expectedPattern = '111111222';
  const actualPatterns = Array.from(
    distributionStats.distributionPatterns.keys(),
  );
  assertEquals(
    actualPatterns.length,
    1,
    `Should only have one distribution pattern for 2 players, but got: ${
      actualPatterns.join(', ')
    }`,
  );
  assertEquals(
    actualPatterns[0],
    expectedPattern,
    `Distribution pattern should be "${expectedPattern}" for 2 players`,
  );

  // Average should be exactly 12/9 ≈ 1.33 (12 monsters / 9 hexes)
  assertEquals(
    distributionStats.averageMonstersPerHex,
    12 / 9,
    `Average monsters per hex should be exactly ${
      12 / 9
    }, but got ${distributionStats.averageMonstersPerHex}`,
  );
});

Deno.test('MonsterDistribution - initialization robustness', () => {
  for (let i = 0; i < 10; i++) {
    const manager = new GameManager();
    const state = manager.getGameState();

    // Verify game state is properly initialized
    assertEquals(state.getPlayerCount(), 2, 'Should have 2 players');

    const monsterHexes = manager.getGameState().getMonsterHexes();
    assertEquals(
      monsterHexes.length,
      9,
      'Should have 9 monster hexes after initialization',
    );
  }
});
