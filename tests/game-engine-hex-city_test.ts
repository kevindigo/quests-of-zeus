import { assert, assertEquals } from '@std/assert';
import type { LoadStatueAction } from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { OracleSystem } from '../src/OracleSystem.ts';
import { Resource } from '../src/Resource.ts';
import { type CityHex, COLOR_WHEEL, type Item } from '../src/types.ts';
import { type UiState, UiStateClass } from '../src/UiState.ts';

let gameState: GameState;
let uiState: UiState;

function setupNextToCity(): CityHex {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  uiState = new UiStateClass();
  const cityHex = gameState.getCityHexes()[0];
  assert(cityHex);

  const cityCoordinates = { q: cityHex.q, r: cityHex.r };
  const map = gameState.getMap();
  const cityCell = map.getCell(cityCoordinates);
  assert(cityCell);
  const color = cityCell.color;
  assert(color !== 'none');
  const seaNeighbors = map.getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      cityCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  const player = gameState.getCurrentPlayer();
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [];
  player.oracleCards = [color];
  player.favor = 0;

  uiState.setSelectedCoordinates(cityCell.getCoordinates());
  return cityHex;
}

function getSelectedCityHex(): CityHex {
  const cityCoordinates = uiState.getSelectedCoordinates();
  assert(cityCoordinates);
  const cityHex = gameState.findCityHexAt(cityCoordinates);
  assert(cityHex);
  return cityHex;
}

function createLoadStatueAction(): LoadStatueAction {
  const cityHex = getSelectedCityHex();
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  assert(cityCell);
  const color = cityCell.color;
  assert(color !== 'none');
  uiState.setSelectedResource(Resource.createCard(color));
  uiState.setSelectedCoordinates(cityCell.getCoordinates());
  const action: LoadStatueAction = {
    type: 'hex',
    subType: 'loadStatue',
    coordinates: cityHex.getCoordinates(),
    spend: Resource.createCard(color),
  };
  return action;
}

Deno.test('GameEngineHex - city no resource of that color', () => {
  const cityHex = setupNextToCity();
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  const color = cityCell?.color;
  assert(color && color !== 'none');
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [OracleSystem.applyRecolor(color, 1)];
  player.oracleCards = [];
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(availableLoadCity.length, 0);
});

Deno.test('GameEngineHex - city no statues available', () => {
  const cityHex = setupNextToCity();
  cityHex.statues = 0;
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(availableLoadCity.length, 0);
});

Deno.test('GameEngineHex - city resource no space yes quest yes', () => {
  const cityHex = setupNextToCity();
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  const color = cityCell?.color;
  assert(color && color !== 'none');
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [OracleSystem.applyRecolor(color, 1)];
  player.oracleCards = [];
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(availableLoadCity.length, 0);
});

Deno.test('GameEngineHex - city resource yes space no quest yes', () => {
  setupNextToCity();
  const player = gameState.getCurrentPlayer();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(player.loadItem(redCube).success);
  const blueCube: Item = { type: 'cube', color: 'blue' };
  assert(player.loadItem(blueCube).success);
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(availableLoadCity.length, 0);
});

Deno.test('GameEngineHex - city resource yes space yes quest no', () => {
  setupNextToCity();
  const player = gameState.getCurrentPlayer();
  player.getQuestsOfType('statue').forEach((quest, index) => {
    quest.isCompleted = true;
    quest.color = COLOR_WHEEL[index] || 'red';
  });
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = availableActions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(availableAction, action);
  });
  assertEquals(availableLoadCity.length, 0);
});
