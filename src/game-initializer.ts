// Game initialization and setup for Quests of Zeus
import type { HexCell } from "./game-engine.ts";
import { HexMap } from "./hexmap.ts";
import { createEmptyStorage } from "./storage-manager.ts";
import type {
  CubeHex,
  GameState,
  HexColor,
  MonsterHex,
  Player,
} from "./types.ts";
import { ALL_COLORS, COLORS } from "./types.ts";

export function findZeus(map: HexMap): HexCell {
  const zeusCell = map.getCellsByTerrain("zeus")[0];
  if (zeusCell) {
    return zeusCell;
  }

  throw new Error("Zeus not found in map!");
}

export class GameInitializer {
  private oracleCardDeck: HexColor[] = [];

  /**
   * Initialize a new game state
   */
  public initializeGame(): GameState {
    const map = new HexMap();

    // Find the Zeus hex coordinates
    const zeusCell = findZeus(map);
    const zeusPosition = zeusCell
      ? { q: zeusCell.q, r: zeusCell.r }
      : { q: 0, r: 0 };

    // Initialize players (2-4 players)
    const players = this.initializePlayers(zeusPosition);

    // Initialize the oracle card deck
    this.initializeOracleCardDeck();

    // Initialize cube hexes with Offering cubes
    const cubeHexes = this.initializeOfferingCubes(map, players.length);

    // Initialize monster hexes with monster distribution
    const monsterHexes = this.initializeMonsters(map, players.length);

    return {
      map,
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: "action", // Start directly in action phase since dice are already rolled
      monsterStrength: 3,
      weatherDice: [],
      cubeHexes,
      monsterHexes,
    };
  }

  /**
   * Initialize players with starting positions and resources
   */
  private initializePlayers(startPosition: { q: number; r: number }): Player[] {
    const playerColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
    const players: Player[] = [];

    for (let i = 0; i < 2; i++) { // Start with 2 players for now
      // Roll initial oracle dice for all players during setup
      const initialDice: HexColor[] = [];
      for (let j = 0; j < 3; j++) {
        const randomColor =
          ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
        if (randomColor) {
          initialDice.push(randomColor);
        }
      }

      players.push({
        id: i + 1,
        name: `Player ${i + 1}`,
        color: playerColors[i] as HexColor,
        shipPosition: startPosition, // All players start on Zeus hex
        storage: createEmptyStorage(),
        completedQuests: 0,
        completedQuestTypes: {
          temple_offering: 0,
          monster: 0,
          foundation: 0,
          cloud: 0,
        },
        oracleDice: initialDice, // All players start with dice already rolled
        favor: 3 + i, // First player gets 3 favor, each subsequent gets 1 more
        shield: 0, // Players start with 0 shield
        recoloredDice: {}, // Track recoloring intentions
        oracleCards: [], // Initialize oracle cards as empty array
        usedOracleCardThisTurn: false, // No oracle cards used at start of turn
      });
    }

    return players;
  }

  /**
   * Initialize the oracle card deck
   */
  private initializeOracleCardDeck(): void {
    this.oracleCardDeck = [];
    const cardColors: HexColor[] = [
      COLORS.BLACK,
      COLORS.PINK,
      COLORS.BLUE,
      COLORS.YELLOW,
      COLORS.GREEN,
      COLORS.RED,
    ];
    // The deck consists of 5 copies of each of the 6 colors (5 * 6 = 30 cards)
    for (const color of cardColors) {
      for (let i = 0; i < 5; i++) {
        this.oracleCardDeck.push(color);
      }
    }

    // Shuffle the oracle card deck
    this.shuffleArray(this.oracleCardDeck);
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

    // We should have exactly 6 cube hexes
    if (cubeCells.length !== 6) {
      console.warn(`Expected 6 cube hexes but found ${cubeCells.length}`);
    }

    // Use a Latin square approach to ensure perfect distribution
    // Each hex gets exactly playerCount cubes, each color appears exactly playerCount times
    // and no color appears twice on the same hex

    // Create a base pattern that ensures each color appears once in each position
    const basePattern: HexColor[][] = [];

    // Create a shuffled copy of colors for the first hex
    const shuffledColors = [...ALL_COLORS];
    this.shuffleArray(shuffledColors);

    // For the first hex, use the shuffled colors
    basePattern.push([...shuffledColors]);

    // For subsequent hexes, rotate the pattern to ensure no duplicates in columns
    for (let i = 1; i < 6; i++) {
      const previousPattern = basePattern[i - 1] || [];
      const rotated = [...previousPattern];
      // Rotate the array to create a Latin square
      const first = rotated.shift();
      if (first) rotated.push(first);
      basePattern.push(rotated);
    }

    // Now assign cubes to hexes based on playerCount
    // For playerCount = 2, each hex gets the first 2 colors from its pattern
    // For playerCount = 3, each hex gets the first 3 colors, etc.
    for (let i = 0; i < cubeCells.length && i < 6; i++) {
      const cell = cubeCells[i];
      if (!cell) {
        throw new Error("Missing some cube cells?");
      }
      const thisPattern = basePattern[i] || [];
      const hexColors = thisPattern.slice(0, playerCount);

      cubeHexes.push({
        q: cell.q,
        r: cell.r,
        cubeColors: hexColors,
      });
    }

    return cubeHexes;
  }

  /**
   * Initialize monsters on monster hexes with simplified distribution:
   * - All monster hexes are treated equally (no marked/unmarked distinction)
   * - Monsters are distributed as evenly as possible across all 9 hexes
   * - Total monsters per color = number of players
   * - No hex can have more than one monster of the same color
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

    // Create a shuffled list of all monster colors to place
    const monsterColors = [...ALL_COLORS];
    this.shuffleArray(monsterColors);

    // We need playerCount copies of each color
    const monsterColorsToPlace: HexColor[] = [];
    for (let i = 0; i < playerCount; i++) {
      monsterColorsToPlace.push(...monsterColors);
    }

    // Initialize empty monster hexes
    for (const cell of shuffledMonsterHexes) {
      monsterHexes.push({
        q: cell.q,
        r: cell.r,
        monsterColors: [],
      });
    }

    // Distribute monsters evenly by stepping through hexes and colors
    // This algorithm ensures we can always place all monsters without getting stuck
    let colorIndex = 0;
    let hexIndex = 0;
    const totalColors = monsterColorsToPlace.length;

    while (colorIndex < totalColors) {
      const currentHex = monsterHexes[hexIndex];
      if (!currentHex) {
        throw new Error("Missing monster hex?");
      }
      const currentColor = monsterColorsToPlace[colorIndex];
      if (currentColor) {
        currentHex.monsterColors.push(currentColor);
      }
      hexIndex = (hexIndex + 1) % monsterHexes.length;
      colorIndex++;
    }

    return monsterHexes;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (!array[i]) {
        throw new Error("Unable to shuffle missing elements");
      }
      const temp = array[i];
      if (!array[j]) {
        throw new Error("Unable to shuffle missing elements");
      }
      array[i] = array[j];
      if (!temp) {
        throw new Error("Unable to shuffle missing elements");
      }
      array[j] = temp;
    }
  }

  /**
   * Get the oracle card deck (for use by the main engine)
   */
  public getOracleCardDeck(): HexColor[] {
    return this.oracleCardDeck;
  }
}
