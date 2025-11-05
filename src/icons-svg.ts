// SVG Icons for Oracle of Delphi
// Centralized location for all game icons

export interface IconOptions {
  centerX: number;
  centerY: number;
  cellSize: number;
}

/**
 * Generate a thick black circle with a stylized Z resembling a lightning bolt for Zeus
 */
export function generateZeusIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 14 * scale * 2.5; // 2.5x larger to fill more space
  
  // Monochrome black color
  const strokeColor = "#000000";
  const circleStrokeWidth = 3 * scale; // Thick circle border
  const zStrokeWidth = 2.5 * scale; // Thick Z stroke
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="zeus-icon">
      <!-- Thick black circle that almost fills the hex -->
      <circle 
        cx="0" 
        cy="0" 
        r="${size * 0.8}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${circleStrokeWidth}"
      />
      
      <!-- Highly stylized Z that resembles a lightning bolt -->
      <path d="
        M ${-size * 0.5} ${-size * 0.4}
        L ${size * 0.5} ${-size * 0.4}
        L ${-size * 0.3} ${0}
        L ${size * 0.3} ${0}
        L ${-size * 0.5} ${size * 0.4}
        L ${size * 0.5} ${size * 0.4}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${zStrokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  `;
}