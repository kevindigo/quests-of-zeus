// Oracle of Delphi Game Engine
// Core game mechanics and state management

import type { HexColor } from "./hexmap.ts";
import { ALL_COLORS, COLORS, HexMap } from "./hexmap.ts";

export interface StorageSlot {
  type: "cube" | "statue" | "empty";
  color: HexColor;
}

export interface Player {
  id: number;
  name: string;
  color: HexColor;
  shipPosition: { q: number; r: number };
  storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  completedQuests: number;
  completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  oracleDice: HexColor[]; // Current oracle dice values
}

export interface CubeHex {
  q: number;
  r: number;
  cubeColors: HexColor[]; // Array of colors that have cubes on this hex (no duplicates)
}

export interface MonsterHex {
  q: number;
  r: number;
  monsterColors: HexColor[]; // Array of monster colors on this hex (no duplicates, max 2 per hex)
}

export interface GameState {
  map: HexMap;
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: "setup" | "oracle" | "action" | "end";
  monsterStrength: number;
  weatherDice: HexColor[];
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
}

// Helper function to create empty storage slots
function createEmptyStorage(): [StorageSlot, StorageSlot] {
  return [
    { type: "empty", color: "none" },
    { type: "empty", color: "none" },
  ];
}

// Helper function to check if player has a cube of specific color
function hasCubeOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "cube" && slot.color === color
  );
}

// Helper function to check if player has a statue of specific color
function hasStatueOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "statue" && slot.color === color
  );
}

// Helper function to add a cube to storage (returns true if successful)
function addCubeToStorage(player: Player, color: HexColor): boolean {
  const emptySlotIndex = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (emptySlotIndex !== -1) {
    player.storage[emptySlotIndex] = { type: "cube", color };
    return true;
  }
  return false;
}

