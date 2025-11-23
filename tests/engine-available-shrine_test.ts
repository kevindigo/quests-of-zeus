import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { OracleSystem } from '../src/OracleSystem.ts';
import {
  findFirstCellWithTerrainAndColor,
  putPlayerNextTo,
  setupGame,
  testEngine,
  testGrid,
  testMap,
  testPlayer,
  testState,
} from './test-helpers.ts';

Deno.test('Available land - nothing available from zeus', () => {
  setupGame();
  testEngine.setSelectedDieColor('red');
  const positions = testEngine.getAvailableLandInteractions();
  assertEquals(positions.length, 0);
});

Deno.test('Available land - shrine adjacent but wrong color', () => {
  setupGame();
  const color = testPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findFirstCellWithTerrainAndColor('shrine', color);
  putPlayerNextTo(shrineCell);
  const wrongColor = OracleSystem.applyRecolor(color, 1);

  testEngine.setSelectedDieColor(wrongColor);
  const positions = testEngine.getAvailableLandInteractions();
  const shrines = positions.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine adjacent correct color', () => {
  setupGame();
  const color = testPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findFirstCellWithTerrainAndColor('shrine', color);
  putPlayerNextTo(shrineCell);

  testEngine.setSelectedDieColor(color);
  const lands = testEngine.getAvailableLandInteractions();
  const ourShrine = lands.find((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assert(ourShrine, JSON.stringify(lands));
});

Deno.test('Available land - shrine already completed', () => {
  setupGame();
  const color = testPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findFirstCellWithTerrainAndColor('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = testState.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex);
  shrineHex.status = 'filled';

  testEngine.setSelectedDieColor(color);
  const lands = testEngine.getAvailableLandInteractions();
  const shrines = lands.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine already flipped and not ours', () => {
  setupGame();
  const shrineHex = testState.getShrineHexes().find((sh) => {
    return sh.owner !== testPlayer.color;
  });
  assert(shrineHex);
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  shrineHex.status = 'visible';
  putPlayerNextTo(shrineCell);
  testPlayer.oracleDice = [shrineCell.color];
  testEngine.setSelectedDieColor(shrineCell.color);

  const cells = testEngine.getAvailableLandInteractions();
  const thisShrine = cells.find((cell) => {
    return cell.q === shrineHex.q && cell.r === shrineHex.r;
  });
  assert(!thisShrine, JSON.stringify(cells));
});

Deno.test('Available land - shrine already flipped and is ours', () => {
  setupGame();
  const shrineHex = testState.getShrineHexes().find((sh) => {
    return sh.owner === testPlayer.color;
  });
  assert(shrineHex);
  const shrineCell = testMap.getCell(shrineHex);
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  shrineHex.status = 'visible';
  testEngine.setSelectedDieColor(shrineCell.color);

  testPlayer.oracleDice = [shrineCell.color];
  putPlayerNextTo(shrineCell);

  const lands = testEngine.getAvailableLandInteractions();
  const ourShrine = lands.find((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assert(ourShrine, JSON.stringify(lands));
});
