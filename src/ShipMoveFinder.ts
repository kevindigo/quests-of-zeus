import type { GameState } from './GameState.ts';
import { type HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import type { CoreColor, PossibleShipMove } from './types.ts';

export class ShipMoveFinder {
  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public getAvailableMovesForColor(
    effectiveColor: CoreColor,
    maxFavorForMovement: number,
  ): PossibleShipMove[] {
    const player = this.gameState.getCurrentPlayer();
    const origin = player.getShipPosition();
    const baseRange = player.getRange();
    const map = this.gameState.getMap();

    const availableMoves: PossibleShipMove[] = [];
    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const moves = this.getAvailableMoves(origin, baseRange, favorSpent);
      const relevantMoves = moves.filter((move) => {
        if (move.q === origin.q && move.r === origin.r) {
          return false;
        }
        const cell = map.getCell({ q: move.q, r: move.r });
        if (!cell) {
          return false;
        }
        if (cell.color !== effectiveColor) {
          return false;
        }
        return true;
      });

      relevantMoves.forEach((possibleMove) => {
        if (!this.alreadyContainsMove(availableMoves, possibleMove)) {
          availableMoves.push(possibleMove);
        }
      });
    }

    return availableMoves;
  }

  public getAvailableMoves(
    origin: HexCoordinates,
    baseRange: number,
    maxFavorForMovement: number,
  ): PossibleShipMove[] {
    const availableMoves: PossibleShipMove[] = [];
    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const movementRange = baseRange + favorSpent;
      const reachableSeaCells = this.getReachableSeaTiles(
        origin,
        movementRange,
      );

      reachableSeaCells.forEach((cell) => {
        const possibleMove = {
          q: cell.q,
          r: cell.r,
          effectiveColor: cell.color,
          favorCost: favorSpent,
        };

        if (!this.alreadyContainsMove(availableMoves, possibleMove)) {
          availableMoves.push(possibleMove);
        }
      });
    }

    return availableMoves;
  }

  private alreadyContainsMove(
    availableMoves: PossibleShipMove[],
    candidateMove: PossibleShipMove,
  ): boolean {
    const found = availableMoves.find((move) => {
      return HexGrid.isSameLocation(move, candidateMove) &&
        move.favorCost <= candidateMove.favorCost;
    });
    return found ? true : false;
  }

  /**
   * Get all reachable sea tiles within movement range using BFS
   * Ships can move up to <range> steps on sea tiles, starting from the current position
   * Movement is only allowed through sea tiles (land blocks movement)
   * Ships can start on non-sea tiles (like Zeus) and move to adjacent sea tiles
   */
  private getReachableSeaTiles(
    from: HexCoordinates,
    range: number,
  ): { q: number; r: number; color: CoreColor }[] {
    const reachableTiles: { q: number; r: number; color: CoreColor }[] = [];
    const visited = new Set<string>();
    const queue: { q: number; r: number; steps: number }[] = [];

    // Start BFS from the current position (step 0)
    const startKey = `${from.q},${from.r}`;
    visited.add(startKey);
    queue.push({ q: from.q, r: from.r, steps: 0 });

    // Continue BFS up to the movement range
    while (queue.length > 0) {
      const current = queue.shift()!;

      // If we've reached the maximum range, don't explore further
      if (current.steps >= range) {
        continue;
      }

      const map = this.gameState.getMap();
      const neighbors = map.getNeighbors({ q: current.q, r: current.r });

      for (const neighbor of neighbors) {
        if (neighbor.terrain === 'sea') {
          const key = `${neighbor.q},${neighbor.r}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              q: neighbor.q,
              r: neighbor.r,
              steps: current.steps + 1,
            });
            reachableTiles.push({
              q: neighbor.q,
              r: neighbor.r,
              color: neighbor.color as CoreColor,
            });
          }
        }
      }
    }

    return reachableTiles;
  }

  private gameState: GameState;
}
