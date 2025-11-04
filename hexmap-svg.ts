// SVG Hex Map Generator for Oracle of Delphi
// Generates an SVG representation of the hex map

import { HexCell, TerrainType, HexColor } from './hexmap.ts';

export interface HexMapSVGOptions {
  cellSize?: number;
  strokeWidth?: number;
  showCoordinates?: boolean;
  showTerrainLabels?: boolean;
  interactive?: boolean;
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
    };
  }

  /**
   * Generate SVG for a single hex cell
   */
  public generateHexCell(cell: HexCell, x: number, y: number): string {
    const { cellSize, strokeWidth, showCoordinates, showTerrainLabels } = this.options;
    const hexPoints = this.calculateHexPoints(x, y);
    
    // Get terrain color
    const terrainColor = this.getTerrainColor(cell.terrain);
    const strokeColor = this.getStrokeColor(cell.color);
    
    // Calculate hex center for labels
    const centerX = x + cellSize;
    const centerY = y + cellSize;
    
    let cellContent = `
      <polygon 
        points="${hexPoints}" 
        fill="${terrainColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
        data-q="${cell.q}" 
        data-r="${cell.r}"
        data-terrain="${cell.terrain}"
        class="hex-cell ${this.getTerrainClass(cell.terrain)}"
      />`;
    
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
  public calculateHexPoints(x: number, y: number): string {
    const { cellSize } = this.options;
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
  private calculateCellPosition(q: number, r: number): { x: number, y: number } {
    const { cellSize } = this.options;
    const x = cellSize * 1.5 * q;
    const y = cellSize * Math.sqrt(3) * (r + q / 2);
    return { x, y };
  }

  /**
   * Get terrain-specific color
   */
  private getTerrainColor(terrain: TerrainType): string {
    const colors: Record<TerrainType, string> = {
      sea: '#4a90e2',
      coast: '#87ceeb',
      plains: '#90ee90',
      hills: '#daa520',
      mountains: '#a9a9a9',
      forest: '#228b22',
      desert: '#f0e68c'
    };
    return colors[terrain] || '#cccccc';
  }

  /**
   * Get stroke color based on cell color
   */
  private getStrokeColor(color: HexColor): string {
    const colors: Record<HexColor, string> = {
      none: '#333333',
      red: '#ff0000',
      pink: '#ff69b4',
      blue: '#0000ff',
      black: '#000000',
      green: '#008000',
      yellow: '#ffff00'
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
      sea: 'Sea',
      coast: 'Coast',
      plains: 'Plains',
      hills: 'Hills',
      mountains: 'Mount',
      forest: 'Forest',
      desert: 'Desert'
    };
    return labels[terrain] || terrain;
  }

  /**
   * Generate complete SVG for the hex map
   */
  generateSVG(grid: HexCell[][]): string {
    const { cellSize, interactive } = this.options;
    const width = grid.length;
    
    // Find the maximum height by checking all rows
    let maxHeight = 0;
    for (let q = 0; q < width; q++) {
      maxHeight = Math.max(maxHeight, grid[q]?.length || 0);
    }
    
    // Calculate SVG dimensions
    const svgWidth = cellSize * 2 + cellSize * 1.5 * (width - 1);
    const svgHeight = cellSize * 2 + cellSize * Math.sqrt(3) * (maxHeight - 0.5);
    
    let svgContent = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" class="hex-map-svg">
  <defs>
    <style>
      .hex-cell {
        transition: all 0.2s ease;
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
    </style>
  </defs>
  
  <g class="hex-grid">`;

    // Generate all hex cells
    for (let q = 0; q < width; q++) {
      const row = grid[q] || [];
      for (let r = 0; r < row.length; r++) {
        const cell = row[r];
        if (cell) {
          const { x, y } = this.calculateCellPosition(q, r);
          svgContent += this.generateHexCell(cell, x, y);
        }
      }
    }

    svgContent += `
  </g>
</svg>`;

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
  // Add click handlers to hex cells
  svg.addEventListener('click', (event) => {
    const hexCell = event.target.closest('.hex-cell');
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

  // Add hover effects
  svg.addEventListener('mouseover', (event) => {
    const hexCell = event.target.closest('.hex-cell');
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