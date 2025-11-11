// Game type definitions for Quests of Zeus
import type { HexMap } from "./hexmap.ts";
import type { Player } from "./Player.ts";

// Terrain types for the hexagonal map
export type TerrainType =
  | "zeus" // Zeus locations
  | "sea" // Sea tiles
  | "shallow" // Shallow water
  | "monsters" // Monster locations
  | "cubes" // Cube locations
  | "temple" // Temple locations
  | "clouds" // Cloud locations
  | "city" // City locations
  | "foundations"; // Foundation locations

// Color types for hex cells
export type CoreColor =
  | "black"
  | "pink"
  | "blue"
  | "yellow"
  | "green"
  | "red";

// Color constants for the 6 fundamental colors
// These colors are used to power actions in the game
export const CORE_COLORS = {
  BLACK: "black" as CoreColor,
  PINK: "pink" as CoreColor,
  BLUE: "blue" as CoreColor,
  YELLOW: "yellow" as CoreColor,
  GREEN: "green" as CoreColor,
  RED: "red" as CoreColor,
} as const;

export const COLOR_WHEEL: CoreColor[] = [
  CORE_COLORS.BLACK,
  CORE_COLORS.PINK,
  CORE_COLORS.BLUE,
  CORE_COLORS.YELLOW,
  CORE_COLORS.GREEN,
  CORE_COLORS.RED,
];

// Color types for hex cells
export type HexColor =
  | "none"
  | CoreColor;

export interface HexCell {
  // Coordinates using axial coordinate system for hex grids
  q: number; // Column coordinate
  r: number; // Row coordinate

  // Cell characteristics
  terrain: TerrainType;
  color: HexColor;

  // City-specific properties
  statues?: number; // Number of statues placed on this city (0-3)
}

export type PlayerColorName =
  | "blue"
  | "yellow"
  | "green"
  | "red";

export const PLAYER_COLOR_NAMES = {
  BLACK: "black" as PlayerColorName,
  PINK: "pink" as PlayerColorName,
  BLUE: "blue" as PlayerColorName,
  YELLOW: "yellow" as PlayerColorName,
  GREEN: "green" as PlayerColorName,
  RED: "red" as PlayerColorName,
} as const;

export const PLAYER_COLORS = [
  PLAYER_COLOR_NAMES.GREEN,
  PLAYER_COLOR_NAMES.BLUE,
  PLAYER_COLOR_NAMES.YELLOW,
  PLAYER_COLOR_NAMES.RED,
];

export interface StorageSlot {
  type: "cube" | "statue" | "empty";
  color?: HexColor;
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

export interface MoveShipResult {
  success: boolean;
  error?: {
    type:
      | "invalid_player"
      | "wrong_phase"
      | "invalid_target"
      | "not_sea"
      | "no_die"
      | "die_not_available"
      | "wrong_color"
      | "not_reachable"
      | "not_enough_favor"
      | "recoloring_failed"
      | "unknown";
    message: string;
    details?: {
      playerId?: number;
      targetQ?: number;
      targetR?: number;
      dieColor?: HexColor;
      favorSpent?: number;
      availableFavor?: number;
      availableDice?: HexColor[];
      targetTerrain?: string;
      targetColor?: HexColor;
      requiredColor?: HexColor;
      movementRange?: number;
      recoloringCost?: number;
      phase?: string;
      originalDieColor?: HexColor;
      currentQ?: number;
      currentR?: number;
    };
  };
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
