import { assert, assertGreaterOrEqual } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { DropCubeAction, LoadCubeAction } from '../src/actions.ts';
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

function createLoadCubeAction(color: CoreColor): LoadCubeAction {
  const offeringHex = getSelectedOfferingHex();
  const offeringCell = gameState.getMap().getCell(offeringHex.getCoordinates());
  assert(offeringCell);
  uiState.setSelectedResource(Resource.createCard(color));
  uiState.setSelectedCoordinates(offeringCell.getCoordinates());
  const action: LoadCubeAction = {
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
  assertEquals(
    found.length,
    0,
    JSON.stringify(action) + ': ' + JSON.stringify(actions),
  );
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
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
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
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
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

Deno.test('GameEngineHex -available next to useful temple', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const templeHex = gameState.getMap().getCellsByTerrain('temple')[0];
  assert(templeHex);
  const templeColor = templeHex.color;
  assert(templeColor !== 'none');
  const templeCoordinates = { q: templeHex.q, r: templeHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      templeCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;
  const cube: Item = { type: 'cube', color: templeColor };
  const loaded = player.loadItem(cube);
  assert(loaded.success, loaded.message);

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'dropCube' &&
      action.coordinates.q === templeHex.q &&
      action.coordinates.r === templeHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'dropCube');
  assert(
    action.coordinates.q === templeHex.q &&
      action.coordinates.r === templeHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - doTempleAction', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const quest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color !== 'none';
  });
  assert(quest && !quest.isCompleted);
  const color = quest.color;
  assert(color !== 'none');
  const templeCell = gameState.getMap().getCellsByTerrain('temple').find(
    (cell) => {
      return cell.color === color;
    },
  );
  assert(templeCell);
  const templeLocation = templeCell.getCoordinates();
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      templeLocation,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [color];
  player.favor = 0;
  const item: Item = { type: 'cube', color };
  player.loadItem(item);
  const resource = Resource.createDie(color);
  uiState.setSelectedResource(resource);
  uiState.setSelectedCoordinates(templeLocation);

  const action: DropCubeAction = {
    type: 'hex',
    subType: 'dropCube',
    coordinates: templeLocation,
    spend: resource,
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assert(quest.isCompleted);
  assertEquals(player.favor, 3);
  assertEquals(player.getItemCount(), 0);
  assertEquals(player.oracleDice.length, 0);
});
