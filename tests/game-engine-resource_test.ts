import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { assertStringIncludes } from '@std/assert/string-includes';
import {
  Actions,
  type ResourceAdvanceGodAction,
  type ResourceGainFavorAction,
  type ResourceGainOracleCardAction,
} from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineResource } from '../src/GameEngineResource.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { PhaseAdvancingGod, PhaseMain } from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL, type CoreColor } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
} from './test-helpers.ts';

let gameState: GameState;

function setup(): void {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const dice: CoreColor[] = ['red', 'red'];
  player.oracleDice = dice;
  const cards: CoreColor[] = ['red', 'blue'];
  player.oracleCards = cards;
  player.favor = 1;
}

function createGainFavorAction(spend: Resource): ResourceGainFavorAction {
  return {
    type: 'resource',
    subType: 'gainFavor',
    spend,
  };
}

function createGainCardAction(
  spend: Resource,
): ResourceGainOracleCardAction {
  return {
    type: 'resource',
    subType: 'gainOracleCard',
    spend,
  };
}

Deno.test('GameEngineAnyResource - available actions already used card', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  player.usedOracleCardThisTurn = true;
  const actions = GameEngineResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 1 + 1 + 2, JSON.stringify(actions));
});

Deno.test('GameEngineAnyResource - available actions dice and cards', () => {
  setup();
  const actions = GameEngineResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 3 * 4, JSON.stringify(actions));
});

Deno.test('GameEngineAnyResource - available actions empty deck', () => {
  setup();
  gameState.getOracleCardDeck().splice(0);

  const actions = GameEngineResource.getAnyResourceActions(gameState);
  assertEquals(actions.length, 3 * 3, JSON.stringify(actions));
});

Deno.test('GameEngineColor AdvanceGod available - no resource', () => {
  setupGame();
  testPlayer.oracleDice = [];

  const availableActions = GameEngineResource.getAnyResourceActions(
    testGameState,
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineColor AdvanceGod available - god already at top', () => {
  setupGame();
  COLOR_WHEEL.forEach((color) => {
    const god = testPlayer.getGod(color);
    god.level = GameEngine.getMaxGodLevel(testGameState);
  });

  const availableActions = GameEngineResource.getAnyResourceActions(
    testGameState,
  );
  const advanceGodActions = availableActions.filter((availableAction) => {
    return (availableAction.type === 'resource' &&
      availableAction.subType === 'advanceGod');
  });
  assertEquals(advanceGodActions.length, 0);
});

Deno.test('GameEngineColor AdvanceGod available - can advance', () => {
  setupGame();
  const color = 'blue';
  testPlayer.oracleDice = [color];
  testPlayer.getGod(color).level = GameEngine.getMaxGodLevel(testGameState) - 1;
  const action: ResourceAdvanceGodAction = {
    type: 'resource',
    subType: 'advanceGod',
    spend: Resource.createDie(color),
  };

  const availableActions = GameEngineResource.getAnyResourceActions(
    testGameState,
  );
  const found = Actions.findOne(availableActions, action);
  assert(found);
});

Deno.test('GameEngineAnyResource - gain favor nothing selected', () => {
  setup();

  const result = GameEngineResource.doAction(
    createGainFavorAction(Resource.none),
    gameState,
  );
  assertFailureContains(result, 'available');
});

Deno.test('GameEngineAnyResource - gain favor with die success', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;
  const oldDiceCount = player.oracleDice.length;

  const result = GameEngineResource.doAction(
    createGainFavorAction(Resource.createDie('red')),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
  assertFalse(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, oldDiceCount - 1);
});

Deno.test('GameEngineAnyResource - gain favor with card success', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;

  const result = GameEngineResource.doAction(
    createGainFavorAction(Resource.createCard('blue')),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 1);
});

Deno.test('GameEngineAnyResource - gain favor ignore recolor', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;

  const result = GameEngineResource.doAction(
    createGainFavorAction(Resource.createRecoloredCard('blue', 2)),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gained');
  assertEquals(player.favor, oldFavor + 2);
});

Deno.test('GameEngineAnyResource - gain card nothing selected', () => {
  setup();

  const result = GameEngineResource.doAction(
    createGainCardAction(Resource.none),
    gameState,
  );
  assertFailureContains(result, 'available');
});

Deno.test('GameEngineAnyResource - gain card with die success', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;

  const result = GameEngineResource.doAction(
    createGainCardAction(Resource.createDie('red')),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.favor, oldFavor);
  assertFalse(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, 1);
  assertEquals(player.oracleCards.length, 3);
});

Deno.test('GameEngineAnyResource - gain card with card success', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  const oldFavor = player.favor;

  const result = GameEngineResource.doAction(
    createGainCardAction(Resource.createCard('blue')),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.favor, oldFavor);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleDice.length, 2);
  assertEquals(player.oracleCards.length, 2);
});

Deno.test('GameEngineAnyResource - gain card with die ignore recolor', () => {
  setup();
  const player = gameState.getCurrentPlayer();

  const result = GameEngineResource.doAction(
    createGainCardAction(Resource.createRecoloredDie('red', 2)),
    gameState,
  );
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'gain');
  assertEquals(player.oracleDice.length, 1);
  assertEquals(player.oracleCards.length, 3);
});

Deno.test('GameEngineColor AdvanceGod doAction - not available', () => {
  setupGame();
  testPlayer.oracleDice = [];
  const action: ResourceAdvanceGodAction = {
    type: 'resource',
    subType: 'advanceGod',
    spend: Resource.createDie('blue'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assertFailureContains(result, 'not available');
});

Deno.test('GameEngineColor AdvanceGod doAction - success', () => {
  setupGame();
  const maxGodLevel = GameEngine.getMaxGodLevel(testGameState);
  const color = 'blue';
  testPlayer.oracleDice = [color];
  testPlayer.getGod(color).level = maxGodLevel - 1;
  const action: ResourceAdvanceGodAction = {
    type: 'resource',
    subType: 'advanceGod',
    spend: Resource.createDie(color),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(testPlayer.getGodLevel(color), maxGodLevel);
  assertEquals(testPlayer.oracleDice.length, 0);
});

Deno.test('GameEngineResource - doAction free advance god', () => {
  setupGame();
  testGameState.queuePhase(PhaseAdvancingGod.phaseName);
  testGameState.endPhase();
  const action: ResourceAdvanceGodAction = {
    type: 'resource',
    subType: 'advanceGod',
    spend: Resource.createDie('red'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  const player = testGameState.getCurrentPlayer();
  assertEquals(player.getGodLevel('red'), 1);
  assertEquals(player.oracleDice.length, 3);
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
