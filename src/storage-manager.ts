// Storage slot management for Quests of Zeus
import type { HexColor, Player, StorageSlot } from "./types.ts";

// Helper function to create empty storage slots
export function createEmptyStorage(): [StorageSlot, StorageSlot] {
  return [
    { type: "empty", color: "none" },
    { type: "empty", color: "none" },
  ];
}

// Helper function to check if player has a cube of specific color
export function hasCubeOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "cube" && slot.color === color
  );
}

// Helper function to check if player has a statue of specific color
export function hasStatueOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "statue" && slot.color === color
  );
}

// Helper function to add a cube to storage (returns true if successful)
export function addCubeToStorage(player: Player, color: HexColor): boolean {
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
export function removeCubeFromStorage(
  player: Player,
  color: HexColor,
): boolean {
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
export function removeStatueFromStorage(
  player: Player,
  color: HexColor,
): boolean {
  const statueSlotIndex = player.storage.findIndex((slot) =>
    slot.type === "statue" && slot.color === color
  );
  if (statueSlotIndex !== -1) {
    player.storage[statueSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}
