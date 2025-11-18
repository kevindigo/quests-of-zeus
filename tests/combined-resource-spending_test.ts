// Tests for combined die and oracle card spending functionality
// Verifies that users can select either resource type and use it for movement, favor gain, or oracle card drawing

import { assert, assertEquals } from '@std/assert';
import { Controller } from '../src/Controller.ts';
import { GameEngine } from '../src/game-engine-core.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('CombinedResourceSpending - select die for favor gain', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ['blue', 'red', 'green'] as CoreColor[];
  const initialFavor = player.favor;

  // Test that player can select a die and spend it for favor
  const success = engine.spendDieForFavor(player.id, 'blue');

  assert(success, 'Should be able to spend die for favor');

  // Die should be consumed
  assertEquals(
    player.oracleDice.includes('blue'),
    false,
    'Blue die should be consumed',
  );

  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, 'Favor should increase by 2');
});

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

Deno.test('CombinedResourceSpending - select oracle card for favor gain', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ['blue'];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can select an oracle card and spend it for favor
  const success = engine.spendOracleCardForFavor(player.id, 'blue');

  assert(success, 'Should be able to spend oracle card for favor');

  // Oracle card should be consumed
  assertEquals(
    player.oracleCards.includes('blue'),
    false,
    'Blue oracle card should be consumed',
  );

  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, 'Favor should increase by 2');

  // Oracle card usage flag should be set
  assertEquals(
    player.usedOracleCardThisTurn,
    true,
    'Oracle card usage flag should be set',
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

Deno.test('CombinedResourceSpending - favor spending with both resource types', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ['blue', 'red', 'green'] as CoreColor[];
  player.oracleCards = ['pink'];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Spend die for favor
  const dieFavorSuccess = engine.spendDieForFavor(player.id, 'blue');
  assert(dieFavorSuccess, 'Should be able to spend die for favor');
  assertEquals(
    player.favor,
    initialFavor + 2,
    'Favor should increase by 2 from die',
  );

  // Spend oracle card for favor
  const cardFavorSuccess = engine.spendOracleCardForFavor(player.id, 'pink');
  assert(cardFavorSuccess, 'Should be able to spend oracle card for favor');
  assertEquals(
    player.favor,
    initialFavor + 4,
    'Favor should increase by 4 total',
  );
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
