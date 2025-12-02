import type {
  Action,
  DropCubeAction,
  DropStatueAction,
  ExploreShrineAction,
  FightMonsterAction,
  LoadCubeAction,
  LoadStatueAction,
  ShipMoveAction,
  TeleportAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import type { UiState } from './UiState.ts';

export class ControllerForHexClicks {
  public constructor(gameState: GameState, uiState: UiState) {
    this.gameState = gameState;
    this.uiState = uiState;
  }

  // FixMe: This should always rely on action rather than creating them
  public handleHexClick(
    action: Action,
    coordinates: HexCoordinates,
    favorCost: number,
  ): ResultWithMessage {
    const gameState = this.gameState;

    this.uiState.setSelectedCoordinates(coordinates);

    const cell = this.gameState.getMap().getCell(coordinates);
    if (!cell) {
      return new Failure(`No cell found at ${JSON.stringify(coordinates)}`);
    }

    const uiState = this.getUiState();
    const terrain = cell.terrain;
    switch (terrain) {
      case 'sea': {
        if (action.type === 'move') {
          const action: ShipMoveAction = {
            type: 'move',
            destination: coordinates,
            spend: uiState.getSelectedResource(),
            favorToExtendRange: favorCost,
          };
          const result = GameEngine.doAction(action, gameState);
          uiState.clearResourceSelection();
          return result;
        } else if (action.type === 'teleport') {
          const action: TeleportAction = {
            type: 'teleport',
            coordinates: coordinates,
          };
          const result = GameEngine.doAction(action, gameState);
          return result;
        } else {
          return new Failure('Hex click for unknown reason!');
        }
      }
      case 'shrine': {
        const action: ExploreShrineAction = {
          type: 'hex',
          subType: 'exploreShrine',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      case 'offerings': {
        const action: LoadCubeAction = {
          type: 'hex',
          subType: 'loadCube',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      case 'temple': {
        const action: DropCubeAction = {
          type: 'hex',
          subType: 'dropCube',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      case 'city': {
        const action: LoadStatueAction = {
          type: 'hex',
          subType: 'loadStatue',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      case 'statue': {
        const action: DropStatueAction = {
          type: 'hex',
          subType: 'dropStatue',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      case 'monsters': {
        const action: FightMonsterAction = {
          type: 'hex',
          subType: 'fightMonster',
          coordinates,
          spend: uiState.getSelectedResource(),
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
      }
      default:
        return new Failure(
          `Hex click not supported for ${
            JSON.stringify(coordinates)
          } of ${terrain}`,
        );
    }
  }

  private getUiState(): UiState {
    return this.uiState;
  }

  private gameState: GameState;
  private uiState: UiState;
}
