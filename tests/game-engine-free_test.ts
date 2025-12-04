import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { Actions, type FreeEndTurnAction } from '../src/actions.ts';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { setupGame, testGameState } from './test-helpers.ts';

Deno.test('GameEngineFree - getFreeActions cannot end with dice remaining', () => {
  setupGame();
  const endTurnAction: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };

  const actionsWithDiceUnspent = GameEngineFree.getFreeActions(testGameState);
  assertEquals(Actions.filter(actionsWithDiceUnspent, endTurnAction).length, 0);

  const player = testGameState.getCurrentPlayer();
  player.oracleDice = [];
  const actionsNoDiceLeft = GameEngineFree.getFreeActions(testGameState);
  assertEquals(Actions.filter(actionsNoDiceLeft, endTurnAction).length, 1);
});

Deno.test('GameEngineFree - end turn action success', () => {
  setupGame();
  const oldPlayer = testGameState.getCurrentPlayer();
  oldPlayer.oracleDice = [];
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
  testGameState.getCurrentPlayer().oracleDice = [];

  GameEngineFree.doAction(action, testGameState);
  assertEquals(testGameState.getCurrentPlayerIndex(), 0);
  assertEquals(testGameState.getRound(), 2);
});
