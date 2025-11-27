import type { Action, ShipMoveAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './MovementSystem.ts';
import type { Resource } from './Resource.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import { ShipMoveHandler } from './ShipMoveHandler.ts';
import type { PossibleShipMove } from './types.ts';

export class GameEngineMove {
  public static getMoveActions(gameState: GameState): Action[] {
    const possibleActionsWithAvailableResources: ShipMoveAction[] = [];

    const allTheoreticallyPossibleMoves = this
      .getAllShipMovesIgnoringAvailableResources(
        gameState,
      );

    allTheoreticallyPossibleMoves.forEach((move) => {
      const player = gameState.getCurrentPlayer();
      const availableFavor = player.favor;
      const availableResources = player.getAvailableResourcesWithRecoloring();
      const actionOrNull = this.createActionIfAvailable(
        move,
        availableFavor,
        availableResources,
      );

      if (actionOrNull) {
        possibleActionsWithAvailableResources.push(actionOrNull);
      }
    });

    return possibleActionsWithAvailableResources;
  }

  public static doAction(
    _action: ShipMoveAction,
    _gameState: GameState,
  ): ResultWithMessage {
    return new Failure('Ship move not implemented yet');
  }

  public static areEqualMoveActions(aa: Action, action: Action): boolean {
    return aa.type === 'move' && action.type === 'move' &&
      aa.destination.q === action.destination.q &&
      aa.destination.r === action.destination.r &&
      aa.favorToExtendRange === action.favorToExtendRange &&
      aa.spend.equals(action.spend);
  }

  private static getAllShipMovesIgnoringAvailableResources(
    gameState: GameState,
  ): PossibleShipMove[] {
    const currentPlayer = gameState.getCurrentPlayer();
    const favorAvailableForRange = currentPlayer.favor;

    const movementSystem = new MovementSystem(gameState.getMap());
    const shipMoveHandler = new ShipMoveHandler(
      gameState,
      movementSystem,
    );
    const availableMoves = shipMoveHandler.getAvailableMoves(
      currentPlayer.getShipPosition(),
      currentPlayer.getRange(),
      favorAvailableForRange,
    );
    return availableMoves;
  }

  private static createActionIfAvailable(
    move: PossibleShipMove,
    availableFavor: number,
    availableResources: Resource[],
  ): ShipMoveAction | null {
    const suitableResource = availableResources.find((resource) => {
      return (
        move.effectiveColor === resource.getEffectiveColor() &&
        move.favorCost + resource.getRecolorCost() <= availableFavor
      );
    });

    if (suitableResource) {
      const action = this.createShipMoveAction(
        { q: move.q, r: move.r },
        suitableResource,
        move.favorCost,
      );
      return action;
    }

    return null;
  }

  private static createShipMoveAction(
    destination: HexCoordinates,
    spend: Resource,
    favorToExtendRange: number,
  ): ShipMoveAction {
    const action: ShipMoveAction = {
      type: 'move',
      destination,
      spend,
      favorToExtendRange,
    };
    return action;
  }
}
