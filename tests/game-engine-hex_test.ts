import { assert, assertGreaterOrEqual } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { COLOR_WHEEL } from '../src/types.ts';

Deno.test('GameEngineHex - available wrong phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineHex - available at zeus', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineHex - available next to at least one hidden shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes()[0];
  assert(shrineHex);
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - available next to at least one hidden shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes()[0];
  assert(shrineHex);
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - available next to our visible shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner === player.color;
  });
  assert(shrineHex);
  shrineHex.status = 'visible';
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});
