import {
  assert,
  assertFalse,
  assertLess,
  assertStringIncludes,
} from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import type { GameState } from '../src/GameState.ts';
import {
  HexClickHandlers,
  type HexClickResult,
} from '../src/HexClickHandlers.ts';
import { type HexCoordinates, HexGrid } from '../src/hexmap/HexGrid.ts';
import type { Player } from '../src/Player.ts';

function assertFailureContains(result: HexClickResult, fragment: string): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

function assertFailureContainsAll(
  result: HexClickResult,
  fragments: string[],
): void {
  fragments.forEach((fragment) => {
    assertFailureContains(result, fragment);
  });
}

let engine: QuestsZeusGameEngine;
let handler: HexClickHandlers;
let state: GameState;
let center: HexCoordinates;
let player: Player;

function setup(): void {
  engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  handler = new HexClickHandlers(engine);
  state = engine.getGameState();
  center = HexGrid.CENTER;
  player = state.getCurrentPlayer();
}

Deno.test('Hex click move - no resource selected', () => {
  setup();
  assertFailureContains(
    handler.handleHexClick(center, 'sea', null, null),
    'select a',
  );
});

Deno.test('Hex click move - player does not have that card', () => {
  setup();
  player.oracleCards = ['green'];
  assertFailureContainsAll(
    handler.handleHexClick(center, 'sea', null, 'blue'),
    ['card', 'blue'],
  );
});

Deno.test('Hex click move - player does not have that die', () => {
  setup();
  player.oracleDice = ['green'];
  assertFailureContainsAll(
    handler.handleHexClick(center, 'sea', 'blue', null),
    ['dice', 'blue'],
  );
});

Deno.test('Hex click move - unlisted but otherwise legal', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  const noFavorMovesJson = JSON.stringify(
    engine.getAvailableMovesForColor(player, firstDie, 0),
  );
  const upToFiveFavorMoves = engine.getAvailableMovesForColor(
    player,
    firstDie,
    5,
  );
  const onlyOneFavorMoves = upToFiveFavorMoves.filter((move) => {
    return !noFavorMovesJson.includes(JSON.stringify(move));
  });
  assertLess(onlyOneFavorMoves.length, upToFiveFavorMoves.length);
  const moveNeedingFavor = onlyOneFavorMoves[0];
  assert(moveNeedingFavor);
  player.favor = 0;
  const coordinates = { q: moveNeedingFavor.q, r: moveNeedingFavor.r };
  assertFailureContains(
    handler.handleHexClick(coordinates, 'sea', firstDie, null),
    'range',
  );
});

Deno.test('Hex click move - legal move but failed', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  const availableMoves = engine.getAvailableMovesForColor(
    player,
    firstDie,
    player.favor,
  );
  const moveNeedingFavor = availableMoves.find((move) => {
    return move.favorCost > 0;
  });
  assert(moveNeedingFavor);
  player.favor = 0;
  const result = handler.handleHexClick(
    { q: moveNeedingFavor.q, r: moveNeedingFavor.r },
    'sea',
    firstDie,
    null,
  );
  assertFailureContains(result, 'range');
});

Deno.test('Hex click move - successful', () => {
  setup();
  const firstDie = player.oracleDice[0];
  assert(firstDie);
  const availableMoves = engine.getAvailableMovesForColor(
    player,
    firstDie,
    player.favor,
  );
  const move = availableMoves[0];
  assert(move);
  const result = handler.handleHexClick(
    { q: move.q, r: move.r },
    'sea',
    firstDie,
    null,
  );
  assert(result.success);
});
