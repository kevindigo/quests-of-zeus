import { assertEquals } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('Setup player - favor', () => {
  const engine = new GameEngine();

  const state = engine.getGameState();
  assertEquals(state.getPlayerCount(), 2);

  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(player.favor, 3 + player.id);
  }
});

Deno.test('Setup player - storage', () => {
  const engine = new GameEngine();
  const state = engine.getGameState();
  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(player.getItemCapacity(), 2);
    assertEquals(player.getItemCount(), 0);
  }
});
