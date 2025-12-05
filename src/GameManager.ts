// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import type {
  Action,
  AdvanceGodAction,
  ColorActivateGodAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import { GameState } from './GameState.ts';
import { GameStateInitializer } from './GameStateInitializer.ts';
import { PhaseAdvancingGod } from './phases.ts';
import type { Player } from './Player.ts';
import { Resource } from './Resource.ts';
import type { CoreColor, GameEvent } from './types.ts';
import { type UiState, UiStateClass } from './UiState.ts';

export class GameManager {
  constructor() {
    this.state = new GameState();
    this.uiState = new UiStateClass();
    this.listeners = [];
  }

  public startNewGame(): void {
    new GameStateInitializer().initializeGameState(this.state);
    this.uiState.reset();
    this.showMessage('New game started');
  }

  public onEvent(listener: (event: GameEvent) => void) {
    console.log('GameManager adding onEvent listener');
    this.listeners.push(listener);
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

  public doAdvanceGod(godColor: CoreColor): void {
    const phaseName = this.getGameState().getPhaseName();
    const isAdvancingGodPhase = phaseName === PhaseAdvancingGod.phaseName;

    const selectedResource = this.getUiState().getSelectedResource();
    const resource = isAdvancingGodPhase ? Resource.none : selectedResource;

    const action: AdvanceGodAction = {
      type: 'advance',
      godColor: godColor,
      spend: resource,
    };

    this.doAction(action);
  }

  public doActivateGod(godColor: CoreColor): void {
    const action: ColorActivateGodAction = {
      type: 'color',
      subType: 'activateGod',
      color: godColor,
    };

    this.doAction(action);
  }

  private doAction(action: Action): void {
    const result = GameEngine.doAction(action, this.getGameState());
    if (result.success) {
      this.uiState.clearResourceSelection();
    }
    this.showMessage(result.message);
    this.notifyStateChanged();
  }

  private showMessage(message: string): void {
    this.emit({ type: 'message', text: message });
  }

  private notifyStateChanged(): void {
    this.emit({
      type: 'stateChange',
      gameState: this.getGameState(),
      uiState: this.getUiState(),
    });
  }

  private emit(event: GameEvent) {
    this.listeners.forEach((cb) => cb(event));
  }

  private state: GameState;
  private uiState: UiState;
  private listeners: ((event: GameEvent) => void)[];
}
