// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import type {
  Action,
  AnyResourceGainFavorAction,
  AnyResourceGainOracleCardAction,
} from './actions.ts';
import { ControllerForBasicActions } from './ControllerForBasicActions.ts';
import { ControllerForHexClicks } from './ControllerForHexClicks.ts';
import { GameEngine } from './GameEngine.ts';
import { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './MovementSystem.ts';
import { Resource } from './Resource.ts';
import { ShipMoveHandler } from './ShipMoveHandler.ts';
import type { CoreColor, TerrainType } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewGame } from './ViewGame.ts';

export class Controller {
  constructor() {
    this.gameManager = new GameManager();
    this.gameEngine = new GameEngine();
    this.viewGame = new ViewGame(
      this.gameManager.getGameState(),
      this.gameManager.getUiState(),
    );
  }

  public getGameState(): GameState {
    return this.gameManager.getGameState();
  }

  public getUiState(): UiState {
    return this.gameManager.getUiState();
  }

  public initializeGameUI(): void {
    this.viewGame.viewWelcome();
    this.setupEventListeners();
  }

  public clearResourceSelection(): void {
    this.getUiState().clearResourceSelection();
  }

  public getSelectedDieColor(): CoreColor | null {
    const selected = this.getUiState().getSelectedResource();
    return selected.isDie() ? selected.getBaseColor() : null;
  }

  public getSelectedCardColor(): CoreColor | null {
    const selected = this.getUiState().getSelectedResource();
    return selected.isCard() ? selected.getBaseColor() : null;
  }

  public selectDieColor(color: CoreColor): boolean {
    this.getUiState().clearResourceSelection();
    const die = Resource.createDie(color);
    this.getUiState().setSelectedResource(die);
    return true;
  }

  public selectCardColor(color: CoreColor): boolean {
    this.getUiState().clearResourceSelection();
    const card = Resource.createCard(color);
    this.getUiState().setSelectedResource(card);
    return true;
  }

  private clearResourceSelectionAndUpdateDisplay(): void {
    this.clearResourceSelection();
    this.showMessage('Resource selection cleared');
    this.renderGameState();
  }

