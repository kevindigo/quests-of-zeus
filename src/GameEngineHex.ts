import type { Action } from './actions.ts';
import type { GameState } from './GameState.ts';

export class GameEngineHex {
  public static getHexActions(gameState: GameState): Action[] {
    const actions: Action[] = [];
    if (gameState.getPhase() !== 'action') {
      return actions;
    }

    return actions;
  }
}
