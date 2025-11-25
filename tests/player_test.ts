import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { Player } from '../src/Player.ts';
import type { Item } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testPlayer,
} from './test-helpers.ts';

Deno.test('Player - range', () => {
  const player = new Player(0, 'any', 'blue', { q: 0, r: 0 });
  assertEquals(player.getRange(), 3);
});

Deno.test('Player - getQuestsOfType', () => {
  setupGame();
  const templeQuests = testPlayer.getQuestsOfType('temple');
  assertEquals(
    templeQuests.length,
    3,
    `Expected 3 quests but got: ${JSON.stringify(templeQuests)}`,
  );
});

Deno.test('Player - load cube valid', () => {
  setupGame();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(testPlayer.validateItemIsLoadable(redCube).success);
  const result = testPlayer.loadItem(redCube);
  assert(result.success, result.message);
  const items = testPlayer.getLoadedItems();
  assertEquals(items.length, 1);
  assertEquals(testPlayer.getItemCount(), items.length);
});

Deno.test('Player - load cube already present', () => {
  setupGame();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(testPlayer.validateItemIsLoadable(redCube).success);
  const shouldWork = testPlayer.loadItem(redCube);

  const validation = testPlayer.validateItemIsLoadable(redCube);
  assertFailureContains(validation, 'already');
  assert(shouldWork, shouldWork.message);
  const result = testPlayer.loadItem(redCube);
  assertFailureContains(result, 'already');
});

Deno.test('Player - load cube already full', () => {
  setupGame();
  const templeQuests = testPlayer.getQuestsOfType('temple');
  const coloredQuests = templeQuests.filter((quest) => {
    return quest.color !== 'none';
  });
  const questColors = coloredQuests.map((quest) => {
    return quest.color;
  });
  assertEquals(questColors.length, 2, `Got ${JSON.stringify(questColors)}`);
  questColors.forEach((color) => {
    assert(color != 'none');
    const item: Item = { type: 'cube', color: color };
    assert(testPlayer.validateItemIsLoadable(item).success);
    const result = testPlayer.loadItem(item);
    assert(result.success, result.message);
  });
  const redCube: Item = { type: 'cube', color: 'red' };
  const validation = testPlayer.validateItemIsLoadable(redCube);
  assertFailureContains(validation, 'full');
  const result = testPlayer.loadItem(redCube);
  assertFailureContains(result, 'full');
});

Deno.test('Player - get resources for base color dice', () => {
  setupGame();
  testPlayer.oracleDice = ['red', 'blue', 'red'];
  const resources = testPlayer.getResourcesForDice();
  assertEquals(resources.length, 2);
  assert(resources.find((resource) => {
    return resource.isDie() && resource.getBaseColor() === 'red';
  }));
  assert(resources.find((resource) => {
    return resource.isDie() && resource.getBaseColor() === 'blue';
  }));
});

Deno.test('Player - get resources for base color cards', () => {
  setupGame();
  testPlayer.oracleCards = ['pink', 'blue', 'pink'];
  const resources = testPlayer.getResourcesForCards();
  assertEquals(resources.length, 2);
  assert(resources.find((resource) => {
    return resource.isCard() && resource.getBaseColor() === 'pink';
  }));
  assert(resources.find((resource) => {
    return resource.isCard() && resource.getBaseColor() === 'blue';
  }));
});

Deno.test('Player - getAvailableResources', () => {
  setupGame();
  testPlayer.oracleDice = ['red', 'blue', 'red'];
  testPlayer.oracleCards = ['pink', 'blue', 'pink'];

  const resourcesWithCards = testPlayer
    .getAvailableResourcesWithoutRecoloring();
  assertEquals(resourcesWithCards.length, 4);

  testPlayer.usedOracleCardThisTurn = true;
  const resourcesWithoutCards = testPlayer
    .getAvailableResourcesWithoutRecoloring();
  assertEquals(resourcesWithoutCards.length, 2);
});
