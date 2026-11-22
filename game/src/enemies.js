// The dungeon's monsters, one roster per floor. Each monster has a name, a
// body colour and shape for the renderer, base hit points and attack, and the
// intents it can pick each turn. The world scales hit points and attack with
// the floor, so the same roster grows harder as the run goes deeper.

export const INTENT_ATTACK = 'attack';
export const INTENT_DEFEND = 'defend';
export const INTENT_BUFF = 'buff';
export const INTENT_DEBUFF = 'debuff';

/** One floor's roster, in order: the first four floors draw from here, the boss is fixed. */
export const MONSTERS = [
  { id: 'slime', name: 'Cave Slime', color: '#5ec96e', dark: '#2f7d3d', shape: 'blob', hp: 26, attack: 6, intents: [INTENT_ATTACK, INTENT_ATTACK, INTENT_DEFEND] },
  { id: 'rat', name: 'Sewer Rat', color: '#9a8f7a', dark: '#5d5344', shape: 'rat', hp: 22, attack: 7, intents: [INTENT_ATTACK, INTENT_ATTACK, INTENT_DEBUFF] },
  { id: 'bat', name: 'Gloom Bat', color: '#8a6fd6', dark: '#4a3585', shape: 'bat', hp: 24, attack: 7, intents: [INTENT_ATTACK, INTENT_ATTACK, INTENT_ATTACK] },
  { id: 'skeleton', name: 'Bone Skeleton', color: '#e8e4d8', dark: '#8f8a7c', shape: 'skull', hp: 30, attack: 8, intents: [INTENT_ATTACK, INTENT_DEFEND, INTENT_ATTACK] },
  { id: 'orc', name: 'Dungeon Orc', color: '#7fb069', dark: '#456b2e', shape: 'orc', hp: 36, attack: 9, intents: [INTENT_ATTACK, INTENT_ATTACK, INTENT_BUFF] },
  { id: 'spider', name: 'Web Spider', color: '#c96e9a', dark: '#7d2f56', shape: 'spider', hp: 28, attack: 8, intents: [INTENT_ATTACK, INTENT_DEBUFF, INTENT_ATTACK] },
];

export const BOSS = {
  id: 'warden', name: 'The Dungeon Warden', color: '#e0a458', dark: '#8a5a1e',
  shape: 'warden', hp: 58, attack: 12,
  intents: [INTENT_ATTACK, INTENT_ATTACK, INTENT_BUFF, INTENT_DEFEND],
};

/** Human words for an intent, shown above the monster. */
export function intentLabel(intent, attack) {
  if (intent === INTENT_ATTACK) return `Attacks for ${attack}`;
  if (intent === INTENT_DEFEND) return 'Raises its guard';
  if (intent === INTENT_BUFF) return 'Gathers strength';
  return 'Weakens you';
}
