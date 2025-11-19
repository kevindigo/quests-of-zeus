// SVG Hex Map Generator for Quests of Zeus
// Generates an SVG representation of the hex map

import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import {
  generateCityIcon,
  generateCloudsIcon,
  generateMonsterIcon,
  generateOfferingsIcon,
  generateStatueBasesIcon,
  generateStatueIcons,
  generateTempleIcon,
  generateZeusIcon,
} from './icons-svg.ts';
import type { Player } from './Player.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  HexColor,
  MonsterHex,
  StatueHex,
  TerrainType,
} from './types.ts';

export interface HexMapSVGOptions {
  showCoordinates?: boolean;
  showTerrainLabels?: boolean;
  interactive?: boolean;
  cityHexes?: CityHex[];
  cubeHexes?: CubeHex[];
  monsterHexes?: MonsterHex[];
  statueHexes?: StatueHex[];
  players?: Player[];
}

// Interface for icon generation options
export interface IconOptions {
  centerX: number;
  centerY: number;
  cellSize: number;
}

export class HexMapSVG {
  private options: Required<HexMapSVGOptions>;

  constructor(options: HexMapSVGOptions = {}) {
    this.options = {
      showCoordinates: options.showCoordinates ?? false,
      showTerrainLabels: options.showTerrainLabels ?? false,
      interactive: options.interactive ?? true,
      cityHexes: options.cityHexes || [],
      cubeHexes: options.cubeHexes || [],
      monsterHexes: options.monsterHexes || [],
      statueHexes: options.statueHexes || [],
      players: options.players || [],
    };
  }

