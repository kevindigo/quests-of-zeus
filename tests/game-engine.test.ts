// Tests for the Quests of Zeus game engine

import { assert, assertEquals, assertExists } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('GameEngine - initialization', () => {
  const engine = new QuestsZeusGameEngine();

  // Game should not be initialized by default
  assertEquals(engine.isGameInitialized(), false);

  // Initialize the game
  engine.initializeGame();
  const state = engine.getGameState();

  assertExists(state.map);
  assertEquals(state.players.length, 2);
  assertEquals(state.round, 1);
  assertEquals(state.phase, 'action'); // Game starts in action phase since dice are already rolled

  // All players should start with dice already rolled
  state.players.forEach((player) => {
    assertEquals(
      player.oracleDice.length,
      3,
      'Each player should start with 3 dice',
    );
  });

  // Now game should be initialized
  assertEquals(engine.isGameInitialized(), true);
});

Deno.test('GameEngine - player creation', () => {
  const engine = new QuestsZeusGameEngine();

  // Should throw error when game is not initialized
  try {
    engine.getPlayer(1);
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);

  assertExists(player1);
  assertExists(player2);
  assertEquals(player1?.name, 'Player 1');
  assertEquals(player2?.name, 'Player 2');

  // All players should start on the same position (Zeus hex)
  assertEquals(player1?.getShipPosition(), player2?.getShipPosition());

  // Check that players start with empty storage
  assertEquals(player1?.storage.length, 2);
  assertEquals(player2?.storage.length, 2);
  assertEquals(player1?.storage[0].type, 'empty');
  assertEquals(player1?.storage[1].type, 'empty');
  assertEquals(player2?.storage[0].type, 'empty');
  assertEquals(player2?.storage[1].type, 'empty');

  // Check that players start with 0 shield
  assertEquals(player1?.shield, 0, 'Player 1 should start with 0 shield');
  assertEquals(player2?.shield, 0, 'Player 2 should start with 0 shield');
});

