import { assertEquals } from '@std/assert';
import { assert } from '@std/assert/assert';
import type { ShipMoveAction } from '../src/actions.ts';
import { GameEngineMove } from '../src/GameEngineMove.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL } from '../src/types.ts';

let gameState: GameState;

function setup(): void {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const map = gameState.getMap();
  for (let r = 0; r < 6; ++r) {
    const cell = map.getCell({ q: 0, r });
    assert(cell);
    cell.terrain = 'sea';
    cell.color = COLOR_WHEEL[r] || 'none';
  }
  const player = gameState.getCurrentPlayer();
  player.setShipPosition(HexGrid.CENTER);
}

Deno.test('GameEngineMove - cannot move to current position', () => {
  setup();
  const centerColor = COLOR_WHEEL[0];
  assert(centerColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [centerColor];
  player.favor = 0;
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: HexGrid.CENTER,
    spend: Resource.createDie(centerColor),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 0);
});

Deno.test('GameEngineMove - no resource available', () => {
  setup();
  const r = 1;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const destination = { q: 0, r: r };
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.favor = 0;
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: destination,
    spend: Resource.createDie(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 0);
});

Deno.test('GameEngineMove - cannot move beyond range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.favor = 0;
  player.oracleDice = [colorDistant];
  player.oracleCards = [colorDistant];
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createDie(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 0);
});

Deno.test('GameEngineMove - simple move die no favor', () => {
  setup();
  const r = 3;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [colorAdjacent];
  player.favor = 0;
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createDie(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});

Deno.test('GameEngineMove - simple move card no favor', () => {
  setup();
  const r = 3;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [colorAdjacent];
  player.favor = 0;
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createCard(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});

Deno.test('GameEngineMove - move die with favor for range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [colorDistant];
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createDie(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});

Deno.test('GameEngineMove - move card with favor for range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [colorDistant];
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createCard(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});

Deno.test('GameEngineMove - move die with favor for recoloring', () => {
  setup();
  const r = 3;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const baseColor = COLOR_WHEEL[(r + 6 - 2) % COLOR_WHEEL.length];
  assert(baseColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [baseColor];
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createRecoloredDie(baseColor, 2),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});

Deno.test('GameEngineMove - move card with favor for recoloring', () => {
  setup();
  const r = 3;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const baseColor = COLOR_WHEEL[(r + 6 - 2) % COLOR_WHEEL.length];
  assert(baseColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [baseColor];
  const simpleMove: ShipMoveAction = {
    type: 'move',
    subType: 'shipMove',
    destination: { q: 0, r },
    spend: Resource.createRecoloredCard(baseColor, 2),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMoves = actions.filter((availableAction) => {
    return GameEngineMove.areEqualMoveActions(availableAction, simpleMove);
  });
  assertEquals(adjacentMoves.length, 1);
});
