import { assertEquals, assertFalse } from '@std/assert';
import { assert } from '@std/assert/assert';
import { Actions, type MoveShipAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineMove } from '../src/GameEngineMove.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL } from '../src/types.ts';
import { assertFailureContains } from './test-helpers.ts';

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
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: HexGrid.CENTER,
    spend: Resource.createDie(centerColor),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.find(actions, simpleMove);
  assertFalse(adjacentMove);
});

Deno.test('GameEngineMove - available no resource available', () => {
  setup();
  const r = 1;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const destination = { q: 0, r: r };
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.favor = 0;
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: destination,
    spend: Resource.createDie(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.find(actions, simpleMove);
  assertFalse(adjacentMove);
});

Deno.test('GameEngineMove - available cannot move beyond range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.favor = 0;
  player.oracleDice = [colorDistant];
  player.oracleCards = [colorDistant];
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createDie(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.find(actions, simpleMove);
  assertFalse(adjacentMove);
});

Deno.test('GameEngineMove - available simple move die no favor', () => {
  setup();
  const r = 3;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [colorAdjacent];
  player.favor = 0;
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createDie(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available simple move card no favor', () => {
  setup();
  const r = 3;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [colorAdjacent];
  player.favor = 0;
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createCard(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available move die with favor for range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [colorDistant];
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createDie(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available move card with favor for range', () => {
  setup();
  const r = 5;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [colorDistant];
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createCard(colorDistant),
    favorToExtendRange: 2,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available move die with favor for recoloring', () => {
  setup();
  const r = 3;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const baseColor = COLOR_WHEEL[(r - 2) % COLOR_WHEEL.length];
  assert(baseColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [baseColor];
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createRecoloredDie(baseColor, 2),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available move card with favor for recoloring', () => {
  setup();
  const r = 3;
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const baseColor = COLOR_WHEEL[(r - 2) % COLOR_WHEEL.length];
  assert(baseColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [baseColor];
  const simpleMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createRecoloredCard(baseColor, 2),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const adjacentMove = Actions.findOne(actions, simpleMove);
  assert(adjacentMove);
});

Deno.test('GameEngineMove - available should offer die and card for same move', () => {
  setup();
  const r = 1;
  const colorAdjacent = COLOR_WHEEL[r];
  assert(colorAdjacent);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [colorAdjacent];
  player.oracleCards = [colorAdjacent];
  player.favor = 0;
  const dieMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createDie(colorAdjacent),
    favorToExtendRange: 0,
  };
  const cardMove: MoveShipAction = {
    type: 'move',
    destination: { q: 0, r },
    spend: Resource.createCard(colorAdjacent),
    favorToExtendRange: 0,
  };

  const actions = GameEngineMove.getMoveActions(gameState);
  const dieMoves = Actions.findOne(actions, dieMove);
  assert(dieMoves);
  const cardMoves = Actions.findOne(actions, cardMove);
  assert(cardMoves);
});

Deno.test('GameEngineMove - do action not available', () => {
  setup();
  const player = gameState.getCurrentPlayer();
  player.setShipPosition(HexGrid.CENTER);
  const centerCell = gameState.getMap().getCell(HexGrid.CENTER);
  assert(centerCell && centerCell.color !== 'none');
  player.oracleDice = [centerCell.color];
  const moveAlreadyThere: MoveShipAction = {
    type: 'move',
    destination: HexGrid.CENTER,
    spend: Resource.createDie(centerCell.color),
    favorToExtendRange: 0,
  };

  const result = GameEngine.doAction(moveAlreadyThere, gameState);
  assertFailureContains(result, 'not available');
});

Deno.test('GameEngineMove - do action card move favor worked', () => {
  setup();
  const r = 4;
  const destination = { q: 0, r: r };
  const colorDistant = COLOR_WHEEL[r];
  assert(colorDistant);
  const baseColor = COLOR_WHEEL[(r - 1) % COLOR_WHEEL.length];
  assert(baseColor);
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [];
  player.oracleCards = [baseColor];
  const moveRecoloredCardPlusRange: MoveShipAction = {
    type: 'move',
    destination: destination,
    spend: Resource.createRecoloredCard(baseColor, 1),
    favorToExtendRange: 1,
  };
  const result = GameEngine.doAction(moveRecoloredCardPlusRange, gameState);
  assert(result.success, result.message);
  assert(HexGrid.isSameLocation(player.getShipPosition(), destination));
  assertEquals(player.oracleCards.length, 0);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.favor, 1);
});
