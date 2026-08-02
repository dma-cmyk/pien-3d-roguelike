// Roguelike System Constants and Definitions - 8 Fixed Character Classes

export const JOB_CLASSES = {
  WARRIOR: {
    id: 'WARRIOR',
    name: '戦士',
    emoji: '🥺',
    description: 'HP・攻撃力・防御力が高いバランス型',
    hp: 40,
    maxHp: 40,
    atk: 12,
    def: 5,
    initialItems: [
      { id: 'init_steel_sword', name: '鋼鉄の剣', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 8, enchantments: [] },
      { id: 'init_steel_shield', name: '鋼鉄の盾', category: 'EQUIPMENT', type: 'SHIELD', defBonus: 5, enchantments: [] },
      { id: 'init_herb', name: '薬草', category: 'CONSUMABLE', type: 'HERB', heal: 30 },
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
    def: 2,
    initialItems: [
      { id: 'init_fire_spell', name: 'ファイヤーの書', category: 'SPELLBOOK', spell: 'FIRE', uses: 6 },
      { id: 'init_thunder_spell', name: 'サンダーの書', category: 'SPELLBOOK', spell: 'THUNDER', uses: 6 },
      { id: 'init_potion', name: '特効薬', category: 'CONSUMABLE', type: 'POTION', heal: 50 },
    ],
  },
  THIEF: {
    id: 'THIEF',
    name: '盗賊',
    emoji: '😎',
    description: '素早さ・会心率が高く、ドロップ率UP',
    hp: 30,
    maxHp: 30,
    atk: 9,
    def: 3,
    initialItems: [
      { id: 'init_thief_dagger', name: '会心の短剣', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 6, enchantments: ['会心', 'ドロップ増'] },
      { id: 'init_id_簪', name: '識別のかんざし', category: 'JAR', type: 'IDENTIFY', capacity: 3, contents: [] },
      { id: 'init_thief_gold', name: '盗賊の金貨袋', category: 'MONEY', amount: 200 },
    ],
  },
  MARTIAL_ARTIST: {
    id: 'MARTIAL_ARTIST',
    name: '武闘家',
    emoji: '😤',
    description: '素手攻撃力が高く、連続攻撃率を持つ。満腹度消費が少ない',
    hp: 38,
    maxHp: 38,
    atk: 14,
    def: 4,
    initialItems: [
      { id: 'init_herb_1', name: '薬草', category: 'CONSUMABLE', type: 'HERB', heal: 30, uses: 3 },
      { id: 'init_bread', name: '高級パン', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 60 },
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
    def: 4,
    initialItems: [
      { id: 'init_heal_spell', name: '回復魔法の書', category: 'SPELLBOOK', spell: 'HEAL', uses: 5 },
      { id: 'init_holy_amulet', name: '聖なるお守り', category: 'EQUIPMENT', type: 'SHIELD', defBonus: 4, enchantments: ['自動回復', '全知全能'] },
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
    def: 3,
    initialItems: [
      { id: 'init_bow', name: '狩人の弓矢', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 7, enchantments: ['暗視', '必中'] },
      { id: 'init_trap_kit', name: '罠解除ツール', category: 'CONSUMABLE', type: 'HERB', heal: 20, uses: 4 },
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
      { id: 'init_axe', name: '両手斧', category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 9, enchantments: ['狂乱', '会心'] },
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
      { id: 'init_fake_gold', name: '偽物の金貨', category: 'MONEY', amount: 150 },
    ],
  },
};

export const MATERIALS = {
  WOODEN: { name: '木製', emoji: '🪵', multiplier: 1.0, prefix: '木製' },
  BRONZE: { name: '青銅製', emoji: '🥉', multiplier: 1.4, prefix: '青銅製' },
  IRON: { name: '鉄製', emoji: '🪨', multiplier: 1.8, prefix: '鉄製' },
  STEEL: { name: '鋼鉄製', emoji: '⚔️', multiplier: 2.3, prefix: '鋼鉄製' },
  DIAMOND: { name: 'ダイヤ製', emoji: '💎', multiplier: 3.2, prefix: 'ダイヤ製' },
  ORICHALCUM: { name: 'オリハルコン製', emoji: '🌟', multiplier: 4.2, prefix: 'オリハルコン製' },
};

export const EGOS = [
  { name: '狂乱の', enchant: '狂乱', atkBonus: 6, defBonus: 0 },
  { name: '灼熱の', enchant: '火属性', atkBonus: 4, defBonus: 0 },
  { name: '暗夜の', enchant: '暗視', atkBonus: 2, defBonus: 3 },
  { name: '雷撃の', enchant: '会心', atkBonus: 7, defBonus: 0 },
  { name: '伝説の', enchant: '全知全能', atkBonus: 8, defBonus: 6 },
  { name: '漆黒の', enchant: '吸血', atkBonus: 5, defBonus: 2 },
  { name: '聖なる', enchant: '魔法反射', atkBonus: 3, defBonus: 7 },
  { name: '剛力無双の', enchant: '採掘強化', atkBonus: 9, defBonus: 1 },
];

export const BASE_ITEMS = [
  { name: '剣', emoji: '⚔️', type: 'WEAPON', baseAtk: 6, baseDef: 0 },
  { name: '大剣', emoji: '🪓', type: 'WEAPON', baseAtk: 10, baseDef: 0 },
  { name: '短剣', emoji: '🗡️', type: 'WEAPON', baseAtk: 4, baseDef: 0 },
  { name: '盾', emoji: '🛡️', type: 'SHIELD', baseAtk: 0, baseDef: 6 },
  { name: '大盾', emoji: '🔰', type: 'SHIELD', baseAtk: 0, baseDef: 10 },
  { name: '鎧', emoji: '🦺', type: 'SHIELD', baseAtk: 2, baseDef: 7 },
];

export const LEGENDARY_ARTIFACTS = [
  {
    name: '👑 賢者の石',
    emoji: '👑',
    category: 'ARTIFACT',
    type: 'PHILOSOPHER_STONE',
    effect: '毎ターンHP自然回復 & 満腹度無限',
    atkBonus: 15,
    defBonus: 10,
    enchantments: ['全知全能', '暗視'],
  },
  {
    name: '🏆 🥺のぴえんオーブ',
    emoji: '🏆',
    category: 'ARTIFACT',
    type: 'VICTORY_ORB',
    effect: '使用すると即座に迷宮から脱出制覇できる',
    atkBonus: 0,
    defBonus: 0,
    enchantments: ['全知全能'],
  },
  {
    name: '🔱 アテナの神槍',
    emoji: '🔱',
    category: 'ARTIFACT',
    type: 'PHILOSOPHER_STONE',
    effect: '敵を即死させる神々の加護 & 常時HP全回復',
    atkBonus: 35,
    defBonus: 10,
    enchantments: ['会心', '吸血', '全知全能'],
  },
  {
    name: '🔰 イージスの神盾',
    emoji: '🔰',
    category: 'ARTIFACT',
    type: 'PHILOSOPHER_STONE',
    effect: 'すべてのダメージを劇的軽減 & 魔法反射',
    atkBonus: 10,
    defBonus: 35,
    enchantments: ['魔法反射', '防護', '暗視'],
  },
];

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
  { type: 'SMITH', name: '鍛冶屋', emoji: '👷', role: '装備の鍛錬・強化 & 素材クラフト' },
  { type: 'IDENTIFIER', name: '鑑定士', emoji: '🧙', role: '未識別アイテムの鑑定' },
  { type: 'TELLER', name: '占い師', emoji: '🧕', role: 'マップ透視 & Gemini AI 神器降臨' },
  { type: 'GAMBLER', name: 'ギャンブラー', emoji: '🤵', role: '倍プッシュBJ & 高速目押しカジノ' },
  { type: 'TAMER', name: '魔物使い', emoji: '🧔', role: 'ペット売買 & 回復治療' },
];

export function getFloorTheme(floorNumber) {
  if (floorNumber >= 15) {
    return { name: '深淵の魔宮', wallColor: '#2a1b3d', floorColor: '#120a1c', fogColor: '#0a0512' };
  } else if (floorNumber >= 10) {
    return { name: '溶岩の回廊', wallColor: '#4a1515', floorColor: '#1c0a0a', fogColor: '#120505' };
  } else if (floorNumber >= 5) {
    return { name: '古代の遺跡', wallColor: '#1e293b', floorColor: '#0f172a', fogColor: '#090d16' };
  }
  return { name: '地下洞窟', wallColor: '#334155', floorColor: '#1e293b', fogColor: '#0f172a' };
}
