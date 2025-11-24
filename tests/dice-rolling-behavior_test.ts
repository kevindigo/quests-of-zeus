// Tests for the new dice rolling behavior (dice rolled at end of turn)

import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';

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
