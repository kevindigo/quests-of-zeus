import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import { Player } from '../src/Player.ts';

Deno.test('Setup player - favor', () => {
  const engine = new GameManager();

  const state = engine.getGameState();
  assertEquals(state.getPlayerCount(), 2);

  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(player.favor, 3 + player.id);
  }
});

Deno.test('Setup player - storage', () => {
  const engine = new GameManager();
  const state = engine.getGameState();
  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(player.getItemCapacity(), 2);
    assertEquals(player.getItemCount(), 0);
  }
});

Deno.test('DiceRolling - all players start with dice rolled', () => {
  const engine = new GameManager();

  // Initialize the game
  const state = engine.getGameState();

  // All players should start with dice already rolled
  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(
      player.oracleDice.length,
      3,
      `Player ${playerId + 1} should start with 3 dice rolled`,
    );

    // Each die should be a valid color
    player.oracleDice.forEach((dieColor, dieIndex) => {
      assert(
        ['red', 'pink', 'blue', 'black', 'green', 'yellow'].includes(dieColor),
        `Player ${
          playerId + 1
        } die ${dieIndex} should be a valid color, got ${dieColor}`,
      );
    });
  }

  // Game should start in action phase since dice are already rolled
  assertEquals(state.getPhase(), 'action', 'Game should start in action phase');
});

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

Deno.test('Player - range', () => {
  const player = new Player(0, 'any', 'blue', { q: 0, r: 0 });
  assertEquals(player.getRange(), 3);
});
