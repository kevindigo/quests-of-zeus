import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { ColorAdvanceGodAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineColor } from '../src/GameEngineColor.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
} from './test-helpers.ts';

Deno.test('GameEngineColor AdvanceGod available - no resource', () => {
  setupGame();
  testPlayer.oracleDice = [];

  const availableActions = GameEngineColor.getColorActions(testGameState);
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineColor AdvanceGod available - god already at top', () => {
  setupGame();
  COLOR_WHEEL.forEach((color) => {
    const god = testPlayer.getGod(color);
    god.level = GameEngine.getMaxGodLevel(testGameState);
  });

  const availableActions = GameEngineColor.getColorActions(testGameState);
  const advanceGodActions = availableActions.filter((availableAction) => {
    return (availableAction.type === 'color' &&
      availableAction.subType === 'advanceGod');
  });
  assertEquals(advanceGodActions.length, 0);
});

Deno.test('GameEngineColor AdvanceGod available - can advance', () => {
  setupGame();
  const color = 'blue';
  testPlayer.oracleDice = [color];
  testPlayer.getGod(color).level = GameEngine.getMaxGodLevel(testGameState) - 1;
  const action: ColorAdvanceGodAction = {
    type: 'color',
    subType: 'advanceGod',
    spend: Resource.createDie(color),
  };

  const availableActions = GameEngineColor.getColorActions(testGameState);
  const found = availableActions.filter((availableAction) => {
    return GameEngineColor.areEqualColorActions(availableAction, action);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineColor AdvanceGod doAction - not available', () => {
  setupGame();
  testPlayer.oracleDice = [];
  const action: ColorAdvanceGodAction = {
    type: 'color',
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
  const action: ColorAdvanceGodAction = {
    type: 'color',
    subType: 'advanceGod',
    spend: Resource.createDie(color),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertEquals(testPlayer.getGodLevel(color), maxGodLevel);
  assertEquals(testPlayer.oracleDice.length, 0);
});
