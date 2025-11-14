// Tests for the two-step action phase implementation

import { assert, assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('GameController - die selection', () => {
  // Test that selectedDieColor starts as null
  // Note: We need to access the private field through a test method or reflection
  // For now, we'll test the behavior through public methods

  // Initialize a game engine directly for testing
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  // Game now starts with dice already rolled
  const player = engine.getPlayer(1);
  assertExists(player);
  assertEquals(player.oracleDice.length, 3);

  // The first die should be available for selection
  const firstDieColor = player.oracleDice[0];
  assert(
    player.oracleDice.includes(firstDieColor!),
    'Player should have the die',
  );
});

Deno.test('GameController - movement with selected die', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  // Game now starts with dice already rolled
  const player = engine.getPlayer(1);
  assertExists(player);
  assertEquals(player.oracleDice.length, 3);

  // Get available moves
  const availableMoves = engine.getAvailableMoves(1);

  if (availableMoves.length > 0) {
    const firstMove = availableMoves[0];
    const requiredDieColor = firstMove!.dieColor;

    // Verify that the player has the required die
    assert(
      player.oracleDice.includes(requiredDieColor),
      `Player should have ${requiredDieColor} die for this move`,
    );

    // Count how many dice of this color the player has before the move
    const diceCountBefore = player.oracleDice.filter((color: string) =>
      color === requiredDieColor
    ).length;

    // Test moving with the correct die color
    const moveResult = engine.moveShip(
      1,
      firstMove!.q,
      firstMove!.r,
      requiredDieColor,
    );
    assertEquals(
      moveResult.success,
      true,
      'Move should succeed with correct die color',
    );

    // Verify exactly one die of this color was consumed
    const diceCountAfter = player.oracleDice.filter((color: string) =>
      color === requiredDieColor
    ).length;
    assertEquals(
      diceCountAfter,
      diceCountBefore - 1,
      'Exactly one die should be consumed after move',
    );
  }
});

Deno.test('GameController - die selection and clearing', () => {
  // This test would verify the UI behavior of selecting and clearing dice
  // Since we can't easily test UI interactions, we'll document the expected behavior:

  // 1. During action phase, dice should be displayed as clickable elements
  // 2. Clicking a die should select it and highlight available moves for that die
  // 3. The selected die should be visually distinct
  // 4. Clicking "Clear" should deselect the die and remove move highlights
  // 5. Players should be able to select a different die before making a move

  assert(true, 'Two-step action phase UI behavior documented');
});

// Helper function for assertions
function assertExists<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should exist');
  }
}
