import { assertEquals } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('Favor System - player initialization', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const state = engine.getGameState();
  assertEquals(state.players.length, 2);

  state.players.forEach((player) => {
    assertEquals(player.favor, 3 + player.id);
  });
});
