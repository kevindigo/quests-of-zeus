# HexMap Module

This module provides a refactored, modular implementation of the hexagonal map
system for the Quests of Zeus game.

## Overview

The original large `HexMap` class has been refactored into several focused
service classes, each with a single responsibility:

## Classes

### HexMap (Main Class)

- **Purpose**: Main container that coordinates between services
- **Responsibilities**: Grid storage, service coordination, public API,
  serialization
- **Key Methods**: `getGrid()`, `getCell()`, `getNeighbors()`, `serialize()`,
  `deserialize()`

### TerrainPlacementManager

- **Purpose**: Handle all terrain generation and placement logic
- **Responsibilities**: Grid generation, Zeus placement, city placement, special
  terrain placement
- **Key Methods**: `generateGrid()`, `placeZeus()`, `placeCities()`,
  `placeSpecialTerrain()`

### SeaColorManager

- **Purpose**: Handle sea hex coloring with constraint satisfaction
- **Responsibilities**: Color assignment to sea hexes, conflict resolution
- **Key Methods**: `assignColorsToSeaHexes()`, `getLeastConflictingColor()`

### HexGridOperations

- **Purpose**: Core hex grid coordinate calculations and operations
- **Responsibilities**: Hex adjacency, coordinate calculations, distance
  calculations
- **Key Methods**: `getAdjacent()`, `getNeighborsFromGrid()`, `hexDistance()`,
  `getCorner()`

### PathfindingService

- **Purpose**: Pathfinding and connectivity analysis
- **Responsibilities**: Pathfinding algorithms, connectivity checks
- **Key Methods**: `canReachZeus()`, `hasNeighborOfType()`,
  `getNeighborsOfType()`

### UtilityService

- **Purpose**: General utility functions
- **Responsibilities**: Array shuffling and other utilities
- **Key Methods**: `shuffleArray()`

## Benefits of Refactoring

1. **Single Responsibility Principle**: Each class has a clear, focused purpose
2. **Testability**: Smaller classes are easier to unit test
3. **Maintainability**: Changes to one aspect won't affect others
4. **Reusability**: Services can be reused in other parts of the application
5. **Readability**: HexMap becomes a simple coordinator

## Usage

```typescript
import { HexMap } from './hexmap/HexMap.ts';

// Create a new map
const map = new HexMap();

// Access the grid
const grid = map.getGrid();

// Get a specific cell
const cell = map.getCell(0, 0);

// Get neighbors of a cell
const neighbors = map.getNeighbors(1, 1);

// Serialize for storage
const serialized = map.serialize();

// Deserialize from stored data
const restoredMap = HexMap.deserialize(serialized);
```

## Architecture

The `HexMap` class uses dependency injection to coordinate between services:

- `HexMap` → `TerrainPlacementManager` → `HexGridOperations` +
  `PathfindingService` + `SeaColorManager` + `UtilityService`
- `HexMap` → `HexGridOperations` for grid operations

This architecture allows for easy testing and modification of individual
components without affecting the entire system.
