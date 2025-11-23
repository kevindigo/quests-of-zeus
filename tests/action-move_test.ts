import { assert, assertEquals, assertFalse, assertGreater } from '@std/assert';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { MovementSystem } from '../src/MovementSystem.ts';
import { ShipMoveHandler } from '../src/ShipMoveHandler.ts';
import { UiStateClass } from '../src/UiState.ts';

function createShipMoveHandler(): ShipMoveHandler {
  const state = new GameState();
  new GameStateInitializer().initializeGameState(state);

  const centerHex = state.getMap().getCell(HexGrid.CENTER)!;
  centerHex.terrain = 'sea';
  centerHex.color = 'red';
  const uiState = new UiStateClass();
  const movementSystem = new MovementSystem(state.getMap());
  const shipMoveHandler = new ShipMoveHandler(state, uiState, movementSystem);
  return shipMoveHandler;
}

Deno.test('Action move ship wrong phase', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();

  state.setPhase('setup');
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_phase');
  assertEquals(result.error.details?.phase, state.getPhase());
});

Deno.test('Action move ship invalid destination coordinates', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['red'];
  const destination = player.getShipPosition();
  const uiState = handler.getUiState();
  uiState.setSelectedCoordinates(destination);
  uiState.setSelectedDieColor('red');
  const alreadyThere = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(alreadyThere.success);
  assert(alreadyThere.error);
  assertEquals(alreadyThere.error.type, 'invalid_target');
  assertEquals(alreadyThere.error.details?.targetQ, destination.q);
  assertEquals(alreadyThere.error.details?.targetR, destination.r);

  const qIsOffMapCoordinates = {
    q: state.getMap().getHexGrid().getRadius() + 1,
    r: 0,
  };
  uiState.setSelectedCoordinates(qIsOffMapCoordinates);
  uiState.setSelectedDieColor('red');
  const offMap = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(offMap.success);
  assert(offMap.error);
  assertEquals(offMap.error.type, 'invalid_target');
  assertEquals(offMap.error.details?.targetQ, qIsOffMapCoordinates.q);
  assertEquals(offMap.error.details?.targetR, qIsOffMapCoordinates.r);

  const rIsOffMapCoordinates = {
    q: 0,
    r: -(state.getMap().getHexGrid().getRadius() + 1),
  };
  uiState.setSelectedCoordinates(rIsOffMapCoordinates);
  uiState.setSelectedDieColor('red');
  const offMap2 = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(offMap2.success);
  assert(offMap2.error);
  assertEquals(offMap2.error.type, 'invalid_target');
  assertEquals(offMap2.error.details?.targetQ, rIsOffMapCoordinates.q);
  assertEquals(offMap2.error.details?.targetR, rIsOffMapCoordinates.r);
});

Deno.test('Action move ship use die or card not both', () => {
  const handler = createShipMoveHandler();

  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  const noDieOrCard = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(noDieOrCard.success);
  assert(noDieOrCard.error);
  assertEquals(noDieOrCard.error.type, 'no_die_or_card');
});

Deno.test('Action move ship use invalid die', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['red'];
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('blue');
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'die_not_available');
  assertEquals(result.error.details?.dieColor, 'blue');
  assertEquals(result.error.details?.availableDice?.length, 1);
});

Deno.test('Action move ship use invalid card', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.oracleCards = ['red'];
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedOracleCardColor('blue');
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'card_not_available');
  assertEquals(result.error.details?.dieColor, 'blue');
  assertEquals(result.error.details?.availableDice?.length, 1);
});

Deno.test('Action move ship not enough favor', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.favor = 0;
  player.oracleDice = ['red'];
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('red');
  const tooMuchRecolor = handler.attemptMoveShip(
    1,
    0,
  );
  assertFalse(tooMuchRecolor.success);
  assert(tooMuchRecolor.error);
  assertEquals(tooMuchRecolor.error.type, 'not_enough_favor');

  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('red');
  const tooMuchRange = handler.attemptMoveShip(
    0,
    1,
  );
  assertFalse(tooMuchRange.success);
  assert(tooMuchRange.error);
  assertEquals(tooMuchRange.error.type, 'not_enough_favor');
});

