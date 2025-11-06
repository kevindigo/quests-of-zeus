// SVG Hex Map Generator for Oracle of Delphi
// Generates an SVG representation of the hex map

import type { HexCell, HexColor, TerrainType } from "./hexmap.ts";
import type { CubeHex, MonsterHex } from "./game-engine.ts";
import {
  generateCityIcon,
  generateCloudsIcon,
  generateCubesIcon,
  generateFoundationsIcon,
  generateMonsterIcon,
  generateStatueIcons,
  generateTempleIcon,
  generateZeusIcon,
} from "./icons-svg.ts";

export interface HexMapSVGOptions {
  cellSize?: number;
  strokeWidth?: number;
  showCoordinates?: boolean;
  showTerrainLabels?: boolean;
  interactive?: boolean;
  cubeHexes?: CubeHex[];
  monsterHexes?: MonsterHex[];
}

export class HexMapSVG {
  private options: Required<HexMapSVGOptions>;

  constructor(options: HexMapSVGOptions = {}) {
    this.options = {
      cellSize: options.cellSize || 40,
      strokeWidth: options.strokeWidth || 1,
      showCoordinates: options.showCoordinates ?? false,
      showTerrainLabels: options.showTerrainLabels ?? false,
      interactive: options.interactive ?? true,
      cubeHexes: options.cubeHexes || [],
      monsterHexes: options.monsterHexes || [],
    };
  }

  /**
   * Generate SVG for a single hex cell
   */
  public generateHexCell(cell: HexCell, x: number, y: number): string {
    const { cellSize, strokeWidth, showCoordinates, showTerrainLabels } =
      this.options;

    // Get terrain color
    const terrainColor = this.getTerrainColor(cell.terrain);
    const strokeColor = this.getStrokeColor(cell.color);

    // Calculate hex center for labels
    const centerX = x + cellSize;
    const centerY = y + cellSize;

    // Always start with the basic black outline
    const basicHexPoints = this.calculateHexPoints(x, y);
    let cellContent = `
      <polygon 
        points="${basicHexPoints}" 
        fill="${terrainColor}" 
        stroke="#333333" 
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-cell ${this.getTerrainClass(cell.terrain)}"
      />`;

    // For colored hexes, add an inner polygon with thick colored outline
    if (cell.color !== "none") {
      const effectiveStrokeWidth = strokeWidth * 3;
      // Inset the polygon to make room for the thick border inside the basic outline
      const insetAmount = (effectiveStrokeWidth / 2) + 1;
      const innerHexPoints = this.calculateHexPoints(
        x + insetAmount,
        y + insetAmount,
        cellSize - insetAmount,
      );

      cellContent += `
      <polygon 
        points="${innerHexPoints}" 
        fill="${terrainColor}" 
        stroke="${strokeColor}" 
        stroke-width="${effectiveStrokeWidth}"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-cell-inner ${this.getTerrainClass(cell.terrain)}"
      />`;
    }

    // Add Greek god head icon for Zeus hex
    if (cell.terrain === "zeus") {
      cellContent += generateZeusIcon({ centerX, centerY, cellSize });
    }

    // Add city icon for city hexes
    if (cell.terrain === "city") {
      cellContent += generateCityIcon({ 
        centerX, 
        centerY, 
        cellSize,
        hexColor: this.getStrokeColor(cell.color)
      });
      
      // Add statue icons if there are statues on this city
      if (cell.statues && cell.statues > 0) {
        cellContent += generateStatueIcons({ 
          centerX, 
          centerY, 
          cellSize,
          hexColor: this.getStrokeColor(cell.color)
        }, cell.statues);
      }
    }

    // Add monster icon for monster hexes
    if (cell.terrain === "monsters") {
      try {
        const monsterHex = this.options.monsterHexes?.find((mh) =>
          mh.q === cell.q && mh.r === cell.r
        );
        
        console.log(`Processing monster hex at (${cell.q}, ${cell.r}):`, monsterHex);
        
        // Always show the line-drawn monster icon as the base
        cellContent += generateMonsterIcon({ centerX, centerY, cellSize });
        
        // Then overlay colored monsters if present
        if (monsterHex && monsterHex.monsterColors.length > 0) {
          console.log(`Generating colored monsters for (${cell.q}, ${cell.r}) with colors:`, monsterHex.monsterColors);
          cellContent += this.generateColoredMonsters({ centerX, centerY, cellSize }, monsterHex.monsterColors);
        }
      } catch (error) {
        console.error(`Error rendering monster hex at (${cell.q}, ${cell.r}):`, error);
        // Fallback to generic monster icon on error
        cellContent += generateMonsterIcon({ centerX, centerY, cellSize });
      }
    }

    // Add temple icon for temple hexes
    if (cell.terrain === "temple") {
      cellContent += generateTempleIcon({ 
        centerX, 
        centerY, 
        cellSize,
        hexColor: this.getStrokeColor(cell.color)
      });
    }

    // Add cubes icon for cubes hexes
    if (cell.terrain === "cubes") {
      try {
        const cubeHex = this.options.cubeHexes.find((ch) =>
          ch.q === cell.q && ch.r === cell.r
        );
        
        console.log(`Processing cube hex at (${cell.q}, ${cell.r}):`, cubeHex);
        
        // Always show the line-drawn cubes icon as the base
        cellContent += generateCubesIcon({ centerX, centerY, cellSize });
        
        // Then overlay colored cubes if present
        if (cubeHex && cubeHex.cubeColors.length > 0) {
          console.log(`Generating colored cubes for (${cell.q}, ${cell.r}) with colors:`, cubeHex.cubeColors);
          cellContent += this.generateColoredCubes({ centerX, centerY, cellSize }, cubeHex.cubeColors);
        }
      } catch (error) {
        console.error(`Error rendering cube hex at (${cell.q}, ${cell.r}):`, error);
        // Fallback to generic cube icon on error
        cellContent += generateCubesIcon({ centerX, centerY, cellSize });
      }
    }

    // Add clouds icon for clouds hexes
    if (cell.terrain === "clouds") {
      cellContent += generateCloudsIcon({ centerX, centerY, cellSize });
    }

    // Add foundations icon for foundations hexes
    if (cell.terrain === "foundations") {
      cellContent += generateFoundationsIcon({ centerX, centerY, cellSize });
    }

    // Add coordinates if enabled
    if (showCoordinates) {
      cellContent += `
        <text 
          x="${centerX}" 
          y="${centerY - 5}" 
          text-anchor="middle" 
          font-size="10" 
          fill="rgba(0,0,0,0.7)"
          class="hex-coord"
        >${cell.q},${cell.r}</text>`;
    }

    // Add terrain label if enabled
    if (showTerrainLabels) {
      const terrainLabel = this.getTerrainLabel(cell.terrain);
      cellContent += `
        <text 
          x="${centerX}" 
          y="${centerY + 8}" 
          text-anchor="middle" 
          font-size="8" 
          fill="rgba(0,0,0,0.6)"
          class="hex-terrain-label"
        >${terrainLabel}</text>`;
    }

    return cellContent;
  }

