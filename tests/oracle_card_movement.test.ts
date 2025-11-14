// Tests for oracle card movement functionality

import { assert, assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('OracleCardMovement - basic functionality', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 0;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Give player an oracle card
  player.oracleCards = ['blue'];
  player.usedOracleCardThisTurn = false;

  // Test that player has the oracle card
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.oracleCards[0], 'blue');
  assertEquals(player.usedOracleCardThisTurn, false);
});

Deno.test('OracleCardMovement - spend oracle card for movement', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 0;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Give player an oracle card and position them on a sea hex
  player.oracleCards = ['blue'];
  player.usedOracleCardThisTurn = false;

  // Find a blue sea hex to move to
  const gameState = engine.getGameState();
  const blueSeaHexes = gameState.map.getCellsByTerrain('sea').filter((cell) =>
    cell.color === 'blue'
  );

  if (blueSeaHexes.length > 0) {
    const targetHex = blueSeaHexes[0];
    assert(targetHex);

    // Position player on a sea hex adjacent to the target
    const adjacentHexes = gameState.map.getNeighbors(
      targetHex.getCoordinates(),
    );
    const adjacentSeaHex = adjacentHexes.find((hex) => hex.terrain === 'sea');

    if (adjacentSeaHex) {
      player.setShipPosition({ q: adjacentSeaHex.q, r: adjacentSeaHex.r });

      // Test spending oracle card for movement
      const moveResult = engine.spendOracleCardForMovement(
        playerId,
        targetHex.q,
        targetHex.r,
        'blue',
      );

      assert(moveResult.success, 'Oracle card movement should succeed');
      assertEquals(player.getShipPosition().q, targetHex.q);
      assertEquals(player.getShipPosition().r, targetHex.r);
      assertEquals(
        player.oracleCards.length,
        0,
        'Oracle card should be consumed',
      );
      assertEquals(
        player.usedOracleCardThisTurn,
        true,
        'Player should have used oracle card this turn',
      );
    }
  }
});

Deno.test('OracleCardMovement - cannot use oracle card twice per turn', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 0;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Give player multiple oracle cards
  player.oracleCards = ['blue', 'red'];
  player.usedOracleCardThisTurn = false;

  // Find a blue sea hex to move to
  const gameState = engine.getGameState();
  const blueSeaHexes = gameState.map.getCellsByTerrain('sea').filter((cell) =>
    cell.color === 'blue'
  );

  if (blueSeaHexes.length > 0) {
    const targetHex = blueSeaHexes[0];
    assert(targetHex);

    // Position player on a sea hex adjacent to the target
    const adjacentHexes = gameState.map.getNeighbors(
      targetHex.getCoordinates(),
    );
    const adjacentSeaHex = adjacentHexes.find((hex) => hex.terrain === 'sea');

    if (adjacentSeaHex) {
      player.setShipPosition({ q: adjacentSeaHex.q, r: adjacentSeaHex.r });

      // First oracle card movement should succeed
      const firstMoveResult = engine.spendOracleCardForMovement(
        playerId,
        targetHex.q,
        targetHex.r,
        'blue',
      );

      assert(
        firstMoveResult.success,
        'First oracle card movement should succeed',
      );

      // Try to use second oracle card in same turn
      const secondMoveResult = engine.spendOracleCardForMovement(
        playerId,
        targetHex.q,
        targetHex.r,
        'red',
      );

      assert(
        !secondMoveResult.success,
        'Second oracle card movement should fail',
      );
      assertEquals(
        player.oracleCards.length,
        1,
        'Only first oracle card should be consumed',
      );
    }
  }
});

Deno.test('OracleCardMovement - cannot use oracle card without having it', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 0;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Player has no oracle cards
  player.oracleCards = [];
  player.usedOracleCardThisTurn = false;

  // Find a blue sea hex to move to
  const gameState = engine.getGameState();
  const blueSeaHexes = gameState.map.getCellsByTerrain('sea').filter((cell) =>
    cell.color === 'blue'
  );

  if (blueSeaHexes.length > 0) {
    const targetHex = blueSeaHexes[0];
    assert(targetHex);

    // Try to use oracle card without having it
    const moveResult = engine.spendOracleCardForMovement(
      playerId,
      targetHex.q,
      targetHex.r,
      'blue',
    );

    assert(
      !moveResult.success,
      'Oracle card movement should fail without having the card',
    );
  }
});

Deno.test('OracleCardMovement - oracle card usage resets on end turn', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 0;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Give player an oracle card and use it
  player.oracleCards = ['blue'];
  player.usedOracleCardThisTurn = true;

  // End turn
  engine.endTurn();

  // Oracle card usage should be reset
  assertEquals(
    player.usedOracleCardThisTurn,
    false,
    'Oracle card usage should reset on end turn',
  );
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
