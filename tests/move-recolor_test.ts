// Unit test for recoloring favor calculation in extra range moves

import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import { MovementSystem } from '../src/MovementSystem.ts';
import { Resource } from '../src/Resource.ts';
import { ShipMoveHandler } from '../src/ShipMoveHandler.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('RecolorFavorCalculation - moves account for recoloring cost', () => {
  const manager = new GameManager();

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  const gameState = manager.getGameState();
  const recoloredBlack = Resource.createRecoloredDie('black', 1);
  manager.getUiState().setSelectedResource(recoloredBlack);
  const movementSystem = new MovementSystem(gameState.getMap());
  const handler = new ShipMoveHandler(gameState, movementSystem);
  const availableMoves = handler.getAvailableMovesForColor(
    'pink',
    player.favor - 1,
  );

  // Should have moves that require pink sea tiles (since black die can be recolored to pink)
  const movesToPinkTiles = availableMoves.filter((move) => {
    const cell = gameState.getMap().getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'pink';
  });

  assert(
    movesToPinkTiles.length > 0,
    'Should have moves to pink sea tiles with recolored black die',
  );

  // For each pink move, verify that the total cost (movement favor + recoloring cost) <= player favor
  for (const move of movesToPinkTiles) {
    const totalCost = move.favorCost + 1; // movement favor + recoloring cost
    const canAfford = totalCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should be affordable with total cost ${totalCost}`,
    );
  }
});

Deno.test('RecolorFavorCalculation - high recoloring cost limits moves', () => {
  const manager = new GameManager();

  const player = manager.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 3; // Low favor

  const blue2 = Resource.createRecoloredDie('blue', 2);
  manager.getUiState().setSelectedResource(blue2);
  const state = manager.getGameState();
  const movementSystem = new MovementSystem(state.getMap());
  const handler = new ShipMoveHandler(state, movementSystem);
  const movesWithHighRecolor = handler.getAvailableMovesForColor(
    'blue',
    player.favor - 2,
  );

  // Verify that all returned moves are actually affordable
  // The game engine should filter out moves that exceed available favor
  for (const move of movesWithHighRecolor) {
    const totalCost = move.favorCost + 2; // movement favor + high recoloring cost
    const canAfford = totalCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should not be available with total cost ${totalCost} exceeding favor ${player.favor}`,
    );
  }
});

Deno.test('RecolorFavorCalculation - moves without recoloring unaffected', () => {
  const gameEngine = new GameManager();
  const gameState = gameEngine.getGameState();
  const uiState = gameEngine.getUiState();
  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  uiState.setSelectedResource(Resource.createDie('black'));
  const movementSystem = new MovementSystem(gameState.getMap());
  const handler = new ShipMoveHandler(gameState, movementSystem);
  const movesWithoutRecolor = handler.getAvailableMovesForColor(
    'black',
    player.favor,
  );

  // Should only have moves to black sea tiles
  const movesToBlackTiles = movesWithoutRecolor.filter((move) => {
    const cell = gameState.getMap().getCell({ q: move.q, r: move.r });
    return cell && cell.color === 'black';
  });

  assertEquals(
    movesWithoutRecolor.length,
    movesToBlackTiles.length,
    'All moves should be to black sea tiles without recoloring',
  );

  for (const move of movesWithoutRecolor) {
    const canAfford = move.favorCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should be affordable with cost ${move.favorCost}`,
    );
  }
});
