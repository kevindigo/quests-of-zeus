// Player action implementations for Quests of Zeus
import type { GameState } from './GameState.ts';
import { HexGrid } from './hexmap/HexGrid.ts';
import type { MovementSystem } from './MovementSystem.ts';
import { OracleSystem } from './OracleSystem.ts';
import type { CoreColor, MoveShipResult, PossibleShipMove } from './types.ts';
import type { UiState } from './UiState.ts';

export class ShipMoveHandler {
  constructor(
    private gameState: GameState,
    private uiState: UiState,
    private movementSystem: MovementSystem,
  ) {}

  public getGameState(): GameState {
    return this.gameState;
  }

  public getUiState(): UiState {
    return this.uiState;
  }

  public getMovementSystem(): MovementSystem {
    return this.movementSystem;
  }

  public getAvailableMovesForColor(
    effectiveColor: CoreColor,
    maxFavorForMovement: number,
  ): PossibleShipMove[] {
    const player = this.gameState.getCurrentPlayer();
    const origin = player.getShipPosition();

    const availableMoves: PossibleShipMove[] = [];
    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const movementRange = player.getRange() + favorSpent;
      const reachableSeaCells = this.movementSystem!.getReachableSeaTiles(
        origin,
        movementRange,
      );

      const relevantCells = reachableSeaCells.filter((cell) => {
        if (HexGrid.isSameLocation(cell, origin)) {
          return false;
        }
        if (cell.color !== effectiveColor) {
          return false;
        }
        return true;
      });

      relevantCells.forEach((cell) => {
        const possibleMove = {
          q: cell.q,
          r: cell.r,
          effectiveColor: cell.color,
          favorCost: favorSpent,
        };

        if (!this.alreadyContainsMove(availableMoves, possibleMove)) {
          availableMoves.push(possibleMove);
        }
      });
    }

    return availableMoves;
  }

  private alreadyContainsMove(
    availableMoves: PossibleShipMove[],
    candidateMove: PossibleShipMove,
  ): boolean {
    const found = availableMoves.find((move) => {
      return HexGrid.isSameLocation(move, candidateMove);
    });
    return found ? true : false;
  }

  public attemptMoveShip(
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    // validate state
    const phase = this.gameState.getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        error: { type: 'wrong_phase', message: 'whatever', details: { phase } },
      };
    }
    // validate player
    const player = this.gameState.getCurrentPlayer();
    if (this.gameState.getCurrentPlayerIndex() !== player.id) {
      return {
        success: false,
        error: { type: 'invalid_player', message: 'not current player' },
      };
    }

    const selectedResource = this.uiState.getSelectedResource();
    if (!selectedResource.hasColor()) {
      return {
        success: false,
        error: {
          type: 'no_die_or_card',
          message: 'must spend either die or card',
        },
      };
    }
    // validate die (if spent)
    if (selectedResource.isDie()) {
      if (player.oracleDice.indexOf(selectedResource.getBaseColor()) < 0) {
        return {
          success: false,
          error: {
            type: 'die_not_available',
            message:
              `no ${selectedResource.getBaseColor()} die available in ${player.oracleDice}`,
            details: {
              dieColor: selectedResource.getBaseColor(),
              availableDice: player.oracleDice,
            },
          },
        };
      }
    }
    // validate card (if spent)
    if (selectedResource.isCard()) {
      if (player.oracleCards.indexOf(selectedResource.getBaseColor()) < 0) {
        return {
          success: false,
          error: {
            type: 'card_not_available',
            message:
              `no ${selectedResource.getBaseColor()} card available in ${player.oracleCards}`,
            details: {
              dieColor: selectedResource.getBaseColor(),
              availableDice: player.oracleCards,
            },
          },
        };
      }
      if (player.usedOracleCardThisTurn) {
        return {
          success: false,
          error: {
            type: 'second_card',
            message: 'Already used a card this turn',
          },
        };
      }
    }

    // FixMe: I think all the validations below should be replaced by
    // a call to get all valid moves. If it's listed, it's valid.

    // validate destination coordinates
    const destination = this.uiState.getSelectedCoordinates();
    if (!destination) {
      return {
        success: false,
        error: { type: 'unknown', message: 'Destination was null' },
      };
    }

    if (
      JSON.stringify(destination) === JSON.stringify(player.getShipPosition())
    ) {
      return {
        success: false,
        error: {
          type: 'invalid_target',
          message: 'already there',
          details: { targetQ: destination.q, targetR: destination.r },
        },
      };
    }
    const map = this.gameState.getMap();
    const radius = map.getHexGrid().getRadius();
    if (Math.abs(destination.q) > radius || Math.abs(destination.r) > radius) {
      return {
        success: false,
        error: {
          type: 'invalid_target',
          message: 'off the map',
          details: { targetQ: destination.q, targetR: destination.r },
        },
      };
    }
    // validate enough favor available
    if (favorSpentForRange + favorSpentToRecolor > player.favor) {
      return {
        success: false,
        error: {
          type: 'not_enough_favor',
          message:
            `${favorSpentForRange} + ${favorSpentToRecolor} > ${player.favor}`,
        },
      };
    }
    // validate destination is sea
    const destinationCell = map.getCell(destination);
    const terrain = destinationCell?.terrain;
    if (terrain !== 'sea') {
      return {
        success: false,
        error: {
          type: 'not_sea',
          message: `Destination ${JSON.stringify(destinationCell)} not sea`,
          details: {
            targetTerrain: terrain || 'unknown',
          },
        },
      };
    }
    // validate destination color matches effective color
    const effectiveColor = OracleSystem.applyRecolor(
      selectedResource.getBaseColor(),
      favorSpentToRecolor,
    );
    if (effectiveColor !== destinationCell?.color) {
      return {
        success: false,
        error: {
          type: 'wrong_color',
          message: `Used ${effectiveColor} to try to get to ${
            JSON.stringify(destinationCell)
          }`,
        },
      };
    }
    // validate destination is in range
    const availableRange = player.getRange() + favorSpentForRange;
    const validation = this.movementSystem.validateMove(
      player.getShipPosition(),
      destination.q,
      destination.r,
      effectiveColor,
      availableRange,
      destinationCell,
    );
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'not_reachable',
          message: validation.error || 'Unknown validation failure',
        },
      };
    }
    // move the ship, spend the favor, spend the die/card
    player.setShipPosition(destination);
    player.favor -= favorSpentForRange;
    player.favor -= favorSpentToRecolor;
    if (selectedResource.isCard()) {
      player.usedOracleCardThisTurn = true;
    }
    this.gameState.removeSpentResourceFromPlayer(player, selectedResource);

    // log and return results
    return {
      success: true,
    };
  }
}
