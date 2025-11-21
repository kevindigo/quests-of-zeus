import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
  assertStringIncludes,
} from '@std/assert';
import { ControllerForHexClicks } from '../src/ControllerForHexClicks.ts';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import { type HexCoordinates, HexGrid } from '../src/hexmap/HexGrid.ts';
import type { Player } from '../src/Player.ts';
import type { ResultWithMessage } from '../src/ResultWithMessage.ts';

function assertFailureContains(
  result: ResultWithMessage,
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
    handler.handleHexClick(center, 'sea'),
    'phase',
  );
});

Deno.test('Hex click - second oracle card', () => {
  setup();

  player.usedOracleCardThisTurn = true;
  state.setSelectedOracleCardColor('red');
  assertFailureContains(
    handler.handleHexClick(center, 'sea'),
    'per turn',
  );
});

Deno.test('Hex click - unsupported terrain', () => {
  setup();
  player.oracleDice = ['red'];
  state.setSelectedDieColor('red');
  assertFailureContains(
    handler.handleHexClick(center, 'shallow'),
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
  state.setSelectedDieColor(shrineCell.color);
  const result = handler.handleHexClick(
    shrineCell.getCoordinates(),
    'shrine',
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - next to good color, but click elsewhere', () => {
  setup();
  const grid = state.map.getHexGrid();
  const shrineCells = grid.getCellsOfType('shrine');
  const adjacentShrineCell = shrineCells[0];
  assert(adjacentShrineCell);
  const adjacentColor = adjacentShrineCell.color;
  if (adjacentColor === 'none') {
    throw new Error('Impossible: a shrine had no color');
  }
  assertNotEquals(adjacentColor, 'none');
  const otherShrineCell = shrineCells[1];
  assert(otherShrineCell);
  const seaNeighbor = grid.getNeighborsOfType(adjacentShrineCell, 'sea')[0];
  assert(seaNeighbor);
  player.setShipPosition(seaNeighbor.getCoordinates());
  player.oracleDice = [adjacentColor, 'green'];
  state.setSelectedDieColor(adjacentColor);
  const result = handler.handleHexClick(
    otherShrineCell.getCoordinates(),
    'shrine',
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
  state.setSelectedDieColor('green');
  const result = handler.handleHexClick(
    shrineCell.getCoordinates(),
    'shrine',
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - available my hidden shrine (die)', () => {
  setup();
  const color = player.oracleDice[0]!;
  const grid = state.map.getHexGrid();
  const shrineCells = grid.getCellsOfType('shrine');
  const shrineCell = shrineCells.find((cell) => {
    return cell.color === color;
  });
  assert(shrineCell);

  const seaNeighbor = grid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(seaNeighbor);
  player.setShipPosition(seaNeighbor.getCoordinates());

  const shrineHex = state.getShrineHexes().find((hex) => {
    return hex.q === shrineCell.q && hex.r === shrineCell.r;
  });
  assert(shrineHex);
  shrineHex.owner = player.color;

  state.setSelectedDieColor(color);
  const result = handler.handleHexClick(
    shrineCell.getCoordinates(),
    'shrine',
  );
  assert(result.success, `Should have succeeded, but ${result.message}`);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(state.getEffectiveSelectedColor(), null);
  assertEquals(state.getSelectedRecoloring(), 0);
});
