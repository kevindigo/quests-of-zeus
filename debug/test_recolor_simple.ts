// Simple test for die recoloring feature

import { QuestsZeusGameEngine } from './src/game-engine.ts';
import type { Player } from './src/types.ts';

function testRecolorSimple() {
  console.log('Simple die recoloring test...\n');

  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer() as Player & {
    recoloredDice?: any;
  };

  // Set up specific test conditions
  player.oracleDice = ['black', 'pink', 'blue'];
  player.favor = 5;

  console.log(`Initial dice: ${player.oracleDice.join(', ')}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Test 1: Set recoloring intention for black die with 1 favor (should become pink when used)
  console.log('Test 1: Set recoloring intention black → pink (1 favor)');
  const result1 = gameEngine.setRecolorIntention(player.id, 'black', 1);
  console.log(`  Result: ${result1 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Dice after intention: ${player.oracleDice.join(', ')}`);
  console.log(`  Favor remaining: ${player.favor} (not spent yet)\n`);

  // Test 2: Set recoloring intention for pink die with 2 favor (should become blue when used)
  console.log('Test 2: Set recoloring intention pink → blue (2 favor)');
  const result2 = gameEngine.setRecolorIntention(player.id, 'pink', 2);
  console.log(`  Result: ${result2 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Dice after intention: ${player.oracleDice.join(', ')}`);
  console.log(`  Favor remaining: ${player.favor} (not spent yet)\n`);

  // Test 3: Set recoloring intention for blue die with 3 favor (should become green when used)
  console.log('Test 3: Set recoloring intention blue → green (3 favor)');
  const result3 = gameEngine.setRecolorIntention(player.id, 'blue', 3);
  console.log(`  Result: ${result3 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Dice after intention: ${player.oracleDice.join(', ')}`);
  console.log(`  Favor remaining: ${player.favor} (not spent yet)\n`);

  // Test 4: Wrap around - set recoloring intention for red die with 1 favor (should become black when used)
  console.log('Test 4: Set recoloring intention red → black (wrap around)');
  player.oracleDice = ['red'];
  player.favor = 1;
  const result4 = gameEngine.setRecolorIntention(player.id, 'red', 1);
  console.log(`  Result: ${result4 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Dice after intention: ${player.oracleDice.join(', ')}`);
  console.log(`  Favor remaining: ${player.favor} (not spent yet)\n`);

  console.log('Simple die recoloring test completed!');
}

// Run the test
testRecolorSimple();
