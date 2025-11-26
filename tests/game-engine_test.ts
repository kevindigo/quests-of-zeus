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
import { Resource } from '../src/Resource.ts';
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

  const result = GameEngine.spendResource(gameState, Resource.none);
  assertFalse(result.success, result.message);
  assertFailureContains(result, 'select');
});

Deno.test('GameEngine - spend resource with pending recolor', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const result = GameEngine.spendResource(
    gameState,
    Resource.createRecoloredDie('red', 2),
  );
  assert(result.success, result.message);
});

Deno.test('GameEngine - spend resource die success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = ['blue', 'red', 'red'];
  const redDie = Resource.createDie('red');

  const result = GameEngine.spendResource(gameState, redDie);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'spent');
  assertEquals(player.oracleDice.length, 2);
  assertGreaterOrEqual(player.oracleDice.indexOf('blue'), 0);
  assertGreaterOrEqual(player.oracleDice.indexOf('red'), 0);
  assertFalse(player.usedOracleCardThisTurn);
});

Deno.test('GameEngine - spend resource card success', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  player.oracleCards = ['blue', 'red', 'red'];
  const redCard = Resource.createCard('red');

  const result = GameEngine.spendResource(gameState, redCard);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'spent');
  assertEquals(player.oracleCards.length, 2);
  assertGreaterOrEqual(player.oracleCards.indexOf('blue'), 0);
  assertGreaterOrEqual(player.oracleCards.indexOf('red'), 0);
  assert(player.usedOracleCardThisTurn);
});