  /**
   * Calculate the six points of a hexagon
   */
  public calculateHexPoints(x: number, y: number, size?: number): string {
    const cellSize = size ?? this.options.cellSize;
    const points: string[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + cellSize + cellSize * Math.cos(angle);
      const py = y + cellSize + cellSize * Math.sin(angle);
      points.push(`${px},${py}`);
    }

    return points.join(" ");
  }

  /**
   * Calculate position for a hex cell in axial coordinates
   */
  private calculateCellPosition(
    q: number,
    r: number,
  ): { x: number; y: number } {
    const { cellSize } = this.options;
    // Add offset to center the hexagon
    const offsetX = cellSize * 1.5 * 6; // Center at q=0
    const offsetY = cellSize * Math.sqrt(3) * 6; // Center at r=0

    const x = cellSize * 1.5 * q + offsetX;
    const y = cellSize * Math.sqrt(3) * (r + q / 2) + offsetY;
    return { x, y };
  }

  /**
   * Get terrain-specific color
   */
  private getTerrainColor(terrain: TerrainType): string {
    const colors: Record<TerrainType, string> = {
      zeus: "#ffd700", // Yellow for Zeus
      sea: "#87ceeb", // Pale blue for sea
      shallow: "#000000", // Black for shallow water
      monsters: "#d4a574", // Light brown for monsters
      cubes: "#e8c99b", // Darker yellow-tan for cubes (more visible)
      temple: "#f9d9a9", // Yellow-tan for temple
      clouds: "#f0f8ff", // Light blue-white for clouds
      city: "#b0b0b0", // Light gray for city
      foundations: "#b0b0b0", // Light gray for foundations
    };
    return colors[terrain] || "#cccccc";
  }

