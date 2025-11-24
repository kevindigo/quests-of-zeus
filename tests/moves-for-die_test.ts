// Tests for the new getAvailableMovesForDie method

import { assert, assertEquals, assertGreater } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import { MovementSystem } from '../src/MovementSystem.ts';
import { ShipMoveHandler } from '../src/ShipMoveHandler.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('getAvailableMovesForDie - basic functionality', () => {
  const manager = new GameManager();
  const movementSystem = new MovementSystem(manager.getGameState().getMap());
  const handler = new ShipMoveHandler(
    manager.getGameState(),
    manager.getUiState(),
    movementSystem,
  );

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  manager.getUiState().setSelectedRecoloring(0);

  // Test getting moves for a specific die color
  const movesForBlack = handler.getAvailableMovesForColor(player.favor);
  const movesForPink = handler.getAvailableMovesForColor(player.favor);
  const movesForBlue = handler.getAvailableMovesForColor(player.favor);

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
  const manager = new GameManager();
  const movementSystem = new MovementSystem(manager.getGameState().getMap());
  const handler = new ShipMoveHandler(
    manager.getGameState(),
    manager.getUiState(),
    movementSystem,
  );

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;
  manager.getUiState().setSelectedDieColor('black');

  // Get moves with different favor amounts
  const movesWithNoFavor = handler.getAvailableMovesForColor(0);
  const movesWithSomeFavor = handler.getAvailableMovesForColor(2);
  const movesWithMaxFavor = handler.getAvailableMovesForColor(5);

  // With more favor, should have more or equal moves (since favor extends range)
  assert(movesWithSomeFavor.length >= movesWithNoFavor.length);
  assert(movesWithMaxFavor.length >= movesWithSomeFavor.length);
});

Deno.test('getAvailableMovesForDie - recoloring intention', () => {
  const manager = new GameManager();
  const gameState = manager.getGameState();
  const uiState = manager.getUiState();
  const movementSystem = new MovementSystem(gameState.getMap());
  const handler = new ShipMoveHandler(gameState, uiState, movementSystem);
  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  manager.getUiState().setSelectedRecoloring(0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = manager.getUiState().setSelectedRecoloring(1);
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Get moves for black die with recoloring intention
  manager.getUiState().setSelectedDieColor('black');
  const movesWithRecolor = handler.getAvailableMovesForColor(
    player.favor,
  );

  // Should have moves that require pink sea tiles (since black die can be recolored to pink)
  const pinkSeaTiles = gameState.getMap().getCellsByTerrain('sea').filter((
    cell,
  ) => cell.color === 'pink');
  assertGreater(pinkSeaTiles.length, 0);

  // Check that we have moves to pink sea tiles
  const movesToPinkTiles = movesWithRecolor.filter((move) => {
    const cell = gameState.getMap().getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'pink';
  });

  assert(
    movesToPinkTiles.length > 0,
    'Should have moves to pink sea tiles with recolored black die',
  );
});

Deno.test('getAvailableMovesForDie - insufficient favor for recoloring', () => {
  const manager = new GameManager();
  const movementSystem = new MovementSystem(manager.getGameState().getMap());
  const handler = new ShipMoveHandler(
    manager.getGameState(),
    manager.getUiState(),
    movementSystem,
  );

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 1; // Low favor

  // Clear any recoloring intentions that might exist from initialization
  manager.getUiState().setSelectedRecoloring(0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = manager.getUiState().setSelectedRecoloring(1);
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Get moves for black die with recoloring intention but insufficient favor
  manager.getUiState().setSelectedDieColor('pink');
  const movesWithRecolor = handler.getAvailableMovesForColor(
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
  const manager = new GameManager();
  const gameState = manager.getGameState();
  const uiState = manager.getUiState();
  const movementSystem = new MovementSystem(gameState.getMap());
  const handler = new ShipMoveHandler(gameState, uiState, movementSystem);

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  manager.getUiState().setSelectedRecoloring(0);

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = manager.getUiState().setSelectedRecoloring(1);
  assert(recoloringSuccess, 'Recoloring intention should be set successfully');

  // Clear recoloring intention
  manager.getUiState().clearSelectedRecoloring();

  // Get moves after clearing recoloring intention
  manager.getUiState().setSelectedDieColor('black');
  const movesAfterClear = handler.getAvailableMovesForColor(
    player.favor,
  );

  // Should only have moves to black sea tiles now
  const movesToBlackTiles = movesAfterClear.filter((move) => {
    const cell = gameState.getMap().getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'black';
  });

  assertEquals(
    movesAfterClear.length,
    movesToBlackTiles.length,
    'All moves should be to black sea tiles after clearing recoloring',
  );
});
