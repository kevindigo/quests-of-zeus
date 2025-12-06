import { assertFalse } from '@std/assert';
import { ActionResolver } from '../src/ActionResolver.ts';
import { GameManager } from '../src/GameManager.ts';

Deno.test('Resolver - For now, should never be terminal', () => {
  const engine = new GameManager();
  const gameState = engine.getGameState();
  const resolver = new ActionResolver();
  assertFalse(resolver.isTerminal(gameState));
});

// Deno.test('Resolver - gain favor should always be available', () => {
//   const engine = new GameEngine();
//   const gameState = engine.getGameState();
//   const resolver = new ActionResolver(engine);
//   const actions = resolver.getLegalActions(gameState);
//   assertGreater(actions.length, 0);
// });
