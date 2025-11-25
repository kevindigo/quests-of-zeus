import type { Action, ExploreShrineAction } from './actions.ts';
import type { GameState } from './GameState.ts';

export class GameEngineHex {
  public static getHexActions(gameState: GameState): Action[] {
    const actions: Action[] = [];
    if (gameState.getPhase() !== 'action') {
      return actions;
    }

    const grid = gameState.getMap().getHexGrid();
    const player = gameState.getCurrentPlayer();
    const shipAt = player.getShipPosition();
    const neighbors = grid.getNeighborsByCoordinates(shipAt);

    const resources = player.getAvailableResourcesWithRecoloring();
    resources.forEach((resource) => {
      const resourceColor = resource.getEffectiveColor();
      neighbors.forEach((neighbor) => {
        if (neighbor.terrain === 'shrine' && neighbor.color === resourceColor) {
          const shrineHex = gameState.getShrineHexes().find((shrineHex) => {
            return shrineHex.q === neighbor.q && shrineHex.r === neighbor.r;
          });
          if (shrineHex?.status === 'hidden') {
            const action: ExploreShrineAction = {
              type: 'hex',
              subType: 'exploreShrine',
              spend: resource,
              coordinates: neighbor.getCoordinates(),
              targetColor: resourceColor,
            };
            actions.push(action);
          }
        }
      });
    });
    return actions;
  }
}
