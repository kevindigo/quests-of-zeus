import type { Action, ShipMoveAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import { MovementSystem } from './MovementSystem.ts';
import { Resource } from './Resource.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import { ShipMoveHandler } from './ShipMoveHandler.ts';
import type { PossibleShipMove } from './types.ts';

export class GameEngineMove {
  public static getMoveActions(gameState: GameState): Action[] {
    const player = gameState.getCurrentPlayer();
    const availableFavor = player.favor;
    const availableResources = player.getAvailableResourcesWithRecoloring();
    console.log(`GEM.gME: Evalating ${availableResources.length} resources`);
    const allPossibleMoves = this.getAllPossibleShipMovesWithFavor(gameState);
    const availableMoves = allPossibleMoves.filter((move) => {
      const suitableResource = availableResources.find((resource) => {
        console.log(
          `GEM.gME: Move 
          ${JSON.stringify(move.effectiveColor)} (${move.favorCost}) vs. 
          resource ${resource.getBaseColor()} (${resource.getRecolorCost()})`,
        );
        if (
          move.effectiveColor === resource.getEffectiveColor() &&
          move.favorCost + resource.getRecolorCost() <= availableFavor
        ) {
          console.log('GEM.gME: Yes!');
          return resource;
        }
        console.log('GEM.gME: Nope!');
        return null;
      });
      return suitableResource ? true : false;
    });
    const availableMoveActions: ShipMoveAction[] = availableMoves.map(
      (move) => {
        const action: ShipMoveAction = {
          type: 'move',
          subType: 'shipMove',
          destination: { q: move.q, r: move.r },
          spend: Resource.none,
          favorToExtendRange: move.favorCost,
        };
        return action;
      },
    );
    // FixMe: Need to filter out any moves where recoloring+rangeExtension > available favor
    return availableMoveActions;
  }

  public static doAction(
    _action: ShipMoveAction,
    _gameState: GameState,
  ): ResultWithMessage {
    return new Failure('Ship move not implemented yet');
  }

  public static areEqualMoveActions(aa: Action, action: Action): boolean {
    return aa.type === 'move' && action.type === 'move' &&
      aa.subType === action.subType &&
      aa.destination.q === action.destination.q &&
      aa.destination.r === action.destination.r &&
      aa.favorToExtendRange === action.favorToExtendRange &&
      aa.spend.equals(action.spend);
  }

  private static getAllPossibleShipMovesWithFavor(
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
}
