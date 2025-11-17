import { assertFalse, assertStringIncludes } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import type { GameState } from '../src/GameState.ts';
import { ControllerForHexClicks } from '../src/HexClickHandlers.ts';
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

let engine: QuestsZeusGameEngine;
let handler: ControllerForHexClicks;
let state: GameState;
let center: HexCoordinates;
let player: Player;

function setup(): void {
  engine = new QuestsZeusGameEngine();
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
  assertFailureContains(
    handler.handleHexClick(center, 'shallow', 'red', null),
    'shallow',
  );
});
