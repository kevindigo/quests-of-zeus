import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { DropCubeAction } from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import { Resource } from '../src/Resource.ts';
import type { CoreColor, Item, Quest } from '../src/types.ts';
import { type UiState, UiStateClass } from '../src/UiState.ts';

let gameState: GameState;
let uiState: UiState;

function setupNextToTemple(
  color: CoreColor,
): Quest {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();

  const map = gameState.getMap();
  const templeCell = map.getCellsByTerrain('temple').find((cell) => {
    return cell.color === color;
  });
  assert(templeCell);
  const templeCoordinates = templeCell.getCoordinates();
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      templeCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [];
  player.oracleCards = [color];
  player.favor = 0;
  const quest = loadCubeForWildQuest(color);

  uiState.setSelectedCoordinates(templeCoordinates);
  return quest;
}

function getSelectedTempleCell(): HexCell {
  const templeCoordinates = uiState.getSelectedCoordinates();
  assert(templeCoordinates);
  const templeCell = gameState.getMap().getCell(templeCoordinates);
  assert(templeCell);
  return templeCell;
}

function loadCubeForWildQuest(color: CoreColor): Quest {
  const player = gameState.getCurrentPlayer();
  const cube: Item = { type: 'cube', color: color };
  const loaded = player.loadItem(cube);
  assert(loaded.success, loaded.message);
  const wildQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'none';
  });
  assert(wildQuest);
  wildQuest.color = color;
  return wildQuest;
}

function createDropCubeAction(color: CoreColor): DropCubeAction {
  const templeCell = getSelectedTempleCell();
  uiState.setSelectedResource(Resource.createCard(color));
  uiState.setSelectedCoordinates(templeCell.getCoordinates());
  const action: DropCubeAction = {
    type: 'hex',
    subType: 'dropCube',
    coordinates: templeCell.getCoordinates(),
    spend: Resource.createCard(color),
  };
  return action;
}

Deno.test('GameEngineHex -available next to useful temple', () => {
  const red: CoreColor = 'red';
  setupNextToTemple(red);

  const action = createDropCubeAction(red);
  const actions = GameEngineHex.getHexActions(gameState);
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineHex - doTempleAction', () => {
  const red: CoreColor = 'red';
  const quest = setupNextToTemple(red);

  const action = createDropCubeAction(red);
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assert(quest.isCompleted);
  const player = gameState.getCurrentPlayer();
  assertEquals(player.favor, 3);
  assertEquals(player.getItemCount(), 0);
  assertEquals(player.oracleDice.length, 0);
});
