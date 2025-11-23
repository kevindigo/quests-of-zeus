import {
  assert,
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from '@std/assert';
import { ControllerForBasicActions } from '../src/ControllerForBasicActions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import type { Player } from '../src/Player.ts';
import { assertFailureContains } from './test-helpers.ts';

let engine: GameEngine;
let state: GameState;
let currentPlayer: Player;
let handler: ControllerForBasicActions;

function setup() {
  engine = new GameEngine();
  engine.initializeGame();
  state = engine.getGameState();
  currentPlayer = engine.getCurrentPlayer();
  handler = new ControllerForBasicActions(engine);
}

Deno.test('Buy favor - no resource selected', () => {
  setup();
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'select');
});

Deno.test('Buy favor - success with die', () => {
  setup();
  currentPlayer.favor = 0;
  const firstDie = currentPlayer.oracleDice[0];
  assert(firstDie);
  engine.setSelectedDieColor(firstDie);
  const result = handler.spendResourceForFavor();
  assert(result.success);
  assertStringIncludes(result.message, firstDie);
  assertEquals(currentPlayer.favor, 2);
});

Deno.test('Buy favor - success with card', () => {
  setup();
  currentPlayer.favor = 0;
  currentPlayer.oracleCards = ['red'];
  engine.setSelectedOracleCardColor('red');
  assert(engine.getSelectedResource().hasColor());
  assert(engine.getSelectedResource().isCard());
  assertEquals(engine.getSelectedResource().getColor(), 'red');

  const result = handler.spendResourceForFavor();
  assert(result);
  assertStringIncludes(result.message, 'red');
  assertEquals(currentPlayer.favor, 2);
  assertEquals(currentPlayer.oracleCards.length, 0);
  assertFalse(engine.getSelectedResource().hasColor());
  assertFalse(engine.getSelectedResource().hasColor());
  assert(
    currentPlayer.usedOracleCardThisTurn,
    'Should have set the used card flag',
  );
});

Deno.test('Buy favor - wrong phase', () => {
  setup();
  state.setPhase('setup');
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'phase');
});

Deno.test('Buy favor - already used an oracle card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  currentPlayer.usedOracleCardThisTurn = true;
  engine.setSelectedOracleCardColor('blue');
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'card');
});

Deno.test('Buy favor - with card, then with die', () => {
  setup();

  currentPlayer.oracleCards = ['red'];
  engine.setSelectedOracleCardColor('red');
  const spentCard = handler.spendResourceForFavor();
  assert(spentCard.success, spentCard.message);

  currentPlayer.oracleDice = ['red'];
  engine.setSelectedDieColor('red');
  const spentDie = handler.spendResourceForFavor();
  assert(spentDie.success, spentDie.message);
});

Deno.test('Buy favor - with card, then with card', () => {
  setup();

  currentPlayer.oracleCards = ['red'];
  engine.setSelectedOracleCardColor('red');
  const firstTry = handler.spendResourceForFavor();
  assert(firstTry.success, firstTry.message);

  currentPlayer.oracleCards = ['red'];
  engine.setSelectedOracleCardColor('red');
  const secondTry = handler.spendResourceForFavor();
  assertFailureContains(secondTry, 'card');
});

Deno.test('Buy oracle card - no resource selected', () => {
  setup();
  const result = handler.drawOracleCard(null, null);
  assertFailureContains(result, 'select');
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
  assertFailureContains(result, 'phase');
});

Deno.test('Buy oracle card - already used an oracle card', () => {
  setup();
  currentPlayer.oracleCards = ['red'];
  currentPlayer.usedOracleCardThisTurn = true;
  const result = handler.drawOracleCard(null, 'blue');
  assertFailureContains(result, 'card');
});

Deno.test('Recolor - no resource selected', () => {
  setup();
  const result = handler.setRecolorIntention(1, null, null);
  assertFailureContains(result, 'select');
});

Deno.test('Recolor - success clear die recoloring', () => {
  setup();
  const result = handler.setRecolorIntention(0, 'black', null);
  assert(result.success);
  assertStringIncludes(result.message, 'cleared');
});

Deno.test('Recolor - success clear card recoloring', () => {
  setup();
  const result = handler.setRecolorIntention(0, null, 'black');
  assert(result.success);
  assertStringIncludes(result.message, 'cleared');
});

Deno.test('Recolor - success recolor die', () => {
  setup();
  const result = handler.setRecolorIntention(1, 'black', null);
  assert(result.success);
  assertStringIncludes(result.message, 'pink');
});

Deno.test('Recolor - success recolor card', () => {
  setup();
  const result = handler.setRecolorIntention(1, null, 'black');
  assert(result.success);
  assertStringIncludes(result.message, 'pink');
});

Deno.test('Recolor - not enough favor', () => {
  setup();
  const result = handler.setRecolorIntention(
    currentPlayer.favor + 1,
    'red',
    null,
  );
  assertFailureContains(result, 'Failed');
});
