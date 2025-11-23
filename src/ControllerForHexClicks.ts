import type { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './MovementSystem.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { ShipMoveHandler } from './ShipMoveHandler.ts';
import type { MoveShipResult } from './types.ts';

export class ControllerForHexClicks {
  public constructor(engine: GameManager) {
    this.gameEngine = engine;
  }

  public getEngine(): GameManager {
    return this.gameEngine;
  }

  private getState(): GameState {
    return this.getEngine().getGameState();
  }

  public handleHexClick(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    const gameState = this.gameEngine.getGameStateSnapshot();
    if (gameState.getPhase() !== 'action') {
      return new Failure(
        `Cannot click hexes during the ${gameState.getPhase()} phase`,
      );
    }

    const effectiveColor = this.gameEngine.getEffectiveSelectedColor();
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

      return new Failure(
        'Please select a resource (die or oracle card) first!!',
      );
    }

    const currentPlayer = gameState.getCurrentPlayer();
    // const selectedOracleCardColor = gameState.getSelectedOracleCardColor();
    const selectedResource = this.getEngine().getSelectedResource();

    if (selectedResource.isCard() && currentPlayer.usedOracleCardThisTurn) {
      return new Failure('Cannot use more than 1 oracle card per turn');
    }
    if (
      selectedResource.isDie() &&
      !currentPlayer.oracleDice.includes(selectedResource.getColor())
    ) {
      return new Failure(
        `Color ${selectedResource.getColor()} not in dice ${
          JSON.stringify(currentPlayer.oracleDice)
        }`,
      );
    }
    if (
      selectedResource.isCard() &&
      !currentPlayer.oracleCards.includes(selectedResource.getColor())
    ) {
      return new Failure(
        `Color ${selectedResource.getColor()} not in cards ${
          JSON.stringify(currentPlayer.oracleCards)
        }`,
      );
    }

    const cell = this.gameEngine.getGameState().getMap().getCell(coordinates);
    if (!cell) {
      return new Failure(`No cell found at ${JSON.stringify(coordinates)}`);
    }

    const terrain = cell.terrain;
    switch (terrain) {
      case 'sea': {
        return this.handleMoveWithDieOrCard(coordinates);
      }
      case 'shrine': {
        return this.handleShrineWithDieOrCard(
          coordinates,
        );
      }
      case 'offerings': {
        return this.handleOfferingsWithDieOrCard(coordinates);
      }
      case 'temple': {
        return this.handleTempleWithDieOrCard(coordinates);
      }
      default:
        return new Failure(
          `Hex click not supported for ${
            JSON.stringify(coordinates)
          } of ${terrain}`,
        );
    }
  }

  private handleMoveWithDieOrCard(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    const state = this.getState();
    const currentPlayer = state.getCurrentPlayer();
    const effectiveColor = this.gameEngine.getEffectiveSelectedColor();
    const recoloringCost = this.gameEngine.getSelectedRecoloring();
    const availableFavor = currentPlayer.favor;
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);
    // Get available moves for the selected color and available favor
    const uiState = this.getEngine().getUiState();
    const movementSystem = new MovementSystem(state.getMap());
    const moveShipHandler = new ShipMoveHandler(state, uiState, movementSystem);
    const availableMoves = moveShipHandler.getAvailableMovesForColor(
      maxFavorForMovement,
    );

    const q = coordinates.q;
    const r = coordinates.r;
    const targetMove = availableMoves.find((move) =>
      move.q === q && move.r === r
    );

    if (!targetMove) {
      return new Failure(
        `Cannot move to this hex using ${effectiveColor}!` +
          'Must be a sea hex within range of matching color.',
      );
    }

    const favorSpentForRange = targetMove.favorCost;

    const selectedResource = this.getEngine().getSelectedResource();
    const selectedDieColor = selectedResource.isDie()
      ? selectedResource.getColor()
      : null;
    const selectedOracleCardColor = selectedResource.isCard()
      ? selectedResource.getColor()
      : null;
    const moveResult = this.gameEngine.moveShip(
      currentPlayer.id,
      q,
      r,
      selectedResource,
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
      return new Success(message);
    } else {
      // Debug: Log the failure details
      console.log('Move failed with details:', {
        playerId: currentPlayer.id,
        targetQ: q,
        targetR: r,
        dieColor: selectedDieColor,
        favorSpent: this.gameEngine.getSelectedRecoloring(),
        playerFavor: currentPlayer.favor,
        playerDice: currentPlayer.oracleDice,
        recolorIntention: this.gameEngine.getSelectedRecoloring(),
        moveResult,
      });

      return new Failure(ControllerForHexClicks.formatMoveErrorMessage(
        moveResult.error,
      ));
    }
  }

  private handleShrineWithDieOrCard(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    if (!this.isLandHexClickable(coordinates)) {
      return new Failure('That shrine is not available');
    }
    return this.getEngine().activateShrine(coordinates);
  }

  private handleOfferingsWithDieOrCard(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    if (!this.isLandHexClickable(coordinates)) {
      return new Failure('That offering is not available');
    }
    return this.getEngine().activateOffering(coordinates);
  }

  private handleTempleWithDieOrCard(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    if (!this.isLandHexClickable(coordinates)) {
      return new Failure('That temple is not available');
    }
    return this.getEngine().activateTemple(coordinates);
  }

  private isLandHexClickable(coordinates: HexCoordinates): boolean {
    const engine = this.getEngine();
    const cells = engine.getAvailableLandInteractions();
    const found = cells.find((cell) => {
      return (cell.q === coordinates.q && cell.r === coordinates.r);
    });
    return found ? true : false;
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

  private gameEngine: GameManager;
}
