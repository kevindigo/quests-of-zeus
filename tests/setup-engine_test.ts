import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('GameEngine setup - initialization', () => {
  const engine = new GameEngine();

  // Game should not be initialized by default
  assertEquals(engine.isGameInitialized(), false);

  // Initialize the game
  engine.initializeGame();
  const state = engine.getGameState();

  assert(state.map);
  assertEquals(state.players.length, 2);
  assertEquals(state.getRound(), 1);
  assertEquals(state.getPhase(), 'action'); // Game starts in action phase since dice are already rolled

  // All players should start with dice already rolled
  state.players.forEach((player) => {
    assertEquals(
      player.oracleDice.length,
      3,
      'Each player should start with 3 dice',
    );
  });

  // Now game should be initialized
  assertEquals(engine.isGameInitialized(), true);
});

Deno.test('GameEngine setup - player creation', () => {
  const engine = new GameEngine();

  // Should throw error when game is not initialized
  try {
    engine.getPlayer(0);
    assert(false, 'Should have thrown error');
  } catch (error: unknown) {
    assertEquals(
      (error as Error).message,
      'Game not initialized. Call initializeGame() first.',
    );
  }

  // Initialize the game
  engine.initializeGame();
  const player1 = engine.getPlayer(0);
  const player2 = engine.getPlayer(1);

  assert(player1);
  assert(player2);
  assertEquals(player1?.name, 'Player 1');
  assertEquals(player2?.name, 'Player 2');

  // All players should start on the same position (Zeus hex)
  assertEquals(player1?.getShipPosition(), player2?.getShipPosition());

  // Check that players start with 0 shield
  assertEquals(player1?.shield, 0, 'Player 1 should start with 0 shield');
  assertEquals(player2?.shield, 0, 'Player 2 should start with 0 shield');
});

Deno.test('GameEngine setup - roll dice during setup', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getPlayer(0);
  assert(player);
  assertEquals(player?.oracleDice.length, 3);
});

Deno.test('GameEngine setup - initialize shield', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(0);
  const player2 = engine.getPlayer(1);

  assert(player1);
  assert(player2);

  assertEquals(player1.shield, 0, 'Player 1 shield should be 0');
  assertEquals(player2.shield, 0, 'Player 2 shield should be 0');

  const gameState = engine.getGameState();
  const serializedPlayer1 = gameState.players.find((p) => p.id === player1.id);
  const serializedPlayer2 = gameState.players.find((p) => p.id === player2.id);

  assert(serializedPlayer1);
  assert(serializedPlayer2);
  assertEquals(
    serializedPlayer1.shield,
    0,
    'Player 1 shield should be 0 in serialized state',
  );
  assertEquals(
    serializedPlayer2.shield,
    0,
    'Player 2 shield should be 0 in serialized state',
  );
});

Deno.test('GameEngine - all players start on Zeus hex', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  // Get all players
  const player1 = engine.getPlayer(0);
  const player2 = engine.getPlayer(1);

  assert(player1);
  assert(player2);

  // Find the Zeus hex in the map
  const state = engine.getGameState();
  const zeusCells = state.map.getCellsByTerrain('zeus');
  assertEquals(zeusCells.length, 1, 'There should be exactly one Zeus hex');

  const zeusCell = zeusCells[0]!;
  const zeusPosition = { q: zeusCell.q, r: zeusCell.r };

  // Verify all players start on the Zeus hex
  assertEquals(
    player1.getShipPosition(),
    zeusPosition,
    'Player 1 should start on Zeus hex',
  );
  assertEquals(
    player2.getShipPosition(),
    zeusPosition,
    'Player 2 should start on Zeus hex',
  );

  // Verify all players start on the same position
  assertEquals(
    player1.getShipPosition(),
    player2.getShipPosition(),
    'All players should start on the same position',
  );

  // Verify the starting position is actually a Zeus hex
  const player1Cell = state.map.getCell(
    player1.getShipPosition(),
  );
  assert(player1Cell);
  assertEquals(player1Cell.terrain, 'zeus', 'Player 1 should be on a Zeus hex');

  const player2Cell = state.map.getCell(
    player2.getShipPosition(),
  );
  assert(player2Cell);
  assertEquals(player2Cell.terrain, 'zeus', 'Player 2 should be on a Zeus hex');
});

Deno.test('GameEngine - initializes oracle card deck', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  assertEquals(engine.getGameState().getOracleCardDeck().length, 30);
});

Deno.test('GameEngine - starting a new game resets the oracle card deck', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const player = engine.getCurrentPlayer();
  player.oracleDice = ['red'];
  const uiState = engine.getUiState();
  uiState.setSelectedDieColor('red');
  assert(engine.drawOracleCard(player.id, 'red'));
  assertEquals(engine.getGameState().getOracleCardDeck().length, 29);
  engine.initializeGame();
  assertEquals(engine.getGameState().getOracleCardDeck().length, 30);
});
