// Debug test for movement system
import { assertEquals } from '@std/assert/equals';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('Debug movement system', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();

  // Check what type of hex the player starts on
  const gameState = engine.getGameState();
  const startCell = gameState.map.getCell(
    player.getShipPosition().q,
    player.getShipPosition().r,
  );
  assertEquals(startCell?.terrain, 'zeus');
});