  /**
   * Generate SVG for a single hex cell
   */
  public generateHexCell(
    cell: HexCell,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const { showCoordinates, showTerrainLabels } = this.options;

    const strokeWidth = 1;
    // Get terrain color
    const terrainColor = this.getTerrainColor(cell.terrain);
    const strokeColor = this.getStrokeColor(cell.color);

    const outlineColor = cell.terrain === 'shallow' ? 'none' : 'black';

    // Calculate hex center for labels
    const centerX = x + cellSize;
    const centerY = y + cellSize;

    // Always start with the basic black outline
    const basicHexPoints = this.calculateHexPoints(x, y, cellSize);
    let cellContent = `
      <polygon 
        points="${basicHexPoints}" 
        fill="${terrainColor}" 
        stroke="${outlineColor}" 
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-cell ${this.getTerrainClass(cell.terrain)}"
      />`;

    // For colored hexes, add an inner polygon with thick colored outline
    if (cell.color !== 'none') {
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

      // Add an even more inset polygon for highlighting (won't cover the colored border)
      const highlightInsetAmount = insetAmount + effectiveStrokeWidth + 4; // Increased for smaller highlights
      const highlightHexPoints = this.calculateHexPoints(
        x + highlightInsetAmount,
        y + highlightInsetAmount,
        cellSize - highlightInsetAmount,
      );

      cellContent += `
      <polygon 
        points="${highlightHexPoints}" 
        fill="none" 
        stroke="transparent" 
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-highlight ${this.getTerrainClass(cell.terrain)}"
        style="pointer-events: none;"
      />`;

      // Debug: Log hex-highlight creation for colored hexes
      console.log(
        `Created hex-highlight for colored hex at (${cell.q}, ${cell.r})`,
      );
    } else {
      // For uncolored hexes, add a highlight polygon at the same inset as colored hexes
      const highlightInsetAmount = 16; // Increased from 10 to 16 for smaller highlights (consistent with colored hexes)
      const highlightHexPoints = this.calculateHexPoints(
        x + highlightInsetAmount,
        y + highlightInsetAmount,
        cellSize - highlightInsetAmount,
      );

      cellContent += `
      <polygon 
        points="${highlightHexPoints}" 
        fill="none" 
        stroke="transparent" 
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-highlight ${this.getTerrainClass(cell.terrain)}"
        style="pointer-events: none;"
      />`;

      // Debug: Log hex-highlight creation for uncolored hexes
      console.log(
        `Created hex-highlight for uncolored hex at (${cell.q}, ${cell.r})`,
      );
    }

    // Add Greek god head icon for Zeus hex
    if (cell.terrain === 'zeus') {
      cellContent += generateZeusIcon({ centerX, centerY, cellSize });
    }

    // Add city icon for city hexes
    if (cell.terrain === 'city') {
      const cityHex = this.options.cityHexes?.find((ch) =>
        ch.q === cell.q && ch.r === cell.r
      );

      cellContent += generateCityIcon({
        centerX,
        centerY,
        cellSize,
        hexColor: this.getStrokeColor(cell.color),
      });

      // Add statue icons if there are statues on this city
      if (cityHex && cityHex.statues && cityHex.statues > 0) {
        console.log(
          `City at (${cell.q}, ${cell.r}): statues = ${cityHex.statues}, color = ${cell.color}`,
        );
        cellContent += generateStatueIcons({
          centerX,
          centerY,
          cellSize,
          hexColor: this.getStrokeColor(cell.color),
        }, cityHex.statues);
      }
    }

    // Add monster icon for monster hexes
    if (cell.terrain === 'monsters') {
      try {
        const monsterHex = this.options.monsterHexes?.find((mh) =>
          mh.q === cell.q && mh.r === cell.r
        );

        console.log(
          `Processing monster hex at (${cell.q}, ${cell.r}):`,
          monsterHex,
        );

        // Always show the line-drawn monster icon as the base
        cellContent += generateMonsterIcon({ centerX, centerY, cellSize });

        // Then overlay colored monsters if present
        if (monsterHex && monsterHex.monsterColors.length > 0) {
          console.log(
            `Generating colored monsters for (${cell.q}, ${cell.r}) with colors:`,
            monsterHex.monsterColors,
          );
          cellContent += this.generateColoredMonsters({
            centerX,
            centerY,
            cellSize,
          }, monsterHex.monsterColors);
        }
      } catch (error) {
        console.error(
          `Error rendering monster hex at (${cell.q}, ${cell.r}):`,
          error,
        );
        // Fallback to generic monster icon on error
        cellContent += generateMonsterIcon({ centerX, centerY, cellSize });
      }
    }

    // Add temple icon for temple hexes
    if (cell.terrain === 'temple') {
      cellContent += generateTempleIcon({
        centerX,
        centerY,
        cellSize,
        hexColor: this.getStrokeColor(cell.color),
      });
    }

    // Add cubes icon for offerings hexes
    if (cell.terrain === 'offerings') {
      try {
        const cubeHex = this.options.cubeHexes.find((ch) =>
          ch.q === cell.q && ch.r === cell.r
        );

        console.log(`Processing cube hex at (${cell.q}, ${cell.r}):`, cubeHex);

        // Always show the line-drawn offerings icon as the base
        cellContent += generateOfferingsIcon({ centerX, centerY, cellSize });

        // Then overlay colored cubes if present
        if (cubeHex && cubeHex.cubeColors.length > 0) {
          console.log(
            `Generating colored cubes for (${cell.q}, ${cell.r}) with colors:`,
            cubeHex.cubeColors,
          );
          cellContent += this.generateColoredCubes({
            centerX,
            centerY,
            cellSize,
          }, cubeHex.cubeColors);
        }
      } catch (error) {
        console.error(
          `Error rendering cube hex at (${cell.q}, ${cell.r}):`,
          error,
        );
        // Fallback to generic cube icon on error
        cellContent += generateOfferingsIcon({ centerX, centerY, cellSize });
      }
    }

    // Add clouds icon for clouds hexes
    if (cell.terrain === 'shrine') {
      cellContent += generateCloudsIcon({ centerX, centerY, cellSize });
    }

    // Add statue icon for statue hexes
    if (cell.terrain === 'statue') {
      try {
        // FixMe: If the icon stays hidden, stop generating it!
        // cellContent += generateStatueBasesIcon({ centerX, centerY, cellSize });

        const statueHex = this.options.statueHexes.find((sh) =>
          sh.q === cell.q && sh.r === cell.r
        );
        const statueBaseColors = statueHex?.statueBaseColors || [];

        cellContent += this.generateColoredStatueBases({
          centerX,
          centerY,
          cellSize,
        }, statueBaseColors);
      } catch (error) {
        console.error(
          `Error rendering cube hex at (${cell.q}, ${cell.r}):`,
          error,
        );
        cellContent += generateStatueBasesIcon({ centerX, centerY, cellSize });
      }
    }

    cellContent += this.getPlayerMarkers(
      cell.getCoordinates(),
      centerX,
      centerY,
      cellSize,
    );

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
  public calculateHexPoints(x: number, y: number, cellSize: number): string {
    const points: string[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + cellSize + cellSize * Math.cos(angle);
      const py = y + cellSize + cellSize * Math.sin(angle);
      points.push(`${px},${py}`);
    }

    return points.join(' ');
  }

  /**
   * Calculate position for a hex cell in axial coordinates
   */
  private calculateCellPosition(
    q: number,
    r: number,
    cellSize: number,
  ): { x: number; y: number } {
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
      zeus: 'none', // Yellow for Zeus
      sea: '#87ceeb', // Pale blue for sea
      shallow: 'none', // Transparent for shallow water
      monsters: '#d4a574', // Light brown for monsters
      offerings: '#e8c99b', // Darker yellow-tan for offerings (more visible)
      temple: '#f9d9a9', // Yellow-tan for temple
      shrine: '#f0f8ff', // Light blue-white for shrines
      city: '#b0b0b0', // Light gray for city
      statue: '#b0b0b0', // Light gray for statues
    };
    return colors[terrain] || '#cccccc';
  }

