// SVG Hex Map Generator for Quests of Zeus
// Generates an SVG representation of the hex map
// This should represent everything that would appear on a physical board

import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import {
  generateCityIcon,
  generateCloudsIcon,
  generateStatueIcons,
  generateTempleIcon,
  generateZeusIcon,
} from './icons-svg.ts';
import {
  COLOR_WHEEL,
  type CoreColor,
  type HexColor,
  type TerrainType,
} from './types.ts';
import { ViewPlayer } from './ViewPlayer.ts';

export interface IconOptions {
  centerX: number;
  centerY: number;
  cellSize: number;
}

export class HexMapSvgGenerator {
  constructor() {
  }

  public generateSVG(
    gameState: GameState,
    areAccessibilityIconsEnabled: boolean,
  ): string {
    const cellSize = 30;

    const grid = gameState.getMap().getHexGrid();
    const radius = grid.getRadius();
    const svgWidth = cellSize * 2 + cellSize * 1.5 * (radius * 2);
    const svgHeight = cellSize * 2 + cellSize * Math.sqrt(3) * (radius * 2);

    let svgContent = `<svg 
      width="${svgWidth}" 
      height="${svgHeight}" 
      xmlns="http://www.w3.org/2000/svg" 
      class="hex-map-svg">`;
    svgContent += this.createStyleSheetSvg();
    svgContent += this.createHexGridSvg(
      grid,
      gameState,
      cellSize,
      areAccessibilityIconsEnabled,
    );
    svgContent += `</svg>`;

    console.log('SVG generation completed successfully');
    return svgContent;
  }

  private createHexGridSvg(
    grid: HexGrid,
    gameState: GameState,
    cellSize: number,
    areAccessibilityIconsEnabled: boolean,
  ): string {
    let svgContent = `<g class="hex-grid">`;

    grid.forEachCell((cell) => {
      svgContent += this.createHexCellSvg(
        gameState,
        cell,
        cellSize,
        areAccessibilityIconsEnabled,
      );
    });

    svgContent += `</g>`;
    return svgContent;
  }

  private createHexCellSvg(
    gameState: GameState,
    cell: HexCell,
    cellSize: number,
    areAccessibilityIconsEnabled: boolean,
  ): string {
    const { x, y } = this.calculateCellPosition(cell.q, cell.r, cellSize);

    let cellContent = this.createBasicHexPolygonSvg(
      cell,
      x,
      y,
      cellSize,
    );

    if (cell.color !== 'none') {
      cellContent += this.createHexColorBorderSvg(cell, x, y, cellSize);
    }

    cellContent += this.createHighlightableBorderSvg(cell, x, y, cellSize);

    const centerX = x + cellSize;
    const centerY = y + cellSize;

    cellContent += this.createHexTerrainSpecificSvg(
      gameState,
      cell,
      x,
      y,
      cellSize,
      areAccessibilityIconsEnabled,
    );

    cellContent += this.createPlayerMarkersSvg(
      gameState,
      cell.getCoordinates(),
      centerX,
      centerY,
      cellSize,
    );

    return cellContent;
  }

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

  private getColorForTerrain(terrain: TerrainType): string {
    const colors: Record<TerrainType, string> = {
      zeus: 'none',
      sea: '#C4F4FFFF',
      shallow: 'none',
      monsters: '#d4a574',
      offerings: '#e8c99b',
      temple: '#f9d9a9',
      shrine: '#f0f8ff',
      city: '#b0b0b0',
      statue: '#b0b0b0',
    };
    return colors[terrain] || '#cccccc';
  }

