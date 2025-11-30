// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameState } from './GameState.ts';
import { GameStateInitializer } from './GameStateInitializer.ts';
import type { Player } from './Player.ts';
import { type UiState, UiStateClass } from './UiState.ts';

export class GameManager {
  constructor() {
    this.state = new GameState();
    this.uiState = new UiStateClass();
    this.startNewGame();
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

  private state: GameState;
  private uiState: UiState;
}
