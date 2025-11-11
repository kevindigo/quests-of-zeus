// Game type definitions for Quests of Zeus

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
export type HexColor =
  | "none"
  | "red"
  | "black"
  | "pink"
  | "blue"
  | "yellow"
  | "green";

// Color constants for the 6 fundamental colors
// These colors are used to power actions in the game
export const COLORS = {
  BLACK: "black" as HexColor,
  BLUE: "blue" as HexColor,
  RED: "red" as HexColor,
  YELLOW: "yellow" as HexColor,
  GREEN: "green" as HexColor,
  PINK: "pink" as HexColor,
} as const;

export const ALL_COLORS: HexColor[] = [
  COLORS.BLACK,
  COLORS.BLUE,
  COLORS.RED,
  COLORS.YELLOW,
  COLORS.GREEN,
  COLORS.PINK,
];

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

import type { HexMap } from "./hexmap.ts";

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
  favor: number; // Player's favor resource
  shield: number; // Player's shield resource
  recoloredDice: {
    [dieColor: string]: { newColor: HexColor; favorCost: number };
  }; // Track recoloring intentions for dice
  recoloredCards?: {
    [cardColor: string]: { newColor: HexColor; favorCost: number };
  }; // Track recoloring intentions for oracle cards
  oracleCards: HexColor[]; // Oracle cards held by player
  usedOracleCardThisTurn: boolean; // Track if player has used an oracle card this turn
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
