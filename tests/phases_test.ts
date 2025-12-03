import { assertEquals } from '@std/assert/equals';
import { GameEngine } from '../src/GameEngine.ts';
import { PhaseAdvancingGod } from '../src/phases.ts';
import { setupGame, testGameState, testPlayer } from './test-helpers.ts';

Deno.test('PhaseAdvancingGod - getAvailableActions', () => {
  setupGame();
  const maxLevel = GameEngine.getMaxGodLevel(testGameState);
  testPlayer.getGod('red').level = maxLevel;
  testPlayer.getGod('green').level = maxLevel;
  testGameState.queuePhase(PhaseAdvancingGod.phaseName);
  testGameState.endPhase();
  assertEquals(testGameState.getPhaseName(), PhaseAdvancingGod.phaseName);

  const availableActions = GameEngine.getAvailableActions(testGameState);
  assertEquals(availableActions.length, 4 + 1);
});
