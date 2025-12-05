import { assertEquals } from '@std/assert';
import { Actions, type ColorActivateGodAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineColor } from '../src/GameEngineColor.ts';
import { PhaseExploring, PhaseTeleporting } from '../src/phases.ts';
import { assertSuccess, setupGame, testGameState } from './test-helpers.ts';

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
  const god = player.getGod('blue');
  god.level = GameEngine.getMaxGodLevel(testGameState);
  const action: ColorActivateGodAction = {
    type: 'color',
    subType: 'activateGod',
    color: 'blue',
  };

  const result = GameEngine.doAction(action, testGameState);
  assertSuccess(result);
  assertEquals(testGameState.getPhase().getName(), PhaseTeleporting.phaseName);
});

Deno.test('GameEngineFree - doAction activate green god', () => {
  setupGame();
  const player = testGameState.getCurrentPlayer();
  const god = player.getGod('green');
  god.level = GameEngine.getMaxGodLevel(testGameState);
  const action: ColorActivateGodAction = {
    type: 'color',
    subType: 'activateGod',
    color: 'green',
  };

  const result = GameEngine.doAction(action, testGameState);
  assertSuccess(result);
  assertEquals(testGameState.getPhase().getName(), PhaseExploring.phaseName);
});
