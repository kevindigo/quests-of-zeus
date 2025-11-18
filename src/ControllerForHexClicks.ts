import type { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { OracleSystem } from './oracle-system.ts';
import type { Player } from './Player.ts';
import type {
  ControllerActionResult,
  CoreColor,
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
    selectedDieColor: CoreColor | null,
    selectedOracleCardColor: CoreColor | null,
  ): ControllerActionResult {
    const gameState = this.gameEngine.getGameStateSnapshot();
    if (gameState.getPhase() !== 'action') {
      return {
        success: false,
        message: `Cannot click hexes during the ${gameState.getPhase()} phase`,
      };
    }

    const selectedColor = selectedDieColor || selectedOracleCardColor;
    if (!selectedColor) {
      return {
        success: false,
        message: 'Please select a resource (die or oracle card) first!!',
      };
    }

    const currentPlayer = gameState.getCurrentPlayer();
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
      return this.handleMoveWithDieOrCard(
        currentPlayer,
        coordinates,
        selectedDieColor,
        selectedOracleCardColor,
        selectedColor,
        gameState.getRecolorIntention(currentPlayer.id),
      );
    }

    if (terrain === 'shrine') {
      return {
        success: false,
        message: 'Hex click not supported for shrine yet',
      };
    }

    return {
      success: false,
      message: `Hex click not supported for ${
        JSON.stringify(coordinates)
      } of ${terrain}`,
    };
  }

  private handleMoveWithDieOrCard(
    currentPlayer: Player,
    coordinates: HexCoordinates,
    selectedDieColor: CoreColor | null,
    selectedOracleCardColor: CoreColor | null,
    selectedColor: CoreColor,
    recoloringCost: number,
  ): ControllerActionResult {
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      recoloringCost,
    );
    const availableFavor = currentPlayer.favor;
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);
    // Get available moves for the selected color and available favor
    const availableMoves = this.gameEngine.getAvailableMovesForColor(
      currentPlayer,
      effectiveColor,
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

    // Confirm spending favor?

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
        favorSpent: this.getState().getRecolorIntention(currentPlayer.id),
        playerFavor: currentPlayer.favor,
        playerDice: currentPlayer.oracleDice,
        recolorIntention: this.getState().getRecolorIntention(currentPlayer.id),
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
