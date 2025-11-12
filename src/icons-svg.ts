// SVG Icons for Quests of Zeus
// Centralized location for all game icons

export interface IconOptions {
  centerX: number;
  centerY: number;
  cellSize: number;
  hexColor?: string;
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
  const strokeColor = '#000000';
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
  const { centerX, centerY, cellSize, hexColor } = options;

  // Scale the icon based on cell size - 2.5x larger than before
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space

  // Monochrome black color with thick strokes
  const strokeColor = '#000000';
  const strokeWidth = 2.5 * scale; // Thick black lines

  // Use hex color for fill, fallback to none if not provided
  const fillColor = hexColor || 'none';

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
        fill="${fillColor}" 
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
        fill="${fillColor}" 
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
        fill="${fillColor}" 
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
  const { centerX, centerY, cellSize, hexColor } = options;

  // Scale the icon based on cell size - same scale as city icon
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space

  // Monochrome black color with thick strokes
  const strokeColor = '#000000';
  const strokeWidth = 2.5 * scale; // Thick black lines

  // Use hex color for fill, fallback to none if not provided
  const fillColor = hexColor || 'none';

  return `
    <g transform="translate(${centerX}, ${centerY})" class="temple-icon">
      <!-- Square base with bottom line and no top line -->
      <path d="
        M ${-size * 0.4} ${-size * 0.3}
        L ${-size * 0.4} ${size * 0.3}
        L ${size * 0.4} ${size * 0.3}
        L ${size * 0.4} ${-size * 0.3}
      " 
        fill="${fillColor}" 
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
  const strokeColor = '#000000';
  const strokeWidth = 2.5 * scale; // Thick black lines

  return `
    <g transform="translate(${centerX}, ${centerY})" class="monster-icon">
      <!-- Large main paw pad (heart-shaped for realism) -->
      <path d="
        M ${-size * 0.5} ${size * 0.1}
        C ${-size * 0.3} ${size * 0.5}, ${size * 0.3} ${size * 0.5}, ${
    size * 0.5
  } ${size * 0.1}
        C ${size * 0.4} ${-size * 0.1}, ${-size * 0.4} ${-size * 0.1}, ${
    -size * 0.5
  } ${size * 0.1}
        Z
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Four toe pads above the main pad - middle toes higher, outer toes lower -->
      <!-- Leftmost toe - moved down -->
      <circle 
        cx="${-size * 0.45}" 
        cy="${-size * 0.25}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Left middle toe - moved up -->
      <circle 
        cx="${-size * 0.15}" 
        cy="${-size * 0.35}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Right middle toe - moved up -->
      <circle 
        cx="${size * 0.15}" 
        cy="${-size * 0.35}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Rightmost toe - moved down -->
      <circle 
        cx="${size * 0.45}" 
        cy="${-size * 0.25}" 
        r="${size * 0.12}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Claw ticks above each toe pad - adjusted for new toe positions -->
      <!-- Leftmost claw - moved down with toe -->
      <path d="
        M ${-size * 0.45} ${-size * 0.4}
        L ${-size * 0.45} ${-size * 0.5}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Left middle claw - moved up with toe -->
      <path d="
        M ${-size * 0.15} ${-size * 0.5}
        L ${-size * 0.15} ${-size * 0.6}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Right middle claw - moved up with toe -->
      <path d="
        M ${size * 0.15} ${-size * 0.5}
        L ${size * 0.15} ${-size * 0.6}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth * 0.8}" 
        stroke-linecap="round"
      />
      
      <!-- Rightmost claw - moved down with toe -->
      <path d="
        M ${size * 0.45} ${-size * 0.4}
        L ${size * 0.45} ${-size * 0.5}
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
  const size = 16 * scale * 2.5; // Even larger size to fill more space

  // Monochrome black color with thick strokes
  const strokeColor = '#000000';
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
        C ${-size * 0.25} ${-size * 0.55}, ${-size * 0.4} ${-size * 0.45}, ${
    -size * 0.1
  } ${-size * 0.4}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      
      <path d="
        M ${size * 0.1} ${-size * 0.4}
        C ${size * 0.25} ${-size * 0.55}, ${size * 0.4} ${-size * 0.45}, ${
    size * 0.1
  } ${-size * 0.4}
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
 * Generate statue icons for cities
 * Statues are represented as tall thin rectangles (3:1 ratio) in the city's color
 * Positioned at the bottom of the hex (below the city icon) with clear spacing
 */
