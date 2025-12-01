import { assert, assertStringIncludes } from '@std/assert';
import { ControllerForBasicActions } from '../src/ControllerForBasicActions.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

let handler: ControllerForBasicActions;

function setup() {
  setupGame();
  handler = new ControllerForBasicActions(testGameState, testUiState);
}

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
