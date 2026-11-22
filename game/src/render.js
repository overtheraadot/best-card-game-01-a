// Drawing only: the run's state and the current phase in, pixels out. The
// 1280x720 table is scaled to fit the window and centred, the margin filled
// with the backdrop colour. Cards are drawn as rounded rectangles with a cost
// gem, a drawn icon (no image files, so the game loads nothing over the
// network), a name and rules text; the monster is drawn from its shape and
// colours. layout() also answers hit tests, so input and drawing never drift.
import { CARD, FIELD, FLOORS, FONT, PALETTE, PLAYER } from './config.js';
import { cardById } from './cards.js';
import { intentLabel } from './enemies.js';
import { PHASE_BATTLE, PHASE_DEFEAT, PHASE_DRAFT, PHASE_TITLE, PHASE_VICTORY } from './world.js';

export const SCREEN_TITLE = PHASE_TITLE;
export const SCREEN_BATTLE = PHASE_BATTLE;
export const SCREEN_DRAFT = PHASE_DRAFT;
export const SCREEN_VICTORY = PHASE_VICTORY;
export const SCREEN_DEFEAT = PHASE_DEFEAT;

const ENEMY_POS = { x: 640, y: 210, radius: 92 };
const END_TURN = { x: 1070, y: 560, width: 170, height: 52 };
const DRAFT_CARD_Y = 250;

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function kindColor(kind) {
  if (kind === 'attack') return PALETTE.cardAttack;
  if (kind === 'power') return PALETTE.cardPower;
  return PALETTE.cardSkill;
}

