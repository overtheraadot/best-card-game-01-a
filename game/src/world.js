// Dungeon Draft's rules and state, with no drawing and no browser in it: the
// run, the battle (energy, hand, draw and discard piles, block, strength,
// vulnerable, weak and poison), the draft after each won floor, and the win
// and loss screens. Every shuffle and pick runs off the seeded generator the
// caller hands in, so the same seed plays the same dungeon. Actions return
// what happened as a small event object, so the caller can react without the
// world knowing about screens or sound.
import { ENEMY, FLOORS, PLAYER, REWARD } from './config.js';
import { cardById, DRAFT_POOL, STARTER_DECK } from './cards.js';
import { BOSS, INTENT_ATTACK, INTENT_BUFF, INTENT_DEBUFF, INTENT_DEFEND, MONSTERS } from './enemies.js';
import { pick, shuffle } from './random.js';

export const PHASE_TITLE = 'title';
export const PHASE_BATTLE = 'battle';
export const PHASE_DRAFT = 'draft';
export const PHASE_VICTORY = 'victory';
export const PHASE_DEFEAT = 'defeat';

export const EVENT_NONE = 0;
export const EVENT_CARD = 1;
export const EVENT_ENEMY_DOWN = 2;
export const EVENT_PLAYER_DOWN = 4;
export const EVENT_DRAFT = 8;

/** Damage after strength, vulnerable (+50%) and weak (-25%), never below 0. */
function scaledDamage(base, strength, targetVulnerable, attackerWeak) {
  let amount = base + strength;
  if (targetVulnerable > 0) amount = Math.floor(amount * 1.5);
  if (attackerWeak > 0) amount = Math.floor(amount * 0.75);
  return Math.max(0, amount);
}

/** Hit points lost through block first, then health. Returns the health lost. */
function hitThroughBlock(target, amount) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const healthLost = amount - blocked;
  target.hp = Math.max(0, target.hp - healthLost);
  return healthLost;
}

