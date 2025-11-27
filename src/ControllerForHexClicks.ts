import type {
  DropCubeAction,
  ExploreShrineAction,
  LoadCubeAction,
  ShipMoveAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameManager } from './GameManager.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import type { UiState } from './UiState.ts';

export class ControllerForHexClicks {
  public constructor(manager: GameManager) {
    this.gameManager = manager;
  }

  public getEngine(): GameManager {
    return this.gameManager;
  }

  public handleHexClick(
    coordinates: HexCoordinates,
    favorCost: number,
  ): ResultWithMessage {
    const gameState = this.gameManager.getGameState();
    if (gameState.getPhase() !== 'action') {
      return new Failure(
        `Cannot click hexes during the ${gameState.getPhase()} phase`,
      );
    }

    const effectiveColor = this.getUiState().getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure(
        'Please select a resource (die or oracle card) first!!',
      );
    }

    const currentPlayer = gameState.getCurrentPlayer();
    const resource = this.getUiState().getSelectedResource();

    if (resource.isCard() && currentPlayer.usedOracleCardThisTurn) {
      return new Failure('Cannot use more than 1 oracle card per turn');
    }

    const dice = currentPlayer.oracleDice;
    if (resource.isDie() && !dice.includes(resource.getBaseColor())) {
      const color = resource.getBaseColor();
      return new Failure(`Color ${color} not in dice ${JSON.stringify(dice)}`);
    }

    const cards = currentPlayer.oracleCards;
    if (resource.isCard() && !cards.includes(resource.getBaseColor())) {
      const color = resource.getBaseColor();
      return new Failure(
        `Color ${color} not in cards ${JSON.stringify(cards)}`,
      );
    }

    this.gameManager.getUiState().setSelectedCoordinates(coordinates);

    const cell = this.gameManager.getGameState().getMap().getCell(coordinates);
    if (!cell) {
      return new Failure(`No cell found at ${JSON.stringify(coordinates)}`);
    }

    const uiState = this.getUiState();
    const terrain = cell.terrain;
    switch (terrain) {
      case 'sea': {
        const action: ShipMoveAction = {
          type: 'move',
          destination: coordinates,
          spend: uiState.getSelectedResource(),
          favorToExtendRange: favorCost,
        };
        const result = GameEngine.doAction(action, gameState);
        uiState.clearResourceSelection();
        return result;
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
      default:
        return new Failure(
          `Hex click not supported for ${
            JSON.stringify(coordinates)
          } of ${terrain}`,
        );
    }
  }

  private getUiState(): UiState {
    return this.gameManager.getUiState();
  }

  private gameManager: GameManager;
}
