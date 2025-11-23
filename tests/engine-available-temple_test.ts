import { assertEquals } from '@std/assert';
import { assert } from '@std/assert/assert';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import type { CoreColor, Item } from '../src/types.ts';
import { setupGame, testEngine, testGrid, testPlayer } from './test-helpers.ts';

function setupWithRedCubeNextToRedTemple(): HexCell {
  setupGame();
  const redTempleCell = putShipNextToTemple('red');
  const redCube: Item = { type: 'cube', color: 'red' };
  const loaded = testPlayer.loadItem(redCube);
  assert(loaded.success, loaded.message);

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

Deno.test('Engine available temple - wrong color die', () => {
  const redTempleCell = setupWithRedCubeNextToRedTemple();
  testPlayer.oracleDice = ['blue'];
  testEngine.setSelectedDieColor('blue');
  const lands = testEngine.getAvailableLandInteractions();
  const foundTempleCell = lands.find(
    (cell) => {
      return cell.q === redTempleCell.q && cell.r === redTempleCell.r;
    },
  );
  assertEquals(foundTempleCell, undefined);
});

Deno.test('Engine available temple - no matching cube', () => {
  setupWithRedCubeNextToRedTemple();
  const blueTempleCell = putShipNextToTemple('blue');
  testPlayer.oracleDice = ['blue'];
  testEngine.setSelectedDieColor('blue');
  const foundTempleCell = testEngine.getAvailableLandInteractions().find(
    (cell) => {
      return cell.q === blueTempleCell.q && cell.r === blueTempleCell.r;
    },
  );
  assertEquals(foundTempleCell, undefined);
});

Deno.test('Engine available temple - all correct', () => {
  const redTempleCell = setupWithRedCubeNextToRedTemple();
  testPlayer.oracleDice = ['red'];
  testEngine.setSelectedDieColor('red');
  const lands = testEngine.getAvailableLandInteractions();
  const foundTempleCell = lands.find(
    (cell) => {
      return cell.q === redTempleCell.q && cell.r === redTempleCell.r;
    },
  );
  assert(foundTempleCell, `Not in ${lands}?`);
});
