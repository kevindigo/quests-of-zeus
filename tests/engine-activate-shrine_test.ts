import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { OracleSystem } from '../src/OracleSystem.ts';
import type { ShrineHex } from '../src/types.ts';
import {
  assertFailureContains,
  findFirstCellWithTerrainAndColor,
  putPlayerNextTo,
  setupGame,
  testGameManager,
  testGameState,
  testGrid,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

function setupWithReadyShrineHex(): ShrineHex {
  setupGame();
  const color = testPlayer.oracleDice[0];
  assert(color);
  const shrineCell = findFirstCellWithTerrainAndColor('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = testGameState.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex, 'Failed to find our ShrineHex');
  return shrineHex;
}

Deno.test('click land - shrine no selected color', () => {
  setupWithReadyShrineHex();
  const result = testGameManager.activateShrine(HexGrid.CENTER);
  assertFailureContains(result, 'Must select');
});

Deno.test('click land - shrine not valid option', () => {
  setupGame();
  testUiState.setSelectedDieColor('red');
  const result = testGameManager.activateShrine({ q: 0, r: -1 });
  assertFailureContains(result, 'available');
});

Deno.test('Click land - shrine hidden and ours (die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  testUiState.setSelectedDieColor(shrineCell.color);
  shrineHex.owner = testPlayer.color;
  shrineHex.reward = 'favor';
  const originalFavor = testPlayer.favor;
  const originalDiceCount = testPlayer.oracleDice.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(testPlayer.favor, originalFavor);
  assertEquals(testPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and ours (recolored die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  testPlayer.favor = 5;
  const preRecoloredColor = OracleSystem.applyRecolor(shrineCell.color, 1);
  testPlayer.oracleDice = [preRecoloredColor];
  testUiState.setSelectedDieColor(preRecoloredColor);
  testUiState.setSelectedRecoloring(5);
  shrineHex.owner = testPlayer.color;
  shrineHex.reward = 'favor';
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(testPlayer.favor, 0);
  assertEquals(testPlayer.oracleDice.length, 0);
});

Deno.test('Click land - shrine hidden and ours (card)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  testPlayer.oracleCards = [shrineCell.color];
  testGameManager.setSelectedOracleCardColor(shrineCell.color);
  shrineHex.owner = testPlayer.color;
  shrineHex.reward = 'favor';
  const originalFavor = testPlayer.favor;
  const originalCardCount = testPlayer.oracleCards.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(testPlayer.favor, originalFavor);
  assertEquals(testPlayer.oracleCards.length, originalCardCount - 1);
  assert(testPlayer.usedOracleCardThisTurn);
});

Deno.test('Click land - shrine visible and ours (die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  testUiState.setSelectedDieColor(shrineCell.color);
  shrineHex.owner = testPlayer.color;
  shrineHex.status = 'visible';
  const originalDiceCount = testPlayer.oracleDice.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(testPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and favor reward (die)', () => {
  setupGame();
  const shrineHexes = testGameState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== testPlayer.color && sh.reward === 'favor';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = testGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  testPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  testPlayer.oracleDice = [shrineCell.color];
  testUiState.setSelectedDieColor(shrineCell.color);
  const originalFavor = testPlayer.favor;
  const originalDiceCount = testPlayer.oracleDice.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(testPlayer.favor, originalFavor + 4);
  assertEquals(testPlayer.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and card reward (die)', () => {
  setupGame();
  const shrineHexes = testGameState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== testPlayer.color && sh.reward === 'card';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = testGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  testPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  testPlayer.oracleDice = [shrineCell.color];
  testUiState.setSelectedDieColor(shrineCell.color);
  const originalFavor = testPlayer.favor;
  const originalDiceCount = testPlayer.oracleDice.length;
  const originalCardCount = testPlayer.oracleCards.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(testPlayer.favor, originalFavor);
  assertEquals(testPlayer.oracleDice.length, originalDiceCount - 1);
  assertEquals(testPlayer.oracleCards.length, originalCardCount + 1);
});

Deno.test('Click land - shrine card reward but oracle deck empty', () => {
  setupGame();
  const shrineHexes = testGameState.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== testPlayer.color && sh.reward === 'card';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = testGrid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = testGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  testPlayer.setShipPosition(adjacentSeaCell.getCoordinates());

  const MORE_THAN_ORACLE_DECK_CARD_COUNT = 1000;
  const gameEngine = new GameEngine();
  for (let i = 0; i < MORE_THAN_ORACLE_DECK_CARD_COUNT; ++i) {
    testPlayer.oracleDice = ['red'];
    testUiState.setSelectedDieColor('red');
    if (!gameEngine.spendResourceForOracleCard(testGameState, testUiState)) {
      break;
    }
  }

  testPlayer.oracleDice = [shrineCell.color];
  testUiState.setSelectedDieColor(shrineCell.color);

  const originalFavor = testPlayer.favor;
  const originalDiceCount = testPlayer.oracleDice.length;
  const originalCardCount = testPlayer.oracleCards.length;
  const result = testGameManager.activateShrine(shrineCell.getCoordinates());

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(testPlayer.favor, originalFavor);
  assertEquals(testPlayer.oracleDice.length, originalDiceCount - 1);
  assertEquals(testPlayer.oracleCards.length, originalCardCount);
  assertStringIncludes(result.message, 'available');
});
