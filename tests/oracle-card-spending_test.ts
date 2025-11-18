// Tests for oracle card spending functionality

import { assert, assertEquals, assertFalse } from '@std/assert';
import { GameEngine } from '../src/game-engine-core.ts';

Deno.test('OracleCardSpending - basic functionality', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Give player an oracle card
  player.oracleCards = ['blue'];
  player.usedOracleCardThisTurn = false;

  // Test that player has the oracle card
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.oracleCards[0], 'blue');
  assertEquals(player.usedOracleCardThisTurn, false);
});

Deno.test('OracleCardSpending - spend for favor', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ['blue'];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can spend oracle card for favor
  const success = engine.spendOracleCardForFavor(player.id, 'blue');

  assert(success, 'Should be able to spend oracle card for favor');

  // Oracle card should be consumed
  assertEquals(
    player.oracleCards.includes('blue'),
    false,
    'Blue oracle card should be consumed',
  );

  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, 'Favor should increase by 2');

  // Oracle card usage flag should be set
  assertEquals(
    player.usedOracleCardThisTurn,
    true,
    'Oracle card usage flag should be set',
  );
});

Deno.test('OracleCardSpending - cannot use more than one oracle card per turn', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ['blue', 'red'];

  assert(
    engine.spendOracleCardForFavor(
      player.id,
      'blue',
    ),
    'Should be able to spend oracle card for favor',
  );

  assertFalse(
    engine.spendOracleCardForFavor(
      player.id,
      'red',
    ),
    'Should not be able to spend a second oracle card',
  );
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
