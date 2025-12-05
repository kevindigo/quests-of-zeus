import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import type { HexPeekShrineAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { PhaseMain, PhasePeeking } from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import { assertSuccess, setupGame, testGameState } from './test-helpers.ts';

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

Deno.test('doAction peekShrine', () => {
  setupGame();
  const shrineHex = testGameState.getShrineHexes()[0];
  assert(shrineHex);
  testGameState.queuePhase(PhasePeeking.phaseName);
  testGameState.endPhase();
  const action: HexPeekShrineAction = {
    type: 'hex',
    subType: 'peekShrine',
    coordinates: shrineHex.getCoordinates(),
    spend: Resource.none,
  };

  const result = GameEngine.doAction(action, testGameState);
  assertSuccess(result);
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
