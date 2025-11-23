import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';

Deno.test('Shield resource - players start with 0 shield', () => {
  const gameEngine = new GameManager();

  const gameState = gameEngine.getGameState().toSnapshot();

  gameState.players.forEach((player, index) => {
    assertEquals(
      player.shield,
      0,
      `Player ${index + 1} should start with 0 shield`,
    );
  });
});

Deno.test('Shield resource - shield is serialized in game state', () => {
  const gameEngine = new GameManager();

  const gameState = gameEngine.getGameState().toSnapshot();

  gameState.players.forEach((player, index) => {
    assert(
      'shield' in player,
      `Player ${index + 1} should have shield property in game state`,
    );
    assertEquals(
      player.shield,
      0,
      `Player ${index + 1} shield should be 0 in serialized state`,
    );
  });
});
