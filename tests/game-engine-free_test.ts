import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { GameEngineFree } from '../src/GameEngineFree.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { UiStateClass } from '../src/UiState.ts';

Deno.test('GameEngineFree - end turn', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const oldPlayer = gameState.getCurrentPlayer();
  oldPlayer.oracleDice = ['red'];
  oldPlayer.oracleCards = ['blue'];
  oldPlayer.usedOracleCardThisTurn = true;
  uiState.setSelectedDieColor('red');
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
