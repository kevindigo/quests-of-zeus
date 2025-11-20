import { assertFalse, assertStringIncludes } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';
import type { GameState } from '../src/GameState.ts';
import type { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { HexMap } from '../src/hexmap/HexMap.ts';
import type { Player } from '../src/Player.ts';
import type { ResultWithMessage } from '../src/types.ts';

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
