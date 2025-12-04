import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
} from '@std/assert';
import { Actions, type HexLoadStatueAction } from '../src/actions.ts';
import { GameEngine } from '../src/GameEngine.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { Resource } from '../src/Resource.ts';
import {
  type CityHex,
  COLOR_WHEEL,
  type CoreColor,
  type Item,
} from '../src/types.ts';
import { type UiState, UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

let gameState: GameState;
let uiState: UiState;

function setupNextToCity(color: CoreColor): CityHex {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  uiState = new UiStateClass();

  const map = gameState.getMap();
  const cityCell = map.getCellsByTerrain('city').find((cell) => {
    return cell.color === color;
  });
  assert(cityCell);

  const cityCoordinates = { q: cityCell.q, r: cityCell.r };
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

  uiState.setSelectedCoordinates(cityCoordinates);
  const cityHex = gameState.findCityHexAt(cityCoordinates);
  assert(cityHex);
  return cityHex;
}

function getSelectedCityHex(): CityHex {
  const cityCoordinates = uiState.getSelectedCoordinates();
  assert(cityCoordinates);
  const cityHex = gameState.findCityHexAt(cityCoordinates);
  assert(cityHex);
  return cityHex;
}

function createLoadStatueAction(): HexLoadStatueAction {
  const cityHex = getSelectedCityHex();
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  assert(cityCell);
  const color = cityCell.color;
  assert(color !== 'none');
  uiState.setSelectedResource(Resource.createCard(color));
  uiState.setSelectedCoordinates(cityCell.getCoordinates());
  const action: HexLoadStatueAction = {
    type: 'hex',
    subType: 'loadStatue',
    coordinates: cityHex.getCoordinates(),
    spend: Resource.createCard(color),
  };
  return action;
}

Deno.test('GameEngineHex - city no resource of that color', () => {
  const cityHex = setupNextToCity('red');
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  const color = cityCell?.color;
  assert(color && color !== 'none');
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [GameEngine.applyRecolor(color, 1)];
  player.oracleCards = [];
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city no statues available', () => {
  const cityHex = setupNextToCity('red');
  cityHex.statues = 0;
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city resource no space yes quest yes', () => {
  const cityHex = setupNextToCity('red');
  const cityCell = gameState.getMap().getCell(cityHex.getCoordinates());
  const color = cityCell?.color;
  assert(color && color !== 'none');
  const player = gameState.getCurrentPlayer();
  player.oracleDice = [GameEngine.applyRecolor(color, 1)];
  player.oracleCards = [];
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city resource yes space no quest yes', () => {
  setupNextToCity('red');
  const player = gameState.getCurrentPlayer();
  const redCube: Item = { type: 'cube', color: 'red' };
  assert(player.loadItem(redCube).success);
  const blueCube: Item = { type: 'cube', color: 'blue' };
  assert(player.loadItem(blueCube).success);
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city resource yes space yes quest all complete', () => {
  setupNextToCity('pink');
  const player = gameState.getCurrentPlayer();
  player.getQuestsOfType('statue').forEach((quest, index) => {
    quest.isCompleted = true;
    quest.color = COLOR_WHEEL[index] || 'black';
  });
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city resource yes space yes quest duplicate color', () => {
  setupNextToCity('red');
  const player = gameState.getCurrentPlayer();
  const firstWildQuest = player.getQuestsOfType('statue')[0];
  assert(firstWildQuest && firstWildQuest.color === 'none');
  firstWildQuest.color = 'red';
  const action = createLoadStatueAction();

  const availableActions = GameEngineHex.getHexActions(gameState);
  const availableLoadCity = Actions.find(availableActions, action);
  assertFalse(availableLoadCity);
});

Deno.test('GameEngineHex - city no action available', () => {
  const cityHex = setupNextToCity('red');
  cityHex.statues = 0;
  const action = createLoadStatueAction();

  const result = GameEngine.doAction(action, gameState);
  assertFailureContains(result, 'not available');
});

Deno.test('GameEngineHex - city successful load statue', () => {
  const cityHex = setupNextToCity('red');
  const action = createLoadStatueAction();

  const result = GameEngine.doAction(action, gameState);
  assert(result.success, result.message);

  assertEquals(cityHex.statues, 2);

  const player = gameState.getCurrentPlayer();
  const effectiveColor = action.spend.getEffectiveColor();
  assert(effectiveColor);
  const statue: Item = {
    type: 'statue',
    color: effectiveColor,
  };
  assert(player.isItemLoaded(statue));

  const quests = player.getQuestsOfType('statue');
  const changedQuest = quests.find((quest) => {
    return quest.color === effectiveColor;
  });
  assert(changedQuest);

  assertAlmostEquals(player.oracleCards.length, 0);
  assert(player.usedOracleCardThisTurn);
});
