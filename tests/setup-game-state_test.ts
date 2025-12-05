import { assert, assertEquals, assertFalse } from '@std/assert';
import { GameState } from '../src/GameState.ts';
import { PhaseWelcome } from '../src/phases.ts';
import { COLOR_WHEEL, type CoreColor } from '../src/types.ts';
import { setupGame, testGameState } from './test-helpers.ts';

Deno.test('GameState phase - starts in welcome', () => {
  const gameState = new GameState();
  assertEquals(gameState.getPhase().getName(), PhaseWelcome.phaseName);
});

Deno.test('GameState wound deck setup', () => {
  const copiesOfEachColor = 7;
  const gameState = new GameState();
  const countByColor: Map<CoreColor, number> = new Map();
  for (let i = 0; i < copiesOfEachColor * COLOR_WHEEL.length; ++i) {
    const color = gameState.drawWound();
    assert(color, `Failed to draw card index ${i}`);
    const oldCount = countByColor.get(color) ?? 0;
    countByColor.set(color, oldCount + 1);
  }
  COLOR_WHEEL.forEach((color) => {
    assertEquals(countByColor.get(color), 7);
  });
  assertFalse(gameState.drawWound(), 'Deck should be empty now');
});

Deno.test('GameState initializer gives each player a wound', () => {
  setupGame();
  for (
    let playerIndex = 0;
    playerIndex < testGameState.getPlayerCount();
    ++playerIndex
  ) {
    const player = testGameState.getPlayer(playerIndex);
    assertEquals(player.getTotalWoundCount(), 1);
    COLOR_WHEEL.forEach((color) => {
      const woundCount = player.getWoundCount(color);
      if (woundCount > 0) {
        assertEquals(player.getGodLevel(color), 1);
      }
    });
  }
});

Deno.test('GameState initializer starts all lastRolled arrays empty', () => {
  setupGame();
  for (
    let playerIndex = 0;
    playerIndex < testGameState.getPlayerCount();
    ++playerIndex
  ) {
    assertEquals(testGameState.getLastRolledColors(playerIndex).size, 0);
  }
});
