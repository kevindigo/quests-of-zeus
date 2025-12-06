import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { Actions, type HexPeekShrineAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import {
  PhaseAdvancingGod,
  PhaseExploring,
  PhaseFreeloading,
  PhasePeeking,
} from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import {
  assertSuccess,
  setupGame,
  testGameState,
  testPlayer,
} from './test-helpers.ts';

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

Deno.test('PhaseExploring - getAvailableActions', () => {
  setupGame();
  const shrineHexes = testGameState.getShrineHexes();
  if (shrineHexes[0]) shrineHexes[0].status = 'filled';
  if (shrineHexes[1]) shrineHexes[1].status = 'visible';
  const maxLevel = GameEngine.getMaxGodLevel(testGameState);
  testPlayer.getGod('green').level = maxLevel;
  testGameState.queuePhase(PhaseExploring.phaseName);
  testGameState.endPhase();
  assertEquals(testGameState.getPhaseName(), PhaseExploring.phaseName);

  const availableActions = GameEngine.getAvailableActions(testGameState);
  assertEquals(availableActions.length, 10 + 1);
});

Deno.test('PhasePeeking - no hidden shrines', () => {
  setupGame();
  testGameState.getShrineHexes().forEach((hex) => {
    hex.status = 'filled';
  });

  const availableActions = GameEngine.getAvailableActions(testGameState);
  const peekActions = availableActions.filter((action) => {
    return action.type === 'hex' && action.subType === 'peekShrine';
  });
  assertEquals(peekActions.length, 0);
});

Deno.test('PhasePeeking - getAvailableActions with hidden shrines', () => {
  setupGame();
  const shrineHex = testGameState.getShrineHexes()[0];
  assert(shrineHex);
  shrineHex.status = 'filled';
  testGameState.queuePhase(PhasePeeking.phaseName);
  testGameState.endPhase();

  const availableActions = GameEngine.getAvailableActions(testGameState);
  assertEquals(availableActions.length, 11 + 1);
  const peekActions = availableActions.filter((action) => {
    return action.type === 'hex' && action.subType === 'peekShrine';
  });
  assertEquals(peekActions.length, 11);
  const action: HexPeekShrineAction = {
    type: 'hex',
    subType: 'peekShrine',
    coordinates: shrineHex.getCoordinates(),
    spend: Resource.none,
  };
  assertFalse(Actions.find(peekActions, action));
});

Deno.test('PhaseFreeloading - getActions', () => {
  setupGame();
  const player0 = testGameState.getPlayer(0);
  player0.oracleDice = [];
  const player1 = testGameState.getPlayer(1);
  player1.advanceGod('red');
  player1.advanceGod('blue');
  player1.resetGod('yellow');
  assertSuccess(
    GameEngine.doAction({ type: 'free', subType: 'endTurn' }, testGameState),
  );
  assertEquals(testGameState.getPhaseName(), PhaseFreeloading.phaseName);
  player1.removeCurrentFreeloadOpportunities();
  player1.addFreeloadOpportunities(['red', 'blue', 'red', 'yellow']);

  const available = GameEngine.getAvailableActions(testGameState);
  assertEquals(available.length, 2, JSON.stringify(available));
});
