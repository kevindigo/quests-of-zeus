import { assert, assertEquals, assertFalse, assertGreater } from '@std/assert';
import { GameState } from '../src/GameState.ts';
import { GameInitializer } from '../src/GameStateInitializer.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { MovementSystem } from '../src/MovementSystem.ts';
import { Player } from '../src/Player.ts';
import { ShipMoveHandler } from '../src/ShipMoveHandler.ts';
import { Resource } from '../src/types.ts';
import { UiStateClass } from '../src/UiState.ts';

function createShipMoveHandler(): ShipMoveHandler {
  const state = new GameState();
  new GameInitializer().initializeGameState(state);

  const centerHex = state.map.getCell(HexGrid.CENTER)!;
  centerHex.terrain = 'sea';
  centerHex.color = 'red';
  const uiState = new UiStateClass();
  const movementSystem = new MovementSystem(state.map);
  const shipMoveHandler = new ShipMoveHandler(state, uiState, movementSystem);
  return shipMoveHandler;
}

Deno.test('Action move ship not your turn', () => {
  const handler = createShipMoveHandler();
  const player = new Player(2, 'not current', 'yellow', HexGrid.CENTER);

  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.none,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'invalid_player');
});

Deno.test('Action move ship wrong phase', () => {
  const handler = createShipMoveHandler();
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  state.setPhase('setup');
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.none,
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
  const alreadyThere = handler.attemptMoveShip(
    player,
    destination,
    Resource.createDie('red'),
    0,
    0,
  );
  assertFalse(alreadyThere.success);
  assert(alreadyThere.error);
  assertEquals(alreadyThere.error.type, 'invalid_target');
  assertEquals(alreadyThere.error.details?.targetQ, destination.q);
  assertEquals(alreadyThere.error.details?.targetR, destination.r);

  const qIsOffMapCoordinates = {
    q: state.map.getHexGrid().getRadius() + 1,
    r: 0,
  };
  const offMap = handler.attemptMoveShip(
    player,
    qIsOffMapCoordinates,
    Resource.createDie('red'),
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
    r: -(state.map.getHexGrid().getRadius() + 1),
  };
  const offMap2 = handler.attemptMoveShip(
    player,
    rIsOffMapCoordinates,
    Resource.createDie('red'),
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
  const state = handler.getGameState();
  const player = state.getCurrentPlayer();

  const noDieOrCard = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.none,
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
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('blue'),
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
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createCard('blue'),
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
  const tooMuchRecolor = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('red'),
    1,
    0,
  );
  assertFalse(tooMuchRecolor.success);
  assert(tooMuchRecolor.error);
  assertEquals(tooMuchRecolor.error.type, 'not_enough_favor');

  const tooMuchRange = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('red'),
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
  state.map.getHexGrid().getCell(destination)!.terrain = 'shallow';
  player.oracleDice = ['red'];
  const result = handler.attemptMoveShip(
    player,
    destination,
    Resource.createDie('red'),
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
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('blue'),
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
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('red'),
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
  const result = handler.attemptMoveShip(
    player,
    HexGrid.CENTER,
    Resource.createDie('red'),
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
  const result = handler.attemptMoveShip(
    player,
    to,
    Resource.createDie(to.color),
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

  const grid = state.map.getHexGrid();
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
  const result = handler.attemptMoveShip(
    player,
    to,
    Resource.createCard('red'),
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

  const grid = state.map.getHexGrid();
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
  const result = handler.attemptMoveShip(
    player,
    to,
    Resource.createCard('red'),
    1,
    0,
  );
  assert(result.success, JSON.stringify(result.error));
  assertEquals(player.getShipPosition(), to);
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.favor, 1);
  // FixMe: Re-enable this after UiState is standalone
  // assertEquals(state.getSelectedRecoloring(), 0);

  const secondCardInOneTurn = handler.attemptMoveShip(
    player,
    to,
    Resource.createCard('red'),
    1,
    0,
  );
  assertFalse(secondCardInOneTurn.success);
  assertEquals(secondCardInOneTurn.error?.type, 'second_card');
});