  /**
   * Get stroke color based on cell color
   */
  private getStrokeColor(color: HexColor): string {
    const colors: Record<HexColor, string> = {
      none: '#333333',
      red: '#DC143C',
      pink: '#ff69b4',
      blue: '#0000ff',
      black: '#000000',
      green: '#008000',
      yellow: '#ffff00',
    };
    return colors[color] || '#333333';
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
      zeus: 'Zeus',
      sea: 'Sea',
      shallow: 'Shallow',
      monsters: 'Monsters',
      offerings: 'Offerings',
      temple: 'Temple',
      shrine: 'Shrine',
      city: 'City',
      statue: 'Statue',
    };
    return labels[terrain] || terrain;
  }

  /**
   * Generate colored cube icons for cube hexes
   */
  private generateColoredCubes(
    options: IconOptions,
    cubeColors: HexColor[],
  ): string {
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
      console.error('Error in generateColoredCubes:', error);
      // Return empty string on error - the fallback generic icon will be used
      return '';
    }
  }

  /**
   * Generate colored monster icons for monster hexes
   * Monsters are displayed as downward-pointing equilateral triangles
   */
  private generateColoredMonsters(
    options: IconOptions,
    monsterColors: HexColor[],
  ): string {
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
          `${monsterX},${monsterY + triangleHeight / 2}`,
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
      console.error('Error in generateColoredMonsters:', error);
      // Return empty string on error - the fallback generic icon will be used
      return '';
    }
  }

  private generateColoredStatueBases(
    options: IconOptions,
    baseColors: CoreColor[],
  ): string {
    try {
      const { centerX, centerY, cellSize } = options;
      const scale = cellSize / 40;
      // Use horizontal bars
      const barSize = 25 * scale;

      let statueBasesContent = '';

      // Safety check: if no base colors, return empty string
      if (baseColors.length === 0) {
        return statueBasesContent;
      }

      const xValues = [
        centerX - scale * 5,
        centerX + scale * 18,
        centerX - scale * 12,
      ];
      const yValues = [
        centerY - scale * 10,
        centerY + scale * 10,
        centerY + scale * 22,
      ];

      baseColors.forEach((color, index) => {
        const baseX = xValues[index] || centerX;
        const baseY = yValues[index] || centerY;

        const strokeColor = this.getStrokeColor(color);

        statueBasesContent += `
          <line 
            x1 = "${baseX - barSize / 2}"
            y1 = "${baseY}"
            x2 = "${baseX + barSize / 2}"
            y2 = "${baseY}"
            stroke="${strokeColor}" 
            stroke-width="${5 * scale}"
            class="colored-statue-base statue-base-${color}"
          />
        `;
      });

      return statueBasesContent;
    } catch (error) {
      console.error('Error in generateColoredMonsters:', error);
      // Return empty string on error - the fallback generic icon will be used
      return '';
    }
  }

  private getPlayerMarkers(
    cellCoordinates: HexCoordinates,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const players = this.options.players;
    let content = '';
    if (!players) {
      return content;
    }

    const radius = cellSize / 4;
    players.forEach((player) => {
      const position = player.getShipPosition();
      if (
        cellCoordinates.q === position.q && cellCoordinates.r === position.r
      ) {
        const id = player.id;
        const horizontal = (id % 2) * 2 - 1;
        const vertical = Math.floor(id / 2) * 2 - 1;
        const cx = x + (horizontal * radius * 1.2);
        const cy = y + (vertical * radius * 1.2);
        content += `<circle 
            cx = "${cx}"
            cy = "${cy}"
            r = "${radius}"
            stroke="${'black'}" 
            stroke-width="${1}"
            fill="${player.color}"
        />`;
      }
    });

    return content;
  }

  /**
   * Get fill color for cubes
   */
  private getCubeFillColor(color: HexColor): string {
    const colors: Record<HexColor, string> = {
      none: '#cccccc',
      red: '#ff0000', // More vibrant red
      pink: '#ff69b4', // More vibrant pink
      blue: '#0000ff', // More vibrant blue
      black: '#000000', // Pure black
      green: '#008000', // Consistent green (same as hex outlines)
      yellow: '#ffff00', // More vibrant yellow
    };
    return colors[color] || '#cccccc';
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
  public generateSVG(grid: HexGrid): string {
    const cellSize = 30;

    const radius = grid.getRadius();
    const svgWidth = cellSize * 2 + cellSize * 1.5 * (radius * 2);
    const svgHeight = cellSize * 2 + cellSize * Math.sqrt(3) * (radius * 2);

    let svgContent = `<svg 
      width="${svgWidth}" 
      height="${svgHeight}" 
      xmlns="http://www.w3.org/2000/svg" 
      class="hex-map-svg">`;
    svgContent += this.getStyleSection();
    svgContent += this.getHexGridContent(grid, cellSize);
    svgContent += `</svg>`;

    console.log('SVG generation completed successfully');
    return svgContent;
  }

  /**
   * Update options
   */
  setOptions(newOptions: HexMapSVGOptions): void {
    this.options = { ...this.options, ...newOptions };
  }

  private getStyleSection(): string {
    return `<defs><style>
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
    </style></defs>`;
  }

  private getHexGridContent(grid: HexGrid, cellSize: number): string {
    let svgContent = `<g class="hex-grid">`;

    // Generate all hex cells
    grid.forEachCell((cell) => {
      if (cell) {
        console.log(
          `Generating hex cell at (${cell.q}, ${cell.r}) with terrain: ${cell.terrain}`,
        );
        const { x, y } = this.calculateCellPosition(cell.q, cell.r, cellSize);
        svgContent += this.generateHexCell(cell, x, y, cellSize);
      }
    });

    svgContent += `</g>`;
    return svgContent;
  }
}
