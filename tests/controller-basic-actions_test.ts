import { assert, assertFalse, assertStringIncludes } from '@std/assert';
import { ControllerForBasicActions } from '../src/ControllerForBasicActions.ts';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import type { GameState } from '../src/GameState.ts';
import type { Player } from '../src/Player.ts';
import type { ControllerActionResult } from '../src/types.ts';

let engine: QuestsZeusGameEngine;
let state: GameState;
let currentPlayer: Player;
let handler: ControllerForBasicActions;

function setup() {
  engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  state = engine.getGameState();
  currentPlayer = engine.getCurrentPlayer();
  handler = new ControllerForBasicActions(engine);
}

function assertFailureWithFragment(
  result: ControllerActionResult,
  fragment: string,
): void {
  assertFalse(result.success);
  assertStringIncludes(result.message, fragment);
}

Deno.test('Buy favor - no resource selected', () => {
  setup();
  const result = handler.spendResourceForFavor(null, null);
  assertFailureWithFragment(result, 'select');
});

Deno.test('Buy favor - success with die', () => {
  setup();
  const firstDie = currentPlayer.oracleDice[0];
  assert(firstDie);
  const result = handler.spendResourceForFavor(firstDie, null);
  assert(result);
});

Deno.test('Buy favor - success with card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  const result = handler.spendResourceForFavor(null, 'red');
  assert(result);
});

Deno.test('Buy favor - wrong phase', () => {
  setup();
  state.setPhase('setup');
  const result = handler.spendResourceForFavor('red', null);
  assertFailureWithFragment(result, 'phase');
});

Deno.test('Buy favor - wrong die', () => {
  setup();
  currentPlayer.oracleDice = ['red'];
  const result = handler.spendResourceForFavor('blue', null);
  assertFailureWithFragment(result, 'die');
});

Deno.test('Buy favor - wrong card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  const result = handler.spendResourceForFavor(null, 'blue');
  assertFailureWithFragment(result, 'card');
});
