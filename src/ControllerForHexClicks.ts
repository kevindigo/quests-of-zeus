import { ActionMove } from './ActionMoveShip.ts';
import type { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './movement-system.ts';
import type {
  ControllerActionResult,
  MoveShipResult,
  TerrainType,
} from './types.ts';

export class ControllerForHexClicks {
  public constructor(engine: GameEngine) {
    this.gameEngine = engine;
  }

  public getEngine(): GameEngine {
    return this.gameEngine;
  }

  private getState(): GameState {
    return this.getEngine().getGameState();
  }

  public handleHexClick(
    coordinates: HexCoordinates,
    terrain: TerrainType,
  ): ControllerActionResult {
    const gameState = this.gameEngine.getGameStateSnapshot();
    if (gameState.getPhase() !== 'action') {
      return {
        success: false,
        message: `Cannot click hexes during the ${gameState.getPhase()} phase`,
      };
    }

    const effectiveColor = this.getState().getEffectiveSelectedColor();
    if (!effectiveColor) {
      // DEBUGGING!!!
      {
        const shrineHex = gameState.findShrineHexAt(coordinates);
        if (shrineHex) {
          console.log(
            `handleHexClick on ${JSON.stringify(shrineHex)}`,
          );
        }
      }
      // END DEBUGGING!!!

      return {
        success: false,
        message: 'Please select a resource (die or oracle card) first!!',
      };
    }

    const currentPlayer = gameState.getCurrentPlayer();
    const selectedOracleCardColor = gameState.getSelectedOracleCardColor();
    const selectedDieColor = gameState.getSelectedDieColor();

    if (selectedOracleCardColor && currentPlayer.usedOracleCardThisTurn) {
      return {
        success: false,
        message: 'Cannot use more than 1 oracle card per turn',
      };
    }
    if (
      selectedDieColor && !currentPlayer.oracleDice.includes(selectedDieColor)
    ) {
      return {
        success: false,
        message: `Color ${selectedDieColor} not in dice ${
          JSON.stringify(currentPlayer.oracleDice)
        }`,
      };
    }
    if (
      selectedOracleCardColor &&
      !currentPlayer.oracleCards.includes(selectedOracleCardColor)
    ) {
      return {
        success: false,
        message: `Color ${selectedOracleCardColor} not in cards ${
          JSON.stringify(currentPlayer.oracleCards)
        }`,
      };
    }

    if (terrain === 'sea') {
      return this.handleMoveWithDieOrCard(coordinates);
    }

    if (terrain === 'shrine') {
      return this.handleShrineWithDieOrCard(
        coordinates,
      );
    }

    return {
      success: false,
      message: `Hex click not supported for ${
        JSON.stringify(coordinates)
      } of ${terrain}`,
    };
  }

  private handleMoveWithDieOrCard(
    coordinates: HexCoordinates,
  ): ControllerActionResult {
    const state = this.getState();
    const currentPlayer = state.getCurrentPlayer();
    const effectiveColor = state.getEffectiveSelectedColor();
    const recoloringCost = state.getSelectedRecoloring();
    const availableFavor = currentPlayer.favor;
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);
    // Get available moves for the selected color and available favor
    const movementSystem = new MovementSystem(state.map);
    const actionMoveShip = new ActionMove(state, movementSystem);
    const availableMoves = actionMoveShip.getAvailableMovesForColor(
      maxFavorForMovement,
    );

    const q = coordinates.q;
    const r = coordinates.r;
    const targetMove = availableMoves.find((move) =>
      move.q === q && move.r === r
    );

    if (!targetMove) {
      return {
        success: false,
        message:
          `Cannot move to this hex using ${effectiveColor}! Must be a sea hex within range of matching color.`,
      };
    }

    const favorSpentForRange = targetMove.favorCost;

    const selectedDieColor = state.getSelectedDieColor();
    const selectedOracleCardColor = state.getSelectedOracleCardColor();
    const moveResult = this.gameEngine.moveShip(
      currentPlayer.id,
      q,
      r,
      selectedDieColor || undefined,
      selectedOracleCardColor || undefined,
      recoloringCost,
      favorSpentForRange,
    );
    if (moveResult.success) {
      const selectedColor = selectedDieColor || selectedOracleCardColor;
      let message = `Ship moved to (${q}, ${r}) using ${selectedColor}`;
      if (recoloringCost > 0) {
        message +=
          ` spending ${recoloringCost} to recolor to ${effectiveColor}`;
      }
      if (favorSpentForRange > 0) {
        message += ` spending ${favorSpentForRange} to extend range`;
      }
      return {
        success: true,
        message,
      };
    } else {
      // Debug: Log the failure details
      console.log('Move failed with details:', {
        playerId: currentPlayer.id,
        targetQ: q,
        targetR: r,
        dieColor: selectedDieColor,
        favorSpent: this.getState().getSelectedRecoloring(),
        playerFavor: currentPlayer.favor,
        playerDice: currentPlayer.oracleDice,
        recolorIntention: this.getState().getSelectedRecoloring(),
        moveResult,
      });

      return {
        success: false,
        message: ControllerForHexClicks.formatMoveErrorMessage(
          moveResult.error,
        ),
      };
    }
  }

  private handleShrineWithDieOrCard(
    coordinates: HexCoordinates,
  ): ControllerActionResult {
    const engine = this.getEngine();
    const state = engine.getGameState();
    const color = state.getEffectiveSelectedColor();
    if (!color) {
      return {
        success: false,
        message: 'Handler needs a selected color',
      };
    }

    const cells = engine.getAvailableLandInteractions();
    const thisShrine = cells.find((cell) => {
      const isShrine = cell.terrain === 'shrine';
      const isCorrectColor = cell.color === color;
      const at = cell.getCoordinates();
      const isCorrectPlace = at.q === coordinates.q && at.r === coordinates.r;
      return (isShrine && isCorrectColor && isCorrectPlace);
    });
    if (!thisShrine) {
      return {
        success: false,
        message: 'That shrine is not available',
      };
    }
    return this.getEngine().activateShrine(coordinates);
  }

  /**
   * Format a detailed error message from move ship result
   */
  private static formatMoveErrorMessage(
    error?: MoveShipResult['error'],
  ): string {
    if (!error) {
      return 'Invalid move! Unknown error occurred.';
    }

    switch (error.type) {
      case 'invalid_player':
        return 'Invalid player or not your turn!';

      case 'wrong_phase':
        return `Cannot move during ${error.details?.phase} phase!`;

      case 'invalid_target':
        return `Target cell (${error.details?.targetQ}, ${error.details?.targetR}) does not exist!`;

      case 'not_sea':
        return `Cannot move to ${error.details?.targetTerrain} terrain! Ships can only move to sea hexes.`;

      case 'no_die_or_card':
        return 'No die color specified for movement! Please select a die first.';

      case 'die_not_available':
        return `You don't have a ${error.details?.dieColor} die! Available dice: ${
          error.details?.availableDice?.join(', ') || 'none'
        }.`;

      case 'card_not_available':
        return `You don't have a ${error.details?.dieColor} card! Available cards: ${
          error.details?.availableDice?.join(', ') || 'none'
        }.`;

      case 'wrong_color':
        return `Target hex is ${error.details?.targetColor}, but die is ${error.details?.requiredColor}!`;

      case 'not_reachable':
        return `Target is not reachable within ${error.details?.movementRange} movement range!`;

      case 'not_enough_favor':
        return `Not enough favor! Need ${error.details?.favorSpent} but only have ${error.details?.availableFavor}.`;

      case 'recoloring_failed':
        return `Recoloring failed! Not enough favor for recoloring cost of ${error.details?.recoloringCost}.`;

      case 'unknown':
      default:
        return 'Invalid move! Please check your die selection, favor, and target hex.';
    }
  }

  private gameEngine: GameEngine;
}
