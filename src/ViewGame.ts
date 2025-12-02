import type { Action } from './actions.ts';
import type { GameState } from './GameState.ts';
import { HexMapSvgGenerator } from './HexMapSvgGenerator.ts';
import type { CityHex, CubeHex, MonsterHex } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewPlayer } from './ViewPlayer.ts';
import { ViewPlayerTurn } from './ViewPlayerTurn.ts';
import { ViewWelcome } from './ViewWelcome.ts';

export class ViewGame {
  public constructor(gameState: GameState, uiState: UiState) {
    this.gameState = gameState;
    this.uiState = uiState;
  }

  public clearMessagePanel(): void {
    if (!document) {
      console.log(`GameMessage: ${'Trying to clear message panel'}`);
      return;
    }
    const messageTextArea = document.getElementById('gameMessage');
    if (messageTextArea) {
      messageTextArea.textContent = '';
      messageTextArea.scrollTop = messageTextArea.scrollHeight;
    }
  }

  public showMessage(message: string): void {
    if (!document) {
      console.log(`GameMessage: ${message}`);
      return;
    }
    const messageTextArea = document.getElementById('gameMessage');
    if (messageTextArea) {
      messageTextArea.textContent += '> ' + message + '\n';
      messageTextArea.scrollTop = messageTextArea.scrollHeight;
    }
  }

  public viewWelcome(): void {
    const viewWelcome = new ViewWelcome();
    viewWelcome.showWelcomeScreen();
  }

  public renderGameState(availableActions: Action[]): void {
    if (this.gameState.getPhase() === 'setup') {
      this.viewWelcome();
      return;
    }

    // Update player info display
    this.updatePlayerInfo(this.gameState, availableActions);

    // Render the map with player positions
    this.renderMap(this.gameState);

    // Update game phase display
    this.updatePhaseDisplay(this.gameState, this.uiState, availableActions);

    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
      newGameButton.style.visibility = 'visible';
    }
  }

  private updatePlayerInfo(
    gameState: GameState,
    availableActions: Action[],
  ): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    if (!playerInfoContainer) return;

    // Get current player for display
    const currentPlayer = gameState.getCurrentPlayer();

    const view = new ViewPlayer();
    playerInfoContainer.innerHTML = view.getPlayerPanelContents(
      currentPlayer,
      this.gameState,
      this.uiState,
      availableActions,
    );
  }

  private renderMap(gameState: GameState): void {
    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;

    const grid = gameState.getMap().getHexGrid();
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

      const mapSvgGenerator = new HexMapSvgGenerator();
      hexMapContainer.innerHTML = mapSvgGenerator.generateSVG(
        gameState,
        this.uiState.areAccessibilityIconsEnabled(),
      );
    } catch (error) {
      console.error('Error generating SVG:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
    }
  }

  private updatePhaseDisplay(
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    const view = new ViewPlayerTurn(gameState, uiState);
    phaseDisplay.innerHTML = view.getPlayerTurnPanelContents(availableActions);
  }

  private gameState: GameState;
  private uiState: UiState;
}
