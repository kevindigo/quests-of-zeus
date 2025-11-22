import type { Action } from './actions.ts';
import type { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';

export class ActionResolver {
  public constructor(engine: GameEngine) {
    this.engine = engine;
    console.log(`Just here to avoid a compiler error: ${this.engine}`);
  }

  public getLegalActions(_state: GameState): Action[] {
    return [];
  }

  public applyAction(_state: GameState, _action: Action): ResultWithMessage {
    return new Failure('applyAction not implemented yet');
  }

  public isTerminal(_state: GameState): boolean {
    return true;
  }

  private readonly engine: GameEngine;
}
