// Dungeon Draft — tuning numbers, colours and layout in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** How many floors the dungeon has; the last floor is the boss. */
export const FLOORS = 5;

export const PLAYER = {
  maxHp: 60,
  maxEnergy: 3,
  handSize: 5,
  startGold: 0,
};

export const ENEMY = {
  /** Extra hit points and attack added per floor above the first. */
  hpPerFloor: 9,
  attackPerFloor: 2,
};

/** Gold and score handed out for clearing a floor. */
export const REWARD = { goldPerFloor: 12, goldBoss: 40, scorePerFloor: 100 };

/** Where the best run is kept between visits (this browser only). */
export const BEST_KEY = 'dungeon-draft.best-floor';

export const PALETTE = {
  backdrop: '#14101d',
  table: '#241a33',
  tableEdge: '#3a2b52',
  felt: '#2c2140',
  panel: '#1d1628',
  panelEdge: '#4a3a68',
  text: '#f2ead8',
  muted: '#b3a6cc',
  gold: '#f2c94c',
  hp: '#e5534b',
  hpBack: '#3a2027',
  block: '#6ea8fe',
  energy: '#4fc3f7',
  enemyHp: '#ff6b5e',
  cardAttack: '#c0392b',
  cardSkill: '#2471a3',
  cardPower: '#7d3c98',
  cardBack: '#efe6cf',
  cardEdge: '#8a7a5a',
  button: '#3f7d4e',
  buttonEdge: '#6fbf7f',
  danger: '#e5534b',
  intent: '#ffb454',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Card geometry on the table. */
export const CARD = { width: 150, height: 210, gap: 14, handY: 480, hoverLift: 34 };
