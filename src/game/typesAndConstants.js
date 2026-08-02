// Game Definitions and Constants

export const JOB_CLASSES = {
  WARRIOR: {
    id: 'WARRIOR',
    name: '戦士',
    emoji: '🥺',
    description: 'HP・攻撃力・防御力が高いバランス型',
    hp: 40,
    maxHp: 40,
    atk: 12,
    def: 6,
    initialItems: [
      { id: 'init_wep', name: '鋼鉄の剣', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 5, enchantments: [] },
      { id: 'init_shd', name: '鋼鉄の盾', category: 'EQUIPMENT', type: 'SHIELD', defBonus: 4, enchantments: [] },
      { id: 'init_food', name: 'パン', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 50 },
    ],
  },
  MAGE: {
    id: 'MAGE',
    name: '魔法使い',
    emoji: '🧐',
    description: '最大MPが高く、魔法の威力が絶大',
    hp: 25,
    maxHp: 25,
    atk: 7,
    def: 3,
    initialItems: [
      { id: 'init_book1', name: 'ファイヤーの書', category: 'SPELLBOOK', spell: 'FIRE', uses: 6 },
      { id: 'init_book2', name: 'サンダーの書', category: 'SPELLBOOK', spell: 'THUNDER', uses: 5 },
      { id: 'init_food', name: 'パン', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 50 },
    ],
  },
  ROGUE: {
    id: 'ROGUE',
    name: '盗賊',
    emoji: '😎',
    description: '素早さ・会心率が高く、ドロップ率UP',
    hp: 30,
    maxHp: 30,
    atk: 9,
    def: 4,
    initialItems: [
      { id: 'init_key', name: '鍵', category: 'CONSUMABLE', type: 'KEY' },
      { id: 'init_kanzashi', name: '識別のかんざし', category: 'CONSUMABLE', type: 'IDENTIFY' },
      { id: 'init_gold', name: '金貨袋', category: 'MONEY', amount: 200 },
    ],
  },
  MARTIAL_ARTIST: {
    id: 'MARTIAL_ARTIST',
    name: '武闘家',
    emoji: '😤',
    description: '素手攻撃力が高く、連続攻撃率を持つ',
    hp: 35,
    maxHp: 35,
    atk: 14,
    def: 4,
    initialItems: [
      { id: 'init_herb1', name: '薬草', category: 'CONSUMABLE', type: 'HERB', heal: 20 },
      { id: 'init_herb2', name: '薬草', category: 'CONSUMABLE', type: 'HERB', heal: 20 },
      { id: 'init_herb3', name: '薬草', category: 'CONSUMABLE', type: 'HERB', heal: 20 },
    ],
  },
  CLERIC: {
    id: 'CLERIC',
    name: '聖職者',
    emoji: '😇',
    description: '自動HP回復補正、アンデッド特効',
    hp: 32,
    maxHp: 32,
    atk: 8,
    def: 5,
    initialItems: [
      { id: 'init_healbook', name: '回復の書', category: 'SPELLBOOK', spell: 'HEAL', uses: 8 },
      { id: 'init_amulet', name: '聖なるお守り', category: 'EQUIPMENT', type: 'ACCESSORY', defBonus: 2, enchantments: ['自動回復'] },
    ],
  },
  HUNTER: {
    id: 'HUNTER',
    name: '狩人',
    emoji: '🤠',
    description: '遠距離攻撃（弓矢）が可能、トラップ視知',
    hp: 30,
    maxHp: 30,
    atk: 10,
    def: 4,
    initialItems: [
      { id: 'init_bow', name: '弓矢セット', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 4, enchantments: ['貫通'] },
      { id: 'init_trap_tool', name: '罠解除ツール', category: 'CONSUMABLE', type: 'TRAP_DISARM' },
    ],
  },
  BERSERKER: {
    id: 'BERSERKER',
    name: '狂戦士',
    emoji: '🤪',
    description: '低HP時に攻撃力が大幅跳ね上がり',
    hp: 45,
    maxHp: 45,
    atk: 15,
    def: 2,
    initialItems: [
      { id: 'init_axe', name: '両手斧', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 8, enchantments: ['会心'] },
      { id: 'init_rage', name: '狂乱の薬', category: 'CONSUMABLE', type: 'RAGE_POTION' },
    ],
  },
  TRICKSTER: {
    id: 'TRICKSTER',
    name: 'ペテン師',
    emoji: '🤥',
    description: '回避率・運が高く、ショップ割引＆敵混乱スキル所持',
    hp: 28,
    maxHp: 28,
    atk: 8,
    def: 3,
    initialItems: [
      { id: 'init_confuse', name: '混乱の魔法書', category: 'SPELLBOOK', spell: 'CONFUSE', uses: 5 },
      { id: 'init_fake_gold', name: '偽物の金貨', category: 'MONEY', amount: 100 },
    ],
  },
};

