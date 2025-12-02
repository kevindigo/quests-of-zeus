import {
  assert,
  assertEquals,
  assertFalse,
  assertGreater,
  assertLess,
  assertNotEquals,
  assertStringIncludes,
} from '@std/assert';
import { ControllerForHexClicks } from '../src/ControllerForHexClicks.ts';
import { type HexCoordinates, HexGrid } from '../src/hexmap/HexGrid.ts';
import { Resource } from '../src/Resource.ts';
import type { ResultWithMessage } from '../src/ResultWithMessage.ts';
import type { CubeHex } from '../src/types.ts';
import {
  setupGame,
  testGameManager,
  testGameState,
  testGrid,
  testPlayer,
  testUiState,
} from './test-helpers.ts';

function assertFailureContains(
  result: ResultWithMessage,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

let testHandler: ControllerForHexClicks;
let center: HexCoordinates;

function setupWithController(): void {
  setupGame();
  testHandler = new ControllerForHexClicks(testGameState, testUiState);
  center = HexGrid.CENTER;
}

Deno.test('Hex click - second oracle card', () => {
  setupWithController();

  testPlayer.usedOracleCardThisTurn = true;
  testGameManager.getUiState().setSelectedResource(Resource.createCard('red'));
  assert(testGameManager.getUiState().getSelectedResource().isCard());
  assertEquals(
    testGameManager.getUiState().getSelectedResource().getBaseColor(),
    'red',
  );
  assertFailureContains(
    testHandler.handleHexClick(center, 0),
    'per turn',
  );
});

Deno.test('Hex click - unsupported terrain', () => {
  setupWithController();
  testPlayer.oracleDice = ['red'];
  testUiState.setSelectedResource(Resource.createDie('red'));
  const shallowCell = testGrid.getCellsOfType('shallow')[0];
  assert(shallowCell, 'No shallows found on the map?');
  assertFailureContains(
    testHandler.handleHexClick(shallowCell.getCoordinates(), 0),
    'shallow',
  );
});

/********************** Shrine tests ****************************/
Deno.test('Hex click - shrine not adjacent', () => {
  setupWithController();
  const shrineCell = testGrid.getCellsOfType('shrine')[0];
  assert(shrineCell);
  shrineCell.color = 'red';
  testPlayer.oracleDice = [shrineCell.color];
  testUiState.setSelectedResource(Resource.createDie(shrineCell.color));
  const result = testHandler.handleHexClick(
    shrineCell.getCoordinates(),
    0,
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - next to good color, but click elsewhere', () => {
  setupWithController();
  const shrineCells = testGrid.getCellsOfType('shrine');
  const adjacentShrineCell = shrineCells[0];
  assert(adjacentShrineCell);
  const adjacentColor = adjacentShrineCell.color;
  if (adjacentColor === 'none') {
    throw new Error('Impossible: a shrine had no color');
  }
  assertNotEquals(adjacentColor, 'none');
  const otherShrineCell = shrineCells.find((cell) => {
    return cell.color !== adjacentColor;
  });
  assert(otherShrineCell);
  const seaNeighbor = testGrid.getNeighborsOfType(adjacentShrineCell, 'sea')[0];
  assert(seaNeighbor);
  testPlayer.setShipPosition(seaNeighbor.getCoordinates());
  testPlayer.oracleDice = [adjacentColor, 'green'];
  testUiState.setSelectedResource(Resource.createDie(adjacentColor));

  const result = testHandler.handleHexClick(
    otherShrineCell.getCoordinates(),
    0,
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - next to good color, but different color', () => {
  setupWithController();
  const shrineCell = testGrid.getCellsOfType('shrine')[0];
  assert(shrineCell);
  shrineCell.color = 'red';
  const seaNeighbor = testGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(seaNeighbor);
  testPlayer.setShipPosition(seaNeighbor.getCoordinates());
  testPlayer.oracleDice = [shrineCell.color, 'green'];
  testUiState.setSelectedResource(Resource.createDie('green'));
  const result = testHandler.handleHexClick(
    shrineCell.getCoordinates(),
    0,
  );
  assertFailureContains(result, 'not available');
});

Deno.test('Hex click - available my hidden shrine (die)', () => {
  setupWithController();
  const color = testPlayer.oracleDice[0]!;
  const shrineCells = testGrid.getCellsOfType('shrine');
  const shrineCell = shrineCells.find((cell) => {
    return cell.color === color;
  });
  assert(shrineCell);

  const seaNeighbor = testGrid.getNeighborsOfType(shrineCell, 'sea')[0];
  assert(seaNeighbor);
  testPlayer.setShipPosition(seaNeighbor.getCoordinates());

  const shrineHex = testGameState.getShrineHexes().find((hex) => {
    return hex.q === shrineCell.q && hex.r === shrineCell.r;
  });
  assert(shrineHex);
  shrineHex.owner = testPlayer.color;

  testUiState.setSelectedResource(Resource.createDie(color));
  const result = testHandler.handleHexClick(
    shrineCell.getCoordinates(),
    0,
  );
  assert(result.success, `Should have succeeded, but ${result.message}`);
  assertEquals(shrineHex.status, 'filled');
  assertEquals(testUiState.getEffectiveSelectedColor(), null);
  assertEquals(testUiState.getSelectedRecoloring(), 0);
});

/********************** Offering tests ****************************/
function setupGameNextToRedCube(): CubeHex {
  setupWithController();
  const cubeHexes = testGameState.getCubeHexes();
  assertEquals(cubeHexes.length, 6);
  const hexesWithRed = cubeHexes.filter((hex) => {
    return (hex.cubeColors.indexOf('red') >= 0);
  });
  assertEquals(
    hexesWithRed.length,
    testGameState.getPlayerCount(),
    'red cube hex count',
  );
  const cubeHex = hexesWithRed[0];
  assert(cubeHex);
  const cubeHexCoordinates = { q: cubeHex.q, r: cubeHex.r };
  const seaNeighbors = testGrid.getNeighborsByCoordinates(cubeHexCoordinates);
  const destination = seaNeighbors[0];
  assert(destination);
  testPlayer.setShipPosition(destination.getCoordinates());
  const shipCell = testGrid.getCell(testPlayer.getShipPosition());
  assert(shipCell);
  assertGreater(testGrid.getNeighborsOfType(shipCell, 'offerings').length, 0);
  return cubeHex;
}

Deno.test('Hex click - available offering', () => {
  const cubeHex = setupGameNextToRedCube();
  testPlayer.oracleDice = ['red'];
  testUiState.setSelectedResource(Resource.createDie('red'));

  const result = testHandler.handleHexClick(cubeHex, 0);
  assert(result.success, result.message);
  assertEquals(testPlayer.getItemCount(), 1);
  const thisCube = testPlayer.getLoadedItems().find((item) => {
    return item.type == 'cube' && item.color == 'red';
  });
  assert(
    thisCube,
    `Loaded wrong item (${JSON.stringify(testPlayer.getLoadedItems())})`,
  );
  assertEquals(testPlayer.oracleDice.length, 0, 'Should have spent the die');
  assertFalse(
    testUiState.getEffectiveSelectedColor(),
    'Should have unselected the die',
  );
  const templeQuests = testPlayer.getQuestsOfType('temple');
  const redCubeQuest = templeQuests.find((quest) => {
    return quest.color === 'red';
  });
  assert(redCubeQuest, 'Did not update wild quest to red?');
  assertLess(
    cubeHex.cubeColors.indexOf('red'),
    0,
    'Cube not removed from the hex?',
  );
});
