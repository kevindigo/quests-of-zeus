// Oracle of Delphi Game Engine
// Core game mechanics and state management

import type { HexCell, HexColor, TerrainType } from "./hexmap.ts";
import { HexMap, ALL_COLORS, COLORS } from "./hexmap.ts";

export interface Player {
  id: number;
  name: string;
  color: HexColor;
  shipPosition: { q: number; r: number };
  offerings: Record<HexColor, number>; // Offerings collected for each color
  completedQuests: number;
  completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  oracleDice: HexColor[]; // Current oracle dice values
}

export interface Quest {
  id: number;
  type: "temple_offering" | "monster" | "foundation" | "cloud";
  color: HexColor;
  requirements: {
    offerings?: Record<HexColor, number>;
    monsterType?: string;
    location?: { q: number; r: number };
  };
  completed: boolean;
}

export interface GameState {
  map: HexMap;
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: "setup" | "oracle" | "movement" | "action" | "end";
  quests: Quest[];
  availableQuests: Quest[];
  completedQuests: Quest[];
  monsterStrength: number;
  weatherDice: HexColor[];
}

// Helper function to create an empty offerings record
function createEmptyOfferings(): Record<HexColor, number> {
  return {
    none: 0,
    red: 0,
    pink: 0,
    blue: 0,
    black: 0,
    green: 0,
    yellow: 0,
  };
}

// Helper function to create offerings record with specific color requirement
function createOfferingsWithRequirement(color: HexColor, count: number): Record<HexColor, number> {
  return {
    ...createEmptyOfferings(),
    [color]: count,
  };
}

export class OracleGameEngine {
  private state: GameState | null = null;

  constructor() {
    // Game is not initialized by default
  }

  public initializeGame(): GameState {
    const map = new HexMap();
    
    // Initialize players (2-4 players)
    const players: Player[] = [
      {
        id: 1,
        name: "Player 1",
        color: COLORS.RED,
        shipPosition: { q: -1, r: 0 }, // Start at different positions
        offerings: createEmptyOfferings(),
        completedQuests: 0,
        completedQuestTypes: {
          temple_offering: 0,
          monster: 0,
          foundation: 0,
          cloud: 0,
        },
        oracleDice: [],
      },
      {
        id: 2,
        name: "Player 2",
        color: COLORS.BLUE,
        shipPosition: { q: 1, r: 0 },
        offerings: createEmptyOfferings(),
        completedQuests: 0,
        completedQuestTypes: {
          temple_offering: 0,
          monster: 0,
          foundation: 0,
          cloud: 0,
        },
        oracleDice: [],
      },
    ];

    // Initialize quests
    const quests = this.generateInitialQuests();

    this.state = {
      map,
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: "setup",
      quests,
      availableQuests: [...quests],
      completedQuests: [],
      monsterStrength: 3,
      weatherDice: [],
    };

    return this.state;
  }

  private generateInitialQuests(): Quest[] {
    const quests: Quest[] = [];
    let id = 1;

    // Temple offering quests (3 total) - combines collecting offering and delivering to temple
    for (let i = 0; i < 3; i++) {
      quests.push({
        id: id++,
        type: "temple_offering",
        color: ALL_COLORS[i % ALL_COLORS.length],
        requirements: {
          offerings: createOfferingsWithRequirement(ALL_COLORS[i % ALL_COLORS.length], 1),
        },
        completed: false,
      });
    }

    // Monster quests (3 total)
    for (let i = 0; i < 3; i++) {
      quests.push({
        id: id++,
        type: "monster",
        color: ALL_COLORS[i % ALL_COLORS.length],
        requirements: {
          monsterType: "basic",
        },
        completed: false,
      });
    }

    // Foundation quests (3 total)
    for (let i = 0; i < 3; i++) {
      quests.push({
        id: id++,
        type: "foundation",
        color: ALL_COLORS[i % ALL_COLORS.length],
        requirements: {},
        completed: false,
      });
    }

    // Cloud quests (3 total)
    for (let i = 0; i < 3; i++) {
      quests.push({
        id: id++,
        type: "cloud",
        color: ALL_COLORS[i % ALL_COLORS.length],
        requirements: {
          offerings: createOfferingsWithRequirement(ALL_COLORS[i % ALL_COLORS.length], 2),
        },
        completed: false,
      });
    }

    return quests;
  }

