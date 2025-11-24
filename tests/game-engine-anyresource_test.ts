import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { assertStringIncludes } from '@std/assert/string-includes';
import { GameEngineAnyResource } from '../src/GameEngineAnyResource.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import type { CoreColor } from '../src/types.ts';
import { UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

Deno.test('GameEngineAnyResource - available actions setup phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  gameState.setPhase('setup');
  const actions = GameEngineAnyResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineAnyResource - available actions already used card', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const dice: CoreColor[] = ['red', 'red'];
  player.oracleDice = dice;
  const cards: CoreColor[] = ['red', 'blue'];
  player.oracleCards = cards;
  player.usedOracleCardThisTurn = true;
  const actions = GameEngineAnyResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 2);
});

Deno.test('GameEngineAnyResource - available actions dice and cards', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const dice: CoreColor[] = ['red', 'red', 'blue'];
  player.oracleDice = dice;
  const cards: CoreColor[] = ['red', 'black'];
  player.oracleCards = cards;
  const actions = GameEngineAnyResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 8, JSON.stringify(actions));
});

Deno.test('GameEngineAnyResource - available actions empty deck', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  gameState.getOracleCardDeck().splice(0);
  player.oracleDice = ['red'];
  player.oracleCards = ['blue'];

  const actions = GameEngineAnyResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 2, JSON.stringify(actions));
});

Deno.test('GameEngineAnyResource - gain favor nothing selected', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();

  const result = GameEngineAnyResource.spendResourceForFavor(
    gameState,
    uiState,
  );
  assertFailureContains(result, 'available');
});

Deno.test('GameEngineAnyResource - gain favor with die success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleDice = ['red', 'blue'];
  uiState.setSelectedDieColor('red');

  const result = GameEngineAnyResource.spendResourceForFavor(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assertFalse(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, 1);
});

Deno.test('GameEngineAnyResource - gain favor with card success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleCards = ['red', 'blue'];
  uiState.setSelectedOracleCardColor('red');

  const result = GameEngineAnyResource.spendResourceForFavor(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 1);
});

Deno.test('GameEngineAnyResource - gain favor ignore recolor', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleCards = ['red', 'blue'];
  uiState.setSelectedOracleCardColor('red');
  uiState.setSelectedRecoloring(2);

  const result = GameEngineAnyResource.spendResourceForFavor(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
});

Deno.test('GameEngineAnyResource - gain card nothing selected', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();

  const result = GameEngineAnyResource.spendResourceForOracleCard(
    gameState,
    uiState,
  );
  assertFailureContains(result, 'available');
});

Deno.test('GameEngineAnyResource - gain card with die success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleDice = ['red', 'blue'];
  uiState.setSelectedDieColor('red');

  const result = GameEngineAnyResource.spendResourceForOracleCard(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.favor, oldFavor);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assertFalse(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, 1);
  assertEquals(player.oracleCards.length, 1);
});

Deno.test('GameEngineAnyResource - gain card with card success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  player.oracleCards = ['red', 'blue'];
  uiState.setSelectedOracleCardColor('red');

  const result = GameEngineAnyResource.spendResourceForOracleCard(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.favor, oldFavor);
  assertFalse(uiState.getSelectedResource().hasColor());
  assertEquals(uiState.getSelectedRecoloring(), 0);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, 3);
  assertEquals(player.oracleCards.length, 2);
});

Deno.test('GameEngineAnyResource - gain card with die ignore recolor', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  player.oracleDice = ['red', 'blue'];
  uiState.setSelectedDieColor('red');
  uiState.setSelectedRecoloring(2);

  const result = GameEngineAnyResource.spendResourceForOracleCard(
    gameState,
    uiState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.oracleDice.length, 1);
  assertEquals(player.oracleCards.length, 1);
});
