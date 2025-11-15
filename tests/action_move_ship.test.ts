import { assert, assertEquals, assertFalse, assertGreater } from '@std/assert';
import { GameState } from '../src/GameState.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { HexMap } from '../src/hexmap/HexMap.ts';
import { MovementSystem } from '../src/movement-system.ts';
import { OracleSystem } from '../src/oracle-system.ts';
import { PlayerActions } from '../src/player-actions.ts';
import { Player } from '../src/Player.ts';

function createPlayerActions(): PlayerActions {
  const map = new HexMap();
  const centerHex = map.getCell(HexGrid.CENTER)!;
  centerHex.terrain = 'sea';
  centerHex.color = 'red';
  const player = new Player(0, 'whoever', 'blue', HexGrid.getVector(0));
  const state = new GameState(map, [player]);
  state.setPhase('action');
  const movementSystem = new MovementSystem(map);
  const oracleSystem = new OracleSystem([]);
  const playerActions = new PlayerActions(state, movementSystem, oracleSystem);
  return playerActions;
}

Deno.test('Action move ship wrong phase', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  state.setPhase('setup');
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    undefined,
    undefined,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_phase');
});

Deno.test('Action move ship invalid destination coordinates', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['red'];
  const alreadyThere = playerActions.attemptMoveShip(
    player,
    player.getShipPosition(),
    'red',
    undefined,
    0,
    0,
  );
  assertFalse(alreadyThere.success);
  assert(alreadyThere.error);
  assertEquals(alreadyThere.error.type, 'invalid_target');

  const qIsOffMapCoordinates = {
    q: state.map.getHexGrid().getRadius() + 1,
    r: 0,
  };
  const offMap = playerActions.attemptMoveShip(
    player,
    qIsOffMapCoordinates,
    'red',
    undefined,
    0,
    0,
  );
  assertFalse(offMap.success);
  assert(offMap.error);
  assertEquals(offMap.error.type, 'invalid_target');

  const rIsOffMapCoordinates = {
    q: 0,
    r: -(state.map.getHexGrid().getRadius() + 1),
  };
  const offMap2 = playerActions.attemptMoveShip(
    player,
    rIsOffMapCoordinates,
    'red',
    undefined,
    0,
    0,
  );
  assertFalse(offMap2.success);
  assert(offMap2.error);
  assertEquals(offMap2.error.type, 'invalid_target');
});

Deno.test('Action move ship use die or card not both', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  const noDieOrCard = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    undefined,
    undefined,
    0,
    0,
  );
  assertFalse(noDieOrCard.success);
  assert(noDieOrCard.error);
  assertEquals(noDieOrCard.error.type, 'no_die');

  const bothDieAndCard = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'red',
    'red',
    0,
    0,
  );
  assertFalse(bothDieAndCard.success);
  assert(bothDieAndCard.error);
  assertEquals(bothDieAndCard.error.type, 'no_die');
});

Deno.test('Action move ship use invalid die', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['red'];
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'blue',
    undefined,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'die_not_available');
});

Deno.test('Action move ship use invalid card', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.oracleCards = ['red'];
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    undefined,
    'blue',
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'die_not_available');
});

Deno.test('Action move ship not enough favor', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['red'];
  const tooMuchRecolor = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'red',
    undefined,
    1,
    0,
  );
  assertFalse(tooMuchRecolor.success);
  assert(tooMuchRecolor.error);
  assertEquals(tooMuchRecolor.error.type, 'not_enough_favor');

  const tooMuchRange = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'red',
    undefined,
    0,
    1,
  );
  assertFalse(tooMuchRange.success);
  assert(tooMuchRange.error);
  assertEquals(tooMuchRange.error.type, 'not_enough_favor');
});

Deno.test('Action move ship to non-sea', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  const destination = { q: 3, r: 3 };
  state.map.getHexGrid().getCell(destination)!.terrain = 'shallow';
  player.oracleDice = ['red'];
  const result = playerActions.attemptMoveShip(
    player,
    destination,
    'red',
    undefined,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'not_sea');
});

Deno.test('Action move ship to wrong color (no recoloring)', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.oracleDice = ['blue'];
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'blue',
    undefined,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_color');
});

Deno.test('Action move ship to wrong color (with recoloring)', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.favor = 1;
  player.oracleDice = ['red'];
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'red',
    undefined,
    1,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'wrong_color');
});

Deno.test('Action move ship out of range', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();

  player.favor = 1;
  player.oracleDice = ['red'];
  player.setShipPosition({ q: 4, r: 0 });
  const result = playerActions.attemptMoveShip(
    player,
    HexGrid.CENTER,
    'red',
    undefined,
    0,
    0,
  );
  assertFalse(result.success);
  assert(result.error);
  assertEquals(result.error.type, 'not_reachable');
});

Deno.test('Action move ship with die success (no favor)', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
  const player = state.getCurrentPlayer();
  const movementSystem = playerActions.getMovementSystem();

  const from = HexGrid.CENTER;
  player.setShipPosition(from);
  const reachable = movementSystem.getReachableSeaTiles(
    from,
    player.getRange(),
  );
  assertGreater(reachable.length, 1);
  const to = reachable[0]!;
  player.oracleDice = [to.color, to.color];
  const result = playerActions.attemptMoveShip(
    player,
    to,
    to.color,
    undefined,
    0,
    0,
  );
  assert(result.success);
  const toCoordinates = { q: to.q, r: to.r };
  assertEquals(player.getShipPosition(), toCoordinates);
  assertEquals(player.oracleDice.length, 1);
});

Deno.test('Action move ship with card and favor range success', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
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
  const result = playerActions.attemptMoveShip(
    player,
    to,
    undefined,
    'red',
    0,
    1,
  );
  assert(result.success);
  assertEquals(player.getShipPosition(), to);
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.favor, 1);
});

Deno.test('Action move ship with card and recolor success', () => {
  const playerActions = createPlayerActions();
  const state = playerActions.getState();
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
  const result = playerActions.attemptMoveShip(
    player,
    to,
    undefined,
    'red',
    1,
    0,
  );
  assert(result.success);
  assertEquals(player.getShipPosition(), to);
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.favor, 1);

  const secondCardInOneTurn = playerActions.attemptMoveShip(
    player,
    to,
    undefined,
    'red',
    1,
    0,
  );
  assertFalse(secondCardInOneTurn.success);
  assertEquals(secondCardInOneTurn.error?.type, 'second_card');
});