// Wall Types with Durability & Drops
export const WALL_TYPES = {
  EARTH: { type: 'EARTH', name: '土の壁', emoji: '🟫', maxHp: 20, color: '#8b5a2b', dropChance: 0.2, dropType: 'FOOD' },
  STONE: { type: 'STONE', name: '石の壁', emoji: '🩶', maxHp: 50, color: '#808080', dropChance: 0.35, dropType: 'COMMON' },
  ORE: { type: 'ORE', name: '鉱脈の壁', emoji: '🟦', maxHp: 100, color: '#3b82f6', dropChance: 0.6, dropType: 'RARE' },
  OBSIDIAN: { type: 'OBSIDIAN', name: '黒曜石の壁', emoji: '⬛', maxHp: 200, color: '#1e1b4b', dropChance: 0.85, dropType: 'EPIC' },
};

// 20 Types of Enchantments
export const ENCHANTMENTS = [
  '炎上', '氷結', '雷撃', '吸血', '会心',
  '貫通', '採掘強化', '毒付与', '浮遊', '爆風',
  '経験値増', 'ドロップ増', '自動回復', '満腹度軽減', '反撃',
  '暗視', '必中', '防具頑丈', '金運', '呪い耐性'
];

// 6 Friendly NPCs
export const FRIENDLY_NPCS = [
  { type: 'SHOP', name: '道具屋', emoji: '👨', role: 'アイテムの売買' },
  { type: 'IDENTIFIER', name: '鑑定士', emoji: '🧙', role: '未識別アイテムの鑑定' },
  { type: 'SMITH', name: '鍛冶屋', emoji: '👷', role: '装備の強化とエンチャント付与' },
  { type: 'FORTUNE', name: '占い師', emoji: '🧕', role: '階段や罠の位置の予知' },
  { type: 'TAMER', name: '魔物使いルカ', emoji: '🧔', role: '仲間ペットの販売と治療' },
  { type: 'GAMBLER', name: 'ギャンブラー', emoji: '🤵', role: 'ゴールドを賭けた運試し' },
];

// Enemy Monsters per Floor
export const MONSTER_TEMPLATES = [
  { name: 'スライム', emoji: '🫠', minFloor: 1, maxFloor: 3, hp: 12, atk: 4, def: 1, exp: 5 },
  { name: 'コウモリ', emoji: '🦇', minFloor: 1, maxFloor: 4, hp: 16, atk: 6, def: 2, exp: 8 },
  { name: 'スケルトン', emoji: '💀', minFloor: 2, maxFloor: 6, hp: 28, atk: 10, def: 4, exp: 15 },
  { name: 'クモ', emoji: '🕷️', minFloor: 3, maxFloor: 7, hp: 35, atk: 13, def: 5, exp: 22 },
  { name: 'ゴースト', emoji: '👻', minFloor: 4, maxFloor: 8, hp: 45, atk: 16, def: 7, exp: 30 },
  { name: 'オーガ', emoji: '👹', minFloor: 6, maxFloor: 10, hp: 75, atk: 22, def: 10, exp: 50 },
  { name: 'ドラゴン', emoji: '🐉', minFloor: 8, maxFloor: 10, hp: 120, atk: 28, def: 14, exp: 90 },
];

// Floor Themes
export const FLOOR_THEMES = {
  1: { name: '浅層・新緑の洞窟', wallColor: '#556b2f', floorColor: '#3b4e23', lightColor: '#ffffff' },
  2: { name: '浅層・土と石の迷宮', wallColor: '#7c5295', floorColor: '#4a305d', lightColor: '#e0e7ff' },
  5: { name: '中層・古代の青石神殿', wallColor: '#1e3a8a', floorColor: '#1e293b', lightColor: '#93c5fd' },
  8: { name: '深層・黒曜石と溶岩の巣窟', wallColor: '#451a03', floorColor: '#18181b', lightColor: '#fca5a5' },
  10: { name: '最深層・邪神の玉座', wallColor: '#312e81', floorColor: '#09090b', lightColor: '#c084fc' },
};

export function getFloorTheme(floor) {
  if (floor >= 10) return FLOOR_THEMES[10];
  if (floor >= 8) return FLOOR_THEMES[8];
  if (floor >= 5) return FLOOR_THEMES[5];
  if (floor >= 2) return FLOOR_THEMES[2];
  return FLOOR_THEMES[1];
}
