import {
  assert,
  assertEquals,
  assertGreaterOrEqual,
  assertStringIncludes,
} from '@std/assert';
import { assertFalse } from '@std/assert/false';
import { GameEngine } from '../src/GameEngine.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

Deno.test('GameEngine - available simplest case', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];

  const actions = GameEngine.getAvailableActions(gameState);
  assertEquals(actions.length, 1);
  const endTurnAction = actions[0];
  assert(endTurnAction);
  assert(endTurnAction.type === 'free', endTurnAction.type);
  assertEquals(endTurnAction.subType, 'endTurn');
});

Deno.test('GameEngine - spend resource nothing selected', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();

  const result = GameEngine.spendResource(gameState, uiState);
  assertFalse(result.success, result.message);
  assertFailureContains(result, 'select');
});

Deno.test('GameEngine - spend resource with pending recolor', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  uiState.setSelectedDieColor('red');
  uiState.setSelectedRecoloring(2);

  const result = GameEngine.spendResource(gameState, uiState);
  assertFalse(result.success, result.message);
  assertFailureContains(result, 'recolor');
  assert(uiState.getSelectedResource().hasColor());
});

Deno.test('GameEngine - spend resource die success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = ['blue', 'red', 'red'];
  const uiState = new UiStateClass();
  uiState.setSelectedDieColor('red');

  const result = GameEngine.spendResource(gameState, uiState);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'spent');
  assertEquals(player.oracleDice.length, 2);
  assertGreaterOrEqual(player.oracleDice.indexOf('blue'), 0);
  assertGreaterOrEqual(player.oracleDice.indexOf('red'), 0);
  assertFalse(player.usedOracleCardThisTurn);
  assertFalse(uiState.getSelectedResource().hasColor());
});

Deno.test('GameEngine - spend resource card success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  player.oracleCards = ['blue', 'red', 'red'];
  const uiState = new UiStateClass();
  uiState.setSelectedOracleCardColor('red');

  const result = GameEngine.spendResource(gameState, uiState);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'spent');
  assertEquals(player.oracleCards.length, 2);
  assertGreaterOrEqual(player.oracleCards.indexOf('blue'), 0);
  assertGreaterOrEqual(player.oracleCards.indexOf('red'), 0);
  assert(player.usedOracleCardThisTurn);
  assertFalse(uiState.getSelectedResource().hasColor());
});
