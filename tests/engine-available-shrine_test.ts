import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { OracleSystem } from '../src/oracle-system.ts';
import {
  findLandCell,
  putPlayerNextTo,
  setupGame,
  xEngine,
  xGrid,
  xMap,
  xPlayer,
  xState,
} from './test-helpers.ts';

Deno.test('Available land - nothing available from zeus', () => {
  setupGame();
  xState.setSelectedDieColor('red');
  const positions = xEngine.getAvailableLandInteractions();
  assertEquals(positions.length, 0);
});

Deno.test('Available land - shrine adjacent but wrong color', () => {
  setupGame();
  const color = xPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);
  const wrongColor = OracleSystem.applyRecolor(color, 1);

  xState.setSelectedDieColor(wrongColor);
  const positions = xEngine.getAvailableLandInteractions();
  const shrines = positions.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine adjacent correct color', () => {
  setupGame();
  const color = xPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  xState.setSelectedDieColor(color);
  const lands = xEngine.getAvailableLandInteractions();
  const ourShrine = lands.find((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assert(ourShrine, JSON.stringify(lands));
});

Deno.test('Available land - shrine already completed', () => {
  setupGame();
  const color = xPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = xState.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex);
  shrineHex.status = 'filled';

  xState.setSelectedDieColor(color);
  const lands = xEngine.getAvailableLandInteractions();
  const shrines = lands.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine already flipped and not ours', () => {
  setupGame();
  const shrineHex = xState.getShrineHexes().find((sh) => {
    return sh.owner !== xPlayer.color;
  });
  assert(shrineHex);
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  shrineHex.status = 'visible';
  putPlayerNextTo(shrineCell);
  xPlayer.oracleDice = [shrineCell.color];
  xState.setSelectedDieColor(shrineCell.color);

  const cells = xEngine.getAvailableLandInteractions();
  const thisShrine = cells.find((cell) => {
    return cell.q === shrineHex.q && cell.r === shrineHex.r;
  });
  assert(!thisShrine, JSON.stringify(cells));
});

Deno.test('Available land - shrine already flipped and is ours', () => {
  setupGame();
  const shrineHex = xState.getShrineHexes().find((sh) => {
    return sh.owner === xPlayer.color;
  });
  assert(shrineHex);
  const shrineCell = xMap.getCell(shrineHex);
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  shrineHex.status = 'visible';
  xState.setSelectedDieColor(shrineCell.color);

  xPlayer.oracleDice = [shrineCell.color];
  putPlayerNextTo(shrineCell);

  const lands = xEngine.getAvailableLandInteractions();
  const ourShrine = lands.find((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assert(ourShrine, JSON.stringify(lands));
});