  /**
   * Get stroke color based on cell color
   */
  private getStrokeColor(color: HexColor): string {
    const colors: Record<HexColor, string> = {
      none: "#333333",
      red: "#DC143C",
      pink: "#ff69b4",
      blue: "#0000ff",
      black: "#000000",
      green: "#008000",
      yellow: "#ffff00",
    };
    return colors[color] || "#333333";
  }

  /**
   * Get CSS class for terrain
   */
  private getTerrainClass(terrain: TerrainType): string {
    return `terrain-${terrain}`;
  }

  /**
   * Get abbreviated terrain label
   */
  private getTerrainLabel(terrain: TerrainType): string {
    const labels: Record<TerrainType, string> = {
      zeus: "Zeus",
      sea: "Sea",
      shallow: "Shallow",
      monsters: "Monsters",
      cubes: "Cubes",
      temple: "Temple",
      clouds: "Clouds",
      city: "City",
      foundations: "Foundations",
    };
    return labels[terrain] || terrain;
  }

  /**
   * Generate colored cube icons for cube hexes
   */
  private generateColoredCubes(options: IconOptions, cubeColors: HexColor[]): string {
    try {
      const { centerX, centerY, cellSize } = options;
      const scale = cellSize / 40;
      // Use squares for cubes
      const cubeSize = 8 * scale;
      const spacing = cubeSize * 3;

      let cubesContent = '';
      
      // Safety check: if no cube colors, return empty string
      if (cubeColors.length === 0) {
        return cubesContent;
      }
      
      // Position cubes in a circular arrangement around the center
      const angleStep = (2 * Math.PI) / cubeColors.length;
      
      cubeColors.forEach((color, index) => {
        const angle = index * angleStep;
        const cubeX = centerX + Math.cos(angle) * spacing;
        const cubeY = centerY + Math.sin(angle) * spacing;
        
        const strokeColor = this.getStrokeColor(color);
        const fillColor = this.getCubeFillColor(color);
        
        // Use squares instead of circles for cubes
        cubesContent += `
          <rect 
            x="${cubeX - cubeSize}" 
            y="${cubeY - cubeSize}" 
            width="${cubeSize * 2}" 
            height="${cubeSize * 2}" 
            fill="${fillColor}" 
            stroke="${strokeColor}" 
            stroke-width="${2 * scale}"
            class="colored-cube cube-${color}"
          />
        `;
      });

      return cubesContent;
    } catch (error) {
      console.error("Error in generateColoredCubes:", error);
      // Return empty string on error - the fallback generic icon will be used
      return '';
    }
  }

  /**
   * Generate colored monster icons for monster hexes
   * Monsters are displayed as downward-pointing equilateral triangles
   */
  private generateColoredMonsters(options: IconOptions, monsterColors: HexColor[]): string {
    try {
      const { centerX, centerY, cellSize } = options;
      const scale = cellSize / 40;
      // Use triangles
      const triangleSize = 15 * scale;
      const spacing = triangleSize * 2;

      let monstersContent = '';
      
      // Safety check: if no monster colors, return empty string
      if (monsterColors.length === 0) {
        return monstersContent;
      }
      
      // Position monsters in a circular arrangement around the center
      const angleStep = (2 * Math.PI) / monsterColors.length;
      
      monsterColors.forEach((color, index) => {
        const angle = index * angleStep;
        const monsterX = centerX + Math.cos(angle) * spacing;
        const monsterY = centerY + Math.sin(angle) * spacing;
        
        const strokeColor = this.getStrokeColor(color);
        const fillColor = this.getMonsterFillColor(color);
        
        // Create downward-pointing equilateral triangle
        // Equilateral triangle height = side * √3 / 2
        const triangleHeight = triangleSize * Math.sqrt(3) / 2;
        
        // Points for downward-pointing equilateral triangle:
        // Top left, top right, bottom center
        const points = [
          `${monsterX - triangleSize / 2},${monsterY - triangleHeight / 2}`,
          `${monsterX + triangleSize / 2},${monsterY - triangleHeight / 2}`,
          `${monsterX},${monsterY + triangleHeight / 2}`
        ].join(' ');
        
        monstersContent += `
          <polygon 
            points="${points}" 
            fill="${fillColor}" 
            stroke="${strokeColor}" 
            stroke-width="${2 * scale}"
            class="colored-monster monster-${color}"
          />
        `;
      });

      return monstersContent;
    } catch (error) {
      console.error("Error in generateColoredMonsters:", error);
      // Return empty string on error - the fallback generic icon will be used
      return '';
    }
  }

