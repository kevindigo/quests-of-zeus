import { assert, assertFalse, assertStringIncludes } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import type { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { HexMap } from '../src/hexmap/HexMap.ts';
import type { Player } from '../src/Player.ts';
import type { HexColor, ResultWithMessage, TerrainType } from '../src/types.ts';

export function assertFailureContains(
  result: ResultWithMessage,
  fragment: string,
): void {
  assertFalse(result.success, 'Should not have succeeded');
  assertStringIncludes(result.message, fragment);
}

export let xEngine: GameEngine;
export let xState: GameState;
export let xMap: HexMap;
export let xGrid: HexGrid;
export let xPlayer: Player;

export function setupGame(): void {
  xEngine = new GameEngine();
  xEngine.initializeGame();
  xState = xEngine.getGameState();
  xMap = xState.map;
  xGrid = xMap.getHexGrid();
  xPlayer = xState.getCurrentPlayer();
}

export function putPlayerNextTo(cell: HexCell): void {
  const seaNeighbor = xGrid.getNeighborsOfType(cell, 'sea')[0];
  assert(seaNeighbor);
  xPlayer.setShipPosition(seaNeighbor.getCoordinates());
}

export function findFirstCellWithTerrainAndColor(
  terrain: TerrainType,
  color: HexColor,
): HexCell {
  const allShrineCells = xGrid.getCellsOfType(terrain);
  const ourColorShrineCells = allShrineCells.filter((cell) => {
    return cell.color == color;
  });
  const matchingCell = ourColorShrineCells[0];
  assert(matchingCell);
  return matchingCell;
}
