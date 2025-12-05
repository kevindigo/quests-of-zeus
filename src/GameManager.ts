// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import type {
  Action,
  AdvanceGodAction,
  ColorActivateGodAction,
  FreeEndTurnAction,
  HexDropCubeAction,
  HexDropStatueAction,
  HexExploreShrineAction,
  HexFightMonsterAction,
  HexLoadCubeAction,
  HexLoadStatueAction,
  HexPeekShrineAction,
  MoveShipAction,
  ResourceGainFavorAction,
  ResourceGainOracleCardAction,
  ResourceGainTwoPeeks,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import { GameState } from './GameState.ts';
import { GameStateInitializer } from './GameStateInitializer.ts';
import {
  PhaseAdvancingGod,
  PhaseExploring,
  PhaseMain,
  PhasePeeking,
  PhaseTeleporting,
} from './phases.ts';
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
    this.notifyStateChanged();
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

  public doEndTurn(): void {
    const action: FreeEndTurnAction = {
      type: 'free',
      subType: 'endTurn',
    };
    this.doAction(action);
  }

  public dospendResourceForFavor(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: ResourceGainFavorAction = {
      type: 'resource',
      subType: 'gainFavor',
      spend: selectedResource,
    };
    this.doAction(action);
  }

  public doSpendResourceForCard(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: ResourceGainOracleCardAction = {
      type: 'resource',
      subType: 'gainOracleCard',
      spend: selectedResource,
    };
    this.doAction(action);
  }

  public doSpendResourceForTwoPeeks(): void {
    this.showMessage('doSpendResourceForTwoPeeks');
    const selectedResource = this.getUiState().getSelectedResource();
    const action: ResourceGainTwoPeeks = {
      type: 'resource',
      subType: 'gainTwoPeeks',
      spend: selectedResource,
    };
    this.doAction(action);
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

  public doHexClickAction(favorCost: number): void {
    const action = this.getHexClickAction(
      this.getGameState(),
      this.getUiState(),
      favorCost,
    );
    if (!action) {
      this.showMessage('Failed to create action');
      return;
    }

    this.doAction(action);
  }

  private getHexClickAction(
    gameState: GameState,
    uiState: UiState,
    favorCost: number,
  ): Action | null {
    const phase = gameState.getPhase();
    const coordinates = uiState.getSelectedCoordinates();
    if (!coordinates) {
      return null;
    }

    if (phase.getName() === PhaseTeleporting.phaseName) {
      const action: MoveShipAction = {
        type: 'move',
        destination: coordinates,
        spend: Resource.none,
        favorToExtendRange: 0,
      };
      return action;
    }

    if (phase.getName() === PhaseExploring.phaseName) {
      const action: HexExploreShrineAction = {
        type: 'hex',
        subType: 'exploreShrine',
        coordinates: coordinates,
        spend: Resource.none,
      };
      return action;
    }

    if (phase.getName() === PhasePeeking.phaseName) {
      const action: HexPeekShrineAction = {
        type: 'hex',
        subType: 'peekShrine',
        coordinates: coordinates,
        spend: Resource.none,
      };
      return action;
    }

    const resource = uiState.getSelectedResource();
    const map = gameState.getMap();
    const cell = map.getCell(coordinates);
    if (!cell) {
      return null;
    }
    if (phase.getName() === PhaseMain.phaseName) {
      switch (cell.terrain) {
        case 'zeus':
          return null;
        case 'sea': {
          const action: MoveShipAction = {
            type: 'move',
            destination: coordinates,
            spend: resource,
            favorToExtendRange: favorCost,
          };
          return action;
        }
        case 'shallow':
          return null;
        case 'monsters': {
          const action: HexFightMonsterAction = {
            type: 'hex',
            subType: 'fightMonster',
            coordinates,
            spend: resource,
          };
          return action;
        }
        case 'offerings': {
          const action: HexLoadCubeAction = {
            type: 'hex',
            subType: 'loadCube',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'temple': {
          const action: HexDropCubeAction = {
            type: 'hex',
            subType: 'dropCube',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'shrine': {
          const action: HexExploreShrineAction = {
            type: 'hex',
            subType: 'exploreShrine',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'city': {
          const action: HexLoadStatueAction = {
            type: 'hex',
            subType: 'loadStatue',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'statue': {
          const action: HexDropStatueAction = {
            type: 'hex',
            subType: 'dropStatue',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
      }
    }

    return null;
  }

  private doAction(action: Action): void {
    const result = GameEngine.doAction(action, this.getGameState());
    if (result.success) {
      this.uiState.clearResourceSelection();
    }
    result.getMessages().forEach((message) => {
      this.showMessage(message);
    });
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
