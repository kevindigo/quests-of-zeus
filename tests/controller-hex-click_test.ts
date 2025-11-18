import { assert, assertFalse, assertStringIncludes } from '@std/assert';
import { ControllerForHexClicks } from '../src/ControllerForHexClicks.ts';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import { type HexCoordinates, HexGrid } from '../src/hexmap/HexGrid.ts';
import type { Player } from '../src/Player.ts';
import type { ControllerActionResult } from '../src/types.ts';

function assertFailureContains(
  result: ControllerActionResult,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

let engine: GameEngine;
let handler: ControllerForHexClicks;
let state: GameState;
let center: HexCoordinates;
let player: Player;

function setup(): void {
  engine = new GameEngine();
  engine.initializeGame();
  handler = new ControllerForHexClicks(engine);
  state = engine.getGameState();
  center = HexGrid.CENTER;
  player = state.getCurrentPlayer();
}

Deno.test('Hex click - wrong phase', () => {
  setup();

  state.setPhase('setup');
  assertFailureContains(
    handler.handleHexClick(center, 'sea', null, null),
    'phase',
  );
});

Deno.test('Hex click - second oracle card', () => {
  setup();

  player.usedOracleCardThisTurn = true;
  assertFailureContains(
    handler.handleHexClick(center, 'sea', null, 'red'),
    'per turn',
  );
});

Deno.test('Hex click - unsupported terrain', () => {
  setup();
  player.oracleDice = ['red'];
  assertFailureContains(
    handler.handleHexClick(center, 'shallow', 'red', null),
    'shallow',
  );
});

Deno.test('Hex click - shrine not adjacent', () => {
  setup();
  const grid = state.map.getHexGrid();
  const shrineCell = grid.getCellsOfType('shrine')[0];
  assert(shrineCell);
  shrineCell.color = 'red';
  player.oracleDice = [shrineCell.color];
  const result = handler.handleHexClick(
    shrineCell.getCoordinates(),
    'shrine',
    shrineCell.color,
    null,
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - next to good color, but click elsewhere', () => {
  setup();
  const grid = state.map.getHexGrid();
  const shrineCells = grid.getCellsOfType('shrine');
  const adjacentShrineCell = shrineCells[0];
  assert(adjacentShrineCell);
  const otherShrineCell = shrineCells[1];
  assert(otherShrineCell);
  adjacentShrineCell.color = 'red';
  const seaNeighbor = grid.getNeighborsOfType(adjacentShrineCell, 'sea')[0];
  assert(seaNeighbor);
  player.setShipPosition(seaNeighbor.getCoordinates());
  player.oracleDice = [adjacentShrineCell.color, 'green'];
  const result = handler.handleHexClick(
    otherShrineCell.getCoordinates(),
    'shrine',
    adjacentShrineCell.color,
    null,
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - next to good color, but different color', () => {
  setup();
  const grid = state.map.getHexGrid();
  const shrineCell = grid.getCellsOfType('shrine')[0];
  assert(shrineCell);
  shrineCell.color = 'red';
  const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(seaNeighbor);
  player.setShipPosition(seaNeighbor.getCoordinates());
  player.oracleDice = [shrineCell.color, 'green'];
  const result = handler.handleHexClick(
    shrineCell.getCoordinates(),
    'shrine',
    'green',
    null,
  );
  assertFailureContains(result, 'not available');
});

// Deno.test('Hex click - available shrine (die)', () => {
//   setup();
//   const color = player.oracleDice[0]!;
//   const grid = state.map.getHexGrid();
//   const shrineCells = grid.getCellsOfType('shrine');
//   const shrineCell = shrineCells.find((cell) => {
//     return cell.color === color;
//   });
//   assert(shrineCell);
//   const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
//   assert(seaNeighbor);
//   player.setShipPosition(seaNeighbor.getCoordinates());
//   const result = handler.handleHexClick(
//     shrineCell.getCoordinates(),
//     'shrine',
//     color,
//     null,
//   );
//   // assert(result.success, `Should have succeeded, but ${result.message}`);
// });
