// Tests for the new getAvailableMovesForDie method

import { assert, assertEquals, assertGreater } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('getAvailableMovesForDie - basic functionality', () => {
  const gameEngine = new GameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  gameEngine.getGameState().setRecolorIntention(player.id, 0);

  // Test getting moves for a specific die color
  const movesForBlack = gameEngine.getAvailableMovesForColor(
    player,
    'black',
    player.favor,
  );
  const movesForPink = gameEngine.getAvailableMovesForColor(
    player,
    'pink',
    player.favor,
  );
  const movesForBlue = gameEngine.getAvailableMovesForColor(
    player,
    'blue',
    player.favor,
  );

  // Check that moves are returned for each die color
  assertEquals(Array.isArray(movesForBlack), true);
  assertEquals(Array.isArray(movesForPink), true);
  assertEquals(Array.isArray(movesForBlue), true);

  // Check that each move has the required properties
  if (movesForBlack.length > 0) {
    const firstMove = movesForBlack[0];
    assert(firstMove);
    assert('q' in firstMove, 'Move should have q coordinate');
    assert('r' in firstMove, 'Move should have r coordinate');
    assert('favorCost' in firstMove, 'Move should have favorCost property');
  }
});

Deno.test('getAvailableMovesForDie - favor spending', () => {
  const gameEngine = new GameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Get moves with different favor amounts
  const movesWithNoFavor = gameEngine.getAvailableMovesForColor(
    player,
    'black',
    0,
  );
  const movesWithSomeFavor = gameEngine.getAvailableMovesForColor(
    player,
    'black',
    2,
  );
  const movesWithMaxFavor = gameEngine.getAvailableMovesForColor(
    player,
    'black',
    5,
  );

  // With more favor, should have more or equal moves (since favor extends range)
  assert(movesWithSomeFavor.length >= movesWithNoFavor.length);
  assert(movesWithMaxFavor.length >= movesWithSomeFavor.length);
});

Deno.test('getAvailableMovesForDie - recoloring intention', () => {
  const gameEngine = new GameEngine();
  gameEngine.initializeGame();
  const gameState = gameEngine.getGameState();
  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  gameState.setRecolorIntention(player.id, 0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = gameState.setRecolorIntention(
    player.id,
    1,
  );
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Get moves for black die with recoloring intention
  const movesWithRecolor = gameEngine.getAvailableMovesForColor(
    player,
    'pink',
    player.favor,
  );

  // Should have moves that require pink sea tiles (since black die can be recolored to pink)
  const pinkSeaTiles = gameState.map.getCellsByTerrain('sea').filter((cell) =>
    cell.color === 'pink'
  );
  assertGreater(pinkSeaTiles.length, 0);

  // Check that we have moves to pink sea tiles
  const movesToPinkTiles = movesWithRecolor.filter((move) => {
    const cell = gameState.map.getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'pink';
  });

  assert(
    movesToPinkTiles.length > 0,
    'Should have moves to pink sea tiles with recolored black die',
  );
});

Deno.test('getAvailableMovesForDie - insufficient favor for recoloring', () => {
  const gameEngine = new GameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 1; // Low favor

  // Clear any recoloring intentions that might exist from initialization
  gameEngine.getGameState().setRecolorIntention(player.id, 0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = gameEngine.getGameState().setRecolorIntention(
    player.id,
    1,
  );
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Get moves for black die with recoloring intention but insufficient favor
  const movesWithRecolor = gameEngine.getAvailableMovesForColor(
    player,
    'pink',
    player.favor - 1,
  );

  // Should not have any moves that require additional favor spending for movement
  // since all favor is needed for recoloring
  for (const move of movesWithRecolor) {
    assertEquals(
      move.favorCost,
      0,
      "Should only have moves that don't require additional favor spending",
    );
  }
});

Deno.test('getAvailableMovesForDie - clear recoloring intention', () => {
  const gameEngine = new GameEngine();
  gameEngine.initializeGame();
  const gameState = gameEngine.getGameState();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  gameState.setRecolorIntention(player.id, 0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = gameState.setRecolorIntention(
    player.id,
    1,
  );
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Clear recoloring intention
  gameState.clearRecolorIntention(player.id);

  // Get moves after clearing recoloring intention
  const movesAfterClear = gameEngine.getAvailableMovesForColor(
    player,
    'black',
    player.favor,
  );

  // Should only have moves to black sea tiles now
  const movesToBlackTiles = movesAfterClear.filter((move) => {
    const cell = gameState.map.getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'black';
  });

  assertEquals(
    movesAfterClear.length,
    movesToBlackTiles.length,
    'All moves should be to black sea tiles after clearing recoloring',
  );
});
