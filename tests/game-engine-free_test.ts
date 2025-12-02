import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import {
  Actions,
  type FreeActivateGodAction,
  type FreeEndTurnAction,
} from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { setupGame, testGameState } from './test-helpers.ts';

Deno.test('GameEngineFree - getFreeActions action phase', () => {
  setupGame();
  const endTurnAction: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };

  const actions = GameEngineFree.getFreeActions(testGameState);
  const endTurnActions = actions.filter((availableAction) => {
    return Actions.areEqual(availableAction, endTurnAction);
  });
  assertEquals(endTurnActions.length, 1);
});

Deno.test('GameEngineFree - getFreeActions god', () => {
  setupGame();
  const player = testGameState.getCurrentPlayer();
  const redGod = player.getGod('red');
  redGod.level = GameEngine.getMaxGodLevel(testGameState);
  const action: FreeActivateGodAction = {
    type: 'free',
    subType: 'activateGod',
    godColor: 'red',
  };

  const availableActions = GameEngineFree.getFreeActions(testGameState);
  const redGodActions = availableActions.filter((availableAction) => {
    return Actions.areEqual(availableAction, action);
  });
  assertEquals(redGodActions.length, 1);
});

Deno.test('GameEngineFree - end turn action success', () => {
  setupGame();
  const oldPlayer = testGameState.getCurrentPlayer();
  oldPlayer.oracleDice = ['red'];
  oldPlayer.oracleCards = ['blue'];
  oldPlayer.usedOracleCardThisTurn = true;
  assertEquals(testGameState.getRound(), 1);

  const action: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };

  const result = GameEngineFree.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(oldPlayer.oracleDice.length, 3);
  assertEquals(oldPlayer.oracleCards.length, 1);
  assertFalse(oldPlayer.usedOracleCardThisTurn);
  assertEquals(testGameState.getCurrentPlayerIndex(), 1);
  assertEquals(testGameState.getPhase().getName(), 'main');
  assertEquals(testGameState.getRound(), 1);

  GameEngineFree.doAction(action, testGameState);
  assertEquals(testGameState.getCurrentPlayerIndex(), 0);
  assertEquals(testGameState.getRound(), 2);
});
