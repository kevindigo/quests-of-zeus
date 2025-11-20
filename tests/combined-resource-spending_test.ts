// Tests for combined die and oracle card spending functionality
// Verifies that users can select either resource type and use it for movement, favor gain, or oracle card drawing

import { assert, assertEquals } from '@std/assert';
import { Controller } from '../src/Controller.ts';
import { GameEngine } from '../src/GameEngine.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('CombinedResourceSpending - select die to draw oracle card', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ['blue', 'red', 'green'] as CoreColor[];
  const initialCardCount = player.oracleCards.length;

  // Test that player can select a die and spend it to draw an oracle card
  const success = engine.drawOracleCard(player.id, 'blue');

  assert(success, 'Should be able to spend die to draw oracle card');

  // Die should be consumed
  assertEquals(
    player.oracleDice.includes('blue'),
    false,
    'Blue die should be consumed',
  );

  // Oracle card count should increase by 1
  assertEquals(
    player.oracleCards.length,
    initialCardCount + 1,
    'Oracle card count should increase by 1',
  );
});

Deno.test('CombinedResourceSpending - resource selection clears when switching types', () => {
  const engine = new GameEngine();
  const controller = new Controller(engine);
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);
  player.oracleDice = ['red', 'black'];
  player.oracleCards = ['blue'];

  controller.clearResourceSelection();
  assertEquals(controller.getSelectedDieColor(), null);
  assertEquals(controller.getSelectedCardColor(), null);

  assert(controller.selectDieColor('red'));
  assertEquals(
    controller.getSelectedDieColor(),
    'red',
    'Expected die to be selected',
  );
  assertEquals(
    controller.getSelectedCardColor(),
    null,
    'Expected card to be cleared',
  );

  assert(controller.selectCardColor('blue'));
  assertEquals(
    controller.getSelectedDieColor(),
    null,
    'Expected die to be cleared',
  );
  assertEquals(
    controller.getSelectedCardColor(),
    'blue',
    'Expected card to be selected',
  );

  assert(controller.selectDieColor('red'));
  assertEquals(
    controller.getSelectedDieColor(),
    'red',
    'Expected die to be selected again',
  );
  assertEquals(
    controller.getSelectedCardColor(),
    null,
    'Expected card to be cleared again',
  );
});

function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
