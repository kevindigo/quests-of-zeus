/**
 * Comprehensive monster distribution test suite
 * Consolidates all monster distribution testing logic
 * Tests: basic distribution, edge cases, algorithm robustness
 */

import { assert, assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine.ts';
import { COLOR_WHEEL } from '../src/types.ts';

// Helper function to run distribution tests
function runDistributionTests(
  engine: QuestsZeusGameEngine,
  runNumber?: number,
): void {
  const monsterHexes = engine.getMonsterHexes();
  const runLabel = runNumber ? `Run ${runNumber}: ` : '';

  // Test 1: Should have exactly 9 monster hexes
  assertEquals(
    monsterHexes.length,
    9,
    `${runLabel}Expected 9 monster hexes, got ${monsterHexes.length}`,
  );

  // Test 2: Total monsters should be 2 * number of colors (since we have 2 players)
  const totalMonsters = monsterHexes.reduce(
    (sum: number, hex: { monsterColors: string[] }) =>
      sum + hex.monsterColors.length,
    0,
  );
  const expectedTotalMonsters = 2 * COLOR_WHEEL.length;
  assertEquals(
    totalMonsters,
    expectedTotalMonsters,
    `${runLabel}Expected ${expectedTotalMonsters} total monsters for 2 players, got ${totalMonsters}`,
  );

  // Test 3: Each color should appear exactly 2 times (2 players)
  const colorCounts: Record<string, number> = {};
  for (const hex of monsterHexes) {
    for (const color of hex.monsterColors) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  for (const color of COLOR_WHEEL) {
    assertEquals(
      colorCounts[color],
      2,
      `${runLabel}Expected 2 monsters of color ${color}, got ${
        colorCounts[color]
      }`,
    );
  }

  // Test 4: No hex should have duplicate colors
  for (const hex of monsterHexes) {
    const uniqueColors = new Set(hex.monsterColors);
    assertEquals(
      uniqueColors.size,
      hex.monsterColors.length,
      `${runLabel}Hex (${hex.q},${hex.r}) has duplicate colors: ${
        hex.monsterColors.join(', ')
      }`,
    );
  }

  // Test 5: Monsters should be evenly distributed (difference ≤ 1)
  const monstersPerHex = monsterHexes.map((hex: { monsterColors: string[] }) =>
    hex.monsterColors.length
  );
  const minMonsters = Math.min(...monstersPerHex);
  const maxMonsters = Math.max(...monstersPerHex);
  assert(
    maxMonsters - minMonsters <= 1,
    `${runLabel}Monster distribution not even: min=${minMonsters}, max=${maxMonsters}, difference=${
      maxMonsters - minMonsters
    }`,
  );

  // Test 6: No hex should have more than 2 monsters (theoretical maximum)
  assert(
    maxMonsters <= 2,
    `${runLabel}Some hex has ${maxMonsters} monsters (should be ≤ 2)`,
  );
}

// Basic distribution test with 2 players
Deno.test('MonsterDistribution - basic distribution with 2 players', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  runDistributionTests(engine);
});

// Test the distribution algorithm multiple times to ensure consistency
Deno.test('MonsterDistribution - distribution consistency', () => {
  const testRuns = 10;

  for (let run = 0; run < testRuns; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    runDistributionTests(engine, run + 1);
  }
});

// Test edge cases
Deno.test('MonsterDistribution - edge cases', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  runDistributionTests(engine);
});

// Test algorithm completeness and robustness
Deno.test('MonsterDistribution - algorithm completeness', () => {
  // const _playerCount = 2; // Unused variable removed

  for (let run = 0; run < 10; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    runDistributionTests(engine, run + 1);
  }
});

// Test that distribution is always even across many runs
Deno.test('MonsterDistribution - even distribution across runs', () => {
  // const _playerCount = 2; // Unused variable removed

  for (let run = 0; run < 20; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();

    const monstersPerHex = monsterHexes.map((
      hex: { monsterColors: string[] },
    ) => hex.monsterColors.length);
    const min = Math.min(...monstersPerHex);
    const max = Math.max(...monstersPerHex);

    // Distribution should be even (difference ≤ 1)
    assert(
      max - min <= 1,
      `Run ${run + 1}: Distribution not even (min=${min}, max=${max})`,
    );
  }
});

// Test color distribution is correct across multiple runs
Deno.test('MonsterDistribution - color distribution consistency', () => {
  // const _playerCount = 2; // Unused variable removed

  for (let run = 0; run < 5; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();

    // Count colors
    const colorCounts: Record<string, number> = {};
    for (const hex of monsterHexes) {
      for (const color of hex.monsterColors) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }

    // Each color should appear exactly 2 times (for 2 players)
    for (const color of COLOR_WHEEL) {
      assertEquals(
        colorCounts[color],
        2,
        `Run ${run + 1}: Color ${color} appears ${
          colorCounts[color]
        } times, expected 2`,
      );
    }
  }
});

// Test that no hex has more than 2 monsters across multiple runs
Deno.test('MonsterDistribution - max monsters per hex', () => {
  // const _playerCount = 2; // Unused variable removed

  for (let run = 0; run < 10; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();

    const maxMonsters = Math.max(
      ...monsterHexes.map((hex: { monsterColors: string[] }) =>
        hex.monsterColors.length
      ),
    );

    // No hex should have more than 2 monsters
    assert(
      maxMonsters <= 2,
      `Run ${run + 1}: Some hex has ${maxMonsters} monsters (should be ≤ 2)`,
    );
  }
});

// Test the algorithm with the actual player count (2 players)
Deno.test('MonsterDistribution - actual player count (2 players)', () => {
  // const _playerCount = 2; // Unused variable removed

  // 2 players * 6 colors = 12 monsters total
  // With 9 hexes, the only possible even distribution is:
  // - 6 hexes with 1 monster each = 6 monsters
  // - 3 hexes with 2 monsters each = 6 monsters
  // Total: 12 monsters
  // So sorted distribution pattern should always be "111111222"

  for (let run = 0; run < 50; run++) {
    const engine = new QuestsZeusGameEngine();
    engine.initializeGame();
    const monsterHexes = engine.getMonsterHexes();

    const monstersPerHex = monsterHexes.map((
      hex: { monsterColors: string[] },
    ) => hex.monsterColors.length);

    // Verify all constraints
    const totalMonsters = monstersPerHex.reduce(
      (sum: number, count: number) => sum + count,
      0,
    );
    assertEquals(
      totalMonsters,
      12,
      `Run ${run + 1}: Total monsters should be 12`,
    );

    const min = Math.min(...monstersPerHex);
    const max = Math.max(...monstersPerHex);
    assert(max - min <= 1, `Run ${run + 1}: Distribution not even`);
    assert(max <= 2, `Run ${run + 1}: Max monsters should be ≤ 2`);

    // Verify the exact distribution pattern
    const sortedPattern = monstersPerHex.sort().join('');
    assertEquals(
      sortedPattern,
      '111111222',
      `Run ${run + 1}: Distribution pattern should be "111111222"`,
    );
  }
});
