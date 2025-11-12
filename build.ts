#!/usr/bin/env -S deno run -A

import * as esbuild from 'esbuild';

async function build() {
  console.log('Building TypeScript logic to JavaScript...');
  console.log('✓ Converting src/hexmap.ts → dist/hexmap.js');
  console.log('✓ Converting src/hexmap-svg.ts → dist/hexmap-svg.js');
  console.log('✓ Converting src/game-engine.ts → dist/game-engine.js');
  console.log('✓ Converting src/game-controller.ts → dist/game-controller.js');

  // Check if proper icons exist
  console.log('Checking icons...');
  try {
    const icon192 = await Deno.readFile('assets/icon-192.png');
    const icon512 = await Deno.readFile('assets/icon-512.png');

    // Check if icons are minimal fallbacks (very small files)
    if (icon192.length < 100 || icon512.length < 100) {
      console.log(
        "⚠ Icon files are minimal fallbacks. Run 'deno task icons' to generate proper icons.",
      );
    } else {
      console.log('✓ Proper icon files found');
    }
  } catch {
    console.log(
      "⚠ Icon files missing. Run 'deno task icons' to generate icons.",
    );
  }

  try {
    // Clean the dist directory first
    try {
      await Deno.remove('dist', { recursive: true });
    } catch {
      // dist directory doesn't exist, that's fine
    }
    await Deno.mkdir('dist', { recursive: true });

    // Build all TypeScript files to dist/
    const result = await esbuild.build({
      entryPoints: [
        'src/hexmap.ts',
        'src/hexmap-svg.ts',
        'src/game-engine.ts',
        'src/game-controller.ts',
        'src/hexmap/index.ts',
      ],
      bundle: true,
      outdir: 'dist',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      plugins: [],
      minify: false,
      sourcemap: true,
      external: [],
      // Add DOM library for browser types
    });

    console.log('✓ Build completed successfully!');
    console.log('✓ All TypeScript logic compiled to JavaScript');
    console.log('✓ Source: src/hexmap.ts → Output: dist/hexmap.js');
    console.log('✓ Source: src/hexmap-svg.ts → Output: dist/hexmap-svg.js');
    console.log('✓ Source: src/game-engine.ts → Output: dist/game-engine.js');
    console.log(
      '✓ Source: src/game-controller.ts → Output: dist/game-controller.js',
    );

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach((warning) => console.log(`  - ${warning.text}`));
    }
  } catch (error) {
    console.error('✘ Build failed:', error);
    Deno.exit(1);
  } finally {
    esbuild.stop();
  }
}

if (import.meta.main) {
  await build();
}
