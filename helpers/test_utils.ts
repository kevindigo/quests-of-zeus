/**
 * Test utilities for debugging without server dependencies
 */

export async function runModuleTest(modulePath: string, testFunction: () => void | Promise<void>) {
  console.log(`🧪 Testing module: ${modulePath}`);
  
  try {
    await testFunction();
    console.log(`✅ ${modulePath} test passed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${modulePath} test failed:`, error);
    return false;
  }
}

export function createTestHarness(testName: string) {
  const startTime = Date.now();
  
  console.log(`\n🧪 Starting: ${testName}`);
  
  return {
    assert: (condition: boolean, message: string) => {
      if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
      }
      console.log(`  ✓ ${message}`);
    },
    
    complete: () => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${testName} completed in ${duration}ms\n`);
    }
  };
}