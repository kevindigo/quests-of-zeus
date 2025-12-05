import { assertEquals } from '@std/assert/equals';
import { GameState } from '../src/GameState.ts';
import { PhaseMain, PhaseTeleporting } from '../src/phases.ts';

Deno.test('GameState phase - endPhase with empty queue goes to main', () => {
  const gameState = new GameState();
  gameState.endPhase();
  assertEquals(gameState.getPhase().getName(), PhaseMain.phaseName);
});

Deno.test('GameState phase - queue queue end end', () => {
  const gameState = new GameState();
  gameState.endPhase();
  gameState.queuePhase(PhaseTeleporting.phaseName);
  gameState.queuePhase(PhaseTeleporting.phaseName);
  gameState.endPhase();
  assertEquals(gameState.getPhase().getName(), PhaseTeleporting.phaseName);
  gameState.endPhase();
  assertEquals(gameState.getPhase().getName(), PhaseTeleporting.phaseName);
  gameState.endPhase();
  assertEquals(gameState.getPhase().getName(), PhaseMain.phaseName);
});
