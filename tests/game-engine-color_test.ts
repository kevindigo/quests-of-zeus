import { assertEquals } from '@std/assert';
import { Actions, type ColorActivateGodAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { setupGame, testGameState } from './test-helpers.ts';
import { GameEngineColor } from '../src/GameEngineColor.ts';

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
