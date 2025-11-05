#!/usr/bin/env -S deno run -A

// Generate proper icon files for the PWA using multiple fallback approaches

/**
 * Downloads an icon from a reliable placeholder service
 */
async function downloadFromService(url: string, filename: string): Promise<boolean> {
  try {
    console.log(`Trying: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    await Deno.writeFile(filename, new Uint8Array(buffer));
    console.log(`✓ Success from: ${url}`);
    return true;
  } catch (error) {
    console.log(`✘ Failed: ${url} - ${error.message}`);
    return false;
  }
}

/**
 * Creates a minimal but proper colored PNG
 */
async function createColoredPNG(width: number, height: number, filename: string): Promise<boolean> {
  try {
    // Use a simple reliable service
    const services = [
      `https://dummyimage.com/${width}x${height}/667eea/ffffff&text=Oracle`,
      `https://placehold.co/${width}x${height}/667eea/ffffff/png?text=Oracle`,
    ];
    
    for (const service of services) {
      const success = await downloadFromService(service, filename);
      if (success) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to create colored PNG for ${filename}:`, error.message);
    return false;
  }
}

/**
 * Creates an absolute minimal PNG as last resort
 */
async function createAbsoluteMinimalPNG(filename: string) {
  // Create the smallest possible valid PNG (1x1 transparent)
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, // Bit depth
    0x06, // Color type (RGBA)
    0x00, // Compression method
    0x00, // Filter method
    0x00, // Interlace method
    0x00, 0x00, 0x00, 0x00, // CRC placeholder
    0x00, 0x00, 0x00, 0x00, // IEND chunk
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
  ]);
  
  await Deno.writeFile(filename, pngData);
  console.log(`⚠ Created absolute minimal PNG for ${filename} (last resort)`);
}

async function main() {
  console.log("Generating PWA icons with multiple fallback approaches...");
  
  // Ensure assets directory exists
  try {
    await Deno.mkdir("assets", { recursive: true });
  } catch {
    // Directory already exists
  }
  
  let success192 = false;
  let success512 = false;
  
  // Try approach 1: Colored PNGs from reliable services
  console.log("\nApproach 1: Using reliable placeholder services...");
  success192 = await createColoredPNG(192, 192, "assets/icon-192.png");
  success512 = await createColoredPNG(512, 512, "assets/icon-512.png");
  
  // If first approach fails, try alternative services
  if (!success192 || !success512) {
    console.log("\nApproach 2: Trying alternative services...");
    
    const alternativeServices = [
      `https://via.placeholder.com/192x192/667eea/ffffff?text=Oracle+192`,
      `https://via.placeholder.com/512x512/764ba2/ffffff?text=Oracle+512`,
    ];
    
    if (!success192) {
      success192 = await downloadFromService(alternativeServices[0], "assets/icon-192.png");
    }
    if (!success512) {
      success512 = await downloadFromService(alternativeServices[1], "assets/icon-512.png");
    }
  }
  
  // Final fallback: minimal PNGs
  if (!success192) {
    console.log("\nFinal fallback for icon-192.png...");
    await createAbsoluteMinimalPNG("assets/icon-192.png");
  }
  
  if (!success512) {
    console.log("\nFinal fallback for icon-512.png...");
    await createAbsoluteMinimalPNG("assets/icon-512.png");
  }
  
  console.log("\nIcon generation completed!");
  
  if (success192 && success512) {
    console.log("✓ Both icons generated successfully from online services");
    console.log("✓ The PWA manifest should now work properly");
  } else {
    console.log("⚠ Some icons were created as minimal fallbacks");
    console.log("⚠ For production, replace with properly designed icons");
  }
}

if (import.meta.main) {
  await main();
}