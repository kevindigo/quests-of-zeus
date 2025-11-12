// Tests for oracle card spending functionality

import { assert, assertEquals, assertFalse } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine.ts';
import { findZeus } from '../src/game-initializer.ts';
import { COLOR_WHEEL, type CoreColor } from '../src/types.ts';

Deno.test('OracleCardSpending - basic functionality', () => {
  const engine = new QuestsZeusGameEngine();
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

Deno.test('OracleCardSpending - spend for movement', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  const gameState = engine.getGameState();
  const zeus = findZeus(gameState.map);
  const adjacentSeaHexes = gameState.map.getNeighborsOfType(
    zeus,
    gameState.map.getGrid(),
    'sea',
  );
  const destination = adjacentSeaHexes[0]!;

  player.oracleCards = [destination.color as CoreColor];
  player.favor = 0;
  player.usedOracleCardThisTurn = false;

  const moveResult = engine.spendOracleCardForMovement(
    player.id,
    destination!.q,
    destination!.r,
    destination!.color as CoreColor,
    0,
  );

  assert(moveResult.success, 'Should be able to move using oracle card');

  // Oracle card should be consumed
  assertFalse(
    player.oracleCards.includes(destination!.color as CoreColor),
    'Blue oracle card should be consumed',
  );

  // Ship position should be updated
  assertEquals(
    player.shipPosition,
    { q: destination!.q, r: destination!.r },
    'Ship position should be updated',
  );

  // Oracle card usage flag should be set
  assert(player.usedOracleCardThisTurn, 'Oracle card usage flag should be set');
});

Deno.test('OracleCardSpending - spend for favor', () => {
  const engine = new QuestsZeusGameEngine();
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
  const engine = new QuestsZeusGameEngine();
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

Deno.test('OracleCardSpending - movement with favor spending', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ['black', 'pink', 'blue', 'yellow', 'green', 'red'];
  player.favor = 1;

  player.usedOracleCardThisTurn = false;

  // Find a sea tile that requires favor spending to reach
  let foundMove = false;
  COLOR_WHEEL.forEach((color) => {
    const candidates = engine.getAvailableMovesForDie(
      player.id,
      color,
      player.favor,
    );
    const favorCandidates = candidates.filter((candidate) => {
      return candidate.favorCost > 0;
    });
    console.log(
      `DEBUG: ${color} found ${candidates.length} total, ${favorCandidates.length} needing favor`,
    );
    if (!foundMove && favorCandidates.length > 0) {
      foundMove = true;
      const move = favorCandidates[0]!;
      const initialFavor = player.favor;

      const moveResult = engine.spendOracleCardForMovement(
        player.id,
        move.q,
        move.r,
        color,
        move?.favorCost,
      );

      // This should succeed even with favor spending
      assert(
        moveResult.success,
        `Should be able to move using oracle card with favor spending, but ${
          JSON.stringify(moveResult)
        }`,
      );

      // Oracle card should be consumed
      assertEquals(
        player.oracleCards.includes(color),
        false,
        '${color} oracle card should have been consumed',
      );

      // Oracle card usage flag should be set
      assertEquals(
        player.usedOracleCardThisTurn,
        true,
        'Oracle card usage flag should be set',
      );
      assertEquals(player.favor, initialFavor - 1, 'Should have spent 1 favor');
    }
  });

  assert(foundMove, 'There should be at least one legal favor move');
});

Deno.test('OracleCardSpending - cannot use oracle card without having it', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Player has no oracle cards
  player.oracleCards = [];
  player.usedOracleCardThisTurn = false;

  // Try to use an oracle card that player doesn't have
  const moveResult = engine.spendOracleCardForMovement(
    player.id,
    1,
    1,
    'blue',
    0,
  );

  assertEquals(
    moveResult.success,
    false,
    'Should not be able to use oracle card without having it',
  );
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
