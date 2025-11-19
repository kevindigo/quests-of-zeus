import {
  assert,
  assertFalse,
  assertNotEquals,
  assertStringIncludes,
} from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import type { Player } from '../src/Player.ts';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { HexMap } from '../src/hexmap/HexMap.ts';
import { OracleSystem } from '../src/oracle-system.ts';
import type {
  GeneralResult,
  HexColor,
  ShrineHex,
  TerrainType,
} from '../src/types.ts';

function assertFailureContains(
  result: GeneralResult,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

let engine: GameEngine;
let state: GameState;
let map: HexMap;
let grid: HexGrid;
let player: Player;

function setup(): void {
  engine = new GameEngine();
  engine.initializeGame();
  state = engine.getGameState();
  map = state.map;
  grid = map.getHexGrid();
  player = state.getCurrentPlayer();
}

function setupWithReadyShrineHex(): ShrineHex {
  setup();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = state.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex, 'Failed to find our ShrineHex');
  return shrineHex;
}

function putPlayerNextTo(cell: HexCell): void {
  const seaNeighbor = grid.getNeighborsOfType(cell, 'sea')[0];
  assert(seaNeighbor);
  player.setShipPosition(seaNeighbor.getCoordinates());
}

function findLandCell(terrain: TerrainType, color: HexColor): HexCell {
  const allShrineCells = grid.getCellsOfType(terrain);
  const ourColorShrineCells = allShrineCells.filter((cell) => {
    return cell.color == color;
  });
  const matchingCell = ourColorShrineCells[0];
  assert(matchingCell);
  return matchingCell;
}

Deno.test('Available land - nothing available from zeus', () => {
  setup();
  state.setSelectedDieColor('red');
  const positions = engine.getAvailableLandInteractions();
  assertEquals(positions.length, 0);
});

Deno.test('Available land - shrine adjacent but wrong color', () => {
  setup();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);
  const wrongColor = OracleSystem.applyRecolor(color, 1);

  state.setSelectedDieColor(wrongColor);
  const positions = engine.getAvailableLandInteractions();
  const shrines = positions.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine adjacent correct color', () => {
  setup();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  state.setSelectedDieColor(color);
  const lands = engine.getAvailableLandInteractions();
  const ourShrine = lands.find((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assert(ourShrine, JSON.stringify(lands));
});

Deno.test('Available land - shrine already completed', () => {
  setup();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = state.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex);
  shrineHex.status = 'filled';

  state.setSelectedDieColor(color);
  const lands = engine.getAvailableLandInteractions();
  const shrines = lands.filter((cell) => {
    return cell.q === shrineCell.q && cell.r === shrineCell.r;
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Available land - shrine already flipped and not ours', () => {
  setup();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = state.findShrineHexAt(shrineCell.getCoordinates());
  assert(shrineHex);
  shrineHex.status = 'visible';
  shrineHex.owner = 'yellow';
  assertNotEquals(shrineHex.owner, player.color);

  state.setSelectedDieColor(color);
  const cells = engine.getAvailableLandInteractions();
  const thisShrine = cells.find((cell) => {
    return cell.q === shrineHex.q && cell.r === shrineHex.r;
  });
  assert(!thisShrine, JSON.stringify(cells));
});

Deno.test('click land - shrine no selected color', () => {
  setupWithReadyShrineHex();
  const result = engine.activateShrine(HexGrid.CENTER);
  assertFailureContains(result, 'Must select');
});

Deno.test('click land - shrine not valid option', () => {
  setup();
  state.setSelectedDieColor('red');
  const result = engine.activateShrine({ q: 0, r: -1 });
  assertFailureContains(result, 'available');
});

Deno.test('Click land - shrine hidden and ours (die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = grid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  state.setSelectedDieColor(shrineCell.color);
  shrineHex.owner = player.color;
  shrineHex.reward = 'favor';
  const originalFavor = player.favor;
  const originalDiceCount = player.oracleDice.length;
  const result = engine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(player.favor, originalFavor);
  assertEquals(player.oracleDice.length, originalDiceCount - 1);
});

Deno.test('Click land - shrine hidden and ours (recolored die)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = grid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  player.favor = 5;
  const preRecoloredColor = OracleSystem.applyRecolor(shrineCell.color, 1);
  player.oracleDice = [preRecoloredColor];
  state.setSelectedDieColor(preRecoloredColor);
  state.setSelectedRecoloring(player.id, 5);
  shrineHex.owner = player.color;
  shrineHex.reward = 'favor';
  const result = engine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(player.favor, 0);
  assertEquals(player.oracleDice.length, 0);
});

Deno.test('Click land - shrine hidden and ours (card)', () => {
  const shrineHex = setupWithReadyShrineHex();
  const shrineCell = grid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  player.oracleCards = [shrineCell.color];
  state.setSelectedOracleCardColor(shrineCell.color);
  shrineHex.owner = player.color;
  shrineHex.reward = 'favor';
  const originalFavor = player.favor;
  const originalCardCount = player.oracleCards.length;
  const result = engine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(player.favor, originalFavor);
  assertEquals(player.oracleCards.length, originalCardCount - 1);
  assert(player.usedOracleCardThisTurn);
});

Deno.test('Click land - shrine hidden and favor reward (die)', () => {
  setup();
  const shrineHexes = state.getShrineHexes();
  const shrineHex = shrineHexes.find((sh) => {
    return sh.owner !== player.color && sh.reward === 'favor';
  });
  assert(shrineHex, `Did not find a favor shrine`);
  const shrineCell = grid.getCell({ q: shrineHex.q, r: shrineHex.r });
  assert(shrineCell);
  assert(shrineCell.color !== 'none');

  const adjacentSeaCell = grid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(adjacentSeaCell);
  player.setShipPosition(adjacentSeaCell.getCoordinates());

  player.oracleDice = [shrineCell.color];
  state.setSelectedDieColor(shrineCell.color);
  const originalFavor = player.favor;
  const originalDiceCount = player.oracleDice.length;
  const result = engine.activateShrine(
    shrineCell.getCoordinates(),
  );

  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  assertEquals(player.favor, originalFavor + 4);
  assertEquals(player.oracleDice.length, originalDiceCount - 1);
});
