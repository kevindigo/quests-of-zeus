// Quests of Zeus Game Engine - Backward Compatibility Adapter
// This file maintains the original interface while using the refactored modular structure

export { QuestsZeusGameEngine } from './game-engine-core.ts';

// Re-export all the types for backward compatibility
export type {
  CubeHex,
  GameState,
  HexColor,
  MonsterHex,
  MoveShipResult,
  StorageSlot,
  TerrainType,
} from './types.ts';
