#!/usr/bin/env -S deno run --allow-read

/**
 * Debug test runner - runs tests without importing server code
 * Use this when you want to test individual components without starting the Oak server
 */

import { testSimple } from "./tests/simple_test.ts";

async function runDebugTests() {
  console.log("🧪 Running debug tests (no server startup)...\n");
  
  try {
    // Add your test functions here
    await testSimple();
    
    console.log("\n✅ All debug tests completed successfully!");
  } catch (error) {
    console.error("❌ Debug test failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  runDebugTests();
}