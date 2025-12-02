import type { Action, ShipMoveAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { UiState } from './UiState.ts';

export class ControllerHighlighter {
  public highlightAvailableHexElements(
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): void {
    this.highlightAvailableShipMoves(uiState, availableActions);
    this.highlightAvailableTeleports(availableActions);
    this.highlightAvailableLands(gameState, uiState, availableActions);
  }

  private highlightAvailableShipMoves(
    uiState: UiState,
    availableActions: Action[],
  ): void {
    const selectedResource = uiState.getSelectedResource();
    const moveActions: ShipMoveAction[] = availableActions.filter((action) => {
      return action.type === 'move';
    });
    const legalMoveActions = moveActions.filter((action) => {
      return action.spend.equals(selectedResource);
    });

    legalMoveActions.forEach((action) => {
      const destination = action.destination;
      const favorCost = action.favorToExtendRange;
      this.highlightSeaHex(destination, favorCost);
    });
  }

  private highlightAvailableTeleports(
    availableActions: Action[],
  ): void {
    const teleportActions = availableActions.filter((action) => {
      return action.type === 'teleport';
    });

    teleportActions.forEach((action) => {
      const destination = action.coordinates;
      const favorCost = 0;
      this.highlightSeaHex(destination, favorCost);
    });
  }

  private highlightSeaHex(destination: HexCoordinates, favorCost: number) {
    // Highlight the new hex-highlight polygons (centered, won't cover colored border)
    const hexToHighlight = document.querySelector(
      `.hex-highlight[data-q="${destination.q}"][data-r="${destination.r}"]`,
    );

    if (hexToHighlight) {
      if (favorCost > 0) {
        hexToHighlight.classList.add('available-move-favor');
      } else {
        hexToHighlight.classList.add('available-move');
      }
    } else {
      console.warn(
        `Could not find hex-highlight element for (${destination.q}, ${destination.r})`,
      );
    }

    // Find the corresponding clickable element
    const hexCell = document.querySelector<SVGElement>(
      `.hex-cell[data-q="${destination.q}"][data-r="${destination.r}"]`,
    );

    if (hexCell) {
      // Attach the favor cost so click handler can read it
      hexCell.setAttribute(
        'data-favor-cost',
        String(favorCost),
      );
    } else {
      console.warn(
        `Could not find hex-cell element for (${destination.q}, ${destination.r})`,
      );
    }
  }
  private highlightAvailableLands(
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): void {
    const selectedResource = uiState.getSelectedResource();
    availableActions.forEach((action) => {
      if (action.type === 'hex' && action.spend.equals(selectedResource)) {
        const cell = gameState.getMap().getCell(action.coordinates);
        if (cell) {
          this.highlightLand(cell);
        }
      }
    });
  }

  private highlightLand(cell: HexCell): void {
    const hexToHighlight = document.querySelector(
      `.hex-highlight[data-q="${cell.q}"][data-r="${cell.r}"]`,
    );
    if (!hexToHighlight) {
      console.warn(
        `Could not find hex-highlight element for (${cell.q}, ${cell.r})`,
      );
      return;
    }

    hexToHighlight.classList.add('available-land');
  }
}