  private selectResource(resourceType: string, resourceColor: CoreColor): void {
    const currentPlayer = this.gameManager.getCurrentPlayer();
    console.log(`selectResource called: ${resourceType}, ${resourceColor}`);

    if (resourceType == 'card' && currentPlayer.usedOracleCardThisTurn) {
      this.showMessage('Cannot use a second oracle card in one turn');
      return;
    }

    const resourceToSelect = (resourceType === 'die')
      ? Resource.createDie(resourceColor)
      : Resource.createCard(resourceColor);

    const alreadySelected = this.getUiState().getSelectedResource();
    if (resourceToSelect.equals(alreadySelected)) {
      this.clearResourceSelectionAndUpdateDisplay();
      return;
    }

    if (resourceType === 'die') {
      if (this.selectDieColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} die`);
        this.renderGameState();
      } else {
        console.log(
          `Player doesn't have ${resourceColor} die. Available dice:`,
          currentPlayer.oracleDice,
        );
      }
    } else if (resourceType === 'card') {
      if (this.selectCardColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} oracle card`);
        this.renderGameState();
      } else {
        console.log(
          `Player doesn't have ${resourceColor} oracle card. Available cards:`,
          currentPlayer.oracleCards,
        );
      }
    }
  }

  private addHandlersToSvg(): void {
    // Hex map interaction
    const svg = document.querySelector('.hex-map-svg');
    if (svg) {
      // Add click handlers to hex cells (only outer cells)
      svg.addEventListener('click', (event) => {
        let target = event?.target;
        if (!(target instanceof Element)) {
          target = null;
        }
        let hexCell = target?.closest(
          '.hex-cell:not(.hex-cell-inner)',
        );
        if (!(hexCell instanceof SVGElement)) {
          hexCell = null;
        }
        if (hexCell) {
          const q = parseInt(hexCell.dataset['q'] ?? '0');
          const r = parseInt(hexCell.dataset['r'] ?? '0');
          const terrain = hexCell.dataset['terrain'];

          // Remove previous selection
          document.querySelectorAll('.hex-cell.selected').forEach((cell) => {
            cell.classList.remove('selected');
          });

          // Add selection to clicked cell
          hexCell.classList.add('selected');

          // Dispatch custom event
          const cellEvent = new CustomEvent('hexCellClick', {
            detail: { q, r, terrain, element: hexCell },
          });
          document.dispatchEvent(cellEvent);

          console.log('Hex cell clicked:', { q, r, terrain });
        }
      });

      // Add hover effects (only outer cells)
      svg.addEventListener('mouseover', (event) => {
        let target = event?.target;
        if (!(target instanceof Element)) {
          target = null;
        }
        if (target) {
          let hexCell = target?.closest(
            '.hex-cell:not(.hex-cell-inner)',
          );
          if (!(hexCell instanceof SVGElement)) {
            hexCell = null;
          }
          if (hexCell) {
            hexCell.style.cursor = 'pointer';
          }
        }
      });
    }
  }

  private highlightAvailableHexElements(gameState: GameState): void {
    this.highlightAvailableShipMoves(gameState);
    this.highlightAvailableLands();
  }

  private highlightAvailableShipMoves(
    gameState: GameState,
  ): void {
    const currentPlayer = gameState.getCurrentPlayer();
    const favorForRecoloring = this.getUiState().getSelectedRecoloring();
    const favorAvailableForRange = currentPlayer.favor - favorForRecoloring;

    // Get available moves for the selected die color and available favor
    const movementSystem = new MovementSystem(gameState.getMap());
    const shipMoveHandler = new ShipMoveHandler(
      gameState,
      this.getUiState(),
      movementSystem,
    );
    const availableMoves = shipMoveHandler.getAvailableMovesForColor(
      favorAvailableForRange,
    );

    availableMoves.forEach(
      (move) => {
        // Highlight the new hex-highlight polygons (centered, won't cover colored border)
        const hexToHighlight = document.querySelector(
          `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
        );

        if (hexToHighlight) {
          if (move.favorCost > 0) {
            hexToHighlight.classList.add('available-move-favor');
          } else {
            hexToHighlight.classList.add('available-move');
          }
        } else {
          console.warn(
            `Could not find hex-highlight element for (${move.q}, ${move.r})`,
          );
        }
      },
    );
  }

  private highlightAvailableLands(): void {
    const lands = this.gameManager.getAvailableLandInteractions();
    lands.forEach((cell) => {
      this.highlightLand(cell);
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

  private setupEventListeners(): void {
    console.log('Setting up event listeners...');

    // Start game button
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.id === 'startGame') {
        this.startNewGame();
      }
    });

    // Hex cell click for movement
    document.addEventListener('hexCellClick', (event: Event) => {
      this.handleHexClickEvent(event);
    });

    // Delegate phase action buttons
    document.addEventListener('click', (event) => {
      this.handleButtonClick(event);
    });
  }

  private handleButtonClick(event: Event): void {
    const target = event.target as HTMLElement;
    console.log(
      'Click event detected on:',
      target,
      'classList:',
      target.classList,
    );

    if (target.id === 'spendResourceForFavor') {
      this.spendResourceForFavor();
    } else if (target.id === 'drawOracleCard') {
      this.drawOracleCard();
    } else if (target.id === 'endTurn') {
      this.endTurn();
    } else if (target.classList.contains('die')) {
      const dieColor = target.getAttribute('data-die-color') as CoreColor;
      if (dieColor) {
        console.log(`Die clicked: ${dieColor}`);
        this.selectResource('die', dieColor);
      }
    } else if (target.classList.contains('oracle-card')) {
      const cardColor = target.getAttribute(
        'data-oracle-card-color',
      ) as CoreColor;
      if (cardColor) {
        console.log(`Oracle card clicked: ${cardColor}`);
        this.selectResource('card', cardColor);
      }
    } else if (
      target instanceof HTMLInputElement && target.name === 'recolorOption'
    ) {
      const favorCost = parseInt(target.value || '0');
      this.setRecolorIntention(favorCost);
    }
  }

  private handleHexClickEvent(event: Event): void {
    const customEvent = event as CustomEvent<
      { q: number; r: number; terrain: TerrainType }
    >;
    const { q, r } = customEvent.detail;
    const coordinates: HexCoordinates = { q, r };
    const handlers = new ControllerForHexClicks(this.gameManager);
    const result = handlers.handleHexClick(
      coordinates,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
      if (result.message) {
        this.showMessage(result.message);
      }
    } else {
      this.showMessage(result.message);
    }
  }

  private startNewGame(): void {
    this.gameManager.startNewGame();
    this.renderGameState();
    this.clearMessagePanel();
    this.showMessage(
      "New game started! All players have rolled their dice. Player 1's turn begins.",
    );
  }

  private spendResourceForFavor(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: AnyResourceGainFavorAction = {
      type: 'anyResource',
      subType: 'gainFavor',
      spend: selectedResource,
    };
    this.doAction(action);
  }

  private drawOracleCard(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: AnyResourceGainOracleCardAction = {
      type: 'anyResource',
      subType: 'gainOracleCard',
      spend: selectedResource,
    };
    this.doAction(action);
  }

  private setRecolorIntention(favorCost: number): void {
    const handler = new ControllerForBasicActions(this.gameManager);
    const result = handler.setRecolorIntention(
      favorCost,
      this.getSelectedDieColor(),
      this.getSelectedCardColor(),
    );
    if (result.success) {
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private endTurn(): void {
    this.clearResourceSelection();

    const result = this.gameEngine.endTurn(
      this.getGameState(),
      this.getUiState(),
    );

    this.showMessage(result.message);

    this.renderGameState();
  }

  private doAction(action: Action): void {
    const result = GameEngine.doAction(
      action,
      this.getGameState(),
      this.getUiState(),
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private clearMessagePanel(): void {
    this.viewGame.clearMessagePanel();
  }

  private showMessage(message: string): void {
    this.viewGame.showMessage(message);
  }

  private renderGameState(): void {
    this.viewGame.renderGameState();

    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;
    this.addHandlersToSvg();

    const state = this.gameManager.getGameState();
    if (state.getPhase() === 'action') {
      this.highlightAvailableHexElements(state);
    }
  }

  private gameManager: GameManager;
  private gameEngine: GameEngine;
  private viewGame: ViewGame;
}
