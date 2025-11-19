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
import type { Player } from '../src/Player.ts';
import type { ControllerActionResult } from '../src/types.ts';

function assertFailureContains(
  result: ControllerActionResult,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

function assertFailureContainsAll(
  result: ControllerActionResult,
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

function setup(): void {
  engine = new GameEngine();
  engine.initializeGame();
  handler = new ControllerForHexClicks(engine);
  state = engine.getGameState();
  center = HexGrid.CENTER;
  player = state.getCurrentPlayer();
}

Deno.test('Hex click move - no resource selected', () => {
  setup();
  assertFailureContains(
    handler.handleHexClick(center, 'sea'),
    'select a',
  );
});

Deno.test('Hex click move - player does not have that card', () => {
  setup();
  player.oracleCards = ['green'];
  state.setSelectedOracleCardColor('blue');
  assertFailureContainsAll(
    handler.handleHexClick(center, 'sea'),
    ['card', 'blue'],
  );
});

Deno.test('Hex click move - player does not have that die', () => {
  setup();
  player.oracleDice = ['green'];
  state.setSelectedDieColor('blue');
  assertFailureContainsAll(
    handler.handleHexClick(center, 'sea'),
    ['dice', 'blue'],
  );
});

Deno.test('Hex click move - unlisted but otherwise legal', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  state.setSelectedDieColor(firstDie);
  const noFavorMovesJson = JSON.stringify(
    engine.getAvailableMovesForColor(0),
  );
  const upToFiveFavorMoves = engine.getAvailableMovesForColor(5);
  const onlyOneFavorMoves = upToFiveFavorMoves.filter((move) => {
    return !noFavorMovesJson.includes(JSON.stringify(move));
  });
  assertLess(onlyOneFavorMoves.length, upToFiveFavorMoves.length);
  const moveNeedingFavor = onlyOneFavorMoves[0];
  assert(moveNeedingFavor);
  player.favor = 0;
  const coordinates = { q: moveNeedingFavor.q, r: moveNeedingFavor.r };
  assertFailureContains(
    handler.handleHexClick(coordinates, 'sea'),
    'range',
  );
});

Deno.test('Hex click move - legal move but failed', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  state.setSelectedDieColor(firstDie);
  const availableMoves = engine.getAvailableMovesForColor(player.favor);
  const moveNeedingFavor = availableMoves.find((move) => {
    return move.favorCost > 0;
  });
  assert(moveNeedingFavor, JSON.stringify(availableMoves));
  player.favor = 0;
  const result = handler.handleHexClick(
    { q: moveNeedingFavor.q, r: moveNeedingFavor.r },
    'sea',
  );
  assert(!result.success, result.message);
  assertFailureContains(result, 'range');
});

Deno.test('Hex click move - successful', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  state.setSelectedDieColor(firstDie);
  const availableMoves = engine.getAvailableMovesForColor(player.favor);
  const move = availableMoves[0];
  assert(move);
  const result = handler.handleHexClick(
    { q: move.q, r: move.r },
    'sea',
  );
  assert(result.success);
});