Deno.test('Action move ship to non-sea', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  const destination = { q: 3, r: 3 };
  state.getMap().getHexGrid().getCell(destination)!.terrain = 'shallow';
  player.oracleDice = ['red'];
  handler.getUiState().setSelectedCoordinates(destination);
  handler.getUiState().setSelectedDieColor('red');
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'not_sea');
  assertEquals(result.error.details?.targetTerrain, 'shallow');
});

Deno.test('Action move ship to wrong color (no recoloring)', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['blue'];
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('blue');
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_color');
});

Deno.test('Action move ship to wrong color (with recoloring)', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.favor = 1;
  player.oracleDice = ['red'];
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('red');
  const result = handler.attemptMoveShip(
    1,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_color');
});

Deno.test('Action move ship out of range', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  player.favor = 1;
  player.oracleDice = ['red'];
  player.setShipPosition({ q: 4, r: 0 });
  handler.getUiState().setSelectedCoordinates(HexGrid.CENTER);
  handler.getUiState().setSelectedDieColor('red');
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'not_reachable');
});

Deno.test('Action move ship with die success (no favor)', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();
  const movementSystem = handler.getMovementSystem();

  const from = HexGrid.CENTER;
  player.setShipPosition(from);
  const reachable = movementSystem.getReachableSeaTiles(
    from,
    player.getRange(),
  );
  assertGreater(reachable.length, 1);
  const to = reachable[0]!;
  player.oracleDice = [to.color, to.color];
  handler.getUiState().setSelectedCoordinates(to);
  handler.getUiState().setSelectedDieColor(to.color);
  const result = handler.attemptMoveShip(
    0,
    0,
  );
  assert(result.success);
  const toCoordinates = { q: to.q, r: to.r };
  assertEquals(player.getShipPosition(), toCoordinates);
  assertEquals(player.oracleDice.length, 1);
});

Deno.test('Action move ship with card and favor range success', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  const grid = state.getMap().getHexGrid();
  grid.forEachCell((cell) => {
    cell.terrain = 'sea';
    cell.color = 'blue';
  });
  const from = HexGrid.CENTER;
  player.setShipPosition(from);
  const to = { q: 4, r: 0 };
  grid.getCell(to)!.color = 'red';
  player.oracleCards = ['red', 'red'];
  player.favor = 2;
  handler.getUiState().setSelectedCoordinates(to);
  handler.getUiState().setSelectedOracleCardColor('red');
  const result = handler.attemptMoveShip(
    0,
    1,
  );
  assert(result.success, JSON.stringify(result.error));
  assertEquals(player.getShipPosition(), to);
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.favor, 1);
});

Deno.test('Action move ship with card and recolor success', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  const grid = state.getMap().getHexGrid();
  grid.forEachCell((cell) => {
    cell.terrain = 'sea';
    cell.color = 'blue';
  });
  const from = HexGrid.CENTER;
  player.setShipPosition(from);
  const to = { q: 3, r: 0 };
  grid.getCell(to)!.color = 'black';
  player.oracleCards = ['red', 'red'];
  player.favor = 2;
  handler.getUiState().setSelectedCoordinates(to);
  handler.getUiState().setSelectedOracleCardColor('red');
  const result = handler.attemptMoveShip(
    1,
    0,
  );
  assert(result.success, JSON.stringify(result.error));
  assertEquals(player.getShipPosition(), to);
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.favor, 1);
  assertEquals(handler.getUiState().getSelectedRecoloring(), 0);

  handler.getUiState().setSelectedCoordinates(to);
  handler.getUiState().setSelectedOracleCardColor('red');
  const secondCardInOneTurn = handler.attemptMoveShip(
    1,
    0,
  );
  assertFalse(secondCardInOneTurn.success);
  assertEquals(secondCardInOneTurn.error?.type, 'second_card');
});
