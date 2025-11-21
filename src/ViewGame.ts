import type { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { HexMapSvgGenerator } from './HexMapSvgGenerator.ts';
import type { CityHex, CubeHex, MonsterHex } from './types.ts';
import { ViewPlayer } from './ViewPlayer.ts';
import { ViewWelcome } from './ViewWelcome.ts';

export class ViewGame {
  public constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  public showWelcomeScreen(): void {
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

  public showMessage(message: string): void {
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

  public renderGameState(): void {
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

    const view = new ViewPlayer(gameState);
    playerInfoContainer.innerHTML = view.getPlayerPanelContents(
      currentPlayer,
      gameState.getSelectedDieColor(),
      gameState.getSelectedOracleCardColor(),
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

      const mapSvgGenerator = new HexMapSvgGenerator();
      hexMapContainer.innerHTML = mapSvgGenerator.generateSVG(grid, gameState);
    } catch (error) {
      console.error('Error generating SVG:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
    }
  }

  private updatePhaseDisplay(state: GameState): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    const view = new ViewPlayer(state);
    phaseDisplay.innerHTML = view.getPhasePanelContents(
      state.getSelectedDieColor(),
      state.getSelectedOracleCardColor(),
    );
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

  private gameEngine: GameEngine;
}