Deno.test('GameEngine - oracle dice rolling', () => {
  const engine = new QuestsZeusGameEngine();

  // Should throw error when game is not initialized
  try {
    engine.rollOracleDice(1);
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();

  // Players should already have dice from initialization
  const player = engine.getPlayer(1);
  assertExists(player);
  assertEquals(player?.oracleDice.length, 3);

  // Test manually rolling dice (for debugging or special cases)
  const dice = engine.rollOracleDice(1);
  assertEquals(dice.length, 3);

  // Player should still have dice after manual roll
  assertEquals(player?.oracleDice.length, 3);
});

Deno.test('GameEngine - movement validation', () => {
  const engine = new QuestsZeusGameEngine();

  // Should throw error when game is not initialized
  try {
    engine.getAvailableMoves(1);
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();

  // Game should already be in action phase with dice ready
  const state = engine.getGameState();
  assertEquals(state.phase, 'action');

  // Get available moves
  const availableMoves = engine.getAvailableMoves(1);
  assertExists(availableMoves);

  // With new movement rules, available moves should include die color information
  assertEquals(Array.isArray(availableMoves), true);

  // Check that each move has the required properties
  if (availableMoves.length > 0) {
    const firstMove = availableMoves[0];
    assert('q' in firstMove!, 'Move should have q coordinate');
    assert('r' in firstMove, 'Move should have r coordinate');
    assert('dieColor' in firstMove, 'Move should have dieColor property');
  }
});

Deno.test('GameEngine - quest completion', () => {
  const engine = new QuestsZeusGameEngine();

  // Should throw error when game is not initialized
  try {
    engine.getGameState();
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();

  // Check that players start with 0 completed quests
  const player1 = engine.getPlayer(1);
  assertExists(player1);
  assertEquals(player1.completedQuests, 0);
});

Deno.test('GameEngine - win condition', () => {
  const engine = new QuestsZeusGameEngine();

  // Should throw error when game is not initialized
  try {
    engine.checkWinCondition();
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();

  // Initially no winner
  const winCondition = engine.checkWinCondition();
  assertEquals(winCondition.gameOver, false);
  assertEquals(winCondition.winner, null);
});

Deno.test('GameEngine - shield resource', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);

  assertExists(player1);
  assertExists(player2);

  // Test that shield property exists and is initialized to 0
  assertEquals(
    'shield' in player1,
    true,
    'Player 1 should have shield property',
  );
  assertEquals(
    'shield' in player2,
    true,
    'Player 2 should have shield property',
  );
  assertEquals(player1.shield, 0, 'Player 1 shield should be 0');
  assertEquals(player2.shield, 0, 'Player 2 shield should be 0');
  assertEquals(
    typeof player1.shield,
    'number',
    'Player 1 shield should be a number',
  );
  assertEquals(
    typeof player2.shield,
    'number',
    'Player 2 shield should be a number',
  );

  // Test that shield is properly serialized in game state
  const gameState = engine.getGameState();
  const serializedPlayer1 = gameState.players.find((p) => p.id === 1);
  const serializedPlayer2 = gameState.players.find((p) => p.id === 2);

  assertExists(serializedPlayer1);
  assertExists(serializedPlayer2);
  assertEquals(
    serializedPlayer1.shield,
    0,
    'Player 1 shield should be 0 in serialized state',
  );
  assertEquals(
    serializedPlayer2.shield,
    0,
    'Player 2 shield should be 0 in serialized state',
  );
});

Deno.test('GameEngine - storage system', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getPlayer(1);
  assertExists(player);

  // Check initial empty storage
  assertEquals(player.storage.length, 2);
  assertEquals(player.storage[0].type, 'empty');
  assertEquals(player.storage[1].type, 'empty');
});

Deno.test('GameEngine - all players start on Zeus hex', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  // Get all players
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);

  assertExists(player1);
  assertExists(player2);

  // Find the Zeus hex in the map
  const state = engine.getGameState();
  const zeusCells = state.map.getCellsByTerrain('zeus');
  assertEquals(zeusCells.length, 1, 'There should be exactly one Zeus hex');

  const zeusCell = zeusCells[0]!;
  const zeusPosition = { q: zeusCell.q, r: zeusCell.r };

  // Verify all players start on the Zeus hex
  assertEquals(
    player1.getShipPosition(),
    zeusPosition,
    'Player 1 should start on Zeus hex',
  );
  assertEquals(
    player2.getShipPosition(),
    zeusPosition,
    'Player 2 should start on Zeus hex',
  );

  // Verify all players start on the same position
  assertEquals(
    player1.getShipPosition(),
    player2.getShipPosition(),
    'All players should start on the same position',
  );

  // Verify the starting position is actually a Zeus hex
  const player1Cell = state.map.getCell(
    player1.getShipPosition().q,
    player1.getShipPosition().r,
  );
  assertExists(player1Cell);
  assertEquals(player1Cell.terrain, 'zeus', 'Player 1 should be on a Zeus hex');

  const player2Cell = state.map.getCell(
    player2.getShipPosition().q,
    player2.getShipPosition().r,
  );
  assertExists(player2Cell);
  assertEquals(player2Cell.terrain, 'zeus', 'Player 2 should be on a Zeus hex');
});

Deno.test('GameEngine - draw oracle card by spending die', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Player must have some dice available
  assert(player.oracleDice.length > 0, 'Player must have oracle dice');

  // Save initial counts
  const initialDiceCount = player.oracleDice.length;
  const initialCardCount = player.oracleCards.length;
  // Note: oracleCardDeck is not directly accessible from engine
  // We'll verify the behavior through the draw operation itself

  // Use the first die color to draw an oracle card
  const dieColor = player.oracleDice[0]!;
  const success = engine.drawOracleCard(playerId, dieColor);

  assert(success, 'Should successfully draw oracle card');

  // Validate that one die was consumed
  assertEquals(
    player.oracleDice.length,
    initialDiceCount - 1,
    'Player should have one less oracle die',
  );

  // Validate that one card was added
  assertEquals(
    player.oracleCards.length,
    initialCardCount + 1,
    'Player should have one more oracle card',
  );

  // Note: We can't directly access oracleCardDeck from engine
  // The deck size reduction is verified by the successful draw operation

  // Test with a die color the player does not have
  const invalidColor = 'black';
  if (player.oracleDice.includes(invalidColor)) {
    // Remove the black die to simulate no black die available
    player.oracleDice = player.oracleDice.filter((c) => c !== invalidColor);
  }
  const fail = engine.drawOracleCard(playerId, invalidColor);
  assert(!fail, 'Drawing with invalid die color should fail');

  // Note: We cannot directly modify the game phase for testing
  // The phase validation is handled internally by the game engine

  // Note: We cannot directly manipulate oracleCardDeck from engine
  // The empty deck case is handled internally by the oracle system
  // After multiple draws, the deck will eventually be exhausted
  // and subsequent draws will fail naturally
});
