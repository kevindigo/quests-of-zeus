import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import type { CoreColor, Item } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testEngine,
  testPlayer,
} from './test-helpers.ts';

Deno.test('Engine offering - can load valid wild cube', () => {
  setupGame();
  const redCube: Item = { type: 'cube', color: 'red' };
  const validation = testEngine.validateItemIsLoadable(redCube);
  assert(validation.success, validation.message);
  const result = testEngine.loadItem(redCube);
  assert(result.success, result.message);

  const templeQuests = testPlayer.getQuestsOfType('temple');
  const redQuest = templeQuests.find((quest) => {
    return quest.color === 'red';
  });
  assert(
    redQuest,
    `Should have found red qeust in ${JSON.stringify(templeQuests)}`,
  );
});

Deno.test('Engine offering - cannot load same cube twice', () => {
  setupGame();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(testEngine.validateItemIsLoadable(redCube).success);
  testEngine.loadItem(redCube);

  const validation = testEngine.validateItemIsLoadable(redCube);
  assertFailureContains(validation, 'already');
  const shouldFail = testEngine.loadItem(redCube);
  assertFailureContains(shouldFail, 'already');
});

Deno.test('Engine offering - fail load cube all quests complete', () => {
  setupGame();
  const templeQuests = testPlayer.getQuestsOfType('temple');
  assertEquals(templeQuests.length, 3);
  const completedColors = templeQuests.map((quest) => {
    if (quest.type === 'temple') {
      quest.isCompleted = true;
      if (quest.color === 'none') {
        quest.color = 'red';
      }
    }
    return quest.color as CoreColor;
  });
  assertEquals(completedColors.length, 3);
  completedColors.forEach((completedColor) => {
    const cube: Item = { type: 'cube', color: completedColor };

    const validation = testEngine.validateItemIsLoadable(cube);
    assertFailureContains(validation, 'quest');
    const result = testEngine.validateItemIsLoadable(cube);
    assertFailureContains(result, 'quest');
  });
});

Deno.test('Engine offering - fail load 2 wild cubes', () => {
  setupGame();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(testEngine.validateItemIsLoadable(redCube).success);
  testEngine.loadItem(redCube);

  const greenCube: Item = { type: 'cube', color: 'green' };
  const validation = testEngine.validateItemIsLoadable(greenCube);
  assertFailureContains(validation, 'needs');
  const shouldFail = testEngine.loadItem(greenCube);
  assertFailureContains(shouldFail, 'needs');
});
