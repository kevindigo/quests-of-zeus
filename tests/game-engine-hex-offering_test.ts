import { assert, assertGreaterOrEqual } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { HexLoadCubeAction } from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { Resource } from '../src/Resource.ts';
import {
  COLOR_WHEEL,
  type CoreColor,
  type CubeHex,
  type Item,
} from '../src/types.ts';
import { type UiState, UiStateClass } from '../src/UiState.ts';
import { assertSuccess } from './test-helpers.ts';

let gameState: GameState;
let uiState: UiState;

function setupNextToOffering(
  cubeFromExistingQuest: boolean,
): CoreColor {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();

  const quests = player.getQuestsOfType('temple');
  const questColors = quests.map((quest) => {
    return quest.color;
  }).filter((color) => {
    return color !== 'none';
  });
  const findColor = cubeFromExistingQuest ? questColors[0] : 'green';
  assert(findColor);
  const offeringHex = gameState.getCubeHexes().find((hex) => {
    return hex.cubeColors.indexOf(findColor) >= 0;
  });
  assert(offeringHex);

  const offeringCoordinates = { q: offeringHex.q, r: offeringHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      offeringCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [];
  player.oracleCards = [...COLOR_WHEEL];
  player.favor = 0;

  const shrineCell = gameState.getMap().getCell(offeringHex.getCoordinates());
  assert(shrineCell);
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());
  return findColor;
}

function getSelectedOfferingHex(): CubeHex {
  const offeringCoordinates = uiState.getSelectedCoordinates();
  assert(offeringCoordinates);
  const offeringHex = gameState.findCubeHexAt(offeringCoordinates);
  assert(offeringHex);
  return offeringHex;
}

function createLoadCubeAction(color: CoreColor): HexLoadCubeAction {
  const offeringHex = getSelectedOfferingHex();
  const offeringCell = gameState.getMap().getCell(offeringHex.getCoordinates());
  assert(offeringCell);
  uiState.setSelectedResource(Resource.createCard(color));
  uiState.setSelectedCoordinates(offeringCell.getCoordinates());
  const action: HexLoadCubeAction = {
    type: 'hex',
    subType: 'loadCube',
    coordinates: offeringHex.getCoordinates(),
    spend: Resource.createCard(color),
  };
  return action;
}

Deno.test('GameEngineHex - available next to cube needed for wild quest', () => {
  const color = setupNextToOffering(false);

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 2, JSON.stringify(actions));
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineHex - available next to cube needed for color quest', () => {
  const color = setupNextToOffering(true);

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 2, JSON.stringify(actions));
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineHex - available next to cube we already have', () => {
  const color = setupNextToOffering(true);
  const player = gameState.getCurrentPlayer();
  const cube: Item = { type: 'cube', color };
  assert(player.loadItem(cube), `Failed to load ${JSON.stringify(cube)}`);

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 0);
});

Deno.test('GameEngineHex - available full ship', () => {
  const color = setupNextToOffering(true);
  const player = gameState.getCurrentPlayer();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(player.loadItem(redCube), `Failed to load red`);
  const greenCube: Item = { type: 'cube', color: 'green' };
  assert(player.loadItem(greenCube), `Failed to load breen`);

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 0);
});

Deno.test('GameEngineHex - available next to cube with no matching quest', () => {
  const color = setupNextToOffering(false);
  const player = gameState.getCurrentPlayer();
  const wildQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);
  wildQuest.color = 'red';

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 0);
});

Deno.test('GameEngineHex - available next to cube matching completed quest', () => {
  const color = setupNextToOffering(true);
  const player = gameState.getCurrentPlayer();
  const completedQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === color;
  });
  assert(completedQuest);
  completedQuest.isCompleted = true;

  const action = createLoadCubeAction(color);
  const actions = GameEngineHex.getHexActions(gameState);
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 0);
});

Deno.test('GameEngineHex - doOfferingAction (existing quest)', () => {
  const color = setupNextToOffering(true);
  const offeringHex = getSelectedOfferingHex();
  const cubeCount = offeringHex.cubeColors.length;

  const action = createLoadCubeAction(color);
  const result = GameEngineHex.doAction(action, gameState);
  assertSuccess(result);
  assertEquals(offeringHex.cubeColors.length, cubeCount - 1);
  const player = gameState.getCurrentPlayer();
  assertEquals(player.getItemCount(), 1);
  assertEquals(player.oracleDice.length, 0);
  assertEquals(player.oracleCards.length, 5);
  const wildQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'none';
  });
  assert(
    wildQuest,
    'Cube should have been used for its quest, not for the wild',
  );
});

Deno.test('GameEngineHex - doOfferingAction (wild quest)', () => {
  const color = setupNextToOffering(false);
  const offeringHex = getSelectedOfferingHex();
  const cubeCount = offeringHex.cubeColors.length;

  const action = createLoadCubeAction(color);
  const result = GameEngineHex.doAction(action, gameState);
  assertSuccess(result);
  assertEquals(offeringHex.cubeColors.length, cubeCount - 1);
  const player = gameState.getCurrentPlayer();
  assertEquals(player.getItemCount(), 1);
  assertEquals(player.oracleDice.length, 0);
  assertEquals(player.oracleCards.length, 5);
  const greenQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'green';
  });
  assert(
    greenQuest,
    'Cube should have been used for the wild quest',
  );
});
