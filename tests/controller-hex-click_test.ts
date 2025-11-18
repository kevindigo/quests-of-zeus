import { assertFalse, assertStringIncludes } from '@std/assert';
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

// Deno.test('Hex click - shrine not adjacent', () => {
//   setup();
//   const grid = state.map.getHexGrid();
//   const shrineCell = grid.getCellsOfType('shrine')[0];
//   assert(shrineCell);
//   shrineCell.color = 'red';
//   const result = handler.handleHexClick(
//     shrineCell.getCoordinates(),
//     'shrine',
//     shrineCell.color,
//     null,
//   );
//   assertFailureContains(result, 'adjacent');
// });

// Deno.test('Hex click - shrine wrong die color', () => {
//   setup();
//   const grid = state.map.getHexGrid();
//   const shrineCell = grid.getCellsOfType('shrine')[0];
//   assert(shrineCell);
//   const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
//   assert(seaNeighbor);
//   player.setShipPosition(seaNeighbor.getCoordinates());
//   shrineCell.color = 'green';
//   const result = handler.handleHexClick(
//     shrineCell.getCoordinates(),
//     'shrine',
//     'red',
//     null,
//   );
//   assertFailureContains(result, 'adjacent');
// });

// Deno.test('Hex click - shrine wrong card color', () => {
//   setup();
//   const grid = state.map.getHexGrid();
//   const shrineCell = grid.getCellsOfType('shrine')[0];
//   assert(shrineCell);
//   const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
//   assert(seaNeighbor);
//   player.setShipPosition(seaNeighbor.getCoordinates());
//   shrineCell.color = 'green';
//   const result = handler.handleHexClick(
//     shrineCell.getCoordinates(),
//     'shrine',
//     null,
//     'red',
//   );
//   assertFailureContains(result, 'adjacent');
// });

// Deno.test('Hex click - available shrine (die)', () => {
//   setup();
//   const grid = state.map.getHexGrid();
//   const shrineCell = grid.getCellsOfType('shrine')[0];
//   assert(shrineCell);
//   const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
//   assert(seaNeighbor);
//   player.setShipPosition(seaNeighbor.getCoordinates());
//   shrineCell.color = 'red';
//   const result = handler.handleHexClick(
//     shrineCell.getCoordinates(),
//     'shrine',
//     shrineCell.color,
//     null,
//   );
//   assert(result.success);
// });
