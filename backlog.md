== Short-term ==

- action: peek at up to 2 shrine tiles

== Quests ==

- Monsters
  - Should roll dice during battle

== Round end/Game end ==

- effect: free god advance for other players' rolls
- effect: ability to move to zeus after 12 quests completed
- round: detect end of game and determine winner

== Peek ==

== Injuries ==

- setup: injury deck
- setup: initial injury and god advance (easy)
- action: spend a die to heal (easy)
- round: end of round, roll Titan die and apply injuries (not too hard)
- During fight, bad roll causes injury (easy after multi-round fight is done)
- turn: if too many injuries, skip and heal (not too hard)
- Shrine quest reward: Heal injuries (not too hard)

== Gods ==

- free: god effects:
  - effect: Grab non-adjacent statue (when adjacent to a city) (easy)
  - effect: Can activate any god to draw an oracle card (easy)
  - effect: Fully heal (easy after wounds are done)
  - effect: Superturn (not easy)
  - effect: Defeat (adjacent) monster (hard)

== Equipment ==

- setup: equipment deck and display
- reward for raising statue: gain equipment
- free: equipment one-time gains (new task for each specific type)
  - effect: +3 favor & +oracle card & 2 god advances (easy)
  - effect: peek under 2 face-down shrines; flip one and take reward (easy after
    peek is done)
  - effect: gain statue of 3 colors (not too hard)
  - effect: gain cube of 3 colors (not too hard)
  - effect: advance any god to top (not too hard)
- effect: equipment ongoing (new task for each specific type)
  - stat: +1 range (easy)
  - stat: +1 storage (easy)
  - trigger: temple/statue/monster -> 1 god advance (easy)
  - trigger (color): rolling a die matching this color -> +2 favor (easy)
  - trigger (color): spend die -> +1 oracle card & +1 favor & +1 god advance
    (easy)
  - stat: injury limit 8 & 4-same (easy? after injuries are done)
  - ability: monster/shrine from 1 space away (not too hard)
  - ability: statue load/drop from 1 space away (not too hard)
  - ability: cube load/drop from 1 space away (not too hard)
  - free: 1x/turn, spend 3 favor to gain a wild action (not too hard)
  - ability: skip over shallows (hard)

== Companions ==

- setup: companion deck
- Reward for defeating monster: gain companion
- Companion effects:
  - effect range: color -> +3 range and land on any color
  - effect wounds: +2 shield and color -> discard and ignore all wounds
  - effect wild: gain oracle card and color -> wild

== Ships ==

- setup: ships (new task for each specific ship)
  - +2 range (easy)
  - +2 shield (easy)
  - effect: start gods higher (easy)
  - setup: gain 1 oracle card and 1 equipment (easy after equipment is done)
  - gain favor get +1 (easy after refactoring)
  - recoloring cost -1 (not too hard)
  - +2 storage and recolor either direction (not too hard)
  - setup: remove 1 quest from the game (not too hard)

== Cosmetic/Usability ==

- Make monster triangles larger
- Make statue bar taller
- Move city icon down slightly
- Display icons for quests:
  - Temple offering 🛕 🫴
  - Statue 🪦 ⛏️ ⛲ 🗿
  - Monster 💀 ⚔️
  - Shrine ☁️ ⛩️
- Ideally sort cards by color
- Ideally only highlight the actual selected die/card

== Features/bugs ==

- Allow spending more than 5 favor to extend move range
- Cache all distances to avoid repeated BFS searches
  - For each sea cell, have an array for each core color
  - Each color array would hold a map of destination coordinates -> distance
  - Could do something similar for equipment that allows cubes/statues not
    adjacent

== Code improvement ==

- Not sure if possible
  - Switch GameManager to be the top level, rather than Controller
    - This doesn't seem possible, because Controller interacts with document,
      which doesn't exist during unit tests
- Not sure if desireable
  - Put all the map navigation in one place
  - Should ship loading rules enforcement all be in one place?
    - Currently, duplicate and full ship are in player, but
    - No valid quest is in GameEngineHex
