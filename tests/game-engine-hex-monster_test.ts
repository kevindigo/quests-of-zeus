import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import type { FightMonsterAction } from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import type { HexCoordinates } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import {
  setupGame,
  testGameState,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

function setupNextToMonster(): void {
  setupGame();

  const color = 'red';
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
  testPlayer.oracleDice = [];
  testPlayer.oracleCards = [color];
  testPlayer.favor = 0;

  const monsterCell = testGameState.getMap().getCell(monsterCoordinates);
  assert(monsterCell);
  testUiState.setSelectedCoordinates(monsterCoordinates);
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
