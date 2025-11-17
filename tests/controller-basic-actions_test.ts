import {
  assert,
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from '@std/assert';
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
  currentPlayer.favor = 0;
  const firstDie = currentPlayer.oracleDice[0];
  assert(firstDie);
  const result = handler.spendResourceForFavor(firstDie, null);
  assert(result);
  assertStringIncludes(result.message, firstDie);
  assertEquals(currentPlayer.favor, 2);
});

Deno.test('Buy favor - success with card', () => {
  setup();
  currentPlayer.favor = 0;
  currentPlayer.oracleCards = ['red'];
  const result = handler.spendResourceForFavor(null, 'red');
  assert(result);
  assertStringIncludes(result.message, 'red');
  assertEquals(currentPlayer.favor, 2);
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

Deno.test('Buy favor - already used an oracle card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  currentPlayer.usedOracleCardThisTurn = true;
  const result = handler.spendResourceForFavor(null, 'blue');
  assertFailureWithFragment(result, 'card');
});

Deno.test('Buy oracle card - no resource selected', () => {
  setup();
  const result = handler.drawOracleCard(null, null);
  assertFailureWithFragment(result, 'select');
});

Deno.test('Buy oracle card - success with die', () => {
  setup();
  const firstDie = currentPlayer.oracleDice[0];
  assert(firstDie);
  const result = handler.drawOracleCard(firstDie, null);
  assert(result);
  assertStringIncludes(result.message, firstDie);
  assertEquals(currentPlayer.oracleCards.length, 1);
});

Deno.test('Buy oracle card - success with card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  const result = handler.drawOracleCard(null, 'red');
  assert(result);
  assertStringIncludes(result.message, 'red');
  assertEquals(currentPlayer.oracleCards.length, 1);
});

Deno.test('Buy oracle card - wrong phase', () => {
  setup();
  state.setPhase('setup');
  const result = handler.drawOracleCard('red', null);
  assertFailureWithFragment(result, 'phase');
});

Deno.test('Buy oracle card - wrong die', () => {
  setup();
  currentPlayer.oracleDice = ['red'];
  const result = handler.drawOracleCard('blue', null);
  assertFailureWithFragment(result, 'die');
});

Deno.test('Buy oracle card - wrong card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  const result = handler.drawOracleCard(null, 'blue');
  assertFailureWithFragment(result, 'card');
});

Deno.test('Buy oracle card - already used an oracle card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  currentPlayer.usedOracleCardThisTurn = true;
  const result = handler.drawOracleCard(null, 'blue');
  assertFailureWithFragment(result, 'card');
});
