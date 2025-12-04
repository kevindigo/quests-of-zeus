import { assert, assertEquals, assertFalse } from '@std/assert';
import { Actions, type AdvanceGodAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineAdvance } from '../src/GameEngineAdvance.ts';
import { GameEngineResource } from '../src/GameEngineResource.ts';
import { PhaseAdvancingGod, PhaseMain } from '../src/phases.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
} from './test-helpers.ts';

Deno.test('GameEngineResource - Actions.areEqual', () => {
  const redCard: AdvanceGodAction = {
    type: 'advance',
    godColor: 'red',
    spend: Resource.createCard('red'),
  };
  const redCard2: AdvanceGodAction = {
    type: 'advance',
    godColor: 'red',
    spend: Resource.createCard('red'),
  };
  const redDie: AdvanceGodAction = {
    type: 'advance',
    godColor: 'red',
    spend: Resource.createDie('red'),
  };
  const blueCard: AdvanceGodAction = {
    type: 'advance',
    godColor: 'blue',
    spend: Resource.createCard('blue'),
  };
  const blackBlack: AdvanceGodAction = {
    type: 'advance',
    godColor: 'black',
    spend: Resource.createCard('black'),
  };

  const blackNone: AdvanceGodAction = {
    type: 'advance',
    godColor: 'black',
    spend: Resource.none,
  };

  const blackNone2: AdvanceGodAction = {
    type: 'advance',
    godColor: 'black',
    spend: Resource.none,
  };

  const pinkNone: AdvanceGodAction = {
    type: 'advance',
    godColor: 'pink',
    spend: Resource.none,
  };

  assert(Actions.areEqual(redCard, redCard2));
  assert(Actions.areEqual(blackNone, blackNone2));
  assertFalse(Actions.areEqual(redCard, redDie));
  assertFalse(Actions.areEqual(redCard, blueCard));
  assertFalse(Actions.areEqual(blackBlack, blackNone));
  assertFalse(Actions.areEqual(blackNone, pinkNone));
});

Deno.test('GameEngineColor AdvanceGod available - god already at top', () => {
  setupGame();
  COLOR_WHEEL.forEach((color) => {
    const god = testPlayer.getGod(color);
    god.level = GameEngine.getMaxGodLevel(testGameState);
  });

  const availableActions = GameEngineResource.getResourceActions(
    testGameState,
  );
  const advanceGodActions = availableActions.filter((availableAction) => {
    return (availableAction.type === 'advance');
  });
  assertEquals(advanceGodActions.length, 0);
});

Deno.test('GameEngineColor AdvanceGod available - can advance', () => {
  setupGame();
  const color = 'blue';
  testPlayer.oracleDice = [color];
  testPlayer.getGod(color).level = GameEngine.getMaxGodLevel(testGameState) - 1;
  const action: AdvanceGodAction = {
    type: 'advance',
    godColor: color,
    spend: Resource.createDie(color),
  };

  const availableActions = GameEngineAdvance.getAdvanceActions(
    testGameState,
  );
  const found = Actions.findOne(availableActions, action);
  assert(found);
});

Deno.test('GameEngineColor AdvanceGod doAction - not available', () => {
  setupGame();
  testPlayer.oracleDice = [];
  const action: AdvanceGodAction = {
    type: 'advance',
    godColor: 'blue',
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
  const action: AdvanceGodAction = {
    type: 'advance',
    godColor: color,
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
  const action: AdvanceGodAction = {
    type: 'advance',
    godColor: 'red',
    spend: Resource.none,
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  const player = testGameState.getCurrentPlayer();
  assertEquals(player.getGodLevel('red'), 1);
  assertEquals(player.oracleDice.length, 3);
  assertEquals(testGameState.getPhaseName(), PhaseMain.phaseName);
});
