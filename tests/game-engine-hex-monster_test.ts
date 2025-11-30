import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { assertLess } from '@std/assert/less';
import type { FightMonsterAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import type { HexCoordinates } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import type { CoreColor, MonsterHex } from '../src/types.ts';
import {
  assertFailureContains,
  setupGame,
  testGameState,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

function setupNextToMonster(): MonsterHex {
  setupGame();
  const color = 'red';
  const monsterHex = setShipNextToMonster(color);
  testPlayer.oracleDice = [];
  testPlayer.oracleCards = [color];
  testPlayer.favor = 0;

  const monsterCoordinates = { q: monsterHex.q, r: monsterHex.r };
  const monsterCell = testGameState.getMap().getCell(monsterCoordinates);
  assert(monsterCell);
  testUiState.setSelectedCoordinates(monsterCoordinates);

  return monsterHex;
}

function setShipNextToMonster(color: CoreColor) {
  const monsterHex = testGameState.getMonsterHexes().find((hex) => {
    return hex.monsterColors.indexOf(color) >= 0;
  });
  assert(monsterHex);
  const monsterCoordinates = { q: monsterHex.q, r: monsterHex.r };
  const seaNeighbors = testGameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      monsterCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  testPlayer.setShipPosition(destination.getCoordinates());
  return monsterHex;
}

function createFightMonsterAction(
  coordinates: HexCoordinates,
  spend: Resource,
): FightMonsterAction {
  return { type: 'hex', subType: 'fightMonster', coordinates, spend };
}

Deno.test('GameEngineHex monter - available resource no quest yes monster yes', () => {
  setupNextToMonster();
  testPlayer.oracleCards = [];

  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createDie('black');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const availableActions = GameEngineHex.getHexActions(testGameState).filter(
    (availableAction) => {
      return GameEngineHex.areEqualHexActions(availableAction, action);
    },
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineHex monter - available resource yes monster no quest yes', () => {
  setupNextToMonster();
  const selectedCoordinates = testUiState.getSelectedCoordinates();
  assert(selectedCoordinates);
  const monsterHex = testGameState.findMonsterHexAt(selectedCoordinates);
  assert(monsterHex);
  monsterHex.monsterColors = [];

  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createCard('red');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const availableActions = GameEngineHex.getHexActions(testGameState).filter(
    (availableAction) => {
      return GameEngineHex.areEqualHexActions(availableAction, action);
    },
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineHex monter - available resource yes monster yes quest wild completed', () => {
  setupNextToMonster();
  const wildQuest = testPlayer.getQuestsOfType('monster').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);
  wildQuest.isCompleted = true;
  wildQuest.color = 'green';
  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createCard('red');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const availableActions = GameEngineHex.getHexActions(testGameState).filter(
    (availableAction) => {
      return GameEngineHex.areEqualHexActions(availableAction, action);
    },
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineHex monter - available resource yes monster yes quest matching completed', () => {
  setupNextToMonster();
  const wildQuest = testPlayer.getQuestsOfType('monster').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);
  wildQuest.isCompleted = true;
  wildQuest.color = 'green';
  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createCard('red');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const availableActions = GameEngineHex.getHexActions(testGameState).filter(
    (availableAction) => {
      return GameEngineHex.areEqualHexActions(availableAction, action);
    },
  );
  assertEquals(availableActions.length, 0);
});

Deno.test('GameEngineHex monter - available success', () => {
  setupNextToMonster();

  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createCard('red');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const allActions = GameEngineHex.getHexActions(testGameState);
  const availableActions = allActions.filter(
    (availableAction) => {
      return GameEngineHex.areEqualHexActions(availableAction, action);
    },
  );
  assertEquals(availableActions.length, 1);
});

Deno.test('GameEngineHex monster - doAction not available', () => {
  setupNextToMonster();
  testPlayer.oracleCards = [];

  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createDie('black');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );

  const result = GameEngine.doAction(action, testGameState);
  assertFailureContains(result, 'not available');
});

// FixMe: All of the doAction tests need to handle multiple-round die combat

Deno.test('GameEngineHex monster - doAction wild success', () => {
  const monsterHex = setupNextToMonster();
  const originalMonsterCount = monsterHex.monsterColors.length;
  const coordinates = testUiState.getSelectedCoordinates();
  assert(coordinates);
  const resource = Resource.createCard('red');
  const action = createFightMonsterAction(
    coordinates,
    resource,
  );
  const wildQuest = testPlayer.getQuestsOfType('monster').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);

  assertEquals(monsterHex.monsterColors.length, originalMonsterCount - 1);
  assertLess(monsterHex.monsterColors.indexOf('red'), 0);
  assert(wildQuest.isCompleted);
  assertEquals(wildQuest.color, 'red');

  assertEquals(testPlayer.oracleCards.length, 0);
  assert(testPlayer.usedOracleCardThisTurn);
});

Deno.test('GameEngineHex monster - doAction required color success', () => {
  setupGame();
  const colorMonsterQuest = testPlayer.getQuestsOfType('monster').find(
    (quest) => {
      return quest.color !== 'none';
    },
  );
  assert(colorMonsterQuest);
  const monsterColor = colorMonsterQuest.color;
  assert(monsterColor !== 'none');
  const monsterHex = setShipNextToMonster(monsterColor);
  testPlayer.oracleDice = [monsterColor];
  const action = createFightMonsterAction(
    monsterHex.getCoordinates(),
    Resource.createDie(monsterColor),
  );

  const result = GameEngine.doAction(action, testGameState);
  assert(result.success, result.message);
  assertLess(monsterHex.monsterColors.indexOf(monsterColor), 0);
  assert(colorMonsterQuest.isCompleted);
  assertEquals(testPlayer.oracleDice.length, 0);
});
