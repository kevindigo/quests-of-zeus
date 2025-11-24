import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { ControllerForBasicActions } from '../src/ControllerForBasicActions.ts';
import {
  assertFailureContains,
  setupGame,
  testGameManager,
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
  assertFailureContains(result, 'available');
});

Deno.test('Buy favor - success with die', () => {
  setup();
  testPlayer.favor = 0;
  const firstDie = testPlayer.oracleDice[0];
  assert(firstDie);
  testUiState.setSelectedDieColor(firstDie);
  const result = handler.spendResourceForFavor();
  assert(result.success);
  assertStringIncludes(result.message, firstDie);
  assertEquals(testPlayer.favor, 2);
});

Deno.test('Buy oracle card - no resource selected', () => {
  setup();
  const result = handler.drawOracleCard();
  assertFailureContains(result, 'available');
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