  private getSvgColorForHexColor(color: HexColor): string {
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

  private getTerrainClass(terrain: TerrainType): string {
    return `terrain-${terrain}`;
  }

  private generateColoredCubes(
    options: IconOptions,
    cubeColors: CoreColor[],
  ): string {
    try {
      const { centerX, centerY, cellSize } = options;
      const cubeWidth = cellSize * 0.4;

      let cubesContent = '';

      cubeColors.forEach((color) => {
        const { bitCenterX, bitCenterY } = this.getBitLocationWithinHex(
          centerX,
          centerY,
          cubeWidth,
          color,
        );

        const strokeColor = this.getSvgColorForHexColor(color);
        const fillColor = this.getCubeFillColor(color);

        // Use squares instead of circles for cubes
        cubesContent += `
          <rect 
            x="${bitCenterX - cubeWidth / 2}" 
            y="${bitCenterY - cubeWidth / 2}" 
            width="${cubeWidth}" 
            height="${cubeWidth}" 
            fill="${fillColor}" 
            stroke="${strokeColor}" 
            stroke-width="${cellSize * 0.05}"
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
    monsterColors: CoreColor[],
  ): string {
    try {
      const { centerX, centerY, cellSize } = options;
      const triangleWidth = cellSize * 0.4;

      let monstersContent = '';

      monsterColors.forEach((color) => {
        const { bitCenterX, bitCenterY } = this.getBitLocationWithinHex(
          centerX,
          centerY,
          triangleWidth,
          color,
        );

        const strokeColor = this.getSvgColorForHexColor(color);
        const fillColor = this.getMonsterFillColor(color);
        const triangleHeight = triangleWidth * Math.sqrt(3) / 2;

        const triangleCornerPoints = [
          `${bitCenterX - triangleWidth / 2},${
            bitCenterY - triangleHeight / 2
          }`,
          `${bitCenterX + triangleWidth / 2},${
            bitCenterY - triangleHeight / 2
          }`,
          `${bitCenterX},${bitCenterY + triangleHeight / 2}`,
        ].join(' ');

        monstersContent += `
          <polygon 
            points="${triangleCornerPoints}" 
            fill="${fillColor}" 
            stroke="${strokeColor}" 
            stroke-width="${cellSize * 0.05}"
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
      const barSize = cellSize * 0.4;

      let statueBasesContent = '';

      baseColors.forEach((color) => {
        const { bitCenterX, bitCenterY } = this.getBitLocationWithinHex(
          centerX,
          centerY,
          barSize,
          color,
        );
        const strokeColor = this.getSvgColorForHexColor(color);

        statueBasesContent += `
          <line 
            x1 = "${bitCenterX - barSize / 2}"
            y1 = "${bitCenterY}"
            x2 = "${bitCenterX + barSize / 2}"
            y2 = "${bitCenterY}"
            stroke="${strokeColor}" 
            stroke-width="${cellSize * 0.2}"
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

  private getBitLocationWithinHex(
    centerX: number,
    centerY: number,
    bitSize: number,
    color: CoreColor,
  ): { bitCenterX: number; bitCenterY: number } {
    const spacing = bitSize * 1.5;

    const angleStep = (2 * Math.PI) / COLOR_WHEEL.length;
    const colorIndex = COLOR_WHEEL.indexOf(color);
    const index = colorIndex >= 0 ? colorIndex : 0;

    const angle = index * angleStep;
    const bitCenterX = centerX + Math.cos(angle) * spacing;
    const bitCenterY = centerY + Math.sin(angle) * spacing;
    return { bitCenterX, bitCenterY };
  }

  private createPlayerMarkersSvg(
    gameState: GameState,
    cellCoordinates: HexCoordinates,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const playerCount = gameState.getPlayerCount();
    let content = '';
    if (playerCount === 0) {
      return content;
    }

    const radius = cellSize / 4;
    for (let playerId = 0; playerId < playerCount; ++playerId) {
      const player = gameState.getPlayer(playerId);
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
    }

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

  private createStyleSheetSvg(): string {
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

  private createBasicHexPolygonSvg(
    cell: HexCell,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const basicHexPoints = this.calculateHexPoints(x, y, cellSize);
    const outlineColor = cell.terrain === 'shallow' ? 'none' : 'black';
    const terrainColor = this.getColorForTerrain(cell.terrain);

    return `
      <polygon 
        points="${basicHexPoints}" 
        fill="${terrainColor}" 
        stroke="${outlineColor}" 
        stroke-width="1"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-cell ${this.getTerrainClass(cell.terrain)}"
      />`;
  }

  private createHexColorBorderSvg(
    cell: HexCell,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const terrainColor = this.getColorForTerrain(cell.terrain);
    const effectiveStrokeWidth = 4;
    const strokeColor = this.getSvgColorForHexColor(cell.color);
    const insetAmount = (effectiveStrokeWidth / 2) + 1;
    const innerHexPoints = this.calculateHexPoints(
      x + insetAmount,
      y + insetAmount,
      cellSize - insetAmount,
    );

    return `
      <polygon 
        class="hex-cell-inner ${this.getTerrainClass(cell.terrain)}"
        points="${innerHexPoints}" 
        fill="${terrainColor}" 
        stroke="${strokeColor}" 
        stroke-width="${effectiveStrokeWidth}"
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
      />`;
  }

  private createHighlightableBorderSvg(
    cell: HexCell,
    x: number,
    y: number,
    cellSize: number,
  ): string {
    const highlightInsetAmount = 8;
    const highlightHexPoints = this.calculateHexPoints(
      x + highlightInsetAmount,
      y + highlightInsetAmount,
      cellSize - highlightInsetAmount,
    );

    return `
      <polygon 
        class="hex-highlight ${this.getTerrainClass(cell.terrain)}"
        points="${highlightHexPoints}" 
        fill="none" 
        stroke="transparent" 
        stroke-linejoin="round"
        stroke-linecap="round"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        style="pointer-events: none;"
      />`;
  }

  private createHexTerrainSpecificSvg(
    gameState: GameState,
    cell: HexCell,
    x: number,
    y: number,
    cellSize: number,
    areAccessibilityIconsEnabled: boolean,
  ): string {
    const centerX = x + cellSize;
    const centerY = y + cellSize;

    switch (cell.terrain) {
      case 'zeus':
        return this.createHexZeusSvg(centerX, centerY, cellSize);
      case 'sea':
        return this.createSeaSvg(
          centerX,
          centerY,
          cellSize,
          cell.color,
          areAccessibilityIconsEnabled,
        );
      case 'city':
        return this.createHexCitySvg(
          gameState,
          cell,
          centerX,
          centerY,
          cellSize,
        );
      case 'monsters':
        return this.createHexMonsterSvg(
          gameState,
          cell,
          centerX,
          centerY,
          cellSize,
        );
      case 'temple':
        return this.createHexTempleSvg(cell, centerX, centerY, cellSize);
      case 'offerings':
        return this.createHexOfferingSvg(
          gameState,
          cell,
          centerX,
          centerY,
          cellSize,
        );
      case 'shrine':
        return this.createHexShrineSvg(
          gameState,
          cell,
          centerX,
          centerY,
          cellSize,
        );
      case 'statue':
        return this.createHexStatueSvg(
          gameState,
          cell,
          centerX,
          centerY,
          cellSize,
        );
      default:
        return '';
    }
  }

  private createHexZeusSvg(
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    return generateZeusIcon({ centerX, centerY, cellSize });
  }

  private createSeaSvg(
    centerX: number,
    centerY: number,
    cellSize: number,
    color: HexColor,
    areAccessibilityIconsEnabled: boolean,
  ): string {
    const accessibleContent = `<text
      x="${centerX}" y="${centerY}"
      text-anchor="middle" dominant-baseline="central"
      font-size="${cellSize * 0.3}"
      pointer-events="none">
      ${ViewPlayer.getSymbol(color)}
    </text>`;

    return areAccessibilityIconsEnabled ? accessibleContent : '';
  }

  private createHexCitySvg(
    gameState: GameState,
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    let cellContent = generateCityIcon({
      centerX,
      centerY,
      cellSize,
      hexColor: this.getSvgColorForHexColor(cell.color),
    });

    const cityHex = gameState.getCityHexes().find((ch) =>
      ch.q === cell.q && ch.r === cell.r
    );

    if (cityHex && cityHex.statues && cityHex.statues > 0) {
      console.log(
        `City at (${cell.q}, ${cell.r}): statues = ${cityHex.statues}, color = ${cell.color}`,
      );
      cellContent += generateStatueIcons({
        centerX,
        centerY,
        cellSize,
        hexColor: this.getSvgColorForHexColor(cell.color),
      }, cityHex.statues);
    }

    return cellContent;
  }

  private createHexMonsterSvg(
    gameState: GameState,
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    let cellContent = '';

    // FixMe: If these icons remain hidden, just delete the entirely
    // let cellContent = generateMonsterIcon({ centerX, centerY, cellSize });

    const monsterHex = gameState.getMonsterHexes().find((mh) =>
      mh.q === cell.q && mh.r === cell.r
    );

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

    return cellContent;
  }

  private createHexTempleSvg(
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    return generateTempleIcon({
      centerX,
      centerY,
      cellSize,
      hexColor: this.getSvgColorForHexColor(cell.color),
    });
  }

  private createHexOfferingSvg(
    gameState: GameState,
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    let cellContent = '';

    // FixMe: If these icons remain hidden, just delete the entirely
    // let cellContent = generateOfferingsIcon({ centerX, centerY, cellSize });

    const cubeHex = gameState.getCubeHexes().find((ch) =>
      ch.q === cell.q && ch.r === cell.r
    );
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
    return cellContent;
  }

  private createHexShrineSvg(
    gameState: GameState,
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    const shrineHex = gameState.findShrineHexAt(cell.getCoordinates());
    if (shrineHex) {
      if (shrineHex.status === 'filled') {
        return '';
      } else if (shrineHex.status === 'visible') {
        const hexColor = this.getSvgColorForHexColor(shrineHex.owner);
        return generateCloudsIcon({ centerX, centerY, cellSize, hexColor });
      }
    }

    return generateCloudsIcon({ centerX, centerY, cellSize, hexColor: 'none' });
  }

  private createHexStatueSvg(
    gameState: GameState,
    cell: HexCell,
    centerX: number,
    centerY: number,
    cellSize: number,
  ): string {
    // FixMe: If the icon stays hidden, stop generating it!
    // cellContent += generateStatueBasesIcon({ centerX, centerY, cellSize });

    const statueHex = gameState.getStatueHexes().find((sh) =>
      sh.q === cell.q && sh.r === cell.r
    );
    const statueBaseColors = statueHex?.statueBaseColors || [];

    return this.generateColoredStatueBases({
      centerX,
      centerY,
      cellSize,
    }, statueBaseColors);
  }
}
