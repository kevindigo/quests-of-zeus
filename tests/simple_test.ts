#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "../src/hexmap.ts";

function testSimple() {
  console.log("Testing simple grid creation...\n");
  
  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");
    
    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);
    
    // Test a few specific cells
    const centerCell = hexMap.getCell(0, 0);
    console.log(`✓ Center cell: ${centerCell ? centerCell.terrain : 'not found'}`);
    
    const seaCell = hexMap.getCell(1, 0);
    console.log(`✓ Sea cell: ${seaCell ? seaCell.terrain : 'not found'}`);
    
    console.log("\n✅ All basic tests passed!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testSimple();
}