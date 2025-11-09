// Quests of Zeus Game Engine - Backward Compatibility Adapter
// This file maintains the original interface while using the refactored modular structure

export { QuestsZeusGameEngine } from "./game-engine-core.ts";

// Re-export all the types for backward compatibility
export type { 
  HexColor, 
  Player, 
  CubeHex, 
  MonsterHex, 
  MoveShipResult, 
  GameState,
  StorageSlot,
  HexCell,
  TerrainType
} from "./types.ts";

// Re-export constants
export { ALL_COLORS, COLORS } from "./types.ts";