import type { Action } from './actions.ts';
import type { GameState } from './GameState.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';

export class ActionResolver {
  public constructor() {
  }

  public getLegalActions(_state: GameState): Action[] {
    return [];
  }

  public applyAction(_state: GameState, _action: Action): ResultWithMessage {
    return Failure.create('applyAction not implemented yet');
  }

  public isTerminal(_state: GameState): boolean {
    return false;
  }
}
