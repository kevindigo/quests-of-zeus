import { assert, assertFalse, assertStringIncludes } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import type { GameState } from '../src/GameState.ts';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import type { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { HexMap } from '../src/hexmap/HexMap.ts';
import type { Player } from '../src/Player.ts';
import type { ResultWithMessage } from '../src/ResultWithMessage.ts';
import type { HexColor, TerrainType } from '../src/types.ts';
import type { UiState } from '../src/UiState.ts';

export function assertFailureContains(
  result: ResultWithMessage,
  fragment: string,
): void {
  assertFalse(
    result.success,
    `Should not have succeeded. Success message: ${result.message}`,
  );
  assertStringIncludes(result.message, fragment);
}

export let testEngine: GameManager;
export let testState: GameState;
export let testUiState: UiState;
export let testMap: HexMap;
export let testGrid: HexGrid;
export let testPlayer: Player;

export function setupGame(): void {
  testEngine = new GameManager();
  testState = testEngine.getGameState();
  testUiState = testEngine.getUiState();
  testMap = testState.getMap();
  testGrid = testMap.getHexGrid();
  testPlayer = testState.getCurrentPlayer();
}

export function putPlayerNextTo(cell: HexCell): void {
  const seaNeighbor = testGrid.getNeighborsOfType(cell, 'sea')[0];
  assert(seaNeighbor);
  testPlayer.setShipPosition(seaNeighbor.getCoordinates());
}

export function findFirstCellWithTerrainAndColor(
  terrain: TerrainType,
  color: HexColor,
): HexCell {
  const allShrineCells = testGrid.getCellsOfType(terrain);
  const ourColorShrineCells = allShrineCells.filter((cell) => {
    return cell.color == color;
  });
  const matchingCell = ourColorShrineCells[0];
  assert(matchingCell);
  return matchingCell;
}
