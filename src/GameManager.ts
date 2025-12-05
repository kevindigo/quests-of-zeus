// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import type { AdvanceGodAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import { GameState } from './GameState.ts';
import { GameStateInitializer } from './GameStateInitializer.ts';
import { PhaseAdvancingGod } from './phases.ts';
import type { Player } from './Player.ts';
import { Resource } from './Resource.ts';
import type { ResultWithMessage } from './ResultWithMessage.ts';
import type { CoreColor } from './types.ts';
import { type UiState, UiStateClass } from './UiState.ts';

export class GameManager {
  constructor() {
    this.state = new GameState();
    this.uiState = new UiStateClass();
  }

  public startNewGame(): void {
    new GameStateInitializer().initializeGameState(this.state);
    this.uiState.reset();
  }

  public getGameState(): GameState {
    return this.state;
  }

  public getCurrentPlayer(): Player {
    return this.state.getCurrentPlayer();
  }

  public getPlayer(playerId: number): Player {
    return this.state.getPlayer(playerId);
  }

  public getUiState(): UiState {
    return this.uiState;
  }

  public doAdvanceGod(godColor: CoreColor): ResultWithMessage {
    const phaseName = this.getGameState().getPhaseName();
    const isAdvancingGodPhase = phaseName === PhaseAdvancingGod.phaseName;

    const selectedResource = this.getUiState().getSelectedResource();
    const resource = isAdvancingGodPhase ? Resource.none : selectedResource;

    const action: AdvanceGodAction = {
      type: 'advance',
      godColor: godColor,
      spend: resource,
    };

    return GameEngine.doAction(action, this.getGameState());
  }

  private state: GameState;
  private uiState: UiState;
}
