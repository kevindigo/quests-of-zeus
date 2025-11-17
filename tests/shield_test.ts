import { assert, assertEquals, assertExists } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('Shield resource - players start with 0 shield', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const gameState = gameEngine.getGameState();

  gameState.players.forEach((player, index) => {
    assertExists(
      player.shield,
      `Player ${index + 1} should have shield property`,
    );
    assertEquals(
      player.shield,
      0,
      `Player ${index + 1} should start with 0 shield`,
    );
    assert(
      typeof player.shield === 'number',
      `Player ${index + 1} shield should be a number`,
    );
  });
});

Deno.test('Shield resource - shield is serialized in game state', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const gameState = gameEngine.getGameState();

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

Deno.test('Shield resource - shield can be modified', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const gameState = gameEngine.getGameState();
  const player = gameState.players[0]!;

  // Simulate gaining shield
  player.shield = 3;
  assertEquals(
    player.shield,
    3,
    'Player shield should be 3 after modification',
  );

  // Simulate losing shield
  player.shield = 1;
  assertEquals(
    player.shield,
    1,
    'Player shield should be 1 after losing shield',
  );
});
