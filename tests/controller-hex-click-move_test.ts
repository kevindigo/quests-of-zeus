import {
  assert,
  assertFalse,
  assertLess,
  assertStringIncludes,
} from '@std/assert';
import { ControllerForHexClicks } from '../src/ControllerForHexClicks.ts';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import { type HexCoordinates, HexGrid } from '../src/hexmap/HexGrid.ts';
import { MovementSystem } from '../src/MovementSystem.ts';
import type { Player } from '../src/Player.ts';
import type { ResultWithMessage } from '../src/ResultWithMessage.ts';
import { ShipMoveHandler } from '../src/ShipMoveHandler.ts';

function assertFailureContains(
  result: ResultWithMessage,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

function assertFailureContainsAll(
  result: ResultWithMessage,
  fragments: string[],
): void {
  fragments.forEach((fragment) => {
    assertFailureContains(result, fragment);
  });
}

let engine: GameEngine;
let handler: ControllerForHexClicks;
let state: GameState;
let center: HexCoordinates;
let player: Player;
let shipMoveHandler: ShipMoveHandler;

function setup(): void {
  engine = new GameEngine();
  engine.initializeGame();
  handler = new ControllerForHexClicks(engine);
  state = engine.getGameState();
  center = HexGrid.CENTER;
  player = state.getCurrentPlayer();
  const uiState = engine.getUiState();
  const movementSystem = new MovementSystem(state.map);
  shipMoveHandler = new ShipMoveHandler(state, uiState, movementSystem);
}

Deno.test('Hex click move - no resource selected', () => {
  setup();
  assertFailureContains(
    handler.handleHexClick(center),
    'select a',
  );
});

Deno.test('Hex click move - player does not have that card', () => {
  setup();
  player.oracleCards = ['green'];
  engine.setSelectedOracleCardColor('blue');
  assertFailureContainsAll(
    handler.handleHexClick(center),
    ['card', 'blue'],
  );
});

Deno.test('Hex click move - player does not have that die', () => {
  setup();
  player.oracleDice = ['green'];
  engine.setSelectedDieColor('blue');
  assertFailureContainsAll(
    handler.handleHexClick(center),
    ['dice', 'blue'],
  );
});

Deno.test('Hex click move - unlisted but otherwise legal', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  engine.setSelectedDieColor(firstDie);
  const noFavorMovesJson = JSON.stringify(
    shipMoveHandler.getAvailableMovesForColor(0),
  );
  const upToFiveFavorMoves = shipMoveHandler.getAvailableMovesForColor(5);
  const onlyOneFavorMoves = upToFiveFavorMoves.filter((move) => {
    return !noFavorMovesJson.includes(JSON.stringify(move));
  });
  assertLess(onlyOneFavorMoves.length, upToFiveFavorMoves.length);
  const moveNeedingFavor = onlyOneFavorMoves[0];
  assert(moveNeedingFavor);
  player.favor = 0;
  const coordinates = { q: moveNeedingFavor.q, r: moveNeedingFavor.r };
  assertFailureContains(
    handler.handleHexClick(coordinates),
    'range',
  );
});

Deno.test('Hex click move - legal move but failed', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  engine.setSelectedDieColor(firstDie);
  const availableMoves = shipMoveHandler.getAvailableMovesForColor(
    player.favor,
  );
  const moveNeedingFavor = availableMoves.find((move) => {
    return move.favorCost > 0;
  });
  assert(moveNeedingFavor, JSON.stringify(availableMoves));
  player.favor = 0;
  const result = handler.handleHexClick(
    { q: moveNeedingFavor.q, r: moveNeedingFavor.r },
  );
  assert(!result.success, result.message);
  assertFailureContains(result, 'range');
});

Deno.test('Hex click move - successful', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  engine.setSelectedDieColor(firstDie);
  const availableMoves = shipMoveHandler.getAvailableMovesForColor(
    player.favor,
  );
  const move = availableMoves[0];
  assert(move);
  const result = handler.handleHexClick(
    { q: move.q, r: move.r },
  );
  assert(result.success);
});
