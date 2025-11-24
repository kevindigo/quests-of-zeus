import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { assertStringIncludes } from '@std/assert/string-includes';
import { GameEngineNoColor } from '../src/GameEngineNoColor.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

Deno.test('GameEngineNoColor - gain favor wrong phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  gameState.setPhase('setup');

  const result = GameEngineNoColor.spendResourceForFavor(gameState, uiState);
  assertFailureContains(result, 'phase');
});

Deno.test('GameEngineNoColor - gain favor nothing selected', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();

  const result = GameEngineNoColor.spendResourceForFavor(gameState, uiState);
  assertFailureContains(result, 'select');
});

Deno.test('GameEngineNoColor - gain favor 2nd card', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  player.oracleCards = ['red', 'blue'];
  player.usedOracleCardThisTurn = true;
  uiState.setSelectedOracleCardColor('red');

  const result = GameEngineNoColor.spendResourceForFavor(gameState, uiState);
  assertFailureContains(result, 'turn');
});

Deno.test('GameEngineNoColor - gain favor success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleCards = ['red', 'blue'];
  uiState.setSelectedOracleCardColor('red');

  const result = GameEngineNoColor.spendResourceForFavor(gameState, uiState);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 1);
});

Deno.test('GameEngineNoColor - gain favor ignore recolor', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleCards = ['red', 'blue'];
  uiState.setSelectedOracleCardColor('red');
  uiState.setSelectedRecoloring(2);

  const result = GameEngineNoColor.spendResourceForFavor(gameState, uiState);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
});
