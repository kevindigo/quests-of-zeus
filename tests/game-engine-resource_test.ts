import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { assertStringIncludes } from '@std/assert/string-includes';
import type {
  ResourceGainFavorAction,
  ResourceGainOracleCardAction,
  ResourceGainTwoPeeks,
} from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineResource } from '../src/GameEngineResource.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { PhaseMain, PhasePeeking } from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import type { CoreColor } from '../src/types.ts';
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

function setAllShrineHexesToFilled(gameState: GameState): void {
  gameState.getShrineHexes().forEach((hex) => {
    hex.status = 'filled';
  });
}

Deno.test('GameEngineResource - available actions already used card', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  player.usedOracleCardThisTurn = true;
  const actions = GameEngineResource.getResourceActions(gameState);
  assertEquals(actions.length, 3, JSON.stringify(actions));
});

Deno.test('GameEngineResource - available actions dice and cards', () => {
  setup();
  const actions = GameEngineResource.getResourceActions(gameState);
  assertEquals(actions.length, 3 + 2 * 3, JSON.stringify(actions));
});

Deno.test('GameEngineResource - available actions empty deck', () => {
  setup();
  gameState.getOracleCardDeck().splice(0);

  const actions = GameEngineResource.getResourceActions(gameState);
  assertEquals(actions.length, 2 + 2 * 2, JSON.stringify(actions));
});

Deno.test('GameEngineResource - no resource', () => {
  setupGame();
  testPlayer.oracleDice = [];

  const availableActions = GameEngineResource.getResourceActions(
    testGameState,
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineResource - getAvailable peeks no hidden shrines', () => {
  setupGame();
  testPlayer.oracleDice = ['yellow'];
  setAllShrineHexesToFilled(testGameState);

  const peekActions = GameEngine.getAvailableActions(testGameState).filter(
    (action) => {
      return action.type === 'resource' && action.subType === 'gainTwoPeeks';
    },
  );
  assertEquals(peekActions.length, 0);
});

Deno.test('GameEngineResource - getAvailable peeks 1 hidden shrine', () => {
  setupGame();
  testPlayer.oracleDice = ['yellow'];
  setAllShrineHexesToFilled(testGameState);
  const shrineHexes = testGameState.getShrineHexes();
  const shrineHex = shrineHexes[0];
  assert(shrineHex);
  shrineHex.status = 'hidden';

  const peekActions = GameEngine.getAvailableActions(testGameState).filter(
    (action) => {
      return action.type === 'resource' && action.subType === 'gainTwoPeeks';
    },
  );
  assertEquals(peekActions.length, 1);
});

Deno.test('GameEngineResource - getAvailable peeks 2+ hidden shrines', () => {
  setupGame();
  testPlayer.oracleDice = ['yellow'];

  const peekActions = GameEngine.getAvailableActions(testGameState).filter(
    (action) => {
      return action.type === 'resource' && action.subType === 'gainTwoPeeks';
    },
  );
  assertEquals(peekActions.length, 1);
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

Deno.test('doAction GainTwoPeeks - 1 hidden shrine', () => {
  setupGame();
  setAllShrineHexesToFilled(testGameState);
  const shrineHex = testGameState.getShrineHexes()[0];
  assert(shrineHex);
  shrineHex.status = 'hidden';
  testPlayer.oracleDice = ['pink'];
  const action: ResourceGainTwoPeeks = {
    type: 'resource',
    subType: 'gainTwoPeeks',
    spend: Resource.createDie('pink'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(testGameState.getPhaseName(), PhasePeeking.phaseName);
  testGameState.endPhase();
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
  assertEquals(testPlayer.oracleDice.length, 0);
});

Deno.test('doAction GainTwoPeeks - >2 hidden shrines', () => {
  setupGame();
  testPlayer.oracleDice = ['pink'];
  const action: ResourceGainTwoPeeks = {
    type: 'resource',
    subType: 'gainTwoPeeks',
    spend: Resource.createDie('pink'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(testPlayer.oracleDice.length, 0);
  assertEquals(testGameState.getPhaseName(), PhasePeeking.phaseName);
  testGameState.endPhase();
  assertEquals(testGameState.getPhaseName(), PhasePeeking.phaseName);
  testGameState.endPhase();
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
