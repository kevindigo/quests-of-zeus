import { assertGreaterOrEqual, assertLess } from '@std/assert';
import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import type { DropStatueAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import type { HexCoordinates } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import type { CoreColor, Item, StatueHex } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testMap,
} from './test-helpers.ts';

function setup(color: CoreColor): StatueHex {
  setupGame();
  const statueHex = testGameState.getStatueHexes().find((hex) => {
    return hex.emptyBases.indexOf(color) >= 0;
  });
  assert(statueHex);
  const statueCoordinates = statueHex.getCoordinates();

  const seaNeighbors = testMap.getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      statueCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  const player = testGameState.getCurrentPlayer();
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [];
  player.oracleCards = [color];
  player.favor = 0;

  return statueHex;
}

function createDropStatueAction(
  coordinates: HexCoordinates,
  spend: Resource,
): DropStatueAction {
  return { type: 'hex', subType: 'dropStatue', coordinates, spend };
}

Deno.test('GameEngineHex statue available - loaded no, base yes, resource yes', () => {
  const statueHex = setup('red');
  const action = createDropStatueAction(
    statueHex.getCoordinates(),
    Resource.createDie('black'),
  );

  const availableActions = GameEngineHex.getHexActions(testGameState);
  const dropsAvailableHere = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(dropsAvailableHere.length, 0);
});

Deno.test('GameEngineHex statue available - loaded yes, base yes, resource no', () => {
  const statueHex = setup('red');
  const player = testGameState.getCurrentPlayer();
  const statue: Item = { type: 'statue', color: 'red' };
  assert(player.loadItem(statue));
  player.oracleCards = [];
  const action = createDropStatueAction(
    statueHex.getCoordinates(),
    Resource.createDie('black'),
  );

  const availableActions = GameEngineHex.getHexActions(testGameState);
  const dropsAvailableHere = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(dropsAvailableHere.length, 0);
});

Deno.test('GameEngineHex statue available - loaded yes, base no, resource yes', () => {
  const statueHex = setup('red');
  const player = testGameState.getCurrentPlayer();
  const statue: Item = { type: 'statue', color: 'red' };
  assert(player.loadItem(statue));
  statueHex.emptyBases = [];
  const action = createDropStatueAction(
    statueHex.getCoordinates(),
    Resource.createCard('red'),
  );

  const availableActions = GameEngineHex.getHexActions(testGameState);
  const dropsAvailableHere = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(dropsAvailableHere.length, 0);
});

Deno.test('GameEngineHex statue available - loaded yes, base yes, resource yes', () => {
  const statueHex = setup('red');
  const player = testGameState.getCurrentPlayer();
  const statue: Item = { type: 'statue', color: 'red' };
  assert(player.loadItem(statue));
  const action = createDropStatueAction(
    statueHex.getCoordinates(),
    Resource.createCard('red'),
  );

  const availableActions = GameEngineHex.getHexActions(testGameState);
  const dropsAvailableHere = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(dropsAvailableHere.length, 1);
});

Deno.test('GameEngineHex statue doAction - not available', () => {
  const statueHex = setup('red');
  const action: DropStatueAction = {
    type: 'hex',
    subType: 'dropStatue',
    coordinates: statueHex.getCoordinates(),
    spend: Resource.createCard('red'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assertFailureContains(result, 'not available');
});

Deno.test('GameEngineHex statue doAction - success', () => {
  const statueHex = setup('red');
  const player = testGameState.getCurrentPlayer();
  const statue: Item = { type: 'statue', color: 'red' };
  assert(player.loadItem(statue));
  const aWildQuest = player.getQuestsOfType('statue').find((quest) => {
    return quest.color === 'none';
  });
  assert(aWildQuest);
  aWildQuest.color = 'red';
  const action: DropStatueAction = {
    type: 'hex',
    subType: 'dropStatue',
    coordinates: statueHex.getCoordinates(),
    spend: Resource.createCard('red'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertFalse(player.isItemLoaded(statue));

  assertLess(statueHex.emptyBases.indexOf('red'), 0);
  assertGreaterOrEqual(statueHex.raisedStatues.indexOf('red'), 0);

  const thisQuest = player.getQuestsOfType('statue').find((quest) => {
    return quest.color === 'red';
  });
  assert(thisQuest);
  assert(thisQuest.isCompleted);

  assertEquals(player.oracleCards.length, 0);
  assert(player.usedOracleCardThisTurn);
});

Deno.test('GameEngineHex statue doAction - success 2nd statue on hex', () => {
  const statueHex = setup('red');
  const nonRedBaseColor = statueHex.emptyBases.find((color) => {
    return color !== 'red';
  });
  assert(nonRedBaseColor);
  const at = statueHex.emptyBases.indexOf(nonRedBaseColor);
  statueHex.emptyBases.splice(at, 1);
  statueHex.raisedStatues.push(nonRedBaseColor);
  assertEquals(statueHex.emptyBases.length, 2);
  assertEquals(statueHex.raisedStatues.length, 1);

  const player = testGameState.getCurrentPlayer();
  const statue: Item = { type: 'statue', color: 'red' };
  assert(player.loadItem(statue));
  const aWildQuest = player.getQuestsOfType('statue').find((quest) => {
    return quest.color === 'none';
  });
  assert(aWildQuest);
  aWildQuest.color = 'red';
  const action: DropStatueAction = {
    type: 'hex',
    subType: 'dropStatue',
    coordinates: statueHex.getCoordinates(),
    spend: Resource.createCard('red'),
  };

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);

  assertEquals(statueHex.emptyBases.length, 1);
  assertEquals(statueHex.raisedStatues.length, 2);
});