  // Game Actions
  public rollOracleDice(playerId: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)) {
      throw new Error("Invalid player or turn");
    }

    // Roll 3 oracle dice (random colors)
    const dice: HexColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
      dice.push(randomColor);
    }

    player.oracleDice = dice;
    this.state.phase = "movement";
    
    return dice;
  }

  public moveShip(playerId: number, targetQ: number, targetR: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)) {
      return false;
    }

    if (this.state.phase !== "movement") {
      return false;
    }

    // Check if movement is valid (adjacent hex)
    const currentPos = player.shipPosition;
    const targetCell = this.state.map.getCell(targetQ, targetR);
    
    if (!targetCell) {
      return false;
    }

    // Check adjacency
    const neighbors = this.state.map.getNeighbors(currentPos.q, currentPos.r);
    const isAdjacent = neighbors.some(neighbor => 
      neighbor.q === targetQ && neighbor.r === targetR
    );

    if (!isAdjacent) {
      return false;
    }

    // Check if player has required oracle dice for sea movement
    if (targetCell.terrain === "sea" && targetCell.color !== "none") {
      const requiredColor = targetCell.color;
      const hasDice = player.oracleDice.includes(requiredColor);
      
      if (!hasDice) {
        return false;
      }

      // Consume the oracle die
      const dieIndex = player.oracleDice.indexOf(requiredColor);
      player.oracleDice.splice(dieIndex, 1);
    }

    // Move the ship
    player.shipPosition = { q: targetQ, r: targetR };
    this.state.phase = "action";
    
    return true;
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cube hex of the specified color
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "cubes" || currentCell.color !== color) {
      return false;
    }

    // Collect offering
    player.offerings[color]++;
    this.endTurn();
    
    return true;
  }

  public fightMonster(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a monster hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "monsters") {
      return false;
    }

    // Check if player has required oracle dice
    const requiredDice = this.state.monsterStrength;
    if (player.oracleDice.length < requiredDice) {
      return false;
    }

    // Consume oracle dice
    player.oracleDice.splice(0, requiredDice);
    
    // Complete monster quest
    this.completeQuest(playerId, "monster");
    this.endTurn();
    
    return true;
  }

  public buildTemple(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a temple hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "temple") {
      return false;
    }

    // Check if player has required offerings
    const requiredColor = currentCell.color;
    if (player.offerings[requiredColor] < 1) {
      return false;
    }

    // Consume offering and complete temple
    player.offerings[requiredColor]--;
    this.completeQuest(playerId, "temple_offering");
    this.endTurn();
    
    return true;
  }

  public buildFoundation(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a foundation hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "foundations") {
      return false;
    }

    // Complete foundation quest
    this.completeQuest(playerId, "foundation");
    this.endTurn();
    
    return true;
  }

  public completeCloudQuest(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cloud hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "clouds") {
      return false;
    }

    // Check if player has required offerings
    const requiredColor = currentCell.color;
    if (player.offerings[requiredColor] < 2) {
      return false;
    }

    // Consume offerings and complete cloud quest
    player.offerings[requiredColor] -= 2;
    this.completeQuest(playerId, "cloud");
    this.endTurn();
    
    return true;
  }

  private completeQuest(playerId: number, questType: Quest["type"]): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    // Find available quest of the specified type
    const questIndex = this.state.availableQuests.findIndex(q => 
      q.type === questType && !q.completed
    );

    if (questIndex !== -1) {
      const quest = this.state.availableQuests[questIndex];
      quest.completed = true;
      player.completedQuests++;
      
      // Track completed quests by type
      player.completedQuestTypes[questType]++;
      
      // Move quest to completed
      this.state.completedQuests.push(quest);
      this.state.availableQuests.splice(questIndex, 1);
    }
  }

  private endTurn(): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Reset oracle dice
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    currentPlayer.oracleDice = [];

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    // If all players have taken their turn, advance round
    if (this.state.currentPlayerIndex === 0) {
      this.state.round++;
    }

    // Reset phase for next player
    this.state.phase = "oracle";
  }

  private getPlayerIndex(playerId: number): number {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players.findIndex(p => p.id === playerId);
  }

  // Game status
  public isGameInitialized(): boolean {
    return this.state !== null;
  }

  // Public getters
  public getGameState(): GameState {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Create a deep copy of the state, but preserve the HexMap instance
    const stateCopy = JSON.parse(JSON.stringify(this.state));
    // Replace the serialized map with the actual HexMap instance
    stateCopy.map = this.state.map;
    return stateCopy;
  }

  public getCurrentPlayer(): Player {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players[this.state.currentPlayerIndex];
  }

  public getPlayer(playerId: number): Player | undefined {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players.find(p => p.id === playerId);
  }

  public getAvailableMoves(playerId: number): { q: number; r: number }[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "movement") {
      return [];
    }

    const currentPos = player.shipPosition;
    const neighbors = this.state.map.getNeighbors(currentPos.q, currentPos.r);
    
    return neighbors.filter(neighbor => {
      // Check if movement to this hex is possible
      if (neighbor.terrain === "sea" && neighbor.color !== "none") {
        return player.oracleDice.includes(neighbor.color);
      }
      return true; // Land hexes are always accessible
    }).map(neighbor => ({ q: neighbor.q, r: neighbor.r }));
  }

  public checkWinCondition(): { winner: Player | null; gameOver: boolean } {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Game ends when any player completes 3 of each quest type
    const winner = this.state.players.find(p => 
      p.completedQuestTypes.temple_offering >= 3 &&
      p.completedQuestTypes.monster >= 3 &&
      p.completedQuestTypes.foundation >= 3 &&
      p.completedQuestTypes.cloud >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner
    };
  }
}