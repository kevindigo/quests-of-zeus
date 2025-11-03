// Hexagonal map representation for Oracle of Delphi
// The game uses a 21x21 hex grid with various terrain types

const TerrainType = {
    SEA: "sea",           // Water tiles
    COAST: "coast",       // Coastal areas
    PLAINS: "plains",     // Open plains
    HILLS: "hills",       // Hilly terrain
    MOUNTAINS: "mountains", // Mountainous areas
    FOREST: "forest",     // Forested areas
    DESERT: "desert",     // Desert terrain
    ORACLE: "oracle",     // Oracle temple locations
    PORT: "port",         // Port cities
    SANCTUARY: "sanctuary" // Sanctuary locations
};

class HexCell {
    constructor(q, r, terrain) {
        this.q = q;        // Column coordinate
        this.r = r;        // Row coordinate
        this.terrain = terrain;
        this.isPassable = terrain !== TerrainType.SEA;
        this.movementCost = this.getMovementCost(terrain);
        this.elevation = this.generateElevation(terrain);
        this.visited = false;
        this.visible = false;
    }

    getMovementCost(terrain) {
        const costs = {
            [TerrainType.SEA]: Infinity,
            [TerrainType.COAST]: 1,
            [TerrainType.PLAINS]: 1,
            [TerrainType.HILLS]: 2,
            [TerrainType.MOUNTAINS]: 3,
            [TerrainType.FOREST]: 2,
            [TerrainType.DESERT]: 1,
            [TerrainType.ORACLE]: 1,
            [TerrainType.PORT]: 1,
            [TerrainType.SANCTUARY]: 1
        };
        return costs[terrain];
    }

    generateElevation(terrain) {
        const baseElevation = {
            [TerrainType.SEA]: 0,
            [TerrainType.COAST]: 10,
            [TerrainType.PLAINS]: 20,
            [TerrainType.HILLS]: 60,
            [TerrainType.MOUNTAINS]: 90,
            [TerrainType.FOREST]: 30,
            [TerrainType.DESERT]: 25,
            [TerrainType.ORACLE]: 50,
            [TerrainType.PORT]: 15,
            [TerrainType.SANCTUARY]: 40
        };
        const variation = Math.random() * 20 - 10;
        return Math.max(0, Math.min(100, baseElevation[terrain] + variation));
    }
}

class HexMap {
    constructor() {
        this.grid = [];
        this.width = 21;
        this.height = 21;
        this.generateGrid();
    }

    generateGrid() {
        this.grid = [];
        
        for (let q = 0; q < this.width; q++) {
            const row = [];
            for (let r = 0; r < this.height; r++) {
                const centerQ = Math.floor(this.width / 2);
                const centerR = Math.floor(this.height / 2);
                const distanceFromCenter = this.hexDistance(q, r, centerQ, centerR);
                
                const terrain = this.generateTerrain(q, r, distanceFromCenter);
                const cell = new HexCell(q, r, terrain);
                
                this.addSpecialLocations(cell, q, r, distanceFromCenter);
                row.push(cell);
            }
            this.grid.push(row);
        }
    }

    hexDistance(q1, r1, q2, r2) {
        const s1 = -q1 - r1;
        const s2 = -q2 - r2;
        return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
    }

    generateTerrain(q, r, distanceFromCenter) {
        const maxDistance = Math.min(this.width, this.height) / 2;
        
        if (distanceFromCenter > maxDistance * 0.8) {
            return TerrainType.SEA;
        } else if (distanceFromCenter > maxDistance * 0.7) {
            return TerrainType.COAST;
        }
        
        const seed = (q * 31 + r * 37) % 100;
        
        if (distanceFromCenter < maxDistance * 0.3) {
            if (seed < 5) return TerrainType.ORACLE;
            if (seed < 15) return TerrainType.SANCTUARY;
            if (seed < 30) return TerrainType.HILLS;
            if (seed < 50) return TerrainType.PLAINS;
            return TerrainType.FOREST;
        } else {
            if (seed < 10) return TerrainType.MOUNTAINS;
            if (seed < 25) return TerrainType.HILLS;
            if (seed < 45) return TerrainType.FOREST;
            if (seed < 60) return TerrainType.PLAINS;
            if (seed < 70) return TerrainType.DESERT;
            return TerrainType.PLAINS;
        }
    }

