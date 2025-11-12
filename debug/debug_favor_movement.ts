// Debug script to test favor spending for movement range extension

import { QuestsZeusGameEngine } from '../src/game-engine.ts';

console.log('Testing favor spending for movement range extension...\n');

// Initialize game
const engine = new QuestsZeusGameEngine();
const _gameState = engine.initializeGame();

// Get first player
const player1 = engine.getPlayer(1)!;
console.log('Player 1 initial state:');
console.log('  Position:', player1.shipPosition);
console.log('  Favor:', player1.favor);

// Roll dice to get to action phase
const dice = engine.rollOracleDice(1);
console.log('\nRolled dice:', dice);

// Test available moves without favor
console.log('\nAvailable moves without spending favor:');
const movesWithoutFavor = engine.getAvailableMoves(1);
console.log('  Count:', movesWithoutFavor.length);
movesWithoutFavor.slice(0, 5).forEach((move, index) => {
  console.log(
    `  ${index + 1}. (${move.q}, ${move.r}) with ${move.dieColor} die`,
  );
});

// Test available moves with favor spending for each die color
console.log('\nAvailable moves with favor spending by die color:');

for (const dieColor of player1.oracleDice) {
  console.log(`\n  Moves for ${dieColor} die:`);
  const movesWithFavor = engine.getAvailableMovesForDie(
    1,
    dieColor,
    player1.favor,
  );
  console.log('    Count:', movesWithFavor.length);

  // Group moves by favor cost
  const movesByFavorCost = new Map<number, typeof movesWithFavor>();
  movesWithFavor.forEach((move) => {
    if (!movesByFavorCost.has(move.favorCost)) {
      movesByFavorCost.set(move.favorCost, []);
    }
    movesByFavorCost.get(move.favorCost)!.push(move);
  });

  movesByFavorCost.forEach((moves, favorCost) => {
    console.log(
      `\n    Moves costing ${favorCost} favor (${moves.length} total):`,
    );
    moves.slice(0, 3).forEach((move, index) => {
      console.log(
        `      ${index + 1}. (${move.q}, ${move.r})`,
      );
    });
    if (moves.length > 3) {
      console.log(`      ... and ${moves.length - 3} more`);
    }
  });
}

// Test moving with favor spending
for (const dieColor of player1.oracleDice) {
  const movesWithFavor = engine.getAvailableMovesForDie(
    1,
    dieColor,
    player1.favor,
  );
  const moveWithFavor = movesWithFavor.find((move) => move.favorCost > 0);

  if (moveWithFavor) {
    console.log('\nTesting movement with favor spending:');
    console.log(
      `  Attempting to move to (${moveWithFavor.q}, ${moveWithFavor.r}) with ${dieColor} die`,
    );
    console.log(`  This move requires ${moveWithFavor.favorCost} favor`);

    const moveResult = engine.moveShip(
      1,
      moveWithFavor.q,
      moveWithFavor.r,
      dieColor,
      moveWithFavor.favorCost,
    );

    console.log('  Move result:', moveResult.success ? 'SUCCESS' : 'FAILED');

    if (moveResult.success) {
      const updatedPlayer = engine.getPlayer(1)!;
      console.log('  New position:', updatedPlayer.shipPosition);
      console.log('  Remaining favor:', updatedPlayer.favor);
    } else if (moveResult.error) {
      console.log('  Error details:', moveResult.error);
    }
    break; // Only test one move
  }
}

console.log('\nFavor movement feature test completed!');