export function generateStatueIcons(
  options: IconOptions,
  statueCount: number,
): string {
  const { centerX, centerY, cellSize, hexColor } = options;

  // Scale the icon based on cell size
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space

  // Use hex color for statues, fallback to black if not provided
  const strokeColor = hexColor || '#000000';
  const fillColor = hexColor || '#cccccc';
  const strokeWidth = 2 * scale; // Slightly thinner than other icons

  // Statue dimensions: tall thin rectangles with 3:1 ratio
  const statueWidth = size * 0.15; // Width of each statue
  const statueHeight = statueWidth * 3; // Height = 3x width for 3:1 ratio
  const statueSpacing = statueWidth * 1.2; // Increased spacing for better visibility

  let statuesContent = '';

  // Position statues at the bottom of the hex, below the city icon
  const startY = size * 0.8; // Position below the city buildings
  const totalWidth = statueCount * statueWidth +
    (statueCount - 1) * statueSpacing;
  const startX = -totalWidth / 2; // Center the statues horizontally

  // Generate statues based on count (0-3)
  for (let i = 0; i < statueCount; i++) {
    const statueX = startX + i * (statueWidth + statueSpacing);

    statuesContent += `
      <!-- Statue ${i + 1} -->
      <rect 
        x="${statueX}" 
        y="${startY}" 
        width="${statueWidth}" 
        height="${statueHeight}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
        class="city-statue statue-${i + 1}"
        style="filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));"
      />
    `;
  }

  return `
    <g transform="translate(${centerX}, ${centerY})" class="statue-icons">
      ${statuesContent}
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
  const strokeColor = '#000000';
  const strokeWidth = 2.5 * scale; // Thick black lines

  return `
    <g transform="translate(${centerX}, ${centerY})" class="clouds-icon">
      <!-- Simplified cloud shape - single clean outline -->
      <path d="
        M ${-size * 0.6} ${-size * 0.1}
        C ${-size * 0.8} ${-size * 0.3}, ${-size * 0.4} ${-size * 0.5}, ${
    -size * 0.2
  } ${-size * 0.3}
        C ${0} ${-size * 0.5}, ${size * 0.2} ${-size * 0.5}, ${size * 0.4} ${
    -size * 0.3
  }
        C ${size * 0.6} ${-size * 0.5}, ${size * 0.8} ${-size * 0.3}, ${
    size * 0.6
  } ${-size * 0.1}
        C ${size * 0.8} ${0}, ${size * 0.6} ${size * 0.2}, ${size * 0.4} ${
    size * 0.1
  }
        C ${size * 0.2} ${size * 0.3}, ${0} ${size * 0.2}, ${-size * 0.2} ${
    size * 0.1
  }
        C ${-size * 0.4} ${size * 0.3}, ${-size * 0.6} ${size * 0.2}, ${
    -size * 0.6
  } ${-size * 0.1}
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

/**
 * Generate a foundations icon with three parallelograms representing squares lying flat
 * Three 3D perspective parallelograms in a staggered arrangement
 */
export function generateFoundationsIcon(options: IconOptions): string {
  const { centerX, centerY, cellSize } = options;

  // Scale the icon based on cell size - same scale as other icons
  const scale = cellSize / 40; // Base scale on default cell size of 40
  const size = 12 * scale * 2.5; // 2.5x larger to fill more space

  // Monochrome black color with thick strokes
  const strokeColor = '#000000';
  const strokeWidth = 2.5 * scale; // Thick black lines

  // Consistent parallelogram dimensions - all oriented with top lines to left, bottom lines to right
  const parallelogramHeight = size * 0.3;
  const perspectiveOffset = size * 0.2; // Amount of perspective shift
  const verticalShift = parallelogramHeight * 0.5; // 50% of parallelogram height
  const horizontalShift = verticalShift * 2; // Twice the vertical shift amount

  return `
    <g transform="translate(${centerX}, ${centerY})" class="foundations-icon">
      <!-- Top parallelogram (near top of hex) - moved up by 50% of height -->
      <polygon points="
        ${-size * 0.1} ${-size * 0.6 - verticalShift},
        ${size * 0.5} ${-size * 0.6 - verticalShift},
        ${size * 0.5 - perspectiveOffset} ${-size * 0.3 - verticalShift},
        ${-size * 0.1 - perspectiveOffset} ${-size * 0.3 - verticalShift}
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Middle parallelogram - moved up by 50% of height and right by twice that amount -->
      <polygon points="
        ${-size * 0.1 + horizontalShift} ${-size * 0.1 - verticalShift},
        ${size * 0.7 + horizontalShift} ${-size * 0.1 - verticalShift},
        ${size * 0.7 - perspectiveOffset + horizontalShift} ${
    size * 0.2 - verticalShift
  },
        ${-size * 0.1 - perspectiveOffset + horizontalShift} ${
    size * 0.2 - verticalShift
  }
      " 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Bottom right parallelogram (toward bottom right) -->
      <polygon points="
        ${-size * 0.7} ${size * 0.3},
        ${size * 0.1} ${size * 0.3},
        ${size * 0.1 - perspectiveOffset} ${size * 0.6},
        ${-size * 0.7 - perspectiveOffset} ${size * 0.6}
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