    addSpecialLocations(cell, q, r, distanceFromCenter) {
        const maxDistance = Math.min(this.width, this.height) / 2;
        
        // Oracle temples
        if (cell.terrain === TerrainType.ORACLE && distanceFromCenter < maxDistance * 0.4) {
            cell.hasOracle = true;
            cell.resources = {
                divineFavor: 3,
                offerings: 2
            };
        }
        
        // Ports
        if (cell.terrain === TerrainType.COAST && Math.random() < 0.1) {
            cell.hasPort = true;
            cell.resources = {
                ...cell.resources,
                gold: 2
            };
        }
        
        // Sanctuaries
        if (cell.terrain === TerrainType.SANCTUARY && distanceFromCenter < maxDistance * 0.6) {
            cell.hasSanctuary = true;
            cell.resources = {
                ...cell.resources,
                divineFavor: 2,
                offerings: 1
            };
        }
        
        // Offering sites
        if (!cell.hasOracle && !cell.hasSanctuary && Math.random() < 0.05) {
            cell.hasOffering = true;
            cell.resources = {
                ...cell.resources,
                offerings: 1
            };
        }
    }

    getCell(q, r) {
        if (q >= 0 && q < this.width && r >= 0 && r < this.height) {
            return this.grid[q][r];
        }
        return null;
    }

    getNeighbors(q, r) {
        const neighbors = [];
        const directions = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        
        for (const [dq, dr] of directions) {
            const neighbor = this.getCell(q + dq, r + dr);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }

    getCellsByTerrain(terrain) {
        const cells = [];
        for (let q = 0; q < this.width; q++) {
            for (let r = 0; r < this.height; r++) {
                if (this.grid[q][r].terrain === terrain) {
                    cells.push(this.grid[q][r]);
                }
            }
        }
        return cells;
    }

    getSpecialCells() {
        const specialCells = [];
        for (let q = 0; q < this.width; q++) {
            for (let r = 0; r < this.height; r++) {
                const cell = this.grid[q][r];
                if (cell.hasOracle || cell.hasPort || cell.hasSanctuary || cell.hasOffering) {
                    specialCells.push(cell);
                }
            }
        }
        return specialCells;
    }

    serialize() {
        return JSON.parse(JSON.stringify(this.grid));
    }

    static deserialize(data) {
        const map = new HexMap();
        map.grid = data;
        return map;
    }
}

// Game state
let gameMap = new HexMap();

// UI Functions
export function generateNewMap() {
    gameMap = new HexMap();
    console.log('New map generated');
    return gameMap;
}

export function getMapStatistics() {
    const terrainCounts = {};
    let oracleCount = 0;
    let portCount = 0;
    let sanctuaryCount = 0;
    let offeringCount = 0;
    
    for (let q = 0; q < gameMap.width; q++) {
        for (let r = 0; r < gameMap.height; r++) {
            const cell = gameMap.grid[q][r];
            terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
            if (cell.hasOracle) oracleCount++;
            if (cell.hasPort) portCount++;
            if (cell.hasSanctuary) sanctuaryCount++;
            if (cell.hasOffering) offeringCount++;
        }
    }
    
    return {
        dimensions: {
            width: gameMap.width,
            height: gameMap.height
        },
        terrainCounts,
        specialLocations: {
            oracles: oracleCount,
            ports: portCount,
            sanctuaries: sanctuaryCount,
            offerings: offeringCount
        },
        totalCells: gameMap.width * gameMap.height
    };
}

export function getSpecialCells() {
    return gameMap.getSpecialCells();
}

export function getMap() {
    return {
        map: gameMap.serialize(),
        dimensions: {
            width: gameMap.width,
            height: gameMap.height
        }
    };
}