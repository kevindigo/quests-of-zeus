// Test script to verify the movement fix
// This tests that ships cannot move to hexes that are within 3 hexes straight-line distance
// but require more than 3 sea steps due to land obstacles

import { QuestsZeusGameEngine } from '../src/game-engine.ts';
import type { HexColor } from '../src/hexmap.ts';

console.log('=== Testing Movement Fix for Land Obstacles ===\n');

const engine = new QuestsZeusGameEngine();
engine.initializeGame();

const gameState = engine.getGameState();
const player = engine.getCurrentPlayer();

console.log('Initial ship position:', player.shipPosition);

// Check what terrain the ship starts on
const startCell = gameState.map.getCell(
  player.shipPosition.q,
  player.shipPosition.r,
);
console.log('Starting terrain:', startCell?.terrain);

// Roll dice to enter action phase
const dice = engine.rollOracleDice(player.id);
console.log('\nRolled dice:', dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log('\nAvailable moves:', availableMoves.length);

// Test reachability logic directly
console.log('\n=== Testing Reachability Logic ===');
const reachableTiles = (engine as QuestsZeusGameEngine & {
  getReachableSeaTiles: (
    q: number,
    r: number,
    maxSteps: number,
  ) => { q: number; r: number; color: HexColor }[];
}).getReachableSeaTiles(
  player.shipPosition.q,
  player.shipPosition.r,
  3,
);
console.log('Reachable sea tiles:', reachableTiles.length);

// Test a specific scenario: try to find hexes that are within 3 hexes straight-line distance
// but not reachable due to land obstacles
console.log('\n=== Testing Land Obstacle Detection ===');

// Get all sea tiles on the map
const allSeaTiles = gameState.map.getCellsByTerrain('sea');
console.log('Total sea tiles on map:', allSeaTiles.length);

// Find sea tiles that are within 3 hexes straight-line distance but not reachable
const unreachableWithinRange: {
  q: number;
  r: number;
  color: HexColor;
  straightLineDistance: number;
}[] = [];

for (const seaTile of allSeaTiles) {
  const straightLineDistance = (engine as QuestsZeusGameEngine & {
    hexDistance: (q1: number, r1: number, q2: number, r2: number) => number;
  }).hexDistance(
    player.shipPosition.q,
    player.shipPosition.r,
    seaTile.q,
    seaTile.r,
  );

  if (straightLineDistance <= 3) {
    const isReachable = reachableTiles.some((tile) =>
      tile.q === seaTile.q && tile.r === seaTile.r
    );

    if (!isReachable) {
      unreachableWithinRange.push({
        q: seaTile.q,
        r: seaTile.r,
        color: seaTile.color,
        straightLineDistance,
      });
    }
  }
}

console.log(
  '\nSea tiles within 3 hexes straight-line distance but NOT reachable due to land obstacles:',
  unreachableWithinRange.length,
);

if (unreachableWithinRange.length > 0) {
  console.log('\nExamples of unreachable tiles within range:');
  unreachableWithinRange.slice(0, 5).forEach((tile, index) => {
    console.log(
      `  Tile ${
        index + 1
      }: (${tile.q}, ${tile.r}) color ${tile.color}, straight-line distance: ${tile.straightLineDistance}`,
    );
  });

  // Try to move to one of these unreachable tiles to verify the fix
  const testTile = unreachableWithinRange[0];
  console.log(`\n=== Testing Movement to Unreachable Tile ===`);
  console.log(
    `Attempting to move to (${testTile.q}, ${testTile.r}) with ${testTile.color} die...`,
  );

  // Check if player has the required die color
  if (player.oracleDice.includes(testTile.color)) {
    const moveResult = engine.moveShip(
      player.id,
      testTile.q,
      testTile.r,
      testTile.color,
    );
    console.log('Move successful:', moveResult.success);
    console.log('Expected: false (should be blocked by land obstacles)');

    if (!moveResult.success) {
      console.log('✓ SUCCESS: Movement correctly blocked by land obstacles!');
      if (moveResult.error) {
        console.log('Error details:', moveResult.error);
      }
    } else {
      console.log('✗ FAILURE: Movement allowed despite land obstacles!');
    }
  } else {
    console.log(`Cannot test - player doesn't have ${testTile.color} die`);
  }
} else {
  console.log(
    '\nNo unreachable tiles found within range - this map might not have land obstacles blocking sea paths',
  );
}
