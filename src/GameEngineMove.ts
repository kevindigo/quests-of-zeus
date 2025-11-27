import type { Action, ShipMoveAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';

export class GameEngineMove {
  public static getMoveActions(_gameState: GameState): Action[] {
    const actions: Action[] = [];
    return actions;
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
}
