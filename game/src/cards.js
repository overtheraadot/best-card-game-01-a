// The card pool: every card's cost, kind, text and effect, as data. The world
// in world.js reads the `effect` descriptor and carries it out; no card here
// knows about the battle. Kinds: attack (red), skill (blue), power (purple).
// `art` picks the little drawn icon the renderer paints on the card face.

export const KIND_ATTACK = 'attack';
export const KIND_SKILL = 'skill';
export const KIND_POWER = 'power';

/**
 * effect kinds:
 *  damage {n}            — deal n damage to the enemy
 *  damageTwice {n}       — deal n damage, twice
 *  block {n}             — gain n block
 *  damageBlock {d, b}    — gain b block, then deal d damage
 *  vulnerable {d, n}     — deal d damage, apply n Vulnerable
 *  weak {d, n}           — deal d damage, apply n Weak
 *  poison {d, n}         — deal d damage, apply n Poison
 *  strength {n}          — gain n Strength for the rest of the battle
 *  heal {n}              — restore n hit points
 *  leech {d, h}          — deal d damage, heal h
 *  draw {n}              — draw n cards
 *  energy {n}            — gain n energy this turn
 */
export const CARDS = {
  strike: { id: 'strike', name: 'Strike', cost: 1, kind: KIND_ATTACK, art: 'sword', text: 'Deal 6 damage.', effect: { type: 'damage', n: 6 } },
  heavyBlow: { id: 'heavyBlow', name: 'Heavy Blow', cost: 2, kind: KIND_ATTACK, art: 'axe', text: 'Deal 11 damage.', effect: { type: 'damage', n: 11 } },
  quickJab: { id: 'quickJab', name: 'Quick Jab', cost: 0, kind: KIND_ATTACK, art: 'dagger', text: 'Deal 3 damage.', effect: { type: 'damage', n: 3 } },
  doubleStrike: { id: 'doubleStrike', name: 'Twin Slash', cost: 1, kind: KIND_ATTACK, art: 'swords', text: 'Deal 4 damage, twice.', effect: { type: 'damageTwice', n: 4 } },
  fireball: { id: 'fireball', name: 'Fireball', cost: 1, kind: KIND_ATTACK, art: 'flame', text: 'Deal 8 damage.', effect: { type: 'damage', n: 8 } },
  bash: { id: 'bash', name: 'Bash', cost: 2, kind: KIND_ATTACK, art: 'hammer', text: 'Deal 8 damage. Apply 2 Vulnerable.', effect: { type: 'vulnerable', d: 8, n: 2 } },
  poisonDagger: { id: 'poisonDagger', name: 'Venom Dagger', cost: 1, kind: KIND_ATTACK, art: 'dagger', text: 'Deal 3 damage. Apply 3 Poison.', effect: { type: 'poison', d: 3, n: 3 } },
  leech: { id: 'leech', name: 'Leech Bite', cost: 1, kind: KIND_ATTACK, art: 'fang', text: 'Deal 4 damage. Heal 4.', effect: { type: 'leech', d: 4, h: 4 } },
  shieldBash: { id: 'shieldBash', name: 'Shield Bash', cost: 1, kind: KIND_ATTACK, art: 'shield', text: 'Gain 5 Block. Deal 5 damage.', effect: { type: 'damageBlock', d: 5, b: 5 } },
  defend: { id: 'defend', name: 'Defend', cost: 1, kind: KIND_SKILL, art: 'shield', text: 'Gain 6 Block.', effect: { type: 'block', n: 6 } },
  ironWall: { id: 'ironWall', name: 'Iron Wall', cost: 2, kind: KIND_SKILL, art: 'wall', text: 'Gain 12 Block.', effect: { type: 'block', n: 12 } },
  dodge: { id: 'dodge', name: 'Sidestep', cost: 1, kind: KIND_SKILL, art: 'boot', text: 'Gain 5 Block. Draw 1 card.', effect: { type: 'blockDraw', b: 5, n: 1 } },
  focus: { id: 'focus', name: 'Battle Focus', cost: 1, kind: KIND_POWER, art: 'eye', text: 'Gain 1 Strength.', effect: { type: 'strength', n: 1 } },
  rally: { id: 'rally', name: 'War Horn', cost: 1, kind: KIND_POWER, art: 'horn', text: 'Gain 2 Energy. Draw 1 card.', effect: { type: 'energyDraw', e: 2, n: 1 } },
  heal: { id: 'heal', name: 'Second Wind', cost: 2, kind: KIND_SKILL, art: 'heart', text: 'Restore 8 HP.', effect: { type: 'heal', n: 8 } },
  cripple: { id: 'cripple', name: 'Cripple', cost: 1, kind: KIND_SKILL, art: 'chain', text: 'Apply 2 Weak. Draw 1 card.', effect: { type: 'weakDraw', n: 2, draw: 1 } },
};

/** The deck a new run starts with. */
export const STARTER_DECK = [
  'strike', 'strike', 'strike', 'strike',
  'defend', 'defend', 'defend',
  'bash', 'fireball', 'quickJab',
];

/** Cards offered as a draft reward after each won floor (3 drawn from here). */
export const DRAFT_POOL = [
  'heavyBlow', 'doubleStrike', 'fireball', 'poisonDagger', 'leech', 'shieldBash',
  'ironWall', 'dodge', 'focus', 'rally', 'heal', 'cripple', 'quickJab', 'bash',
];

/** Look a card up by id; unknown ids fall back to Strike so a bad id never crashes a run. */
export function cardById(id) {
  return CARDS[id] ?? CARDS.strike;
}
