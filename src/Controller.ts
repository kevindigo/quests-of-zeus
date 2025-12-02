// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import type {
  Action,
  AnyResourceGainFavorAction,
  AnyResourceGainOracleCardAction,
  ColorAdvanceGodAction,
  FreeEndTurnAction,
  ShipMoveAction,
} from './actions.ts';
import { ControllerForBasicActions } from './ControllerForBasicActions.ts';
import { ControllerForHexClicks } from './ControllerForHexClicks.ts';
import { GameEngine } from './GameEngine.ts';
import { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Resource } from './Resource.ts';
import type { CoreColor, TerrainType } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewGame } from './ViewGame.ts';

export class Controller {
  constructor() {
    this.gameManager = new GameManager();
    this.gameState = this.gameManager.getGameState();
    this.uiState = this.gameManager.getUiState();
    this.viewGame = new ViewGame(this.gameState, this.uiState);
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getUiState(): UiState {
    return this.uiState;
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

  private selectResource(resourceType: string, resourceColor: CoreColor): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
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
      this.clearResourceSelection();
      this.showMessage('Resource selection cleared');
      this.renderGameState(this.getGameState());
      return;
    }

    if (resourceType === 'die') {
      if (this.selectDieColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} die`);
        this.renderGameState(this.getGameState());
      } else {
        console.log(
          `Player doesn't have ${resourceColor} die. Available dice:`,
          currentPlayer.oracleDice,
        );
      }
    } else if (resourceType === 'card') {
      if (this.selectCardColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} oracle card`);
        this.renderGameState(this.getGameState());
      } else {
        console.log(
          `Player doesn't have ${resourceColor} oracle card. Available cards:`,
          currentPlayer.oracleCards,
        );
      }
    }
  }

  private renderGameState(gameState: GameState): void {
    const availableActions = GameEngine.getAvailableActions(gameState);

    this.viewGame.renderGameState(availableActions);

    this.addHandlersToPlayerPanel();

    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;
    this.addHandlersToSvg();

    if (gameState.getPhase() === 'action') {
      this.highlightAvailableHexElements(gameState, availableActions);
    }
  }

  private addHandlersToPlayerPanel(): void {
    const panel = document.querySelector('.player-gods-panel');
    if (!panel) {
      return;
    }
    {
      const availableGodSquare = panel.querySelector<HTMLSpanElement>(
        '.god-square.available-god-advance',
      );
      if (availableGodSquare) {
        availableGodSquare.addEventListener('click', () => {
          const color = availableGodSquare.dataset['color'] as CoreColor;
          this.onAdvanceGodClicked(color);
        });
      }
    }
    {
      const godActionButton = panel.querySelector<HTMLSpanElement>(
        '.god-level.available-god-action',
      );
      if (godActionButton) {
        godActionButton.addEventListener('click', () => {
          const color = godActionButton.dataset['color'] as CoreColor;
          this.onActivateGodClicked(color);
        });
      }
    }
  }

  private onAdvanceGodClicked(color: CoreColor): void {
    const action: ColorAdvanceGodAction = {
      type: 'color',
      subType: 'advanceGod',
      spend: this.getUiState().getSelectedResource(),
    };
    const result = GameEngine.doAction(action, this.getGameState());
    if (result.success) {
      this.clearResourceSelection();
    }
    this.showMessage('Clicked advance god ' + color + ': ' + result.message);
    this.renderGameState(this.getGameState());
  }

  private onActivateGodClicked(color: CoreColor): void {
    this.showMessage('Clicked activate god ' + color);
    this.renderGameState(this.getGameState());
  }

  private addHandlersToSvg(): void {
    // Hex map interaction
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

  private highlightAvailableHexElements(
    gameState: GameState,
    availableActions: Action[],
  ): void {
    this.highlightAvailableShipMoves(availableActions);

    this.highlightAvailableLands(gameState, availableActions);
  }

  private highlightAvailableShipMoves(
    availableActions: Action[],
  ): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const moveActions: ShipMoveAction[] = availableActions.filter((action) => {
      return action.type === 'move';
    });
    const legalMoveActions = moveActions.filter((action) => {
      return action.spend.equals(selectedResource);
    });

    legalMoveActions.forEach((action) => {
      const destination = action.destination;
      // Highlight the new hex-highlight polygons (centered, won't cover colored border)
      const hexToHighlight = document.querySelector(
        `.hex-highlight[data-q="${destination.q}"][data-r="${destination.r}"]`,
      );

      if (hexToHighlight) {
        if (action.favorToExtendRange > 0) {
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
          String(action.favorToExtendRange),
        );
      } else {
        console.warn(
          `Could not find hex-cell element for (${destination.q}, ${destination.r})`,
        );
      }
    });
  }

  private highlightAvailableLands(
    gameState: GameState,
    availableActions: Action[],
  ): void {
    const selectedResource = this.getUiState().getSelectedResource();
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

    // Delegate button clicks
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
      { q: number; r: number; terrain: TerrainType; favorCost: number }
    >;
    const { q, r, favorCost } = customEvent.detail;
    const coordinates: HexCoordinates = { q, r };
    const handlers = new ControllerForHexClicks(
      this.getGameState(),
      this.getUiState(),
    );
    const result = handlers.handleHexClick(
      coordinates,
      favorCost,
    );
    if (result.success) {
      this.clearResourceSelection();
    }
    this.showMessage(result.message);
    this.renderGameState(this.getGameState());
  }

  private startNewGame(): void {
    this.gameManager.startNewGame();
    this.renderGameState(this.getGameState());
    this.clearMessagePanel();
    this.showMessage(
      "New game started! All players have rolled their dice. Player 1's turn begins.",
    );
  }

  private setRecolorIntention(favorCost: number): void {
    const handler = new ControllerForBasicActions(
      this.getGameState(),
      this.getUiState(),
    );
    const result = handler.setRecolorIntention(
      favorCost,
      this.getSelectedDieColor(),
      this.getSelectedCardColor(),
    );
    if (result.success) {
      this.renderGameState(this.getGameState());
    }
    this.showMessage(result.message);
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

  private endTurn(): void {
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

  private gameManager: GameManager;
  private gameState: GameState;
  private uiState: UiState;
  private viewGame: ViewGame;
}
