import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { OracleSystem } from '../src/OracleSystem.ts';
import type { ShrineHex } from '../src/types.ts';
import {
  assertFailureContains,
  findFirstCellWithTerrainAndColor,
  putPlayerNextTo,
  setupGame,
  xEngine,
  xGrid,
  xPlayer,
  xState,
} from './test-helpers.ts';

function setupWithReadyShrineHex(): ShrineHex {
  setupGame();
  const color = xPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findFirstCellWithTerrainAndColor('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = xState.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex, 'Failed to find our ShrineHex');
  return shrineHex;
}

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

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
  const result = xEngine.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(xPlayer.favor, originalFavor);
  assertEquals(xPlayer.oracleDice.length, originalDiceCount - 1);
  assertEquals(xPlayer.oracleCards.length, originalCardCount);
  assertStringIncludes(result.message, 'available');
});
