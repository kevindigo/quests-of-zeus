import { assert, assertStringIncludes } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { OracleSystem } from '../src/oracle-system.ts';
import type { HexColor, ShrineHex, TerrainType } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  xEngine,
  xGrid,
  xMap,
  xPlayer,
  xState,
} from './test-helpers.ts';

function setupWithReadyShrineHex(): ShrineHex {
  setupGame();
  const color = xPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = xState.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex, 'Failed to find our ShrineHex');
  return shrineHex;
}

function putPlayerNextTo(cell: HexCell): void {
  const seaNeighbor = xGrid.getNeighborsOfType(cell, 'sea')[0];
  assert(seaNeighbor);
  xPlayer.setShipPosition(seaNeighbor.getCoordinates());
}

function findLandCell(terrain: TerrainType, color: HexColor): HexCell {
  const allShrineCells = xGrid.getCellsOfType(terrain);
  const ourColorShrineCells = allShrineCells.filter((cell) => {
    return cell.color == color;
  });
  const matchingCell = ourColorShrineCells[0];
  assert(matchingCell);
  return matchingCell;
}

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

Deno.test('click land - shrine no selected color', () => {
  setupWithReadyShrineHex();
  const result = xEngine.activateShrine(HexGrid.CENTER);
  assertFailureContains(result, 'Must select');
});

Deno.test('click land - shrine not valid option', () => {
  setupGame();
  xState.setSelectedDieColor('red');
  const result = xEngine.activateShrine({ q: 0, r: -1 });
  assertFailureContains(result, 'available');
});

Deno.test('Click land - shrine hidden and ours (die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  xState.setSelectedDieColor(shrineCell.color);
  shrineHex.owner = xPlayer.color;
  shrineHex.reward = 'favor';
  const originalFavor = xPlayer.favor;
  const originalDiceCount = xPlayer.oracleDice.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(xPlayer.favor, originalFavor);
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and ours (recolored die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  xPlayer.favor = 5;
  const preRecoloredColor = OracleSystem.applyRecolor(shrineCell.color, 1);
  xPlayer.oracleDice = [preRecoloredColor];
  xState.setSelectedDieColor(preRecoloredColor);
  xState.setSelectedRecoloring(xPlayer.id, 5);
  shrineHex.owner = xPlayer.color;
  shrineHex.reward = 'favor';
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(xPlayer.favor, 0);
  assertEquals(xPlayer.oracleDice.length, 0);
});

Deno.test('Click land - shrine hidden and ours (card)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  xPlayer.oracleCards = [shrineCell.color];
  xState.setSelectedOracleCardColor(shrineCell.color);
  shrineHex.owner = xPlayer.color;
  shrineHex.reward = 'favor';
  const originalFavor = xPlayer.favor;
  const originalCardCount = xPlayer.oracleCards.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(xPlayer.favor, originalFavor);
  assertEquals(xPlayer.oracleCards.length, originalCardCount - 1);
  assert(xPlayer.usedOracleCardThisTurn);
});

Deno.test('Click land - shrine visible and ours (die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  xState.setSelectedDieColor(shrineCell.color);
  shrineHex.owner = xPlayer.color;
  shrineHex.status = 'visible';
  const originalDiceCount = xPlayer.oracleDice.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and favor reward (die)', () => {
  setupGame();
  const shrineHexes = xState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== xPlayer.color && sh.reward === 'favor';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = xGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  xPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  xPlayer.oracleDice = [shrineCell.color];
  xState.setSelectedDieColor(shrineCell.color);
  const originalFavor = xPlayer.favor;
  const originalDiceCount = xPlayer.oracleDice.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(xPlayer.favor, originalFavor + 4);
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and card reward (die)', () => {
  setupGame();
  const shrineHexes = xState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== xPlayer.color && sh.reward === 'card';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = xGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  xPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  xPlayer.oracleDice = [shrineCell.color];
  xState.setSelectedDieColor(shrineCell.color);
  const originalFavor = xPlayer.favor;
  const originalDiceCount = xPlayer.oracleDice.length;
  const originalCardCount = xPlayer.oracleCards.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(xPlayer.favor, originalFavor);
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
  assertEquals(xPlayer.oracleCards.length, originalCardCount + 1);
});

Deno.test('Click land - shrine card reward but oracle deck empty', () => {
  setupGame();
  const shrineHexes = xState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== xPlayer.color && sh.reward === 'card';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = xGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = xGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  xPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  const MORE_THAN_ORACLE_DECK_CARD_COUNT = 1000;
  for (let i = 0; i < MORE_THAN_ORACLE_DECK_CARD_COUNT; ++i) {
    xPlayer.oracleDice = ['red'];
    if (!xEngine.drawOracleCard(xPlayer.id, 'red')) {
      break;
    }
  }

  xPlayer.oracleDice = [shrineCell.color];
  xState.setSelectedDieColor(shrineCell.color);

  const originalFavor = xPlayer.favor;
  const originalDiceCount = xPlayer.oracleDice.length;
  const originalCardCount = xPlayer.oracleCards.length;
  const result = xEngine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(xPlayer.favor, originalFavor);
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
  assertEquals(xPlayer.oracleCards.length, originalCardCount);
  assertStringIncludes(result.message, 'available');
});
