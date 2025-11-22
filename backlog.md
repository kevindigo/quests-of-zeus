== Short-term ==

== Cosmetic/Usability ==

- Should not be able to select a card if you have already played one this turn
- Can't click on anything on a hex (icon, cubes, monsters)
- Make monster triangles larger
- Make statue bar taller
- Move city icon down slightly
- Display icons for quests:
  - Temple offering 🛕 🫴
  - Statue 🪦 ⛏️ ⛲ 🗿
  - Monster 💀 ⚔️
  - Shrine ☁️ ⛩️
- Display symbols for accessibility: ➰🌀♨️🔆🌱🌸
  - Black: Cloverleaf 🔲🔳 🌢 ➰ ⧇ ⬟ ⧉ ▣ ▩
  - Blue: @ 🌀
  - Red: Bell U 💢 📛 ♨️
  - Pink: 8 / infinity / hourglass ∞ ⌛ Ꝏ 🌸 🩷
  - Yellow: * 🔆
  - Green: Leaf 🌱
- Ideally sort cards by color
- Ideally only highlight the actual selected die/card
- Ideally unselect (clear) a die/card by clicking it again

== Features/bugs ==

- Allow spending more than 5 favor to extend move range
- Cache all distances to avoid repeated BFS searches
  - For each sea cell, have an array for each core color
  - Each color array would hold a map of destination coordinates -> distance
  - Could do something similar for equipment that allows cubes/statues not
    adjacent

== Code improvement ==

- Put all the map navigation in one place

== Quests ==

- Statues
  - action: statue pickup (slot open, not a repeat color)
  - action: statue dropoff
- Shrines
  - action: shrine flip God reward (wait for gods to be implemented)
  - action: shrine flip Shield+heal reward (wait for injuries to be implemented)
    - Any reason not to randomly pick a color with the most injury cards?
- Monsters
  - action: monster fight

== Round end/Game end ==

- effect: free god advance for other players' rolls
- effect: ability to move to zeus after 12 quests completed
- round: detect end of game and determine winner

== Peek ==

- action: peek at up to 2 shrine tiles

== Injuries ==

- setup: initial injury
- action: spend a die to heal
- round: end of round, roll Titan die
- turn: if too many injuries, skip and heal

== Gods ==

- setup: gods
- action: spend a die to advance god
- free: god effects:
  - effect: Fully heal
  - effect: Teleport
  - effect: Defeat (adjacent) monster
  - effect: Superturn
  - effect: Grab non-adjacent statue (when adjacent to a city)
  - effect: Flip any face-down shrine

== Equipment ==

- setup: equipment
- reward: equipment
- free: equipment one-time gains (new task for each specific type)
  - effect: take statue
  - effect: take cube
  - effect: advance any god to top
  - effect: peek under 2 face-down shrines; flip one and take reward
  - effect: +3 favor & +oracle card & 2 god advances
- effect: equipment ongoing (new task for each specific type)
  - stat: +1 range
  - stat: +1 storage
  - stat: injury limit 8 & 4-same
  - ability: skip over shallows
  - ability: monster/shrine from 1 space away
  - ability: statue load/drop from 1 space away
  - ability: cube load/drop from 1 space away
  - trigger: temple/statue/monster -> 1 god advance
  - trigger (color): rolling a die matching this color -> +2 favor
  - trigger (color): spend die -> +1 oracle card & +1 favor & +1 god
  - free: 1x/turn, spend 3 favor to gain a wild action

== Companions ==

- setup: companion deck
- reward: gain companion (non-functional)
  - effect: companion +move
  - effect: companion -wounds
  - effect: companion wild color

== Ships ==

- setup: ships (new task for each specific ship)
