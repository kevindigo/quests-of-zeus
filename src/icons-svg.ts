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
 * Generate a temple icon with a square base (no top line) and sloped roof
 * Simple thick black line drawing matching the city icon style
 */
export function generateTempleIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size - same scale as city icon
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space
  
  // Monochrome black color with thick strokes
  const strokeColor = "#000000";
  const strokeWidth = 2.5 * scale; // Thick black lines
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="temple-icon">
      <!-- Square base with bottom line and no top line -->
      <path d="
        M ${-size * 0.4} ${-size * 0.3}
        L ${-size * 0.4} ${size * 0.3}
        L ${size * 0.4} ${size * 0.3}
        L ${size * 0.4} ${-size * 0.3}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Sloped roof with two lines at ~15 degree angle, extending 20% past each side -->
      <path d="
        M ${-size * 0.48} ${-size * 0.3}
        L ${0} ${-size * 0.5}
        L ${size * 0.48} ${-size * 0.3}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
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

/**
 * Generate a cubes icon with a 3D box and ribbon/bow on top like a present
 * Line drawing of a cube with perspective and decorative ribbon
 */
export function generateCubesIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size - larger than other icons for better visibility
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 14 * scale * 2.5; // Larger size to fill more space
  
  // Monochrome black color with thick strokes
  const strokeColor = "#000000";
  const strokeWidth = 2.5 * scale; // Thick black lines
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="cubes-icon">
      <!-- 3D Cube - front face (larger and more prominent) -->
      <path d="
        M ${-size * 0.5} ${size * 0.3}
        L ${-size * 0.5} ${-size * 0.2}
        L ${size * 0.3} ${-size * 0.2}
        L ${size * 0.3} ${size * 0.3}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- 3D Cube - top face (angled for perspective) -->
      <path d="
        M ${-size * 0.5} ${-size * 0.2}
        L ${-size * 0.3} ${-size * 0.4}
        L ${size * 0.5} ${-size * 0.4}
        L ${size * 0.3} ${-size * 0.2}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- 3D Cube - side face (clearly visible) -->
      <path d="
        M ${size * 0.3} ${-size * 0.2}
        L ${size * 0.5} ${-size * 0.4}
        L ${size * 0.5} ${size * 0.1}
        L ${size * 0.3} ${size * 0.3}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Ribbon - horizontal band across the front face -->
      <path d="
        M ${-size * 0.45} ${0}
        L ${size * 0.25} ${0}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 1.2}" 
        stroke-linecap="round"
      />
      
      <!-- Ribbon - vertical band across the front face -->
      <path d="
        M ${0} ${-size * 0.15}
        L ${0} ${size * 0.25}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 1.2}" 
        stroke-linecap="round"
      />
      
      <!-- Ribbon continuation on top face -->
      <path d="
        M ${0} ${-size * 0.15}
        L ${size * 0.15} ${-size * 0.3}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 1.2}" 
        stroke-linecap="round"
      />
      
      <!-- Ribbon continuation on side face -->
      <path d="
        M ${size * 0.25} ${0}
        L ${size * 0.4} ${-size * 0.15}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 1.2}" 
        stroke-linecap="round"
      />
      
      <!-- Bow loops on top (larger and more prominent) -->
      <path d="
        M ${-size * 0.1} ${-size * 0.4}
        C ${-size * 0.25} ${-size * 0.55}, ${-size * 0.4} ${-size * 0.45}, ${-size * 0.1} ${-size * 0.4}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      
      <path d="
        M ${size * 0.1} ${-size * 0.4}
        C ${size * 0.25} ${-size * 0.55}, ${size * 0.4} ${-size * 0.45}, ${size * 0.1} ${-size * 0.4}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      
      <!-- Bow tails hanging down -->
      <path d="
        M ${-size * 0.1} ${-size * 0.4}
        L ${-size * 0.15} ${-size * 0.25}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      
      <path d="
        M ${size * 0.1} ${-size * 0.4}
        L ${size * 0.15} ${-size * 0.25}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
    </g>
  `;
}

/**
 * Generate a clouds icon with black loops forming a vague cloud-like image
 * Simplified version with clean, minimal cloud shape
 */
export function generateCloudsIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;
  
  // Scale the icon based on cell size - same scale as other icons
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space
  
  // Monochrome black color with thick strokes
  const strokeColor = "#000000";
  const strokeWidth = 2.5 * scale; // Thick black lines
  
  return `
    <g transform="translate(${centerX}, ${centerY})" class="clouds-icon">
      <!-- Simplified cloud shape - single clean outline -->
      <path d="
        M ${-size * 0.6} ${-size * 0.1}
        C ${-size * 0.8} ${-size * 0.3}, ${-size * 0.4} ${-size * 0.5}, ${-size * 0.2} ${-size * 0.3}
        C ${0} ${-size * 0.5}, ${size * 0.2} ${-size * 0.5}, ${size * 0.4} ${-size * 0.3}
        C ${size * 0.6} ${-size * 0.5}, ${size * 0.8} ${-size * 0.3}, ${size * 0.6} ${-size * 0.1}
        C ${size * 0.8} ${0}, ${size * 0.6} ${size * 0.2}, ${size * 0.4} ${size * 0.1}
        C ${size * 0.2} ${size * 0.3}, ${0} ${size * 0.2}, ${-size * 0.2} ${size * 0.1}
        C ${-size * 0.4} ${size * 0.3}, ${-size * 0.6} ${size * 0.2}, ${-size * 0.6} ${-size * 0.1}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  `;
}