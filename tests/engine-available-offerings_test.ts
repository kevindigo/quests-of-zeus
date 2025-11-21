import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertGreater } from '@std/assert/greater';
import { COLOR_WHEEL, type CubeHex, type Item } from '../src/types.ts';
import {
  setupGame,
  testEngine,
  testGrid,
  testPlayer,
  testState,
} from './test-helpers.ts';

function setupGameNextToRedCube(): CubeHex {
  setupGame();
  const cubeHexes = testState.getCubeHexes();
  assertEquals(cubeHexes.length, 6);
  const hexesWithRed = cubeHexes.filter((hex) => {
    return (hex.cubeColors.indexOf('red') >= 0);
  });
  assertEquals(
    hexesWithRed.length,
    testState.players.length,
    'red cube hex count',
  );
  const cubeHex = hexesWithRed[0];
  assert(cubeHex);
  const cubeHexCoordinates = { q: cubeHex.q, r: cubeHex.r };
  const seaNeighbors = testGrid.getNeighborsByCoordinates(cubeHexCoordinates);
  const destination = seaNeighbors[0];
  assert(destination);
  testPlayer.setShipPosition(destination.getCoordinates());
  const shipCell = testGrid.getCell(testPlayer.getShipPosition());
  assert(shipCell);
  assertGreater(testGrid.getNeighborsOfType(shipCell, 'offerings').length, 0);
  return cubeHex;
}
Deno.test('Engine available offerings - no resource selected', () => {
  setupGameNextToRedCube();
  const lands = testEngine.getAvailableLandInteractions();
  assertEquals(lands.length, 0);
});

Deno.test('Engine available offerings - not next to any offerings', () => {
  setupGame();
  const lands = testEngine.getAvailableLandInteractions();
  assertEquals(lands.length, 0);
});

Deno.test('Engine available offerings - not next to selected color cube', () => {
  const cubeHex = setupGameNextToRedCube();
  const missingColors = COLOR_WHEEL.filter((color) => {
    return cubeHex.cubeColors.indexOf(color) < 0;
  });
  const missingColor = missingColors[0];
  assert(missingColor);
  testPlayer.oracleDice = [missingColor];
  testState.setSelectedDieColor(missingColor);
  const lands = testEngine.getAvailableLandInteractions();
  assertEquals(lands.length, 0);
});

Deno.test('Engine available offerings - not loadable', () => {
  setupGameNextToRedCube();
  const redCube: Item = { type: 'cube', color: 'red' };
  testPlayer.loadItem(redCube);
  testPlayer.oracleDice = ['red'];
  testState.setSelectedDieColor('red');
  const lands = testEngine.getAvailableLandInteractions();
  assertEquals(lands.length, 0);
});

Deno.test('Engine available offerings - success', () => {
  const cubeHex = setupGameNextToRedCube();
  testPlayer.oracleDice = ['red'];
  testState.setSelectedDieColor('red');
  const lands = testEngine.getAvailableLandInteractions();
  assertGreater(lands.length, 0);
  const ourOfferingCell = lands.filter((cell) => {
    return cell.q === cubeHex.q && cell.r === cubeHex.r;
  });
  assert(ourOfferingCell);
});
