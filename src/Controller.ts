// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import type { Action, FreeEndTurnAction } from './actions.ts';
import { ControllerHighlighter } from './ControllerHighlighter.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Resource } from './Resource.ts';
import { Success } from './ResultWithMessage.ts';
import type { CoreColor, TerrainType } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewGame } from './ViewGame.ts';

//NOTE: This class is referenced by build.ts
export class Controller {
  //NOTE: This is invoked directly by index.html
  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.gameState = this.gameManager.getGameState();
    console.log(
      'Controller constructor: Current phase: ' +
        this.getGameState().getPhaseName(),
    );
    this.uiState = this.gameManager.getUiState();
    this.viewGame = new ViewGame(this.gameState, this.uiState);
  }

  //NOTE: This is invoked directly by index.html
  public initializeGameUI(): void {
    this.setupEventListeners();
    this.listenToGameManagerEvents();
    this.renderGameState(this.getGameState());
  }

  private listenToGameManagerEvents() {
    console.log('Controller listening to GameManager');
    this.gameManager.onEvent((event) => {
      switch (event.type) {
        case 'stateChange':
          this.renderGameState(event.gameState);
          break;
        case 'message':
          this.showMessage(event.text);
          break;
      }
    });
  }

  private renderGameState(gameState: GameState): void {
    const availableActions = GameEngine.getAvailableActions(gameState);

    this.viewGame.renderGameState(availableActions);

    this.addHandlersToPlayerPanel();

    this.addHandlersToSvg();

    const highligher = new ControllerHighlighter();
    highligher.highlightAvailableHexElements(
      gameState,
      this.uiState,
      availableActions,
    );
  }

  private addHandlersToPlayerPanel(): void {
    const panel = document.querySelector('.player-gods-panel');
    if (!panel) {
      return;
    }
    {
      panel.addEventListener('click', (event) => {
        const square = (event.target as HTMLElement)
          .closest<HTMLSpanElement>(
            '.god-square.available-god-resource-advance,.god-entry-wrapper.available-god-resource-advance',
          );

        if (!square) return;

        const clickedColor = square.dataset['color'] as CoreColor;
        this.gameManager.doAdvanceGod(clickedColor);
      });
    }
    {
      const godActionButton = panel.querySelector<HTMLSpanElement>(
        '.god-level.available-god-action, .god-entry-wrapper.available-god-action',
      );
      if (godActionButton) {
        godActionButton.addEventListener('click', () => {
          const color = godActionButton.dataset['color'] as CoreColor;
          this.gameManager.doActivateGod(color);
        });
      }
    }
  }

  private addHandlersToSvg(): void {
    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;

    const svg = document.querySelector('.hex-map-svg');
    if (!svg) {
      return;
    }

    // Add click handlers to hex cells (only outer cells)
    svg.addEventListener('click', (event) => {
      // Remove previous selection
      document.querySelectorAll('.hex-cell.selected').forEach((cell) => {
        cell.classList.remove('selected');
      });

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
      if (!hexCell) {
        return;
      }
      const q = parseInt(hexCell.dataset['q'] ?? '0');
      const r = parseInt(hexCell.dataset['r'] ?? '0');
      const terrain = hexCell.dataset['terrain'];
      const favorCost = Number(hexCell.getAttribute('data-favor-cost') ?? '0');

      // Add selection to clicked cell
      hexCell.classList.add('selected');

      // Dispatch custom event
      const cellEvent = new CustomEvent('hexCellClick', {
        detail: { q, r, terrain, element: hexCell, favorCost },
      });
      document.dispatchEvent(cellEvent);

      console.log('Hex cell clicked:', { q, r, terrain });
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

  private setupEventListeners(): void {
    console.log('Setting up event listeners...');

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.id === 'startGame') {
        this.startNewGame();
      }
    });

    document.addEventListener('hexCellClick', (event: Event) => {
      this.handleHexClickEvent(event);
    });

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
      this.gameManager.dospendResourceForFavor();
    } else if (target.id === 'drawOracleCard') {
      this.gameManager.doSpendResourceForCard();
    } else if (target.id === 'peekShrine') {
      this.gameManager.doSpendResourceForTwoPeeks();
    } else if (target.id === 'endTurn') {
      this.doEndTurn();
    } else if (target.classList.contains('die')) {
      const dieColor = target.getAttribute('data-die-color') as CoreColor;
      if (dieColor) {
        console.log(`Die clicked: ${dieColor}`);
        this.selectResource(Resource.createDie(dieColor));
      }
    } else if (target.classList.contains('oracle-card')) {
      const cardColor = target.getAttribute(
        'data-oracle-card-color',
      ) as CoreColor;
      if (cardColor) {
        console.log(`Oracle card clicked: ${cardColor}`);
        this.selectResource(Resource.createCard(cardColor));
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
      { q: number; r: number; terrain: TerrainType; favorCost: number }
    >;
    const { q, r, favorCost } = customEvent.detail;
    const coordinates: HexCoordinates = { q, r };
    this.uiState.setSelectedCoordinates(coordinates);

    this.gameManager.doHexClickAction(favorCost);
  }

  private startNewGame(): void {
    this.clearMessagePanel();
    this.gameManager.startNewGame();
    this.renderGameState(this.getGameState());
    this.showMessage(
      "New game started! All players have rolled their dice. Player 1's turn begins.",
    );
  }

  private clearResourceSelection(): void {
    this.getUiState().clearResourceSelection();
  }

  private selectResource(resourceToSelect: Resource): void {
    const currentPlayer = this.gameState.getCurrentPlayer();

    if (resourceToSelect.isCard() && currentPlayer.usedOracleCardThisTurn) {
      this.showMessage('Cannot use a second oracle card in one turn');
      return;
    }

    const alreadySelected = this.getUiState().getSelectedResource();
    if (resourceToSelect.equals(alreadySelected)) {
      this.clearResourceSelection();
      this.showMessage('Resource selection cleared');
      this.renderGameState(this.getGameState());
      return;
    }

    this.getUiState().clearResourceSelection();
    this.getUiState().setSelectedResource(resourceToSelect);
    this.showMessage(`Selected ${resourceToSelect.getBaseColor()}`);
    this.renderGameState(this.getGameState());
  }

  private setRecolorIntention(favorCost: number): void {
    const playerFavor = this.gameState.getCurrentPlayer().favor;
    if (favorCost > playerFavor) {
      this.showMessage(
        `Cannot spend(${favorCost}) favor when player only has (${playerFavor})`,
      );
      return;
    }

    const selectedResource = this.getUiState().getSelectedResource();
    const baseColor = selectedResource.getBaseColor();
    const resource = selectedResource.isDie()
      ? Resource.createRecoloredDie(baseColor, favorCost)
      : selectedResource.isCard()
      ? Resource.createRecoloredCard(baseColor, favorCost)
      : Resource.none;
    this.getUiState().setSelectedResource(resource);

    const result = new Success(
      `Will recolor ${baseColor} to ${resource.getEffectiveColor()}`,
    );

    if (result.success) {
      this.renderGameState(this.getGameState());
    }
    this.showMessage(result.message);
  }

  private doEndTurn(): void {
    const action: FreeEndTurnAction = {
      type: 'free',
      subType: 'endTurn',
    };
    this.doAction(action);
  }

  private doAction(action: Action): void {
    const result = GameEngine.doAction(
      action,
      this.getGameState(),
    );
    this.clearResourceSelection();
    this.showMessage(result.message);
    this.renderGameState(this.getGameState());
  }

  private clearMessagePanel(): void {
    this.viewGame.clearMessagePanel();
  }

  private showMessage(message: string): void {
    this.viewGame.showMessage(message);
  }

  private getGameState(): GameState {
    return this.gameState;
  }

  private getUiState(): UiState {
    return this.uiState;
  }

  private gameManager: GameManager;
  private gameState: GameState;
  private uiState: UiState;
  private viewGame: ViewGame;
}
