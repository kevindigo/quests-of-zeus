import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { assertGreater } from '@std/assert/greater';
import { COLOR_WHEEL, type CubeHex, type Item } from '../src/types.ts';
import {
  setupGame,
  testGameManager,
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
    testState.getPlayerCount(),
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
  const lands = testGameManager.getAvailableLandInteractions();
  assertEquals(lands.length, 0);
});

Deno.test('Engine available offerings - not next to any offerings', () => {
  setupGame();
  const lands = testGameManager.getAvailableLandInteractions();
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
  testGameManager.setSelectedDieColor(missingColor);
  const lands = testGameManager.getAvailableLandInteractions();
  assertFalse(lands.find((cell) => {
    cell.q === cubeHex.q && cell.r === cubeHex.r;
  }));
});

Deno.test('Engine available offerings - not loadable', () => {
  setupGameNextToRedCube();
  const redCube: Item = { type: 'cube', color: 'red' };
  testPlayer.loadItem(redCube);
  testPlayer.oracleDice = ['red'];
  testGameManager.setSelectedDieColor('red');
  const lands = testGameManager.getAvailableLandInteractions();
  const redTemple = lands.find((cell) => {
    cell.terrain === 'temple' && cell.color === 'red';
  });
  assertFalse(redTemple);
});

Deno.test('Engine available offerings - success', () => {
  const cubeHex = setupGameNextToRedCube();
  testPlayer.oracleDice = ['red'];
  testGameManager.setSelectedDieColor('red');
  const lands = testGameManager.getAvailableLandInteractions();
  assertGreater(lands.length, 0);
  const ourOfferingCell = lands.filter((cell) => {
    return cell.q === cubeHex.q && cell.r === cubeHex.r;
  });
  assert(ourOfferingCell);
});