// Helper function to remove a cube of specific color from storage (returns true if successful)
function removeCubeFromStorage(player: Player, color: HexColor): boolean {
  const cubeSlotIndex = player.storage.findIndex((slot) =>
    slot.type === "cube" && slot.color === color
  );
  if (cubeSlotIndex !== -1) {
    player.storage[cubeSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}

// Helper function to remove a statue of specific color from storage (returns true if successful)
function removeStatueFromStorage(player: Player, color: HexColor): boolean {
  const statueSlotIndex = player.storage.findIndex((slot) =>
    slot.type === "statue" && slot.color === color
  );
  if (statueSlotIndex !== -1) {
    player.storage[statueSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}

export class OracleGameEngine {
  private state: GameState | null = null;

  constructor() {
    // Game is not initialized by default
  }

  public initializeGame(): GameState {
    const map = new HexMap();

    // Find the Zeus hex coordinates
    const zeusCell = map.getCellsByTerrain("zeus")[0];
    const zeusPosition = zeusCell
      ? { q: zeusCell.q, r: zeusCell.r }
      : { q: 0, r: 0 };

    // Initialize players (2-4 players)
    const players: Player[] = [
      {
        id: 1,
        name: "Player 1",
        color: COLORS.RED,
        shipPosition: zeusPosition, // All players start on Zeus hex
        storage: createEmptyStorage(),
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
        shipPosition: zeusPosition, // All players start on Zeus hex
        storage: createEmptyStorage(),
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

    // Initialize cube hexes with Offering cubes
    const cubeHexes = this.initializeOfferingCubes(map, players.length);

    // Initialize monster hexes with monster distribution
    const monsterHexes = this.initializeMonsters(map, players.length);

    this.state = {
      map,
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: "oracle",
      monsterStrength: 3,
      weatherDice: [],
      cubeHexes,
      monsterHexes,
    };

    return this.state;
  }

  // Game Actions
  public rollOracleDice(playerId: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (
      !player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)
    ) {
      throw new Error("Invalid player or turn");
    }

    // Roll 3 oracle dice (random colors)
    const dice: HexColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
      dice.push(randomColor);
    }

    player.oracleDice = dice;
    this.state.phase = "action";

    return dice;
  }

  public moveShip(playerId: number, targetQ: number, targetR: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (
      !player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)
    ) {
      return false;
    }

    if (this.state.phase !== "action") {
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
    const isAdjacent = neighbors.some((neighbor) =>
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

    return true;
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cube hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "cubes") {
      return false;
    }

    // Find the cube hex in our tracking
    const cubeHex = this.state.cubeHexes.find((ch) =>
      ch.q === currentCell.q && ch.r === currentCell.r
    );

    if (!cubeHex) {
      return false;
    }

    // Check if the requested color is available on this hex
    if (!cubeHex.cubeColors.includes(color)) {
      return false;
    }

    // Try to add cube to storage
    const success = addCubeToStorage(player, color);
    if (success) {
      // Remove this color from the hex
      const colorIndex = cubeHex.cubeColors.indexOf(color);
      cubeHex.cubeColors.splice(colorIndex, 1);
      this.endTurn();
    }

    return success;
  }

  public fightMonster(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a monster hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "monsters") {
      return false;
    }

    // Find the monster hex in our tracking
    const monsterHex = this.state.monsterHexes.find((mh) =>
      mh.q === currentCell.q && mh.r === currentCell.r
    );

    if (!monsterHex || monsterHex.monsterColors.length === 0) {
      return false; // No monsters on this hex
    }

    // Check if player has required oracle dice
    const requiredDice = this.state.monsterStrength;
    if (player.oracleDice.length < requiredDice) {
      return false;
    }

    // Consume oracle dice
    player.oracleDice.splice(0, requiredDice);

    // Remove one monster from this hex (first one)
    monsterHex.monsterColors.shift();

    // Complete monster quest
    this.completeQuestType(playerId, "monster");
    this.endTurn();

    return true;
  }

  public buildTemple(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a temple hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "temple") {
      return false;
    }

    // Check if player has a cube of the required color
    const requiredColor = currentCell.color;
    if (!hasCubeOfColor(player, requiredColor)) {
      return false;
    }

    // Consume cube and complete temple
    const success = removeCubeFromStorage(player, requiredColor);
    if (success) {
      this.completeQuestType(playerId, "temple_offering");
      this.endTurn();
    }

    return success;
  }

  public buildFoundation(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a foundation hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "foundations") {
      return false;
    }

    // Complete foundation quest
    this.completeQuestType(playerId, "foundation");
    this.endTurn();

    return true;
  }

  public completeCloudQuest(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cloud hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "clouds") {
      return false;
    }

    // Check if player has a statue of the required color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue and complete cloud quest
    const success = removeStatueFromStorage(player, requiredColor);
    if (success) {
      this.completeQuestType(playerId, "cloud");
      this.endTurn();
    }

    return success;
  }

  /**
   * Place a statue on a city
   * Player must be on the city and have a statue of the city's color in storage
   */
  public placeStatueOnCity(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a city hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "city") {
      return false;
    }

    // Check if city already has all 3 statues
    if (currentCell.statues === 3) {
      return false;
    }

    // Check if player has a statue of the city's color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue from storage and add to city
    const success = removeStatueFromStorage(player, requiredColor);
    if (success) {
      this.state.map.addStatueToCity(currentCell.q, currentCell.r);
      this.endTurn();
    }

    return success;
  }

  /**
   * Check if a player can place a statue on the current city
   */
  public canPlaceStatueOnCity(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a city hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "city") {
      return false;
    }

    // Check if city already has all 3 statues
    if (currentCell.statues === 3) {
      return false;
    }

    // Check if player has a statue of the city's color
    const requiredColor = currentCell.color;
    return hasStatueOfColor(player, requiredColor);
  }

  private completeQuestType(
    playerId: number,
    questType: "temple_offering" | "monster" | "foundation" | "cloud",
  ): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.completedQuests++;
    player.completedQuestTypes[questType]++;
  }

  private endTurn(): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Reset oracle dice
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    currentPlayer.oracleDice = [];

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) %
      this.state.players.length;

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
    return this.state.players.findIndex((p) => p.id === playerId);
  }

  /**
   * Initialize Offering cubes on cube hexes
   * Each cube hex gets as many cubes as there are players,
   * but no hex can contain more than one cube of the same color
   */
  private initializeOfferingCubes(map: HexMap, playerCount: number): CubeHex[] {
    const cubeHexes: CubeHex[] = [];

    // Get all cube hexes from the map
    const cubeCells = map.getCellsByTerrain("cubes");

    // Shuffle the cube hexes for random distribution
    const shuffledCubeHexes = [...cubeCells];
    this.shuffleArray(shuffledCubeHexes);

    // Create a pool of colors to distribute
    const colorPool: HexColor[] = [];

    // Add playerCount copies of each color to the pool
    for (let i = 0; i < playerCount; i++) {
      colorPool.push(...ALL_COLORS);
    }

    // Shuffle the color pool for random distribution
    this.shuffleArray(colorPool);

    // Distribute colors to hexes
    let colorIndex = 0;
    for (const cell of shuffledCubeHexes) {
      const cubeColors: HexColor[] = [];

      // Add playerCount colors to this hex, ensuring no duplicates
      for (let i = 0; i < playerCount && colorIndex < colorPool.length; i++) {
        // Find the next color that isn't already on this hex
        while (
          colorIndex < colorPool.length &&
          cubeColors.includes(colorPool[colorIndex])
        ) {
          colorIndex++;
        }

        if (colorIndex < colorPool.length) {
          cubeColors.push(colorPool[colorIndex]);
          colorIndex++;
        }
      }

      cubeHexes.push({
        q: cell.q,
        r: cell.r,
        cubeColors,
      });
    }

    return cubeHexes;
  }

  /**
   * Initialize monsters on monster hexes according to game rules:
   * - Randomly choose 3 monster hexes to be "marked"
   * - Place 2 different-color monsters on each marked hex
   * - Distribute remaining monsters evenly among the remaining 6 non-marked hexes
   * - No color of monster occurs twice on any hex
   * - Total monsters per color = number of players
   */
  private initializeMonsters(map: HexMap, playerCount: number): MonsterHex[] {
    const monsterHexes: MonsterHex[] = [];

    // Get all monster hexes from the map
    const monsterCells = map.getCellsByTerrain("monsters");

    // Check if we have exactly 9 monster hexes as expected
    if (monsterCells.length !== 9) {
      console.warn(`Expected 9 monster hexes but found ${monsterCells.length}`);
    }

    // Shuffle the monster hexes for random distribution
    const shuffledMonsterHexes = [...monsterCells];
    this.shuffleArray(shuffledMonsterHexes);

    // Split into marked (3) and non-marked (6) hexes
    const markedHexes = shuffledMonsterHexes.slice(0, 3);
    const nonMarkedHexes = shuffledMonsterHexes.slice(3);

    // Calculate total monsters needed
    const totalMonstersPerColor = playerCount;
    const totalMonsters = totalMonstersPerColor * ALL_COLORS.length;

    // Create a pool of monster colors to distribute
    const monsterPool: HexColor[] = [];

    // Add playerCount copies of each color to the pool
    for (let i = 0; i < playerCount; i++) {
      monsterPool.push(...ALL_COLORS);
    }

    // Shuffle the monster pool for random distribution
    this.shuffleArray(monsterPool);

    // Track used colors per hex to ensure no duplicates
    const usedColorsPerHex = new Map<string, Set<HexColor>>();

    // Step 1: Place 2 different-color monsters on each marked hex
    for (const markedHex of markedHexes) {
      const hexKey = `${markedHex.q},${markedHex.r}`;
      usedColorsPerHex.set(hexKey, new Set<HexColor>());

      const monsterColors: HexColor[] = [];

      // Find 2 different colors from the pool
      let placed = 0;
      let poolIndex = 0;

      while (placed < 2 && poolIndex < monsterPool.length) {
        const color = monsterPool[poolIndex];

        // Check if this color isn't already used on this hex
        if (!monsterColors.includes(color)) {
          monsterColors.push(color);
          usedColorsPerHex.get(hexKey)!.add(color);

          // Remove this color from the pool (we'll track remaining pool separately)
          monsterPool.splice(poolIndex, 1);
          placed++;
        } else {
          poolIndex++;
        }
      }

      monsterHexes.push({
        q: markedHex.q,
        r: markedHex.r,
        monsterColors,
      });
    }

    // Step 2: Distribute remaining monsters evenly among non-marked hexes
    // Calculate how many monsters should go on each non-marked hex
    const remainingMonsters = monsterPool.length;
    const monstersPerNonMarkedHex = Math.floor(
      remainingMonsters / nonMarkedHexes.length,
    );
    const extraMonsters = remainingMonsters % nonMarkedHexes.length;

    // Distribute monsters to non-marked hexes
    let monsterIndex = 0;

    for (let i = 0; i < nonMarkedHexes.length; i++) {
      const nonMarkedHex = nonMarkedHexes[i];
      const hexKey = `${nonMarkedHex.q},${nonMarkedHex.r}`;
      usedColorsPerHex.set(hexKey, new Set<HexColor>());

      const monsterColors: HexColor[] = [];

      // Calculate how many monsters this hex gets
      const monstersForThisHex = monstersPerNonMarkedHex +
        (i < extraMonsters ? 1 : 0);

      // Add monsters to this hex, ensuring no duplicate colors
      for (
        let j = 0;
        j < monstersForThisHex && monsterIndex < monsterPool.length;
        j++
      ) {
        // Find the next color that isn't already on this hex
        while (
          monsterIndex < monsterPool.length &&
          monsterColors.includes(monsterPool[monsterIndex])
        ) {
          monsterIndex++;
        }

        if (monsterIndex < monsterPool.length) {
          monsterColors.push(monsterPool[monsterIndex]);
          usedColorsPerHex.get(hexKey)!.add(monsterPool[monsterIndex]);
          monsterIndex++;
        }
      }

      monsterHexes.push({
        q: nonMarkedHex.q,
        r: nonMarkedHex.r,
        monsterColors,
      });
    }

    // Log distribution for debugging
    console.log(
      `Monster distribution: ${markedHexes.length} marked hexes, ${nonMarkedHexes.length} non-marked hexes`,
    );
    console.log(
      `Total monsters: ${totalMonsters} (${totalMonstersPerColor} per color)`,
    );

    for (const monsterHex of monsterHexes) {
      console.log(
        `Hex (${monsterHex.q},${monsterHex.r}): ${
          monsterHex.monsterColors.join(", ")
        }`,
      );
    }

    return monsterHexes;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
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
    return this.state.players.find((p) => p.id === playerId);
  }

  public getAvailableMoves(playerId: number): { q: number; r: number }[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return [];
    }

    const currentPos = player.shipPosition;
    const neighbors = this.state.map.getNeighbors(currentPos.q, currentPos.r);

    return neighbors.filter((neighbor) => {
      // Check if movement to this hex is possible
      if (neighbor.terrain === "sea" && neighbor.color !== "none") {
        return player.oracleDice.includes(neighbor.color);
      }
      return true; // Land hexes are always accessible
    }).map((neighbor) => ({ q: neighbor.q, r: neighbor.r }));
  }

  /**
   * Get cube hex information for display
   */
  public getCubeHexes(): CubeHex[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.cubeHexes;
  }

  /**
   * Get monster hex information for display
   */
  public getMonsterHexes(): MonsterHex[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.monsterHexes;
  }

  /**
   * Get monsters on a specific hex
   */
  public getMonstersOnHex(q: number, r: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const monsterHex = this.state.monsterHexes.find((mh) =>
      mh.q === q && mh.r === r
    );
    return monsterHex ? monsterHex.monsterColors : [];
  }

  public checkWinCondition(): { winner: Player | null; gameOver: boolean } {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Game ends when any player completes 3 of each quest type
    const winner = this.state.players.find((p) =>
      p.completedQuestTypes.temple_offering >= 3 &&
      p.completedQuestTypes.monster >= 3 &&
      p.completedQuestTypes.foundation >= 3 &&
      p.completedQuestTypes.cloud >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner,
    };
  }
}
