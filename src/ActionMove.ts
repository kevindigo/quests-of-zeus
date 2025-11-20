// Player action implementations for Quests of Zeus
import type { GameState } from './GameState.ts';
import { type HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import type { MovementSystem } from './MovementSystem.ts';
import { OracleSystem } from './OracleSystem.ts';
import type { Player } from './Player.ts';
import type { CoreColor, MoveShipResult, PossibleShipMove } from './types.ts';

export class ActionMove {
  constructor(
    private state: GameState,
    private movementSystem: MovementSystem,
  ) {}

  public getState(): GameState {
    return this.state;
  }

  public getMovementSystem(): MovementSystem {
    return this.movementSystem;
  }

  public getAvailableMovesForColor(
    maxFavorForMovement: number,
  ): PossibleShipMove[] {
    const player = this.state.getCurrentPlayer();
    const origin = player.getShipPosition();
    const effectiveColor = this.state.getEffectiveSelectedColor();

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
        const possibleMove = { q: cell.q, r: cell.r, favorCost: favorSpent };

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
    player: Player,
    destination: HexCoordinates,
    dieSpent: CoreColor | undefined,
    cardSpent: CoreColor | undefined,
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    // validate state
    const phase = this.state.getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        error: { type: 'wrong_phase', message: 'whatever', details: { phase } },
      };
    }
    // validate player
    if (this.state.getCurrentPlayerIndex() !== player.id) {
      return {
        success: false,
        error: { type: 'invalid_player', message: 'not current player' },
      };
    }
    // validate die OR card but not both
    if (dieSpent && cardSpent) {
      return {
        success: false,
        error: {
          type: 'both_die_and_card',
          message: 'cannot spend both die and card',
        },
      };
    }

    const originalColor = dieSpent || cardSpent;
    if (!originalColor) {
      return {
        success: false,
        error: {
          type: 'no_die_or_card',
          message: 'must spend either die or card',
        },
      };
    }
    // validate die (if spent)
    if (dieSpent) {
      if (player.oracleDice.indexOf(dieSpent) < 0) {
        return {
          success: false,
          error: {
            type: 'die_not_available',
            message: `no ${dieSpent} die available in ${player.oracleDice}`,
            details: {
              dieColor: originalColor,
              availableDice: player.oracleDice,
            },
          },
        };
      }
    }
    // validate card (if spent)
    if (cardSpent) {
      if (player.oracleCards.indexOf(cardSpent) < 0) {
        return {
          success: false,
          error: {
            type: 'card_not_available',
            message: `no ${cardSpent} card available in ${player.oracleCards}`,
            details: {
              dieColor: originalColor,
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

    // validate destination coordinates
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
    const map = this.state.map;
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
      originalColor,
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
    if (cardSpent) {
      player.usedOracleCardThisTurn = true;
    }
    this.state.removeSpentResourceFromPlayer(player, dieSpent, cardSpent);

    // log and return results
    return {
      success: true,
    };
  }
}
