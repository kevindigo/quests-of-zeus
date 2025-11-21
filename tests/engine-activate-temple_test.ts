import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { assert } from '@std/assert/assert';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import type { CoreColor, Item } from '../src/types.ts';
import {
  setupGame,
  testEngine,
  testGrid,
  testPlayer,
  testState,
} from './test-helpers.ts';

function setupWithRedCubeNextToRedTemple(): HexCell {
  setupGame();
  const redTempleCell = putShipNextToTemple('red');
  const redCube: Item = { type: 'cube', color: 'red' };
  const loaded = testPlayer.loadItem(redCube);
  assert(loaded.success, loaded.message);
  const wildQuest = testPlayer.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);
  wildQuest.color = 'red';

  return redTempleCell;
}

function putShipNextToTemple(color: CoreColor): HexCell {
  const templeCell = testGrid.getCellsOfType('temple').find((cell) => {
    return cell.color === color;
  });
  assert(templeCell);
  const destination = testGrid.getNeighborsOfType(templeCell, 'sea')[0];
  assert(destination);
  testPlayer.setShipPosition(destination.getCoordinates());
  return templeCell;
}

Deno.test('Engine activate temple - should work', () => {
  const templeCell = setupWithRedCubeNextToRedTemple();
  testPlayer.oracleDice = ['red'];
  testState.setSelectedDieColor('red');
  const favorWas = testPlayer.favor;

  const result = testEngine.activateTemple(templeCell.getCoordinates());
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'favor');

  const redCube: Item = { type: 'cube', color: 'red' };
  assertFalse(testPlayer.isItemLoaded(redCube), 'Failed to unload?');

  const redTempleQuest = testPlayer.getQuestsOfType('temple').find((temple) => {
    return temple.color === 'red';
  });
  assert(redTempleQuest, 'Quest not found?');
  assert(redTempleQuest.isCompleted, 'Quest not marked complete?');

  assertEquals(testPlayer.oracleDice.length, 0);
  assertFalse(testState.getEffectiveSelectedColor());

  assertEquals(testPlayer.favor, favorWas + 3);
});
