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

/**
 * Generate a line-drawn city icon with three Rome-era buildings
 * Three outlines of Rome-era buildings next to each other, each of slightly different sizes and shapes
 */
export function generateCityIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size - 2.5x larger than before
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space
  
  // Monochrome black color with thick strokes
  const strokeColor = "#000000";
  const strokeWidth = 2.5 * scale; // Thick black lines
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="city-icon">
      <!-- Left building: Temple-style with triangular pediment -->
      <path d="
        M ${-size * 0.8} ${size * 0.3}
        L ${-size * 0.8} ${-size * 0.6}
        L ${-size * 0.4} ${-size * 0.8}
        L ${-size * 0.2} ${-size * 0.6}
        L ${-size * 0.2} ${size * 0.3}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Center building: Basilica-style with arched entrance -->
      <path d="
        M ${-size * 0.15} ${size * 0.3}
        L ${-size * 0.15} ${-size * 0.3}
        L ${size * 0.15} ${-size * 0.3}
        L ${size * 0.15} ${size * 0.3}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Arch for center building -->
      <path d="
        M ${-size * 0.1} ${-size * 0.3}
        A ${size * 0.1} ${size * 0.2} 0 0 0 ${size * 0.1} ${-size * 0.3}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      
      <!-- Right building: Domus/villa with columns - clearer and more prominent -->
      <path d="
        M ${size * 0.25} ${size * 0.3}
        L ${size * 0.25} ${-size * 0.4}
        L ${size * 0.7} ${-size * 0.4}
        L ${size * 0.7} ${size * 0.3}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Column details for right building - more prominent -->
      <line 
        x1="${size * 0.35}" y1="${-size * 0.4}" 
        x2="${size * 0.35}" y2="${size * 0.3}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}"
      />
      <line 
        x1="${size * 0.5}" y1="${-size * 0.4}" 
        x2="${size * 0.5}" y2="${size * 0.3}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}"
      />
      <line 
        x1="${size * 0.65}" y1="${-size * 0.4}" 
        x2="${size * 0.65}" y2="${size * 0.3}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}"
      />
    </g>
  `;
}

/**
 * Generate a monster icon with a realistic paw print design
 * Features a large main pad, four toe pads above, and claw marks
 */
export function generateMonsterIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size - 2.5x larger than before
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space
  
  // Monochrome black color with thick strokes
  const strokeColor = "#000000";
  const strokeWidth = 2.5 * scale; // Thick black lines
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="monster-icon">
      <!-- Large main paw pad (heart-shaped for realism) -->
      <path d="
        M ${-size * 0.5} ${size * 0.1}
        C ${-size * 0.3} ${size * 0.5}, ${size * 0.3} ${size * 0.5}, ${size * 0.5} ${size * 0.1}
        C ${size * 0.4} ${-size * 0.1}, ${-size * 0.4} ${-size * 0.1}, ${-size * 0.5} ${size * 0.1}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Four evenly spaced toe pads above the main pad -->
      <!-- Leftmost toe -->
      <circle 
        cx="${-size * 0.45}" 
        cy="${-size * 0.3}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Left middle toe -->
      <circle 
        cx="${-size * 0.15}" 
        cy="${-size * 0.3}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Right middle toe -->
      <circle 
        cx="${size * 0.15}" 
        cy="${-size * 0.3}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Rightmost toe -->
      <circle 
        cx="${size * 0.45}" 
        cy="${-size * 0.3}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Claw ticks above each toe pad -->
      <!-- Leftmost claw -->
      <path d="
        M ${-size * 0.45} ${-size * 0.45}
        L ${-size * 0.45} ${-size * 0.55}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Left middle claw -->
      <path d="
        M ${-size * 0.15} ${-size * 0.45}
        L ${-size * 0.15} ${-size * 0.55}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Right middle claw -->
      <path d="
        M ${size * 0.15} ${-size * 0.45}
        L ${size * 0.15} ${-size * 0.55}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Rightmost claw -->
      <path d="
        M ${size * 0.45} ${-size * 0.45}
        L ${size * 0.45} ${-size * 0.55}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
    </g>
  `;
}