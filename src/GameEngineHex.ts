import type { Action, ExploreShrineAction, LoadCubeAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { Resource } from './Resource.ts';
import type { Item } from './types.ts';

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
      neighbors.forEach((neighbor) => {
        switch (neighbor.terrain) {
          case 'shrine':
            actions.push(
              ...GameEngineHex.getShrineActions(gameState, neighbor, resource),
            );
            break;
          case 'offerings':
            actions.push(
              ...GameEngineHex.getOfferingActions(
                gameState,
                neighbor,
                resource,
              ),
            );
            break;
        }
      });
    });

    return actions;
  }

  private static getShrineActions(
    gameState: GameState,
    shrineCell: HexCell,
    resource: Resource,
  ): Action[] {
    if (shrineCell.color !== resource.getEffectiveColor()) {
      return [];
    }

    const coordinates = shrineCell.getCoordinates();
    if (GameEngineHex.canExploreShrine(gameState, coordinates)) {
      const targetColor = resource.getEffectiveColor()!;
      const action: ExploreShrineAction = {
        type: 'hex',
        subType: 'exploreShrine',
        spend: resource,
        coordinates,
        targetColor,
      };

      return [action];
    }

    return [];
  }

  private static canExploreShrine(
    gameState: GameState,
    coordinates: HexCoordinates,
  ): boolean {
    const shrineHex = gameState.findShrineHexAt(coordinates);
    if (!shrineHex) {
      return false;
    }

    const player = gameState.getCurrentPlayer();
    const isHidden = shrineHex.status === 'hidden';
    const isVisibleAndOurs = shrineHex?.status === 'visible' &&
      shrineHex.owner === player.color;

    return (isHidden || isVisibleAndOurs);
  }

  private static getOfferingActions(
    gameState: GameState,
    offeringCell: HexCell,
    resource: Resource,
  ): LoadCubeAction[] {
    const effectiveColor = resource.getEffectiveColor();
    if (!effectiveColor) {
      return [];
    }

    const cube: Item = { type: 'cube', color: effectiveColor };
    const player = gameState.getCurrentPlayer();
    if (!player.validateItemIsLoadable(cube)) {
      return [];
    }

    const offeringHex = gameState.findCubeHexAt(offeringCell.getCoordinates());
    if (!offeringHex) {
      return [];
    }

    if (offeringHex.cubeColors.indexOf(effectiveColor) >= 0) {
      const action: LoadCubeAction = {
        type: 'hex',
        subType: 'loadCube',
        coordinates: offeringCell.getCoordinates(),
        spend: resource,
        targetColor: effectiveColor,
      };
      return [action];
    }

    return [];
  }
}