/** One drawn icon per card art id, painted in the card's art circle. */
function drawArt(context, art, cx, cy, size, color) {
  context.save();
  context.translate(cx, cy);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(2, size * 0.09);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const s = size / 2;
  if (art === 'sword' || art === 'dagger') {
    context.beginPath();
    context.moveTo(-s * 0.7, s * 0.7);
    context.lineTo(s * 0.7, -s * 0.7);
    context.stroke();
    context.beginPath();
    context.moveTo(-s * 0.2, s * 0.55);
    context.lineTo(s * 0.55, -s * 0.2);
    context.stroke();
    context.beginPath();
    context.arc(-s * 0.75, s * 0.75, s * 0.22, 0, Math.PI * 2);
    context.fill();
  } else if (art === 'swords') {
    context.beginPath();
    context.moveTo(-s * 0.7, s * 0.5);
    context.lineTo(s * 0.7, -s * 0.5);
    context.moveTo(s * 0.7, s * 0.5);
    context.lineTo(-s * 0.7, -s * 0.5);
    context.stroke();
  } else if (art === 'axe') {
    context.beginPath();
    context.arc(0, -s * 0.3, s * 0.55, Math.PI * 0.6, Math.PI * 1.9);
    context.lineTo(0, s * 0.8);
    context.stroke();
    context.beginPath();
    context.moveTo(0, -s * 0.2);
    context.lineTo(0, s * 0.8);
    context.stroke();
  } else if (art === 'flame') {
    context.beginPath();
    context.moveTo(0, -s);
    context.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.6, s * 0.7, 0, s * 0.7);
    context.bezierCurveTo(-s * 0.6, s * 0.7, -s * 0.9, -s * 0.2, 0, -s);
    context.fill();
  } else if (art === 'hammer') {
    context.fillRect(-s * 0.7, -s * 0.8, s * 1.4, s * 0.55);
    context.beginPath();
    context.moveTo(0, -s * 0.3);
    context.lineTo(0, s * 0.85);
    context.stroke();
  } else if (art === 'shield') {
    context.beginPath();
    context.moveTo(0, -s * 0.9);
    context.lineTo(s * 0.8, -s * 0.5);
    context.lineTo(s * 0.8, s * 0.1);
    context.quadraticCurveTo(s * 0.8, s * 0.8, 0, s);
    context.quadraticCurveTo(-s * 0.8, s * 0.8, -s * 0.8, s * 0.1);
    context.lineTo(-s * 0.8, -s * 0.5);
    context.closePath();
    context.fill();
  } else if (art === 'wall') {
    context.strokeRect(-s * 0.8, -s * 0.6, s * 1.6, s * 1.2);
    context.beginPath();
    context.moveTo(-s * 0.8, 0);
    context.lineTo(s * 0.8, 0);
    context.moveTo(0, -s * 0.6);
    context.lineTo(0, 0);
    context.moveTo(-s * 0.4, 0);
    context.lineTo(-s * 0.4, s * 0.6);
    context.moveTo(s * 0.4, 0);
    context.lineTo(s * 0.4, s * 0.6);
    context.stroke();
  } else if (art === 'heart') {
    context.beginPath();
    context.moveTo(0, s * 0.8);
    context.bezierCurveTo(-s, -s * 0.1, -s * 0.5, -s * 0.9, 0, -s * 0.3);
    context.bezierCurveTo(s * 0.5, -s * 0.9, s, -s * 0.1, 0, s * 0.8);
    context.fill();
  } else if (art === 'eye') {
    context.beginPath();
    context.ellipse(0, 0, s * 0.9, s * 0.5, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(0, 0, s * 0.35, 0, Math.PI * 2);
    context.fill();
  } else if (art === 'horn') {
    context.beginPath();
    context.moveTo(-s * 0.8, s * 0.7);
    context.lineTo(s * 0.2, -s * 0.9);
    context.lineTo(s * 0.8, s * 0.7);
    context.closePath();
    context.fill();
  } else if (art === 'chain') {
    for (let i = -1; i <= 1; i += 1) {
      context.beginPath();
      context.arc(i * s * 0.5, i * s * 0.3, s * 0.32, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (art === 'boot') {
    context.beginPath();
    context.moveTo(-s * 0.5, -s * 0.8);
    context.lineTo(s * 0.3, -s * 0.8);
    context.lineTo(s * 0.3, s * 0.3);
    context.lineTo(s * 0.9, s * 0.6);
    context.lineTo(s * 0.9, s * 0.85);
    context.lineTo(-s * 0.7, s * 0.85);
    context.closePath();
    context.fill();
  } else if (art === 'fang') {
    context.beginPath();
    context.moveTo(-s * 0.6, -s * 0.7);
    context.lineTo(0, s * 0.9);
    context.lineTo(s * 0.6, -s * 0.7);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function wrapText(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line === '' ? word : `${line} ${word}`;
    if (context.measureText(test).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  let hoverCard = -1;
  let hoverDraft = -1;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.fillText(value, x, y);
  }
  function plainText(value, x, y, size, color, align) {
    if (!fonts.has(`p${size}`)) fonts.set(`p${size}`, `${size}px ${FONT}`);
    context.font = fonts.get(`p${size}`);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.fillText(value, x, y);
  }

  function drawBar(x, y, width, height, fraction, fill, back) {
    context.fillStyle = back;
    roundRect(context, x, y, width, height, height / 2);
    context.fill();
    if (fraction > 0) {
      context.fillStyle = fill;
      roundRect(context, x, y, Math.max(height, width * Math.min(1, fraction)), height, height / 2);
      context.fill();
    }
  }

  function drawCard(card, x, y, width, height, hovered, dimmed) {
    const color = kindColor(card.kind);
    context.save();
    if (dimmed) context.globalAlpha = 0.45;
    if (hovered) {
      context.shadowColor = 'rgba(242, 201, 76, 0.8)';
      context.shadowBlur = 18;
    }
    context.fillStyle = PALETTE.cardBack;
    roundRect(context, x, y, width, height, 12);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = hovered ? PALETTE.gold : PALETTE.cardEdge;
    context.lineWidth = hovered ? 3 : 2;
    roundRect(context, x, y, width, height, 12);
    context.stroke();
    // Cost gem.
    context.fillStyle = PALETTE.energy;
    context.beginPath();
    context.arc(x + 22, y + 22, 17, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#1b3a4d';
    context.lineWidth = 2;
    context.stroke();
    text(String(card.cost), x + 22, y + 30, 22, '#0b2233', 'center');
    // Name band.
    context.fillStyle = color;
    context.fillRect(x + 6, y + 46, width - 12, 30);
    text(card.name, x + width / 2, y + 68, 17, '#ffffff', 'center');
    // Art.
    drawArt(context, card.art, x + width / 2, y + 118, 52, color);
    // Rules text.
    context.font = `15px ${FONT}`;
    const lines = wrapText(context, card.text, width - 20);
    lines.forEach((line, i) => {
      plainText(line, x + width / 2, y + 162 + i * 18, 15, '#2b2118', 'center');
    });
    plainText(card.kind.toUpperCase(), x + width / 2, y + height - 10, 11, PALETTE.muted, 'center');
    context.restore();
  }

  /** Where the hand's cards sit, centred, the hovered one lifted. */
  function handLayout(state) {
    const count = state.hand.length;
    const total = count * CARD.width + (count - 1) * CARD.gap;
    const startX = (FIELD.width - total) / 2;
    return state.hand.map((id, i) => ({
      id,
      x: startX + i * (CARD.width + CARD.gap),
      y: CARD.handY - (hoverCard === i ? CARD.hoverLift : 0),
    }));
  }

  function drawEnemy(enemy, time) {
    const bob = Math.sin(time / 600) * 5;
    const cx = ENEMY_POS.x;
    const cy = ENEMY_POS.y + bob;
    const r = ENEMY_POS.radius;
    context.save();
    // Shadow.
    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.beginPath();
    context.ellipse(cx, ENEMY_POS.y + r + 14, r * 0.85, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = enemy.color;
    context.strokeStyle = enemy.dark;
    context.lineWidth = 4;
    if (enemy.shape === 'blob') {
      context.beginPath();
      context.moveTo(cx - r, cy + r * 0.5);
      context.quadraticCurveTo(cx - r * 1.1, cy - r, cx, cy - r * 0.95);
      context.quadraticCurveTo(cx + r * 1.1, cy - r, cx + r, cy + r * 0.5);
      context.quadraticCurveTo(cx + r * 0.6, cy + r * 0.8, cx, cy + r * 0.8);
      context.quadraticCurveTo(cx - r * 0.6, cy + r * 0.8, cx - r, cy + r * 0.5);
      context.fill();
      context.stroke();
    } else if (enemy.shape === 'skull') {
      context.beginPath();
      context.arc(cx, cy - r * 0.1, r * 0.85, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillRect(cx - r * 0.45, cy + r * 0.45, r * 0.9, r * 0.35);
      context.fillStyle = enemy.dark;
      context.beginPath();
      context.arc(cx - r * 0.32, cy - r * 0.15, r * 0.16, 0, Math.PI * 2);
      context.arc(cx + r * 0.32, cy - r * 0.15, r * 0.16, 0, Math.PI * 2);
      context.fill();
    } else if (enemy.shape === 'bat') {
      context.beginPath();
      context.moveTo(cx - r, cy);
      context.quadraticCurveTo(cx - r * 1.5, cy - r, cx - r * 0.4, cy - r * 0.4);
      context.quadraticCurveTo(cx, cy - r * 0.7, cx + r * 0.4, cy - r * 0.4);
      context.quadraticCurveTo(cx + r * 1.5, cy - r, cx + r, cy);
      context.quadraticCurveTo(cx + r * 0.5, cy + r * 0.5, cx, cy + r * 0.3);
      context.quadraticCurveTo(cx - r * 0.5, cy + r * 0.5, cx - r, cy);
      context.fill();
      context.stroke();
    } else if (enemy.shape === 'rat') {
      context.beginPath();
      context.ellipse(cx, cy, r * 0.95, r * 0.62, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(cx - r * 0.55, cy - r * 0.55, r * 0.28, 0, Math.PI * 2);
      context.arc(cx + r * 0.55, cy - r * 0.55, r * 0.28, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(cx + r * 0.9, cy + r * 0.3);
      context.quadraticCurveTo(cx + r * 1.6, cy + r * 0.5, cx + r * 1.4, cy + r * 0.9);
      context.stroke();
    } else if (enemy.shape === 'spider') {
      for (let leg = -1; leg <= 1; leg += 1) {
        context.beginPath();
        context.moveTo(cx - r * 0.5, cy + leg * r * 0.3);
        context.lineTo(cx - r * 1.4, cy + leg * r * 0.6);
        context.moveTo(cx + r * 0.5, cy + leg * r * 0.3);
        context.lineTo(cx + r * 1.4, cy + leg * r * 0.6);
        context.stroke();
      }
      context.beginPath();
      context.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    } else if (enemy.shape === 'warden') {
      context.beginPath();
      context.moveTo(cx - r * 0.7, cy + r);
      context.lineTo(cx - r * 0.35, cy - r * 0.5);
      context.lineTo(cx + r * 0.35, cy - r * 0.5);
      context.lineTo(cx + r * 0.7, cy + r);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(cx, cy - r * 0.55, r * 0.42, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = PALETTE.gold;
      context.beginPath();
      context.moveTo(cx - r * 0.4, cy - r * 0.85);
      context.lineTo(cx - r * 0.2, cy - r * 1.15);
      context.lineTo(cx, cy - r * 0.9);
      context.lineTo(cx + r * 0.2, cy - r * 1.15);
      context.lineTo(cx + r * 0.4, cy - r * 0.85);
      context.closePath();
      context.fill();
    } else {
      // orc: broad body, tusks, heavy brow.
      context.beginPath();
      context.ellipse(cx, cy, r * 0.9, r * 0.85, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.moveTo(cx - r * 0.45, cy + r * 0.35);
      context.lineTo(cx - r * 0.3, cy + r * 0.05);
      context.lineTo(cx - r * 0.15, cy + r * 0.35);
      context.moveTo(cx + r * 0.45, cy + r * 0.35);
      context.lineTo(cx + r * 0.3, cy + r * 0.05);
      context.lineTo(cx + r * 0.15, cy + r * 0.35);
      context.fill();
    }
    // Eyes (all shapes except skull, which drew its own).
    if (enemy.shape !== 'skull') {
      context.fillStyle = '#14101d';
      context.beginPath();
      context.arc(cx - r * 0.3, cy - r * 0.1, r * 0.09, 0, Math.PI * 2);
      context.arc(cx + r * 0.3, cy - r * 0.1, r * 0.09, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(cx - r * 0.27, cy - r * 0.13, r * 0.03, 0, Math.PI * 2);
      context.arc(cx + r * 0.33, cy - r * 0.13, r * 0.03, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawStatusPips(enemy, x, y) {
    const parts = [];
    if (enemy.strength > 0) parts.push(`STR +${enemy.strength}`);
    if (enemy.vulnerable > 0) parts.push(`VULN ${enemy.vulnerable}`);
    if (enemy.weak > 0) parts.push(`WEAK ${enemy.weak}`);
    if (enemy.poison > 0) parts.push(`POISON ${enemy.poison}`);
    if (enemy.block > 0) parts.push(`BLOCK ${enemy.block}`);
    if (parts.length === 0) return;
    context.font = `bold 15px ${FONT}`;
    const width = Math.max(...parts.map((p) => context.measureText(p).width)) + 20;
    parts.forEach((part, i) => {
      context.fillStyle = PALETTE.panel;
      roundRect(context, x, y + i * 26, width, 22, 6);
      context.fill();
      plainText(part, x + 10, y + i * 26 + 16, 15, PALETTE.intent, 'left');
    });
  }

  function drawHud(state) {
    const player = state.player;
    // Top bar: floor, gold, score.
    text(`FLOOR ${state.floor} / ${FLOORS}`, 24, 34, 22, PALETTE.text, 'left');
    text(`Gold ${state.gold}`, 24, 62, 18, PALETTE.gold, 'left');
    text(`Score ${state.score}`, FIELD.width - 24, 34, 22, PALETTE.text, 'right');
    plainText('Dungeon Draft', FIELD.width - 24, 62, 16, PALETTE.muted, 'right');
    // Player plate, mid-left: clear of the hand below and the log above.
    const py = 380;
    context.fillStyle = PALETTE.panel;
    roundRect(context, 24, py - 8, 300, 96, 10);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    roundRect(context, 24, py - 8, 300, 96, 10);
    context.stroke();
    text('YOU', 40, py + 18, 18, PALETTE.text, 'left');
    drawBar(40, py + 30, 220, 16, player.hp / player.maxHp, PALETTE.hp, PALETTE.hpBack);
    text(`${player.hp} / ${player.maxHp}`, 270, py + 44, 15, PALETTE.text, 'left');
    plainText(`Block ${player.block}   Strength +${player.strength}${player.weak > 0 ? `   Weak ${player.weak}` : ''}`, 40, py + 72, 15, PALETTE.muted, 'left');
    // Energy orbs.
    for (let i = 0; i < PLAYER.maxEnergy; i += 1) {
      const ex = 360 + i * 44;
      context.fillStyle = i < state.energy ? PALETTE.energy : '#2c3e50';
      context.beginPath();
      context.arc(ex, py + 30, 18, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#1b3a4d';
      context.lineWidth = 2;
      context.stroke();
      text(`${i + 1}`, ex, py + 37, 16, '#0b2233', 'center');
    }
    plainText('Energy', 348, py + 66, 14, PALETTE.muted, 'left');
    // Piles.
    plainText(`Draw ${state.drawPile.length}`, 900, py + 30, 16, PALETTE.muted, 'left');
    plainText(`Discard ${state.discardPile.length}`, 900, py + 56, 16, PALETTE.muted, 'left');
    // End Turn button.
    context.fillStyle = PALETTE.button;
    roundRect(context, END_TURN.x, END_TURN.y, END_TURN.width, END_TURN.height, 10);
    context.fill();
    context.strokeStyle = PALETTE.buttonEdge;
    context.lineWidth = 2;
    roundRect(context, END_TURN.x, END_TURN.y, END_TURN.width, END_TURN.height, 10);
    context.stroke();
    text('END TURN', END_TURN.x + END_TURN.width / 2, END_TURN.y + 34, 20, '#ffffff', 'center');
    // Recent log.
    state.log.forEach((line, i) => {
      plainText(line, 24, 120 + i * 20, 14, PALETTE.muted, 'left');
    });
  }

  function drawPanel(title, lines, prompt, accent) {
    const width = 640;
    const height = 150 + lines.length * 32;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, width, height, 14);
    context.fill();
    context.strokeStyle = accent ?? PALETTE.panelEdge;
    context.lineWidth = 3;
    roundRect(context, x, y, width, height, 14);
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.text, 'center');
    lines.forEach((line, i) => {
      plainText(line, FIELD.width / 2, y + 118 + i * 32, 20, PALETTE.muted, 'center');
    });
    text(prompt, FIELD.width / 2, y + height - 30, 22, PALETTE.gold, 'center');
  }

  function drawTable(state, time) {
    context.fillStyle = PALETTE.table;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Felt ring around the enemy's spot.
    context.strokeStyle = PALETTE.tableEdge;
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(ENEMY_POS.x, ENEMY_POS.y + 10, 190, 130, 0, 0, Math.PI * 2);
    context.stroke();
  }

  function drawBattle(state, time) {
    drawTable(state, time);
    const enemy = state.enemy;
    drawEnemy(enemy, time);
    // Enemy name, intent and health.
    text(enemy.name, ENEMY_POS.x, 84, 26, PALETTE.text, 'center');
    plainText(intentLabel(enemy.intent, Math.max(0, enemy.attack + enemy.strength)), ENEMY_POS.x, 108, 17, PALETTE.intent, 'center');
    drawBar(ENEMY_POS.x - 130, 330, 260, 16, enemy.hp / enemy.maxHp, PALETTE.enemyHp, PALETTE.hpBack);
    text(`${enemy.hp} / ${enemy.maxHp}`, ENEMY_POS.x, 362, 16, PALETTE.text, 'center');
    drawStatusPips(enemy, 950, 130);
    drawHud(state);
    // Hand.
    const layout = handLayout(state);
    layout.forEach((slot, i) => {
      const card = cardById(slot.id);
      drawCard(card, slot.x, slot.y, CARD.width, CARD.height, hoverCard === i, card.cost > state.energy);
    });
    plainText('Click a card to play it  ·  Keys 1-5 play cards  ·  Space ends the turn', FIELD.width / 2, 706, 14, PALETTE.muted, 'center');
  }

  function drawDraft(state) {
    drawTable(state, 0);
    text('Floor cleared!', FIELD.width / 2, 90, 40, PALETTE.gold, 'center');
    plainText('Draft one card for your deck, then descend deeper.', FIELD.width / 2, 126, 20, PALETTE.muted, 'center');
    const total = 3 * CARD.width + 2 * 30;
    const startX = (FIELD.width - total) / 2;
    state.draftChoices.forEach((id, i) => {
      drawCard(cardById(id), startX + i * (CARD.width + 30), DRAFT_CARD_Y, CARD.width, CARD.height, hoverDraft === i, false);
    });
    text(`Gold ${state.gold}   ·   Deck ${state.deck.length} cards`, FIELD.width / 2, 540, 20, PALETTE.text, 'center');
  }

  function drawTitle(state, best) {
    drawTable(state, 0);
    text('DUNGEON', FIELD.width / 2, 220, 84, PALETTE.text, 'center');
    text('DRAFT', FIELD.width / 2, 310, 84, PALETTE.gold, 'center');
    plainText('A roguelike deck-builder. Five floors. One deck. No way back.', FIELD.width / 2, 360, 22, PALETTE.muted, 'center');
    plainText('Play cards with mouse or keys 1-5. Spend energy, break the monster, draft a new card each floor.', FIELD.width / 2, 396, 18, PALETTE.muted, 'center');
    if (best > 0) plainText(`Best run: floor ${best}`, FIELD.width / 2, 440, 18, PALETTE.gold, 'center');
    text('Press Space or click to delve', FIELD.width / 2, 520, 26, PALETTE.gold, 'center');
    plainText('Starter deck: 4 Strike · 3 Defend · Bash · Fireball · Quick Jab', FIELD.width / 2, 580, 16, PALETTE.muted, 'center');
  }

  /** Paint one frame for the phase the run is in. */
  function draw(state, time) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.textBaseline = 'alphabetic';
    if (state.phase === PHASE_TITLE) drawTitle(state, state.best ?? 0);
    else if (state.phase === PHASE_BATTLE) drawBattle(state, time);
    else if (state.phase === PHASE_DRAFT) drawDraft(state);
    else if (state.phase === PHASE_VICTORY) {
      drawTable(state, time);
      drawPanel('DUNGEON CLEARED!', [
        `You beat all ${FLOORS} floors and slew the Warden.`,
        `Score ${state.score}  ·  Gold ${state.gold}  ·  Cards played ${state.stats.cardsPlayed}`,
        `Damage dealt ${state.stats.damageDealt}  ·  Deck ${state.deck.length} cards`,
      ], 'Press Space to delve again', PALETTE.gold);
    } else if (state.phase === PHASE_DEFEAT) {
      drawTable(state, time);
      drawPanel('YOU DIED', [
        `The dungeon claims another hero on floor ${state.floor}.`,
        `Score ${state.score}  ·  Gold ${state.gold}  ·  Cards played ${state.stats.cardsPlayed}`,
        `Damage dealt ${state.stats.damageDealt}  ·  Best floor ${state.best ?? 0}`,
      ], 'Press Space to try again', PALETTE.danger);
    }
  }

  /** Map a point in logical table coordinates to what sits under it. */
  function hitTest(state, x, y) {
    if (state.phase === PHASE_TITLE || state.phase === PHASE_VICTORY || state.phase === PHASE_DEFEAT) {
      return { type: 'start' };
    }
    if (state.phase === PHASE_DRAFT) {
      const total = 3 * CARD.width + 2 * 30;
      const startX = (FIELD.width - total) / 2;
      for (let i = 0; i < state.draftChoices.length; i += 1) {
        const cx = startX + i * (CARD.width + 30);
        if (x >= cx && x <= cx + CARD.width && y >= DRAFT_CARD_Y && y <= DRAFT_CARD_Y + CARD.height) return { type: 'draft', index: i };
      }
      return null;
    }
    if (state.phase === PHASE_BATTLE) {
      if (x >= END_TURN.x && x <= END_TURN.x + END_TURN.width && y >= END_TURN.y && y <= END_TURN.y + END_TURN.height) {
        return { type: 'endTurn' };
      }
      const layout = handLayout(state);
      // Check from the topmost (last drawn, rightmost) card backwards.
      for (let i = layout.length - 1; i >= 0; i -= 1) {
        const slot = layout[i];
        if (x >= slot.x && x <= slot.x + CARD.width && y >= slot.y && y <= slot.y + CARD.height) return { type: 'card', index: i };
      }
    }
    return null;
  }

  /** Track the hovered card so the hand lifts under the pointer. */
  function hover(state, x, y) {
    hoverCard = -1;
    hoverDraft = -1;
    if (state.phase === PHASE_BATTLE) {
      const layout = handLayout(state);
      for (let i = layout.length - 1; i >= 0; i -= 1) {
        const slot = layout[i];
        if (x >= slot.x && x <= slot.x + CARD.width && y >= slot.y && y <= slot.y + CARD.height) {
          hoverCard = i;
          break;
        }
      }
    } else if (state.phase === PHASE_DRAFT) {
      const total = 3 * CARD.width + 2 * 30;
      const startX = (FIELD.width - total) / 2;
      for (let i = 0; i < state.draftChoices.length; i += 1) {
        const cx = startX + i * (CARD.width + 30);
        if (x >= cx && x <= cx + CARD.width && y >= DRAFT_CARD_Y && y <= DRAFT_CARD_Y + CARD.height) {
          hoverDraft = i;
          break;
        }
      }
    }
  }

  /** Convert a pointer event's client point to logical table coordinates. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * FIELD.width,
      y: (clientY - rect.top) / rect.height * FIELD.height,
    };
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, hitTest, hover, toLogical };
}
