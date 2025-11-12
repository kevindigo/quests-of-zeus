// Test script to verify favor-based move highlighting
// Run this script to check if favor-based moves are being properly calculated and highlighted

import { QuestsZeusGameEngine } from '../src/game-engine.ts';

console.log('=== Testing Favor-Based Move Highlighting ===\n');

// Initialize the game
const gameEngine = new QuestsZeusGameEngine();
const gameState = gameEngine.initializeGame();

// Get the first player
const player = gameEngine.getCurrentPlayer();
console.log(`Current player: ${player.name} (ID: ${player.id})`);
console.log(
  `Player position: (${player.shipPosition.q}, ${player.shipPosition.r})`,
);
console.log(`Player favor: ${player.favor}`);
console.log(`Player dice: ${player.oracleDice.join(', ')}`);

// Test each die color
for (const dieColor of player.oracleDice) {
  console.log(`\n--- Testing moves for ${dieColor} die ---`);

  // Get available moves with current favor
  const availableMoves = gameEngine.getAvailableMovesForDie(
    player.id,
    dieColor,
    player.favor,
  );

  console.log(`Total available moves: ${availableMoves.length}`);

  // Count moves by favor cost
  const movesByFavorCost: Record<number, number> = {};
  availableMoves.forEach((move) => {
    movesByFavorCost[move.favorCost] = (movesByFavorCost[move.favorCost] || 0) +
      1;
  });

  console.log('Moves by favor cost:');
  Object.entries(movesByFavorCost).forEach(([cost, count]) => {
    console.log(`  ${cost} favor: ${count} moves`);
  });

  // Show some example moves
  if (availableMoves.length > 0) {
    console.log('Example moves:');
    availableMoves.slice(0, 5).forEach((move) => {
      console.log(`  (${move.q}, ${move.r}) - cost: ${move.favorCost} favor`);
    });

    if (availableMoves.length > 5) {
      console.log(`  ... and ${availableMoves.length - 5} more moves`);
    }
  } else {
    console.log('  No moves available for this die color');
  }
}

// Test with different favor amounts
console.log('\n--- Testing with different favor amounts ---');
const testDieColor = player.oracleDice[0]; // Use first die for testing

for (let favor = 0; favor <= 5; favor++) {
  const moves = gameEngine.getAvailableMovesForDie(
    player.id,
    testDieColor,
    favor,
  );
  const movesWithFavor = moves.filter((move) => move.favorCost > 0);

  console.log(
    `With ${favor} favor: ${moves.length} total moves, ${movesWithFavor.length} require favor`,
  );
}

console.log('\n=== Favor Highlighting Test Complete ===');
