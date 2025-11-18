import { assert, assertNotEquals } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import type { Player } from '../src/Player.ts';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import type { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { HexMap } from '../src/hexmap/HexMap.ts';
import { OracleSystem } from '../src/oracle-system.ts';
import type { HexColor, TerrainType } from '../src/types.ts';

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

Deno.test('Land - nothing available from zeus', () => {
  setup();
  const positions = engine.getAvailableLandInteractionsForColor(player, 'red');
  assertEquals(positions.length, 0);
});

Deno.test('Land - shrine adjacent but wrong color', () => {
  setup();
  const grid = state.map.getHexGrid();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);
  const wrongColor = OracleSystem.applyRecolor(color, 1);

  const positions = engine.getAvailableLandInteractionsForColor(
    player,
    wrongColor,
  );
  const shrines = positions.filter((position) => {
    const cell = grid.getCell(position);
    return cell?.terrain === 'shrine';
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Land - shrine adjacent correct color', () => {
  setup();
  const grid = state.map.getHexGrid();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const positions = engine.getAvailableLandInteractionsForColor(player, color);
  const shrines = positions.filter((position) => {
    const cell = grid.getCell(position);
    return cell?.terrain === 'shrine';
  });
  assertEquals(shrines.length, 1);
  assertEquals(shrines[0], shrineCell);
});

Deno.test('Land - shrine already completed', () => {
  setup();
  const grid = state.map.getHexGrid();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = state.getShrineHexes().find((hex) => {
    return hex.q === shrineCell.q && hex.r === shrineCell.r;
  });
  assert(shrineHex);
  shrineHex.status = 'filled';

  const positions = engine.getAvailableLandInteractionsForColor(
    player,
    color,
  );
  const shrines = positions.filter((position) => {
    const cell = grid.getCell(position);
    return cell?.terrain === 'shrine';
  });
  assertEquals(shrines.length, 0);
});

Deno.test('Land - shrine flipped and not ours', () => {
  setup();
  const grid = state.map.getHexGrid();
  const color = player.oracleDice[0];
  assert(color);
  const shrineCell = findLandCell('shrine', color);
  putPlayerNextTo(shrineCell);

  const shrineHex = state.getShrineHexes().find((hex) => {
    return hex.q === shrineCell.q && hex.r === shrineCell.r;
  });
  assert(shrineHex);
  shrineHex.status = 'visible';
  shrineHex.owner = 'yellow';
  assertNotEquals(shrineHex.owner, player.color);

  const positions = engine.getAvailableLandInteractionsForColor(
    player,
    color,
  );
  const shrines = positions.filter((position) => {
    const cell = grid.getCell(position);
    return cell?.terrain === 'shrine';
  });
  assertEquals(shrines.length, 0);
});
