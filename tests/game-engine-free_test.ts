import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { Actions, type FreeEndTurnAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { PhaseFreeloading, PhaseMain } from '../src/phases.ts';
import { COLOR_WHEEL, type CoreColor } from '../src/types.ts';
import { assertSuccess, setupGame, testGameState } from './test-helpers.ts';

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
  const player0 = testGameState.getPlayer(0);
  const player1 = testGameState.getPlayer(1);
  COLOR_WHEEL.forEach((color) => {
    player1.advanceGod(color);
  });

  player0.oracleCards = ['blue'];
  player0.usedOracleCardThisTurn = true;
  assertEquals(testGameState.getRound(), 1);

  const action: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };

  player0.oracleDice = [];
  assertSuccess(GameEngineFree.doAction(action, testGameState));

  assertEquals(testGameState.getCurrentPlayerIndex(), 1);
  assertEquals(testGameState.getRound(), 1);

  assertEquals(player0.oracleDice.length, 3);
  assertEquals(player0.oracleCards.length, 1);
  assertFalse(player0.usedOracleCardThisTurn);

  assertEquals(testGameState.getPhaseName(), PhaseFreeloading.phaseName);
  const opportunities = player1.getCurrentFreeloadOpportunities();
  assert(opportunities);
  assertEquals(opportunities, new Set<CoreColor>(player0.oracleDice));
  player1.removeCurrentFreeloadOpportunities();
  assertFalse(player1.getCurrentFreeloadOpportunities());

  testGameState.queuePhase(PhaseMain.phaseName);
  testGameState.endPhase();
  testGameState.getCurrentPlayer().oracleDice = [];
  assertSuccess(GameEngineFree.doAction(action, testGameState));

  assertEquals(testGameState.getCurrentPlayerIndex(), 0);
  assertEquals(testGameState.getRound(), 2);
});

Deno.test('GameEngineFree - end turn skip freeloading if none available', () => {
  setupGame();
  const player0 = testGameState.getPlayer(0);
  player0.oracleDice = [];
  const player1 = testGameState.getPlayer(1);
  COLOR_WHEEL.forEach((color) => {
    player1.resetGod(color);
  });
  assertSuccess(
    GameEngine.doAction({ type: 'free', subType: 'endTurn' }, testGameState),
  );
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);

  player1.oracleDice = [];
  COLOR_WHEEL.forEach((color) => {
    player0.getGod(color).level = 100;
  });
  assertSuccess(
    GameEngine.doAction({ type: 'free', subType: 'endTurn' }, testGameState),
  );
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
