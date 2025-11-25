import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import type { FreeAction } from '../src/actions.ts';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { Resource } from '../src/Resource.ts';
import { UiStateClass } from '../src/UiState.ts';

Deno.test('GameEngineFree - getAvailableActions setup phase', () => {
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

Deno.test('GameEngineFree - getAvailableActions action phase', () => {
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

Deno.test('GameEngineFree - end turn', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const oldPlayer = gameState.getCurrentPlayer();
  oldPlayer.oracleDice = ['red'];
  oldPlayer.oracleCards = ['blue'];
  oldPlayer.usedOracleCardThisTurn = true;
  uiState.setSelectedResource(Resource.createRecoloredDie('red', 2));
  assertEquals(gameState.getRound(), 1);

  const result = GameEngineFree.endTurn(gameState, uiState);
  assert(result.success, result.message);
  assertEquals(oldPlayer.oracleDice.length, 3);
  assertEquals(oldPlayer.oracleCards.length, 1);
  assertFalse(oldPlayer.usedOracleCardThisTurn);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assertEquals(gameState.getCurrentPlayerIndex(), 1);
  assertEquals(gameState.getPhase(), 'action');
  assertEquals(gameState.getRound(), 1);

  GameEngineFree.endTurn(gameState, uiState);
  assertEquals(gameState.getCurrentPlayerIndex(), 0);
  assertEquals(gameState.getRound(), 2);
});
