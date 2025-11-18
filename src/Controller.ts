// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import { ControllerForBasicActions } from './ControllerForBasicActions.ts';
import { ControllerForHexClicks } from './ControllerForHexClicks.ts';
import { GameEngine } from './game-engine-core.ts';
import type { GameState } from './GameState.ts';
import { HexMapSVG } from './hexmap-svg.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { OracleSystem } from './oracle-system.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  MonsterHex,
  TerrainType,
} from './types.ts';
import { ViewGame } from './ViewGame.ts';
import { ViewWelcome } from './ViewWelcome.ts';

export class Controller {
  private gameEngine: GameEngine;
  private hexMapSVG: HexMapSVG;
  constructor(engine?: GameEngine) {
    if (engine) {
      this.gameEngine = engine;
    } else {
      this.gameEngine = new GameEngine();
    }

    this.hexMapSVG = new HexMapSVG({
      cellSize: 30,
      showCoordinates: false,
      showTerrainLabels: false,
      interactive: true,
    });
  }

  public initializeGameUI(): void {
    this.showWelcomeScreen();
    this.setupEventListeners();
  }

  public clearResourceSelection(): void {
    this.selectedDieColor = null;
    this.selectedOracleCardColor = null;
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (currentPlayer) {
      this.gameEngine.getGameState().clearRecolorIntention(currentPlayer.id);
    }
  }

  public getSelectedDieColor(): CoreColor | null {
    return this.selectedDieColor;
  }

  public getSelectedCardColor(): CoreColor | null {
    return this.selectedOracleCardColor;
  }

  public selectDieColor(color: CoreColor): boolean {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (!currentPlayer.oracleDice.includes(color)) {
      return false;
    }

    this.selectedDieColor = color;
    this.selectedOracleCardColor = null;
    return true;
  }

  public selectCardColor(color: CoreColor): boolean {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (!currentPlayer.oracleCards.includes(color)) {
      return false;
    }

    this.selectedOracleCardColor = color;
    this.selectedDieColor = null;
    return true;
  }

  private clearResourceSelectionAndUpdateDisplay(): void {
    this.clearResourceSelection();
    this.showMessage('Resource selection cleared');
    this.renderGameState();
  }

  private selectResource(resourceType: string, resourceColor: CoreColor): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    console.log(`selectResource called: ${resourceType}, ${resourceColor}`);

    this.gameEngine.getGameState().clearRecolorIntention(currentPlayer.id);
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

  private showWelcomeScreen(): void {
    const view = new ViewWelcome();
    const playerInfoContainer = document.getElementById('playerInfo');
    const questInfoContainer = document.getElementById('questInfo');
    const phaseDisplay = document.getElementById('phaseDisplay');
    const hexMapContainer = document.getElementById('hexMapSVG');

    if (playerInfoContainer) {
      playerInfoContainer.innerHTML = view.getInfoPanelContents();
    }

    if (questInfoContainer) {
      questInfoContainer.innerHTML = view.getQuestPanelContents();
    }

    if (phaseDisplay) {
      phaseDisplay.innerHTML = view.getPhasePanelContents();
    }

    if (hexMapContainer) {
      hexMapContainer.innerHTML = view.getMapPanelContents();
    }
  }

  private renderGameState(): void {
    if (!this.gameEngine.isGameInitialized()) {
      this.showWelcomeScreen();
      return;
    }

    const gameState = this.gameEngine.getGameStateSnapshot();

    // Update player info display
    this.updatePlayerInfo(gameState);

    // Render the map with player positions
    this.renderMap(gameState);

    // Update game phase display
    this.updatePhaseDisplay(gameState);

    // Check for win condition
    const winCondition = this.gameEngine.checkWinCondition();
    if (winCondition.gameOver) {
      this.showGameOver(winCondition.winner!);
    }
  }

  private updatePlayerInfo(gameState: GameState): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    if (!playerInfoContainer) return;

    // Get current player for display
    const currentPlayer = gameState.getCurrentPlayer();

    const view = new ViewGame(gameState);
    playerInfoContainer.innerHTML = view.getPlayerPanelContents(
      currentPlayer,
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
  }