  /**
   * Get fill color for cubes
   */
  private getCubeFillColor(color: HexColor): string {
    const colors: Record<HexColor, string> = {
      none: "#cccccc",
      red: "#ff0000",      // More vibrant red
      pink: "#ff69b4",     // More vibrant pink
      blue: "#0000ff",     // More vibrant blue
      black: "#000000",    // Pure black
      green: "#00ff00",    // More vibrant green
      yellow: "#ffff00",   // More vibrant yellow
    };
    return colors[color] || "#cccccc";
  }

  /**
   * Get fill color for monsters
   */
  private getMonsterFillColor(color: HexColor): string {
    // Use the same vibrant colors as cubes for consistency
    return this.getCubeFillColor(color);
  }

  /**
   * Generate complete SVG for the hex map
   */
  generateSVG(grid: HexCell[][]): string {
    const { cellSize } = this.options;

    // For hexagon with radius 6, the dimensions are fixed
    const radius = 6;
    const svgWidth = cellSize * 2 + cellSize * 1.5 * (radius * 2);
    const svgHeight = cellSize * 2 + cellSize * Math.sqrt(3) * (radius * 2);

    let svgContent = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" class="hex-map-svg">
  <defs>
    <style>
      .hex-cell {
        transition: all 0.2s ease;
      }
      .hex-cell-inner {
        pointer-events: none;
      }
      .hex-cell:hover {
        filter: brightness(1.1);
        stroke-width: 2;
      }
      .hex-cell.selected {
        stroke-width: 3;
        stroke: #ff0000;
      }

      .hex-coord, .hex-terrain-label {
        pointer-events: none;
        user-select: none;
      }

      .greek-god-head {
        pointer-events: none;
        user-select: none;
      }
    </style>
  </defs>
  
  <g class="hex-grid">`;

    // Generate all hex cells
    for (let q = 0; q < grid.length; q++) {
      const row = grid[q] || [];
      for (let r = 0; r < row.length; r++) {
        const cell = row[r];
        if (cell) {
          console.log(`Generating hex cell at (${cell.q}, ${cell.r}) with terrain: ${cell.terrain}`);
          const { x, y } = this.calculateCellPosition(cell.q, cell.r);
          svgContent += this.generateHexCell(cell, x, y);
        }
      }
    }

    svgContent += `
  </g>
</svg>`;

    console.log("SVG generation completed successfully");
    return svgContent;
  }

  /**
   * Generate SVG with interactive JavaScript
   */
  generateInteractiveSVG(grid: HexCell[][]): { svg: string; script: string } {
    const svg = this.generateSVG(grid);

    const script = `
// Hex map interaction
const svg = document.querySelector('.hex-map-svg');
if (svg) {
  // Add click handlers to hex cells (only outer cells)
  svg.addEventListener('click', (event) => {
    const hexCell = event.target.closest('.hex-cell:not(.hex-cell-inner)');
    if (hexCell) {
      const q = parseInt(hexCell.dataset.q);
      const r = parseInt(hexCell.dataset.r);
      const terrain = hexCell.dataset.terrain;
      
      // Remove previous selection
      document.querySelectorAll('.hex-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
      });
      
      // Add selection to clicked cell
      hexCell.classList.add('selected');
      
      // Dispatch custom event
      const cellEvent = new CustomEvent('hexCellClick', {
        detail: { q, r, terrain, element: hexCell }
      });
      document.dispatchEvent(cellEvent);
      
      console.log('Hex cell clicked:', { q, r, terrain });
    }
  });

  // Add hover effects (only outer cells)
  svg.addEventListener('mouseover', (event) => {
    const hexCell = event.target.closest('.hex-cell:not(.hex-cell-inner)');
    if (hexCell) {
      hexCell.style.cursor = 'pointer';
    }
  });
}`;

    return { svg, script };
  }

  /**
   * Update options
   */
  setOptions(newOptions: HexMapSVGOptions): void {
    this.options = { ...this.options, ...newOptions };
  }
}
