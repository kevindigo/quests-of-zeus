#!/usr/bin/env -S deno run --allow-read

import { QuestsZeusGameEngine } from '../src/game-engine.ts';

function debugMovement() {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  console.log('Initial player dice:', player.oracleDice);
  console.log('Initial player position:', player.shipPosition);

  // Get available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  console.log('Available moves:', availableMoves.length);

  if (availableMoves.length > 0) {
    const firstMove = availableMoves[0];
    console.log('First move:', firstMove);

    const initialDiceCount = player.oracleDice.length;
    console.log('Dice before movement:', player.oracleDice);

    // Move to the target hex
    const moveResult = engine.moveShip(
      player.id,
      firstMove!.q,
      firstMove!.r,
      firstMove!.dieColor,
    );

    console.log('Move result:', moveResult);
    console.log('Dice after movement:', player.oracleDice);
    console.log('Dice count after movement:', player.oracleDice.length);
    console.log('Expected dice count:', initialDiceCount - 1);

    if (moveResult.success) {
      console.log('SUCCESS: Movement worked');
    } else {
      console.log('FAILED: Movement failed with error:', moveResult.error);
    }
  } else {
    console.log('No available moves found!');
  }
}

// Run the debug test
if (import.meta.main) {
  debugMovement();
}
