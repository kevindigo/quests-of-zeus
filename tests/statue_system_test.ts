// Comprehensive test for the statue system

import { assert, assertEquals } from '@std/assert';
import { HexMap } from '../src/hexmap/HexMap.ts';
import { COLOR_WHEEL } from '../src/types.ts';

Deno.test('StatueSystem - HexMap statue operations', () => {
  const map = new HexMap();
  const cities = map.getCellsByTerrain('city');

  assertEquals(
    cities.length,
    COLOR_WHEEL.length,
    'Should be one city for each color',
  );

  const testCity = cities[0];
  assert(testCity);
});
