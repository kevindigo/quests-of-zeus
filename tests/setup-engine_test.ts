import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { GameManager } from '../src/GameManager.ts';

Deno.test('GameEngine setup - initialization', () => {
  const engine = new GameManager();

  // Initialize the game
  const state = engine.getGameState();

  assert(state.getMap());
  assertEquals(state.getPlayerCount(), 2);
  assertEquals(state.getRound(), 1);
  assertEquals(state.getPhase(), 'action'); // Game starts in action phase since dice are already rolled

  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(
      player.oracleDice.length,
      3,
      'Each player should start with 3 dice',
    );
  }
});

Deno.test('GameEngine setup - player creation', () => {
  const engine = new GameManager();

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
  const engine = new GameManager();

  const player = engine.getPlayer(0);
  assert(player);
  assertEquals(player?.oracleDice.length, 3);
});

Deno.test('GameEngine setup - initialize shield', () => {
  const engine = new GameManager();

  const player1 = engine.getPlayer(0);
  const player2 = engine.getPlayer(1);

  assert(player1);
  assert(player2);

  assertEquals(player1.shield, 0, 'Player 1 shield should be 0');
  assertEquals(player2.shield, 0, 'Player 2 shield should be 0');

  const gameState = engine.getGameState();
  const serializedPlayer1 = gameState.getPlayer(player1.id);
  const serializedPlayer2 = gameState.getPlayer(player2.id);

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
  const engine = new GameManager();

  // Get all players
  const player1 = engine.getPlayer(0);
  const player2 = engine.getPlayer(1);

  assert(player1);
  assert(player2);

  // Find the Zeus hex in the map
  const state = engine.getGameState();
  const zeusCells = state.getMap().getCellsByTerrain('zeus');
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
  const player1Cell = state.getMap().getCell(
    player1.getShipPosition(),
  );
  assert(player1Cell);
  assertEquals(player1Cell.terrain, 'zeus', 'Player 1 should be on a Zeus hex');

  const player2Cell = state.getMap().getCell(
    player2.getShipPosition(),
  );
  assert(player2Cell);
  assertEquals(player2Cell.terrain, 'zeus', 'Player 2 should be on a Zeus hex');
});

Deno.test('GameEngine - initializes oracle card deck', () => {
  const engine = new GameManager();
  assertEquals(engine.getGameState().getOracleCardDeck().length, 30);
});

Deno.test('GameEngine - starting a new game resets the oracle card deck', () => {
  const engine = new GameManager();
  const player = engine.getCurrentPlayer();
  player.oracleDice = ['red'];
  const uiState = engine.getUiState();
  uiState.setSelectedDieColor('red');
  assert(engine.drawOracleCard(player.id, 'red'));
  assertEquals(engine.getGameState().getOracleCardDeck().length, 29);

  engine.startNewGame();
  assertEquals(engine.getGameState().getOracleCardDeck().length, 30);
});
