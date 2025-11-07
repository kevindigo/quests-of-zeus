// Quick debug script to verify favor system is working

import { OracleGameEngine } from "../src/game-engine.ts";

const engine = new OracleGameEngine();
const state = engine.initializeGame();

// Verify the progression pattern
const players = state.players;
let allCorrect = true;
for (let i = 1; i < players.length; i++) {
  if (players[i].favor !== players[i - 1].favor + 1) {
    allCorrect = false;
    console.log(`❌ Error: Player ${i + 1} should have ${players[i - 1].favor + 1} favor but has ${players[i].favor}`);
  }
}