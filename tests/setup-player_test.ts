import { assertEquals } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('Setup player - favor', () => {
  const engine = new GameEngine();
  engine.createGameState();

  const state = engine.getGameState();
  assertEquals(state.players.length, 2);

  state.players.forEach((player) => {
    assertEquals(player.favor, 3 + player.id);
  });
});

Deno.test('Setup player - storage', () => {
  const engine = new GameEngine();
  engine.createGameState();
  engine.getGameState().players.forEach((player) => {
    assertEquals(player.getItemCapacity(), 2);
    assertEquals(player.getItemCount(), 0);
  });
});
