// Game Controller for Oracle of Delphi
// Manages the game UI and user interactions

import { OracleGameEngine } from "./game-engine.ts";
import { HexMapSVG } from "./hexmap-svg.ts";
import type { HexColor } from "./hexmap.ts";

// Type declarations for DOM APIs (for Deno type checking)

export class GameController {
  private gameEngine: OracleGameEngine;
  private hexMapSVG: HexMapSVG;
  private selectedDieColor: HexColor | null = null;

  constructor() {
    this.gameEngine = new OracleGameEngine();
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

  private showWelcomeScreen(): void {
    const playerInfoContainer = document.getElementById("playerInfo");
    const questInfoContainer = document.getElementById("questInfo");
    const phaseDisplay = document.getElementById("phaseDisplay");
    const hexMapContainer = document.getElementById("hexMapSVG");

    if (playerInfoContainer) {
      playerInfoContainer.innerHTML = `
        <div class="welcome-screen">
          <h3>Welcome to Oracle of Delphi</h3>
          <p>A strategic board game of ancient Greece</p>
          <button id="startGame" class="action-btn">Start New Game</button>
          <div class="game-info">
            <h4>How to Play:</h4>
            <ul>
              <li>Roll oracle dice to determine movement options</li>
              <li>Move your ship across the sea and land hexes</li>
              <li>Collect cubes and statues, fight monsters, and build temples</li>
              <li>Complete quests to win the game</li>
              <li>First player to complete 3 of each quest type (Temple Offering, Monster, Foundation, Cloud) wins!</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (questInfoContainer) {
      questInfoContainer.innerHTML = `
        <div class="game-rules">
          <h3>Game Rules</h3>
          <div class="rules-section">
            <h4>Phases:</h4>
            <ul>
              <li><strong>Oracle Phase:</strong> Roll 3 colored dice</li>
              <li><strong>Action Phase:</strong> First select a die, then perform actions (move, collect offerings, fight monsters, etc.)</li>
              <li>You can change your selected die before making a move</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (phaseDisplay) {
      phaseDisplay.innerHTML = `
        <div class="phase-info">
          <h3>Ready to Begin</h3>
          <p>Click "Start New Game" to begin your adventure!</p>
        </div>
      `;
    }

    if (hexMapContainer) {
      hexMapContainer.innerHTML = `
        <div class="welcome-map">
          <p>Game map will appear here when you start a new game</p>
        </div>
      `;
    }
  }

  private renderGameState(): void {
    if (!this.gameEngine.isGameInitialized()) {
      this.showWelcomeScreen();
      return;
    }

    const gameState = this.gameEngine.getGameState();
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    // Update player info display
    this.updatePlayerInfo(gameState);

    // Render the map with player positions
    this.renderMap(gameState);

    // Update game phase display
    this.updatePhaseDisplay(gameState.phase);

    // Check for win condition
    const winCondition = this.gameEngine.checkWinCondition();
    if (winCondition.gameOver) {
      this.showGameOver(winCondition.winner!);
    }
  }

  private updatePlayerInfo(_gameState: unknown): void {
    const playerInfoContainer = document.getElementById("playerInfo");
    if (!playerInfoContainer) return;

    const currentPlayer = this.gameEngine.getCurrentPlayer();

    playerInfoContainer.innerHTML = `
      <div class="player-info">
        <h3>Current Player: ${currentPlayer.name}</h3>
        <div class="player-stats">
          <div><strong>Color:</strong> 
            <span class="color-swatch" style="background-color: ${
      this.getColorHex(currentPlayer.color)
    }"></span>
            ${
      currentPlayer.color.charAt(0).toUpperCase() + currentPlayer.color.slice(1)
    }
          </div>
          <div><strong>Completed Quests:</strong> ${currentPlayer.completedQuests}/12</div>
          <div><strong>Favor:</strong> ${currentPlayer.favor}</div>
        </div>
        <div class="quest-progress">
          <h4>Quest Progress</h4>
          <div class="quest-types">
            <div class="quest-type-item">Temple Offering: ${currentPlayer.completedQuestTypes.temple_offering}/3</div>
            <div class="quest-type-item">Monster: ${currentPlayer.completedQuestTypes.monster}/3</div>
            <div class="quest-type-item">Foundation: ${currentPlayer.completedQuestTypes.foundation}/3</div>
            <div class="quest-type-item">Cloud: ${currentPlayer.completedQuestTypes.cloud}/3</div>
          </div>
        </div>
        <div class="storage">
          <h4>Storage (2 slots)</h4>
          <div class="storage-slots">
            ${
      currentPlayer.storage.map((slot, index) =>
        `<div class="storage-slot slot-${index} ${slot.type}">
                <div class="slot-content">
                  ${
          slot.type === "empty"
            ? '<span class="empty-slot">Empty</span>'
            : `<span class="item-type">${slot.type}</span>
                     <span class="color-swatch" style="background-color: ${
              this.getColorHex(slot.color)
            }"></span>
                     <span class="item-color">${slot.color}</span>`
        }
                </div>
              </div>`
      ).join("")
    }
          </div>
        </div>
        <div class="oracle-dice">
          <h4>Oracle Dice</h4>
          <div class="dice-container">
            ${
      currentPlayer.oracleDice.map((color) => {
        const isSelected = this.selectedDieColor === color;
        return `<div class="die color-${color} ${isSelected ? 'selected-die' : ''}" 
                     style="background-color: ${this.getColorHex(color)}"
                     data-die-color="${color}">
                ${color.charAt(0).toUpperCase()}
              </div>`;
      }).join("")
    }
            ${
      currentPlayer.oracleDice.length === 0
        ? '<div class="no-dice">No dice rolled yet</div>'
        : ""
    }
          </div>
          ${
      this.selectedDieColor && currentPlayer.oracleDice.length > 0
        ? `<div class="selected-die-info">
             Selected: <span class="color-swatch" style="background-color: ${this.getColorHex(this.selectedDieColor)}"></span>
             ${this.selectedDieColor}
             <button id="clearDieSelection" class="action-btn secondary">Clear</button>
           </div>`
        : ""
    }
        </div>
      </div>
    `;
  }

  private renderMap(gameState: unknown): void {
    const hexMapContainer = document.getElementById("hexMapSVG");
    if (!hexMapContainer) return;

    const grid = gameState.map.serialize();
    console.log("Grid structure:", grid);
    console.log("Grid length:", grid.length);

    if (grid && grid.length > 0) {
      console.log("First row length:", grid[0].length);
      console.log("First cell:", grid[0][0]);
    }

    try {
      // Update the hex map SVG with cube hex data
      const cubeHexes = gameState.cubeHexes || [];
      console.log("Cube hexes for rendering:", cubeHexes);

      // Debug: Log cube hex details
      cubeHexes.forEach((cubeHex: unknown, index: number) => {
        console.log(
          `Cube hex ${index}: (${cubeHex.q}, ${cubeHex.r}) with colors:`,
          cubeHex.cubeColors,
        );
      });

      // Update the hex map SVG with monster hex data
      const monsterHexes = gameState.monsterHexes || [];
      console.log("Monster hexes for rendering:", monsterHexes);

      // Debug: Log monster hex details
      monsterHexes.forEach((monsterHex: unknown, index: number) => {
        console.log(
          `Monster hex ${index}: (${monsterHex.q}, ${monsterHex.r}) with colors:`,
          monsterHex.monsterColors,
        );
      });

      // Debug: Check if cube hexes and monster hexes are being passed to SVG renderer
      console.log(
        "Setting cubeHexes in SVG options:",
        cubeHexes.length,
        "hexes",
      );
      console.log(
        "Setting monsterHexes in SVG options:",
        monsterHexes.length,
        "hexes",
      );

      this.hexMapSVG.setOptions({
        cubeHexes: cubeHexes,
        monsterHexes: monsterHexes,
      });

      const { svg, script } = this.hexMapSVG.generateInteractiveSVG(grid);

      hexMapContainer.innerHTML = svg;

      // Execute the interaction script
      try {
        // Use Function constructor instead of direct eval to avoid bundler warnings
        const executeScript = new Function(script);
        executeScript();
      } catch (_error) {
        console.error("Error executing hex map script:", error);
      }

      // Add player markers to the map
      this.addPlayerMarkers(gameState.players);

      // Highlight available moves
      if (gameState.phase === "action") {
        this.highlightAvailableMoves();
      }
    } catch (_error) {
      console.error("Error generating SVG:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
    }
  }

  private addPlayerMarkers(players: any[]): void {
    // Group players by their position
    const playersByPosition = new Map<string, any[]>();
    players.forEach((player) => {
      const positionKey = `${player.shipPosition.q},${player.shipPosition.r}`;
      if (!playersByPosition.has(positionKey)) {
        playersByPosition.set(positionKey, []);
      }
      playersByPosition.get(positionKey)!.push(player);
    });

    // Add markers for each position group
    playersByPosition.forEach((playersAtPosition, positionKey) => {
      const [q, r] = positionKey.split(",").map(Number);
      const cell = document.querySelector(`[data-q="${q}"][data-r="${r}"]`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const svg = cell.closest("svg");
        if (svg) {
          const point = svg.createSVGPoint();

          playersAtPosition.forEach((player, index) => {
            // Calculate position in one of the four quadrants of the hex
            // Use smaller offsets to position dots closer to the center
            const quadrant = index % 4;
            let offsetX = 0;
            let offsetY = 0;

            // Reduce the offset to move dots closer to center (from 1/4 to 1/6 of the width/height)
            const offsetFactor = 6;

            switch (quadrant) {
              case 0: // Upper left
                offsetX = -rect.width / offsetFactor;
                offsetY = -rect.height / offsetFactor;
                break;
              case 1: // Upper right
                offsetX = rect.width / offsetFactor;
                offsetY = -rect.height / offsetFactor;
                break;
              case 2: // Lower left
                offsetX = -rect.width / offsetFactor;
                offsetY = rect.height / offsetFactor;
                break;
              case 3: // Lower right
                offsetX = rect.width / offsetFactor;
                offsetY = rect.height / offsetFactor;
                break;
            }

            point.x = rect.left + rect.width / 2 + offsetX;
            point.y = rect.top + rect.height / 2 + offsetY;
            const svgPoint = point.matrixTransform(
              svg.getScreenCTM()!.inverse(),
            );

            const marker = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "circle",
            );
            marker.setAttribute("cx", svgPoint.x.toString());
            marker.setAttribute("cy", svgPoint.y.toString());
            marker.setAttribute("r", "8");
            marker.setAttribute("fill", this.getColorHex(player.color));
            marker.setAttribute("stroke", "#fff");
            marker.setAttribute("stroke-width", "2");
            marker.setAttribute("class", "player-marker");
            marker.setAttribute("data-player-id", player.id.toString());

            svg.appendChild(marker);
          });
        } else {
          console.warn(
            `Could not find SVG container for players at (${q}, ${r})`,
          );
        }
      } else {
        console.warn(`Could not find cell for players at (${q}, ${r})`);
      }
    });
  }

  private highlightAvailableMoves(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const availableMoves = this.gameEngine.getAvailableMoves(currentPlayer.id);

    // Clear previous highlights
    document.querySelectorAll(".available-move").forEach((cell) => {
      cell.classList.remove("available-move");
      cell.removeAttribute("title");
    });

    // Only highlight moves if a die is selected
    if (this.selectedDieColor) {
      availableMoves.forEach((move) => {
        // Only highlight moves that match the selected die color
        if (move.dieColor === this.selectedDieColor) {
          // Highlight the new hex-highlight polygons (centered, won't cover colored border)
          const highlightCell = document.querySelector(
            `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
          );
          
          if (highlightCell) {
            highlightCell.classList.add("available-move");
            // Add tooltip to show required die color
            highlightCell.setAttribute("title", `Move using ${move.dieColor} die`);
          }
        }
      });
    }
  }

  private updatePhaseDisplay(phase: string): void {
    const phaseDisplay = document.getElementById("phaseDisplay");
    if (!phaseDisplay) return;

    phaseDisplay.innerHTML = `
      <div class="phase-info">
        <h3>Current Phase: ${phase.toUpperCase()}</h3>
        <div class="phase-actions">
          ${this.getPhaseActions(phase)}
        </div>
      </div>
    `;
  }

  private getPhaseActions(phase: string): string {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    switch (phase) {
      case "oracle":
        return `
          <button id="rollDice" class="action-btn">Roll Oracle Dice</button>
        `;
      case "action":
        const currentCell = this.gameEngine.getGameState().map.getCell(
          currentPlayer.shipPosition.q,
          currentPlayer.shipPosition.r,
        );

        let actions = "";
        
        if (this.selectedDieColor) {
          // Die is selected - show available actions
          actions += `<p>Selected die: <span class="color-swatch" style="background-color: ${this.getColorHex(this.selectedDieColor)}"></span> ${this.selectedDieColor}</p>`;
          
          // Movement is always available during action phase with a selected die
          actions += `<p>Click on an adjacent highlighted hex to move your ship</p>`;
          
          if (currentCell?.terrain === "cubes") {
            actions +=
              `<button id="collectOffering" class="action-btn">Collect Offering</button>`;
          }
          if (currentCell?.terrain === "monsters") {
            actions +=
              `<button id="fightMonster" class="action-btn">Fight Monster</button>`;
          }
          if (currentCell?.terrain === "temple") {
            actions +=
              `<button id="buildTemple" class="action-btn">Build Temple</button>`;
          }
          if (currentCell?.terrain === "foundations") {
            actions +=
              `<button id="buildFoundation" class="action-btn">Build Foundation</button>`;
          }
          if (currentCell?.terrain === "clouds") {
            actions +=
              `<button id="completeCloudQuest" class="action-btn">Complete Cloud Quest</button>`;
          }
          if (currentCell?.terrain === "city") {
            const canPlaceStatue = this.gameEngine.canPlaceStatueOnCity(
              currentPlayer.id,
            );
            if (canPlaceStatue) {
              actions +=
                `<button id="placeStatue" class="action-btn">Place Statue on City</button>`;
            } else {
              actions += `<p>Cannot place statue: ${
                currentCell.statues === 3
                  ? "City already has all 3 statues"
                  : "No statue of city's color in storage"
              }</p>`;
            }
          }
        } else {
          // No die selected - show selection instructions
          actions += `<p>Select an oracle die to perform actions</p>`;
          actions += `<p>Available dice: ${currentPlayer.oracleDice.join(", ")}</p>`;
        }

        if (!actions) {
          actions = "<p>No actions available at this location</p>";
        }

        actions +=
          `<button id="endTurn" class="action-btn secondary">End Turn</button>`;
        return actions;
      default:
        return "<p>Game phase not recognized</p>";
    }
  }

  private setupEventListeners(): void {
    // Start game button
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      if (target.id === "startGame") {
        this.startNewGame();
      }
    });

    // Hex cell click for movement
    document.addEventListener("hexCellClick", (event: CustomEvent<{ q: number; r: number }>) => {
      if (!this.gameEngine.isGameInitialized()) return;

      const { q, r } = event.detail;
      const gameState = this.gameEngine.getGameState();

      if (gameState.phase === "action") {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        
        if (!this.selectedDieColor) {
          this.showMessage("Please select a die first!");
          return;
        }
        
        // Get available moves to find the required die color for this target
        const availableMoves = this.gameEngine.getAvailableMoves(currentPlayer.id);
        const targetMove = availableMoves.find(move => move.q === q && move.r === r && move.dieColor === this.selectedDieColor);
        
        if (targetMove) {
          // Use the selected die color
          const success = this.gameEngine.moveShip(currentPlayer.id, q, r, this.selectedDieColor);
          if (success) {
            this.showMessage(`Ship moved to (${q}, ${r}) using ${this.selectedDieColor} die`);
            // Clear selected die after successful move
            this.selectedDieColor = null;
            this.renderGameState();
          } else {
            this.showMessage("Invalid move!");
          }
        } else {
          this.showMessage(`Cannot move to this hex using ${this.selectedDieColor} die! Must be a sea hex within 3 hexes of matching color.`);
        }
      }
    });

    // Delegate phase action buttons
    document.addEventListener("click", (event) => {
      if (!this.gameEngine.isGameInitialized()) return;

      const target = event.target as HTMLElement;

      if (target.id === "rollDice") {
        this.rollOracleDice();
      } else if (target.id === "collectOffering") {
        this.collectOffering();
      } else if (target.id === "fightMonster") {
        this.fightMonster();
      } else if (target.id === "buildTemple") {
        this.buildTemple();
      } else if (target.id === "buildFoundation") {
        this.buildFoundation();
      } else if (target.id === "completeCloudQuest") {
        this.completeCloudQuest();
      } else if (target.id === "placeStatue") {
        this.placeStatueOnCity();
      } else if (target.id === "endTurn") {
        this.endTurn();
      } else if (target.id === "clearDieSelection") {
        this.clearDieSelection();
      } else if (target.classList.contains("die")) {
        const dieColor = target.getAttribute("data-die-color") as HexColor;
        if (dieColor) {
          this.selectDie(dieColor);
        }
      }
    });
  }

  private startNewGame(): void {
    this.gameEngine.initializeGame();
    this.renderGameState();
    this.showMessage("New game started! Player 1's turn begins.");
  }

  private rollOracleDice(): void {
    try {
      const currentPlayer = this.gameEngine.getCurrentPlayer();
      const dice = this.gameEngine.rollOracleDice(currentPlayer.id);
      this.showMessage(`Rolled oracle dice: ${dice.join(", ")}`);
      this.renderGameState();
    } catch (_error) {
      this.showMessage("Cannot roll dice at this time");
    }
  }



  private collectOffering(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const currentCell = this.gameEngine.getGameState().map.getCell(
      currentPlayer.shipPosition.q,
      currentPlayer.shipPosition.r,
    );

    if (currentCell?.terrain === "cubes" && currentCell.color !== "none") {
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
        this.showMessage("No storage space available for cube!");
      }
    }
  }

  private fightMonster(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.fightMonster(currentPlayer.id);
    if (success) {
      this.showMessage("Monster defeated! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Not enough oracle dice to fight this monster");
    }
  }

  private buildTemple(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildTemple(currentPlayer.id);
    if (success) {
      this.showMessage("Temple built! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot build temple here or missing required cube");
    }
  }

  private buildFoundation(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildFoundation(currentPlayer.id);
    if (success) {
      this.showMessage("Foundation built! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot build foundation here");
    }
  }

  private completeCloudQuest(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.completeCloudQuest(currentPlayer.id);
    if (success) {
      this.showMessage("Cloud quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage(
        "Cannot complete cloud quest here or missing required statue",
      );
    }
  }

  private placeStatueOnCity(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.placeStatueOnCity(currentPlayer.id);
    if (success) {
      const currentCell = this.gameEngine.getGameState().map.getCell(
        currentPlayer.shipPosition.q,
        currentPlayer.shipPosition.r,
      );
      if (currentCell) {
        this.showMessage(
          `Statue placed on city! (${currentCell.statues}/3 statues)`,
        );
      } else {
        this.showMessage("Statue placed on city!");
      }
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot place statue on this city");
    }
  }

  private selectDie(dieColor: HexColor): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    
    // Check if the player has this die
    if (currentPlayer.oracleDice.includes(dieColor)) {
      this.selectedDieColor = dieColor;
      this.showMessage(`Selected ${dieColor} die`);
      this.renderGameState();
    }
  }

  private clearDieSelection(): void {
    this.selectedDieColor = null;
    this.showMessage("Die selection cleared");
    this.renderGameState();
  }

  private endTurn(): void {
    // Clear selected die when ending turn
    this.selectedDieColor = null;
    
    // Note: Turns are automatically advanced by the game engine when actions are completed
    // This UI method just clears the selection and shows a message
    this.showMessage("Turn ended. Next player's turn begins when they take an action.");

    this.renderGameState();
  }

  private showMessage(message: string): void {
    const messageContainer = document.getElementById("gameMessage");
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.display = "block";

      setTimeout(() => {
        messageContainer.style.display = "none";
      }, 3000);
    }
  }

  private showGameOver(winner: { name: string; color: string; completedQuests: number }): void {
    const message = `Game Over! ${winner.name} (${
      winner.color.charAt(0).toUpperCase() + winner.color.slice(1)
    }) wins by completing ${winner.completedQuests} quests!`;
    this.showMessage(message);

    // Disable further actions
    const actionButtons = document.querySelectorAll(".action-btn");
    actionButtons.forEach((button: Element) => {
      (button as HTMLButtonElement).disabled = true;
    });
  }

  private getColorHex(color: string): string {
    const colors: Record<string, string> = {
      red: "#DC143C",
      pink: "#ff69b4",
      blue: "#0000ff",
      black: "#000000",
      green: "#008000",
      yellow: "#ffff00",
    };
    return colors[color] || "#333333";
  }
}