  private renderMap(gameState: GameState): void {
    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;

    const grid = gameState.map.getHexGrid();
    console.log('Grid structure:', grid);
    console.log('Grid length:', grid.getRadius());

    try {
      // Update the hex map SVG with cube hex data
      const cityHexes = gameState.getCityHexes();
      // Debug: Log city hex details
      cityHexes.forEach((cityHex: CityHex, index: number) => {
        console.log(
          `City hex ${index}: (${cityHex.q}, ${cityHex.r}) with statues:`,
          cityHex.statues,
        );
      });

      const cubeHexes: CubeHex[] = gameState.getCubeHexes();
      console.log('Cube hexes for rendering:', cubeHexes);

      // Debug: Log cube hex details
      cubeHexes.forEach((cubeHex: CubeHex, index: number) => {
        console.log(
          `Cube hex ${index}: (${cubeHex.q}, ${cubeHex.r}) with colors:`,
          cubeHex.cubeColors,
        );
      });

      // Update the hex map SVG with monster hex data
      const monsterHexes: MonsterHex[] = gameState.getMonsterHexes() || [];
      console.log('Monster hexes for rendering:', monsterHexes);

      // Debug: Log monster hex details
      monsterHexes.forEach((monsterHex: MonsterHex, index: number) => {
        console.log(
          `Monster hex ${index}: (${monsterHex.q}, ${monsterHex.r}) with colors:`,
          monsterHex.monsterColors,
        );
      });

      // Debug: Check if cube hexes and monster hexes are being passed to SVG renderer
      console.log(
        'Setting cubeHexes in SVG options:',
        cubeHexes.length,
        'hexes',
      );
      console.log(
        'Setting monsterHexes in SVG options:',
        monsterHexes.length,
        'hexes',
      );

      const statueHexes = gameState.getStatueHexes();

      this.hexMapSVG.setOptions({
        cityHexes: cityHexes,
        cubeHexes: cubeHexes,
        monsterHexes: monsterHexes,
        statueHexes: statueHexes,
        players: gameState.players,
      });

      hexMapContainer.innerHTML = this.hexMapSVG.generateSVG(grid);
      this.addHandlersToSvg();

      // Highlight available moves
      if (gameState.getPhase() === 'action') {
        this.highlightAvailableMoves(gameState);
      }
    } catch (error) {
      console.error('Error generating SVG:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
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

  private highlightAvailableMoves(gameState: GameState): void {
    const currentPlayer = gameState.getCurrentPlayer();

    const selectedColor = this.selectedDieColor || this.selectedOracleCardColor;
    if (!selectedColor) {
      return;
    }

    const favorForRecoloring = gameState.getRecolorIntention(currentPlayer.id);
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      favorForRecoloring,
    );
    const favorAvailableForRange = currentPlayer.favor - favorForRecoloring;

    // Get available moves for the selected die color and available favor
    const availableMoves = this.gameEngine.getAvailableMovesForColor(
      currentPlayer,
      effectiveColor,
      favorAvailableForRange,
    );

    // Debug logging
    console.log(
      `Highlighting moves for ${effectiveColor} (original: ${this.selectedDieColor}):`,
      {
        availableMovesCount: availableMoves.length,
        movesWithFavor:
          availableMoves.filter((move) => move.favorCost > 0).length,
        movesWithoutFavor:
          availableMoves.filter((move) => move.favorCost === 0).length,
        playerFavor: currentPlayer.favor,
      },
    );

    availableMoves.forEach(
      (move: { q: number; r: number; favorCost: number }) => {
        // Highlight the new hex-highlight polygons (centered, won't cover colored border)
        const highlightCell = document.querySelector(
          `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
        );

        if (highlightCell) {
          if (move.favorCost > 0) {
            highlightCell.classList.add('available-move-favor');
            // Add tooltip to show required die color and favor cost
            highlightCell.setAttribute(
              'title',
              `Move using ${effectiveColor} (costs ${move.favorCost} favor)`,
            );
            console.log(
              `Added favor highlight to (${move.q}, ${move.r}) with cost ${move.favorCost}`,
            );
          } else {
            highlightCell.classList.add('available-move');
            // Add tooltip to show required die color
            highlightCell.setAttribute(
              'title',
              `Move using ${effectiveColor}`,
            );
          }
        } else {
          console.warn(
            `Could not find hex-highlight element for (${move.q}, ${move.r})`,
          );
        }
      },
    );
  }

  private updatePhaseDisplay(state: GameState): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    const view = new ViewGame(state);
    phaseDisplay.innerHTML = view.getPhasePanelContents(
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
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
    if (!this.gameEngine.isGameInitialized()) return;

    const target = event.target as HTMLElement;
    console.log(
      'Click event detected on:',
      target,
      'classList:',
      target.classList,
    );

    if (target.id === 'collectOffering') {
      this.collectOffering();
    } else if (target.id === 'fightMonster') {
      this.fightMonster();
    } else if (target.id === 'buildTemple') {
      this.buildTemple();
    } else if (target.id === 'buildStatue') {
      this.buildStatue();
    } else if (target.id === 'completeShrineQuest') {
      this.completeShrineQuest();
    } else if (target.id === 'placeStatue') {
      // this.placeStatueOnCity();
    } else if (target.id === 'spendResourceForFavor') {
      this.spendResourceForFavor();
    } else if (target.id === 'drawOracleCard') {
      this.drawOracleCard();
    } else if (target.id === 'endTurn') {
      this.endTurn();
    } else if (target.id === 'clearResourceSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
    } else if (target.id === 'clearDieSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
    } else if (target.id === 'clearOracleCardSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
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
    if (!this.gameEngine.isGameInitialized()) return;

    const customEvent = event as CustomEvent<
      { q: number; r: number; terrain: TerrainType }
    >;
    const { q, r, terrain } = customEvent.detail;
    const coordinates: HexCoordinates = { q, r };
    const handlers = new ControllerForHexClicks(this.gameEngine);
    const result = handlers.handleHexClick(
      coordinates,
      terrain,
      this.selectedDieColor,
      this.selectedOracleCardColor,
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
    this.gameEngine.initializeGame();
    this.renderGameState();
    this.showMessage(
      "New game started! All players have rolled their dice. Player 1's turn begins.",
    );
  }

  private collectOffering(): void {
    const gameState = this.gameEngine.getGameStateSnapshot();
    const currentPlayer = gameState.getCurrentPlayer();
    const position = currentPlayer.getShipPosition();
    const currentCell = gameState.map.getCell(
      position,
    );

    if (currentCell?.terrain === 'offerings' && currentCell.color !== 'none') {
      const success = this.gameEngine.collectOffering(
        currentPlayer.id,
        currentCell.color,
      );
      if (success) {
        this.showMessage(`Collected ${currentCell.color} cube!`);
        // Clear selected die after successful action
        this.selectedDieColor = null;
        this.renderGameState();
      } else {
        this.showMessage('No storage space available for cube!');
      }
    }
  }

  private fightMonster(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.fightMonster(currentPlayer.id);
    if (success) {
      this.showMessage('Monster defeated! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Not enough oracle dice to fight this monster');
    }
  }

  private buildTemple(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildTemple(currentPlayer.id);
    if (success) {
      this.showMessage('Temple built! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Cannot build temple here or missing required cube');
    }
  }

  private buildStatue(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildStatue(currentPlayer.id);
    if (success) {
      this.showMessage('Statue built! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Cannot build statue here');
    }
  }

  private completeShrineQuest(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.completeShrineQuest(currentPlayer.id);
    if (success) {
      this.showMessage('Shrine quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage(
        'Cannot complete shrine quest here or missing required statue',
      );
    }
  }

  private spendResourceForFavor(): void {
    const handler = new ControllerForBasicActions(this.gameEngine);
    const result = handler.spendResourceForFavor(
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private drawOracleCard(): void {
    const handler = new ControllerForBasicActions(this.gameEngine);
    const result = handler.drawOracleCard(
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private setRecolorIntention(favorCost: number): void {
    const handler = new ControllerForBasicActions(this.gameEngine);
    const result = handler.setRecolorIntention(
      favorCost,
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private endTurn(): void {
    this.clearResourceSelection();

    this.gameEngine.endTurn();

    this.showMessage(
      'Turn ended. Dice re-rolled for the previous player.',
    );

    this.renderGameState();
  }

  private showMessage(message: string): void {
    if (!document) {
      console.log(`GameMessage: ${message}`);
      return;
    }
    const messageContainer = document.getElementById('gameMessage');
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.display = 'block';

      setTimeout(() => {
        messageContainer.style.display = 'none';
      }, 5000);
    }
  }

  private showGameOver(
    winner: { name: string; color: string },
  ): void {
    const message = `Game Over! ${winner.name} (${
      winner.color.charAt(0).toUpperCase() + winner.color.slice(1)
    }) wins!`;
    this.showMessage(message);

    // Disable further actions
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach((button: Element) => {
      (button as HTMLButtonElement).disabled = true;
    });
  }

  private get selectedDieColor(): CoreColor | null {
    return this.gameEngine.getGameState().getSelectedDieColor();
  }

  private set selectedDieColor(value: CoreColor | null) {
    this.gameEngine.getGameState().setSelectedDieColor(value);
  }

  public get selectedOracleCardColor(): CoreColor | null {
    return this.gameEngine.getGameState().getSelectedOracleCardColor();
  }

  public set selectedOracleCardColor(value: CoreColor | null) {
    this.gameEngine.getGameState().setSelectedOracleCardColor(value);
  }
}
