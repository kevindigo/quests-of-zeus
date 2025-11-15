import { assertEquals } from '@std/assert/equals';
import { Player } from '../src/Player.ts';

Deno.test('Player - range', () => {
  const player = new Player(0, 'any', 'blue', { q: 0, r: 0 });
  assertEquals(player.getRange(), 3);
});
