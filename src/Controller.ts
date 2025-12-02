// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import type {
  Action,
  ColorActivateGodAction,
  DropCubeAction,
  DropStatueAction,
  ExploreShrineAction,
  FightMonsterAction,
  FreeEndTurnAction,
  LoadCubeAction,
  LoadStatueAction,
  ResourceAdvanceGodAction,
  ResourceGainFavorAction,
  ResourceGainOracleCardAction,
  ShipMoveAction,
  TeleportAction,
} from './actions.ts';
import { ControllerHighlighter } from './ControllerHighlighter.ts';
import { GameEngine } from './GameEngine.ts';
import { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { PhaseMain, PhaseTeleporting, PhaseWelcome } from './phases.ts';
import { Resource } from './Resource.ts';
import { Success } from './ResultWithMessage.ts';
import type { CoreColor, TerrainType } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewGame } from './ViewGame.ts';

//NOTE: This class is referenced by build.ts
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

  //NOTE: This is invoked directly by index.html
  public initializeGameUI(): void {
    this.viewGame.viewWelcome();
    this.setupEventListeners();
  }

  public clearResourceSelection(): void {
    this.getUiState().clearResourceSelection();
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

    const highligher = new ControllerHighlighter();
    if (gameState.getPhase().getName() !== PhaseWelcome.phaseName) {
      highligher.highlightAvailableHexElements(
        gameState,
        this.uiState,
        availableActions,
      );
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
    const action: ResourceAdvanceGodAction = {
      type: 'resource',
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
    const action: ColorActivateGodAction = {
      type: 'color',
      subType: 'activateGod',
      color: color,
    };

    const result = GameEngine.doAction(action, this.getGameState());
    if (result.success) {
      this.clearResourceSelection();
    }
    this.showMessage('Clicked activate god ' + color + ': ' + result.message);
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
    this.uiState.setSelectedCoordinates(coordinates);

    const action = this.getHexClickAction(
      this.gameState,
      this.uiState,
      favorCost,
    );
    if (!action) {
      this.showMessage('Failed to create action');
      return;
    }

    const result = GameEngine.doAction(action, this.gameState);
    if (result.success) {
      this.clearResourceSelection();
    }
    this.showMessage(result.message);
    this.renderGameState(this.getGameState());
  }

  private getHexClickAction(
    gameState: GameState,
    uiState: UiState,
    favorCost: number,
  ): Action | null {
    const phase = gameState.getPhase();
    const coordinates = uiState.getSelectedCoordinates();
    if (!coordinates) {
      return null;
    }

    if (phase.getName() === PhaseTeleporting.phaseName) {
      const action: TeleportAction = {
        type: 'teleport',
        coordinates: coordinates,
      };
      return action;
    }

    const resource = uiState.getSelectedResource();
    const map = gameState.getMap();
    const cell = map.getCell(coordinates);
    if (!cell) {
      return null;
    }
    if (phase.getName() === PhaseMain.phaseName) {
      switch (cell.terrain) {
        case 'zeus':
          return null;
        case 'sea': {
          const action: ShipMoveAction = {
            type: 'move',
            destination: coordinates,
            spend: resource,
            favorToExtendRange: favorCost,
          };
          return action;
        }
        case 'shallow':
          return null;
        case 'monsters': {
          const action: FightMonsterAction = {
            type: 'hex',
            subType: 'fightMonster',
            coordinates,
            spend: resource,
          };
          return action;
        }
        case 'offerings': {
          const action: LoadCubeAction = {
            type: 'hex',
            subType: 'loadCube',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'temple': {
          const action: DropCubeAction = {
            type: 'hex',
            subType: 'dropCube',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'shrine': {
          const action: ExploreShrineAction = {
            type: 'hex',
            subType: 'exploreShrine',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'city': {
          const action: LoadStatueAction = {
            type: 'hex',
            subType: 'loadStatue',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
        case 'statue': {
          const action: DropStatueAction = {
            type: 'hex',
            subType: 'dropStatue',
            coordinates,
            spend: uiState.getSelectedResource(),
          };
          return action;
        }
      }
    }

    return null;
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

  private spendResourceForFavor(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: ResourceGainFavorAction = {
      type: 'resource',
      subType: 'gainFavor',
      spend: selectedResource,
    };
    this.doAction(action);
  }

  private drawOracleCard(): void {
    const selectedResource = this.getUiState().getSelectedResource();
    const action: ResourceGainOracleCardAction = {
      type: 'resource',
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
