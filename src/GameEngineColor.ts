import type { ColorAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';

export class GameEngineColor {
  public static getColorActions(_gameState: GameState): ColorAction[] {
    const actions: ColorAction[] = [];
    return actions;
  }

  public static doAction(
    action: ColorAction,
    _gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      default:
        break;
    }

    return new Failure(
      'Color action not implemented: ' + JSON.stringify(action),
    );
  }
}
