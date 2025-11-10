// Simple test to debug oracle card movement
import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Simple oracle card test", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  
  // Give player an oracle card
  player.oracleCards = ["blue"];
  player.favor = 5;
  player.usedOracleCardThisTurn = false;

  console.log("Player has oracle cards:", player.oracleCards);
  console.log("Player favor:", player.favor);
  console.log("Player used oracle card this turn:", player.usedOracleCardThisTurn);

  // Try to use oracle card for favor (simpler test)
  const favorResult = engine.spendOracleCardForFavor(player.id, "blue");
  console.log("Favor result:", favorResult);
  console.log("Player oracle cards after favor:", player.oracleCards);
  console.log("Player favor after favor:", player.favor);
  console.log("Player used oracle card this turn after favor:", player.usedOracleCardThisTurn);

  assert(favorResult, "Should be able to spend oracle card for favor");
});