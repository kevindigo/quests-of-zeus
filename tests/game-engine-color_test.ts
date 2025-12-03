import { assert, assertEquals } from '@std/assert';
import {
  Actions,
  type ColorActivateGodAction,
  type ColorAdvanceGodAction,
} from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineColor } from '../src/GameEngineColor.ts';
import {
  PhaseAdvancingGod,
  PhaseMain,
  PhaseTeleporting,
} from '../src/phases.ts';
import { setupGame, testGameState } from './test-helpers.ts';

Deno.test('GameEngineFree - getFreeActions god', () => {
  setupGame();
  const player = testGameState.getCurrentPlayer();
  const redGod = player.getGod('red');
  redGod.level = GameEngine.getMaxGodLevel(testGameState);
  const action: ColorActivateGodAction = {
    type: 'color',
    subType: 'activateGod',
    color: 'red',
  };

  const availableActions = GameEngineColor.getColorActions(testGameState);
  const redGodActions = Actions.filter(availableActions, action);
  assertEquals(redGodActions.length, 1);
});

Deno.test('GameEngineFree - doAction activate blue god', () => {
  setupGame();
  const player = testGameState.getCurrentPlayer();
  const redGod = player.getGod('blue');
  redGod.level = GameEngine.getMaxGodLevel(testGameState);
  const action: ColorActivateGodAction = {
    type: 'color',
    subType: 'activateGod',
    color: 'blue',
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(testGameState.getPhase().getName(), PhaseTeleporting.phaseName);
});

Deno.test('GameEngineColor - doAction advance god', () => {
  setupGame();
  testGameState.queuePhase(PhaseAdvancingGod.phaseName);
  testGameState.endPhase();
  const action: ColorAdvanceGodAction = {
    type: 'color',
    subType: 'advanceGod',
    color: 'red',
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  const player = testGameState.getCurrentPlayer();
  assertEquals(player.getGodLevel('red'), 1);
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
