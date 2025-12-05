import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { GameManager } from '../src/GameManager.ts';
import type { HexColor } from '../src/types.ts';

Deno.test('Quests - Each player has 12 quests, not yet completed', () => {
  const manager = new GameManager();
  const state = manager.getGameState().toSnapshot();

  state.players.forEach((player) => {
    const quests = player.quests;
    assertEquals(quests.length, 12, 'Not exactly 12 quests?');
    quests.forEach((quest) => {
      assertFalse(quest.isCompleted, 'Already completed?');
    });
  });
});

Deno.test('Quests - Each player has 3 shrine quests', () => {
  const manager = new GameManager();
  const state = manager.getGameState().toSnapshot();

  state.players.forEach((player) => {
    const matchingQuests = player.quests.filter((quest) => {
      return quest.type === 'shrine';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 shrine quests?');

    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      assertEquals(quest.color, 'none', 'Has a color?');
    });
  });
});

Deno.test('Quests - Each player has 3 statue quests', () => {
  const manager = new GameManager();
  const state = manager.getGameState().toSnapshot();

  state.players.forEach((player) => {
    const matchingQuests = player.quests.filter((quest) => {
      return quest.type === 'statue';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 statue quests?');

    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      assertEquals(quest.color, 'none', 'Has a color?');
    });
  });
});

Deno.test('Quests = Each player has 3 temple quests', () => {
  const manager = new GameManager();
  manager.startNewGame();
  const state = manager.getGameState().toSnapshot();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const matchingQuests = player.quests.filter((quest) => {
      return quest.type === 'temple';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 temple quests?');

    const colorsForThisPlayer: Set<HexColor> = new Set();
    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      colorsForThisPlayer.add(quest.color);
      colorsAcrossPlayers.add(quest.color);
    });
    assertEquals(colorsForThisPlayer.size, 3, 'Player does not have 3 colors?');
    assert(
      colorsForThisPlayer.has('none'),
      'Player missing the uncolored quest?',
    );
  });
  assertEquals(
    colorsAcrossPlayers.size,
    3,
    'Every player should have the same 3 colors',
  );
});

Deno.test('Quests = Each player has 3 monster quests', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const state = manager.getGameState().toSnapshot();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const matchingQuests = player.quests.filter((quest) => {
      return quest.type === 'monster';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 monster quests?');

    const colorsForThisPlayer: Set<HexColor> = new Set();
    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      colorsForThisPlayer.add(quest.color);
      colorsAcrossPlayers.add(quest.color);
    });
    assertEquals(colorsForThisPlayer.size, 3, 'Player does not have 3 colors?');
    assert(
      colorsForThisPlayer.has('none'),
      'Player missing the uncolored quest?',
    );
  });
  assertEquals(
    colorsAcrossPlayers.size,
    3,
    'Every player should have the same 3 colors',
  );
});

Deno.test('Quest - monster and temple quest colors should not overlap', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const state = manager.getGameState().toSnapshot();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const templeQuests = player.quests.filter((quest) => {
      return quest.type === 'temple';
    });
    templeQuests.forEach((quest) => {
      colorsAcrossPlayers.add(quest.color);
    });
    const monsterQuests = player.quests.filter((quest) => {
      return quest.type === 'monster';
    });
    monsterQuests.forEach((quest) => {
      colorsAcrossPlayers.add(quest.color);
    });
  });
  assertEquals(
    colorsAcrossPlayers.size,
    5,
    'Not exactly 2 temple colors and 2 monster colors',
  );
  assert(colorsAcrossPlayers.has('none'), 'Missing the uncolored quests?');
});

Deno.test('Quest - monster and temple quest colors should not contain red or green', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const player = manager.getCurrentPlayer();
  const monsterAndTempleQuests = player.getQuests().filter((quest) => {
    return quest.type === 'monster' || quest.type === 'temple';
  });
  assertEquals(monsterAndTempleQuests.length, 6);
  const colors = monsterAndTempleQuests.map((quest) => {
    return quest.color;
  });
  assertEquals(colors.length, 6);
  colors.sort();
  assertEquals(colors, ['black', 'blue', 'none', 'none', 'pink', 'yellow']);
});
