import type { Action, ColorAction, ColorActivateGodAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import { COLOR_WHEEL } from './types.ts';

export class GameEngineColor {
  public static getColorActions(
    gameState: GameState,
  ): Action[] {
    const actions = [];
    actions.push(...this.getActivateGodActions(gameState));

    return actions;
  }

  private static getActivateGodActions(
    gameState: GameState,
  ): ColorActivateGodAction[] {
    const actions: ColorActivateGodAction[] = [];

    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const player = gameState.getCurrentPlayer();
    COLOR_WHEEL.forEach((color) => {
      const level = player.getGodLevel(color);
      if (level >= maxLevel) {
        const action: ColorActivateGodAction = {
          type: 'color',
          subType: 'activateGod',
          color: color,
        };
        actions.push(action);
      }
    });
    return actions;
  }

  public static doAction(
    _action: ColorAction,
    _gameState: GameState,
  ): ResultWithMessage {
    return new Failure('Color actions not implemented yet');
  }
}