export function createRun(random) {
  const state = {
    phase: PHASE_TITLE,
    floor: 1,
    gold: PLAYER.startGold,
    score: 0,
    deck: [...STARTER_DECK],
    player: { hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, block: 0, strength: 0, weak: 0 },
    enemy: null,
    drawPile: [],
    discardPile: [],
    hand: [],
    energy: PLAYER.maxEnergy,
    draftChoices: [],
    stats: { cardsPlayed: 0, damageDealt: 0, floorsCleared: 0, goldEarned: 0 },
    log: [],
  };

  function note(text) {
    state.log.push(text);
    if (state.log.length > 6) state.log.shift();
  }

  function spawnEnemy() {
    const floor = state.floor;
    const def = floor >= FLOORS ? BOSS : pick(random, MONSTERS);
    const hp = def.hp + ENEMY.hpPerFloor * (floor - 1) + (floor >= FLOORS ? 10 : 0);
    const attack = def.attack + ENEMY.attackPerFloor * (floor - 1);
    state.enemy = {
      id: def.id, name: def.name, color: def.color, dark: def.dark, shape: def.shape,
      hp, maxHp: hp, block: 0, strength: 0, vulnerable: 0, weak: 0, poison: 0,
      attack, intents: def.intents, intent: INTENT_ATTACK,
    };
    chooseIntent();
  }

  function chooseIntent() {
    state.enemy.intent = pick(random, state.enemy.intents);
  }

  function drawCards(count) {
    for (let i = 0; i < count; i += 1) {
      if (state.drawPile.length === 0) {
        if (state.discardPile.length === 0) return;
        state.drawPile = shuffle(random, [...state.discardPile]);
        state.discardPile = [];
      }
      state.hand.push(state.drawPile.pop());
    }
  }

  function startBattle() {
    state.drawPile = shuffle(random, [...state.deck]);
    state.discardPile = [];
    state.hand = [];
    state.player.block = 0;
    state.player.strength = 0;
    state.player.weak = 0;
    spawnEnemy();
    startPlayerTurn();
    state.phase = PHASE_BATTLE;
  }

  function startPlayerTurn() {
    state.energy = PLAYER.maxEnergy;
    state.player.block = 0;
    if (state.player.weak > 0) state.player.weak -= 1;
    drawCards(PLAYER.handSize);
  }

  function startRun() {
    state.floor = 1;
    state.gold = PLAYER.startGold;
    state.score = 0;
    state.deck = [...STARTER_DECK];
    state.player = { hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, block: 0, strength: 0, weak: 0 };
    state.stats = { cardsPlayed: 0, damageDealt: 0, floorsCleared: 0, goldEarned: 0 };
    state.log = [];
    note('You descend into the dungeon…');
    startBattle();
  }

  function dealDamage(amount) {
    const lost = hitThroughBlock(state.enemy, amount);
    state.stats.damageDealt += lost;
    return lost;
  }

  function applyEffect(card) {
    const effect = card.effect;
    const player = state.player;
    const enemy = state.enemy;
    switch (effect.type) {
      case 'damage':
        dealDamage(scaledDamage(effect.n, player.strength, enemy.vulnerable, player.weak));
        break;
      case 'damageTwice':
        dealDamage(scaledDamage(effect.n, player.strength, enemy.vulnerable, player.weak));
        dealDamage(scaledDamage(effect.n, player.strength, enemy.vulnerable, player.weak));
        break;
      case 'block':
        player.block += effect.n;
        break;
      case 'damageBlock':
        player.block += effect.b;
        dealDamage(scaledDamage(effect.d, player.strength, enemy.vulnerable, player.weak));
        break;
      case 'blockDraw':
        player.block += effect.b;
        drawCards(effect.n);
        break;
      case 'vulnerable':
        dealDamage(scaledDamage(effect.d, player.strength, enemy.vulnerable, player.weak));
        enemy.vulnerable += effect.n;
        break;
      case 'weakDraw':
        enemy.weak += effect.n;
        drawCards(effect.draw);
        break;
      case 'poison':
        dealDamage(scaledDamage(effect.d, player.strength, enemy.vulnerable, player.weak));
        enemy.poison += effect.n;
        break;
      case 'strength':
        player.strength += effect.n;
        break;
      case 'energyDraw':
        state.energy += effect.e;
        drawCards(effect.n);
        break;
      case 'heal':
        player.hp = Math.min(player.maxHp, player.hp + effect.n);
        break;
      case 'leech': {
        const lost = dealDamage(scaledDamage(effect.d, player.strength, enemy.vulnerable, player.weak));
        player.hp = Math.min(player.maxHp, player.hp + Math.min(effect.h, lost));
        break;
      }
      default:
        break;
    }
  }

  /** Play the card at `handIndex`. Returns an event mask; playing is a no-op outside battle. */
  function playCard(handIndex) {
    if (state.phase !== PHASE_BATTLE || handIndex < 0 || handIndex >= state.hand.length) return EVENT_NONE;
    const card = cardById(state.hand[handIndex]);
    if (card.cost > state.energy) return EVENT_NONE;
    state.energy -= card.cost;
    state.hand.splice(handIndex, 1);
    state.discardPile.push(card.id);
    state.stats.cardsPlayed += 1;
    applyEffect(card);
    note(`Played ${card.name}.`);
    if (state.enemy.hp <= 0) return finishBattle();
    return EVENT_CARD;
  }

  function finishBattle() {
    state.stats.floorsCleared += 1;
    const gold = state.floor >= FLOORS ? REWARD.goldBoss : REWARD.goldPerFloor;
    state.gold += gold;
    state.stats.goldEarned += gold;
    state.score += REWARD.scorePerFloor + gold;
    if (state.floor >= FLOORS) {
      state.score += state.player.hp;
      state.phase = PHASE_VICTORY;
      note('The Warden falls. The dungeon is yours!');
      return EVENT_ENEMY_DOWN;
    }
    state.draftChoices = offerDraft();
    state.phase = PHASE_DRAFT;
    note(`Floor ${state.floor} cleared! Draft a card.`);
    return EVENT_ENEMY_DOWN | EVENT_DRAFT;
  }

  function offerDraft() {
    const pool = [...DRAFT_POOL];
    const choices = [];
    while (choices.length < 3 && pool.length > 0) {
      const index = Math.floor(random() * pool.length);
      choices.push(pool.splice(index, 1)[0]);
    }
    return choices;
  }

  /** Take the drafted card at `choiceIndex` and descend to the next floor. */
  function chooseDraft(choiceIndex) {
    if (state.phase !== PHASE_DRAFT || choiceIndex < 0 || choiceIndex >= state.draftChoices.length) return EVENT_NONE;
    const picked = state.draftChoices[choiceIndex];
    state.deck.push(picked);
    state.draftChoices = [];
    state.floor += 1;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4);
    note(`Drafted ${cardById(picked).name}. Floor ${state.floor} awaits.`);
    startBattle();
    return EVENT_DRAFT;
  }

  function enemyTurn() {
    const enemy = state.enemy;
    const player = state.player;
    if (enemy.poison > 0) {
      hitThroughBlock(enemy, enemy.poison);
      enemy.poison -= 1;
      note(`Poison bites the ${enemy.name} for ${enemy.poison + 1}.`);
      if (enemy.hp <= 0) return finishBattle();
    }
    if (enemy.intent === INTENT_ATTACK) {
      const amount = scaledDamage(enemy.attack, enemy.strength, 0, enemy.weak);
      const lost = hitThroughBlock(player, amount);
      note(`${enemy.name} strikes for ${amount} (${lost} through).`);
    } else if (enemy.intent === INTENT_DEFEND) {
      enemy.block += 8;
      note(`${enemy.name} raises its guard.`);
    } else if (enemy.intent === INTENT_BUFF) {
      enemy.strength += 2;
      note(`${enemy.name} gathers strength.`);
    } else if (enemy.intent === INTENT_DEBUFF) {
      player.weak += 2;
      note(`${enemy.name} weakens you.`);
    }
    if (enemy.vulnerable > 0) enemy.vulnerable -= 1;
    if (enemy.weak > 0) enemy.weak -= 1;
    enemy.block = 0;
    if (player.hp <= 0) {
      state.phase = PHASE_DEFEAT;
      note('You fall in the dark…');
      return EVENT_PLAYER_DOWN;
    }
    chooseIntent();
    return EVENT_NONE;
  }

  /** End the player's turn: discard the hand, let the enemy act, draw anew. */
  function endTurn() {
    if (state.phase !== PHASE_BATTLE) return EVENT_NONE;
    state.discardPile.push(...state.hand);
    state.hand = [];
    const events = enemyTurn();
    if (state.phase === PHASE_BATTLE) startPlayerTurn();
    return events;
  }

  return { state, startRun, playCard, endTurn, chooseDraft };
}
