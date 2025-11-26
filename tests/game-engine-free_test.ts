import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import type { FreeAction, FreeEndTurnAction } from '../src/actions.ts';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { assertFailureContains } from './test-helpers.ts';

Deno.test('GameEngineFree - getFreeActions setup phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  gameState.setPhase('setup');
  const actions = GameEngineFree.getFreeActions(gameState);
  const endTurnActions = actions.filter((action) => {
    if (action.type === 'free') {
      const freeAction = action as FreeAction;
      return (freeAction.subType === 'endTurn');
    }
    return false;
  });
  assertEquals(endTurnActions.length, 0);
});

Deno.test('GameEngineFree - getFreeActions action phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const actions = GameEngineFree.getFreeActions(gameState);
  const endTurnActions = actions.filter((action) => {
    if (action.type === 'free') {
      const freeAction = action as FreeAction;
      return (freeAction.subType === 'endTurn');
    }
    return false;
  });
  assertEquals(endTurnActions.length, 1);
});

Deno.test('GameEngineFree - end turn action wrong phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  gameState.setPhase('setup');

  const action: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };
  const result = GameEngineFree.doAction(action, gameState);
  assertFailureContains(result, 'not available');
});

Deno.test('GameEngineFree - end turn action success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const oldPlayer = gameState.getCurrentPlayer();
  oldPlayer.oracleDice = ['red'];
  oldPlayer.oracleCards = ['blue'];
  oldPlayer.usedOracleCardThisTurn = true;
  assertEquals(gameState.getRound(), 1);

  const action: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };

  const result = GameEngineFree.doAction(action, gameState);
  assert(result.success, result.message);
  assertEquals(oldPlayer.oracleDice.length, 3);
  assertEquals(oldPlayer.oracleCards.length, 1);
  assertFalse(oldPlayer.usedOracleCardThisTurn);
  assertEquals(gameState.getCurrentPlayerIndex(), 1);
  assertEquals(gameState.getPhase(), 'action');
  assertEquals(gameState.getRound(), 1);

  GameEngineFree.doAction(action, gameState);
  assertEquals(gameState.getCurrentPlayerIndex(), 0);
  assertEquals(gameState.getRound(), 2);
});
