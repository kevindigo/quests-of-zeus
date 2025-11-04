#!/usr/bin/env -S deno run -A

import * as esbuild from "https://deno.land/x/esbuild@v0.21.4/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

async function build() {
  console.log("Building TypeScript logic to JavaScript...");
  console.log("✓ Converting hexmap.ts → dist/hexmap.js");
  
  try {
    // Clean the dist directory first
    try {
      await Deno.remove("dist", { recursive: true });
    } catch {
      // dist directory doesn't exist, that's fine
    }
    await Deno.mkdir("dist", { recursive: true });
    
    // Build hexmap.ts to dist/hexmap.js
    const result = await esbuild.build({
      entryPoints: ["hexmap.ts", "hexmap-svg.ts", "new-map-generator.ts"],
      bundle: true,
      outdir: "dist",
      format: "esm",
      platform: "browser",
      target: "es2020",
      plugins: [...denoPlugins()],
      minify: false,
      sourcemap: true,
      external: [],
    });

    console.log("✓ Build completed successfully!");
    console.log("✓ All TypeScript logic compiled to JavaScript");
    console.log("✓ Source: hexmap.ts → Output: dist/hexmap.js");
    console.log("✓ Source: hexmap-svg.ts → Output: dist/hexmap-svg.js");
    
    if (result.warnings.length > 0) {
      console.log("Warnings:");
      result.warnings.forEach(warning => console.log(`  - ${warning.text}`));
    }
    
  } catch (error) {
    console.error("✘ Build failed:", error);
    Deno.exit(1);
  } finally {
    esbuild.stop();
  }
}

if (import.meta.main) {
  await build();
}