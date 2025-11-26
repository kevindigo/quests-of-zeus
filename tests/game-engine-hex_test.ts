import { assertEquals } from '@std/assert/equals';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';

Deno.test('GameEngineHex - available wrong phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineHex - available at zeus', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});
