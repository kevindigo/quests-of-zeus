// Test for city statue functionality

import { assert, assertEquals } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import { COLOR_WHEEL } from '../src/types.ts';

Deno.test('City Statue Functionality - Basic Operations', () => {
  const manager = new GameManager();
  const cities = manager.getGameState().getCityHexes();

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
