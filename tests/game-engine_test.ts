import {
  assert,
  assertEquals,
  assertGreaterOrEqual,
  assertStringIncludes,
} from '@std/assert';
import { assertFalse } from '@std/assert/false';
import type { TeleportAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { PhaseMain, PhaseTeleporting } from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
} from './test-helpers.ts';

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

Deno.test('GameEngine - doAction teleport', () => {
  setupGame();
  const player = testGameState.getCurrentPlayer();
  testPlayer.getGod('blue').level = GameEngine.getMaxGodLevel(testGameState);
  const shipAt = player.getShipPosition();
  const map = testGameState.getMap();
  const seaCells = map.getCellsByTerrain('sea');
  const randomDistantSeaCell = seaCells.find((cell) => {
    const coordinates = cell.getCoordinates();
    const distance = HexGrid.hexDistance(
      coordinates.q,
      coordinates.r,
      shipAt.q,
      shipAt.r,
    );
    return distance > 2;
  });
  assert(randomDistantSeaCell);
  const destination = randomDistantSeaCell.getCoordinates();
  testGameState.queuePhase(PhaseTeleporting.phaseName);
  testGameState.endPhase();
  const action: TeleportAction = {
    type: 'teleport',
    coordinates: destination,
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assert(HexGrid.isSameLocation(destination, player.getShipPosition()));
  assertEquals(testGameState.getPhase().getName(), PhaseMain.phaseName);
  assertEquals(testPlayer.getGod('blue').level, 0);
});
