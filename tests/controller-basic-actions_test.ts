import {
  assert,
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from '@std/assert';
import { ControllerForBasicActions } from '../src/ControllerForBasicActions.ts';
import {
  assertFailureContains,
  setupGame,
  testGameManager,
  testGameState,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

let handler: ControllerForBasicActions;

function setup() {
  setupGame();
  handler = new ControllerForBasicActions(testGameManager);
}

Deno.test('Buy favor - no resource selected', () => {
  setup();
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'select');
});

Deno.test('Buy favor - success with die', () => {
  setup();
  testPlayer.favor = 0;
  const firstDie = testPlayer.oracleDice[0];
  assert(firstDie);
  testGameManager.setSelectedDieColor(firstDie);
  const result = handler.spendResourceForFavor();
  assert(result.success);
  assertStringIncludes(result.message, firstDie);
  assertEquals(testPlayer.favor, 2);
});

Deno.test('Buy favor - success with card', () => {
  setup();
  testPlayer.favor = 0;
  testPlayer.oracleCards = ['red'];
  testGameManager.setSelectedOracleCardColor('red');
  assert(testUiState.getSelectedResource().hasColor());
  assert(testUiState.getSelectedResource().isCard());
  assertEquals(testUiState.getSelectedResource().getColor(), 'red');

  const result = handler.spendResourceForFavor();
  assert(result);
  assertStringIncludes(result.message, 'red');
  assertEquals(testPlayer.favor, 2);
  assertEquals(testPlayer.oracleCards.length, 0);
  assertFalse(testUiState.getSelectedResource().hasColor());
  assertFalse(testUiState.getSelectedResource().hasColor());
  assert(
    testPlayer.usedOracleCardThisTurn,
    'Should have set the used card flag',
  );
});

Deno.test('Buy favor - wrong phase', () => {
  setup();
  testGameState.setPhase('setup');
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'phase');
});

Deno.test('Buy favor - already used an oracle card', () => {
  setup();
  testPlayer.oracleCards = ['red'];
  testPlayer.usedOracleCardThisTurn = true;
  testGameManager.setSelectedOracleCardColor('blue');
  const result = handler.spendResourceForFavor();
  assertFailureContains(result, 'card');
});

Deno.test('Buy favor - with card, then with die', () => {
  setup();

  testPlayer.oracleCards = ['red'];
  testGameManager.setSelectedOracleCardColor('red');
  const spentCard = handler.spendResourceForFavor();
  assert(spentCard.success, spentCard.message);

  testPlayer.oracleDice = ['red'];
  testGameManager.setSelectedDieColor('red');
  const spentDie = handler.spendResourceForFavor();
  assert(spentDie.success, spentDie.message);
});

Deno.test('Buy favor - with card, then with card', () => {
  setup();

  testPlayer.oracleCards = ['red'];
  testGameManager.setSelectedOracleCardColor('red');
  const firstTry = handler.spendResourceForFavor();
  assert(firstTry.success, firstTry.message);

  testPlayer.oracleCards = ['red'];
  testGameManager.setSelectedOracleCardColor('red');
  const secondTry = handler.spendResourceForFavor();
  assertFailureContains(secondTry, 'card');
});

Deno.test('Buy oracle card - no resource selected', () => {
  setup();
  const result = handler.drawOracleCard();
  assertFailureContains(result, 'select');
});

Deno.test('Buy oracle card - success with die', () => {
  setup();
  const firstDie = testPlayer.oracleDice[0];
  assert(firstDie);
  testUiState.setSelectedDieColor(firstDie);
  const result = handler.drawOracleCard();
  assert(result, result.message);
  assertStringIncludes(result.message, firstDie);
  assertEquals(testPlayer.oracleCards.length, 1);
});

Deno.test('Buy oracle card - success with card', () => {
  setup();
  testPlayer.oracleCards = ['red'];
  testUiState.setSelectedOracleCardColor('red');
  const result = handler.drawOracleCard();
  assert(result, result.message);
  assertStringIncludes(result.message, 'red');
  assertEquals(testPlayer.oracleCards.length, 1);
});

Deno.test('Buy oracle card - wrong phase', () => {
  setup();
  testGameState.setPhase('setup');
  testUiState.setSelectedDieColor('red');
  const result = handler.drawOracleCard();
  assertFailureContains(result, 'phase');
});

Deno.test('Buy oracle card - already used an oracle card', () => {
  setup();
  testPlayer.oracleCards = ['red'];
  testPlayer.usedOracleCardThisTurn = true;
  testUiState.setSelectedOracleCardColor('red');
  const result = handler.drawOracleCard();
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
    testPlayer.favor + 1,
    'red',
    null,
  );
  assertFailureContains(result, 'more favor');
});
