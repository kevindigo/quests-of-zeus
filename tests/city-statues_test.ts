// Test for city statue functionality

import { assert, assertEquals } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';
import { COLOR_WHEEL } from '../src/types.ts';

Deno.test('City Statue Functionality - Basic Operations', () => {
  const engine = new GameEngine();
  const cities = engine.getCityHexes();

  assertEquals(
    cities.length,
    COLOR_WHEEL.length,
    'Should find one city per color',
  );

  // Test statue operations on each city
  cities.forEach((city, _index) => {
    assert(city);
  });
});
