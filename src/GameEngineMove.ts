import { type Action, Actions, type MoveShipAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { PhaseTeleporting } from './phases.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { ShipMoveFinder } from './ShipMoveFinder.ts';
import type { PossibleShipMove } from './types.ts';

export class GameEngineMove {
  public static getMoveActions(gameState: GameState): Action[] {
    const possibleActionsWithAvailableResources: MoveShipAction[] = [];

    const allTheoreticallyPossibleMoves = this
      .getAllShipMovesIgnoringAvailableResources(
        gameState,
      );

    allTheoreticallyPossibleMoves.forEach((move) => {
      const player = gameState.getCurrentPlayer();
      const availableFavor = player.favor;
      const availableResources = player.getAvailableResourcesWithRecoloring();
      const actionAvailableGivenResources = this.createActionsIfAvailable(
        move,
        availableFavor,
        availableResources,
      );

      possibleActionsWithAvailableResources.push(
        ...actionAvailableGivenResources,
      );
    });

    return possibleActionsWithAvailableResources;
  }

  public static doAction(
    action: MoveShipAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngine.getAvailableActions(gameState);
    if (!Actions.find(availableActions, action)) {
      return new Failure(
        `ShipMoveAction not available ${JSON.stringify(action)}`,
      );
    }

    const player = gameState.getCurrentPlayer();
    GameEngine.spendResource(gameState, action.spend);
    player.setShipPosition(action.destination);
    player.favor -= action.favorToExtendRange;
    if (gameState.getPhaseName() === PhaseTeleporting.phaseName) {
      player.resetGod('blue');
    }

    gameState.endPhase();
    return new Success(`Ship moved per ${JSON.stringify(action)}`);
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

    const shipMoveHandler = new ShipMoveFinder(gameState);
    const availableMoves = shipMoveHandler.getAvailableMoves(
      currentPlayer.getShipPosition(),
      currentPlayer.getRange(),
      favorAvailableForRange,
    );
    return availableMoves;
  }

  private static createActionsIfAvailable(
    move: PossibleShipMove,
    availableFavor: number,
    availableResources: Resource[],
  ): MoveShipAction[] {
    const suitableResources = availableResources.filter((resource) => {
      return (
        move.effectiveColor === resource.getEffectiveColor() &&
        move.favorCost + resource.getRecolorCost() <= availableFavor
      );
    });

    const actions = suitableResources.map((resource) => {
      const action = this.createShipMoveAction(
        { q: move.q, r: move.r },
        resource,
        move.favorCost,
      );
      return action;
    });

    return actions;
  }

  private static createShipMoveAction(
    destination: HexCoordinates,
    spend: Resource,
    favorToExtendRange: number,
  ): MoveShipAction {
    const action: MoveShipAction = {
      type: 'move',
      destination,
      spend,
      favorToExtendRange,
    };
    return action;
  }
}
