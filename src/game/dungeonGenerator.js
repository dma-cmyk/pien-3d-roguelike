import { MATERIALS, EGOS, BASE_ITEMS, LEGENDARY_ARTIFACTS } from './typesAndConstants';

export function generateRandomItem(x, y, floorNumber) {
  const rand = Math.random();

  // 15% Chance: Artifact
  if (rand < 0.15 || floorNumber >= 8 && rand < 0.25) {
    const art = LEGENDARY_ARTIFACTS[Math.floor(Math.random() * LEGENDARY_ARTIFACTS.length)];
    return {
      ...art,
      id: `art_${Date.now()}_${Math.random()}`,
      x,
      y,
      isIdentified: true,
    };
  }

  // 25% Chance: Material
  if (rand < 0.4) {
    const matKeys = Object.keys(MATERIALS);
    const selectedMatKey = matKeys[Math.floor(Math.random() * matKeys.length)];
    const mat = MATERIALS[selectedMatKey];

    return {
      id: `mat_${Date.now()}_${Math.random()}`,
      x,
      y,
      name: mat.name,
      emoji: mat.emoji,
      category: 'MATERIAL',
      type: selectedMatKey,
      uses: 1 + Math.floor(Math.random() * 2),
      isIdentified: true,
    };
  }

  // 30% Chance: Dynamic Ego + Material Named Equipment
  if (rand < 0.7) {
    const matKeys = Object.keys(MATERIALS);
    const selectedMatKey = matKeys[Math.floor(Math.random() * matKeys.length)];
    const mat = MATERIALS[selectedMatKey];

    const baseItem = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];
    const ego = EGOS[Math.floor(Math.random() * EGOS.length)];

    const calculatedAtk = Math.floor(baseItem.baseAtk * mat.multiplier + ego.atkBonus);
    const calculatedDef = Math.floor(baseItem.baseDef * mat.multiplier + ego.defBonus);
    const fullName = `${ego.name} ${mat.prefix} ${baseItem.emoji} ${baseItem.name}`;

    return {
      id: `equip_${Date.now()}_${Math.random()}`,
      x,
      y,
      name: fullName,
      emoji: baseItem.emoji,
      category: 'EQUIPMENT',
      type: baseItem.type,
      atkBonus: calculatedAtk,
      defBonus: calculatedDef,
      enchantments: [ego.enchant],
      isIdentified: Math.random() < 0.6,
    };
  }

  // 30% Chance: Consumables / Spellbooks / Jars
  const standardPool = [
    { name: '薬草', emoji: '🌿', category: 'CONSUMABLE', type: 'HERB', heal: 30 },
    { name: '特効薬', emoji: '🧪', category: 'CONSUMABLE', type: 'POTION', heal: 60 },
    { name: 'パン', emoji: '🍞', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 50 },
    { name: 'イオの書', emoji: '📜', category: 'SPELLBOOK', type: 'SPELLBOOK', uses: 3 },
    { name: 'テイムの書', emoji: '📖', category: 'SPELLBOOK', type: 'TAME', uses: 2 },
    { name: '合成の壺', emoji: '🏺', category: 'JAR', type: 'SYNTHESIS', capacity: 4, contents: [] },
    { name: '識別の壺', emoji: '🔮', category: 'JAR', type: 'IDENTIFY', capacity: 3, contents: [] },
    { name: '変化の壺', emoji: '✨', category: 'JAR', type: 'CHANGE', capacity: 3, contents: [] },
    { name: '保存の壺', emoji: '📦', category: 'JAR', type: 'STORAGE', capacity: 4, contents: [] },
  ];

  const tpl = standardPool[Math.floor(Math.random() * standardPool.length)];
  return {
    ...tpl,
    id: `std_${Date.now()}_${Math.random()}`,
    contents: tpl.contents ? [] : undefined,
    x,
    y,
    isIdentified: true,
  };
}

const MONSTER_TEMPLATES = [
  { name: 'スライム', emoji: '💧', hp: 18, atk: 6, def: 2, exp: 12, minFloor: 1, maxFloor: 99 },
  { name: 'ゴブリン', emoji: '👺', hp: 28, atk: 10, def: 4, exp: 20, minFloor: 1, maxFloor: 99 },
  { name: 'オーク', emoji: '🐗', hp: 45, atk: 15, def: 6, exp: 35, minFloor: 2, maxFloor: 99 },
  { name: 'スケルトン', emoji: '💀', hp: 60, atk: 20, def: 8, exp: 50, minFloor: 3, maxFloor: 99 },
  { name: 'ミミック', emoji: '🧰', hp: 75, atk: 26, def: 12, exp: 70, minFloor: 4, maxFloor: 99 },
  { name: 'ドラゴン', emoji: '🐉', hp: 120, atk: 35, def: 18, exp: 120, minFloor: 5, maxFloor: 99 },
];

const FRIENDLY_NPCS = [
  { name: '鍛冶屋のガンテツ', emoji: '👷', type: 'SMITH' },
  { name: '鑑定士マロン', emoji: '🧙', type: 'IDENTIFIER' },
  { name: '道具屋トネコ', emoji: '👨', type: 'SHOP' },
  { name: '占い師シルフィ', emoji: '🧕', type: 'TELLER' },
  { name: 'ギャンブラーのジャック', emoji: '🤵', type: 'GAMBLER' },
  { name: '魔物使いのガゼル', emoji: '🧔', type: 'TAMER' },
];

const WALL_TYPES = {
  EARTH: { type: 'EARTH', name: '土の壁', emoji: '🪨', maxHp: 15, color: '#8B4513', dropChance: 0.15, dropType: 'FOOD' },
  STONE: { type: 'STONE', name: '岩石の壁', emoji: '🧱', maxHp: 35, color: '#696969', dropChance: 0.25, dropType: 'ORE' },
  ORE: { type: 'ORE', name: '鉱石の脈', emoji: '💎', maxHp: 50, color: '#4682B4', dropChance: 0.6, dropType: 'ORE' },
  OBSIDIAN: { type: 'OBSIDIAN', name: '黒曜石の魔壁', emoji: '⬛', maxHp: 90, color: '#1A1A1A', dropChance: 0.8, dropType: 'ORE' },
};

export function generateDungeonFloor(floorNumber) {
  const baseSize = 16;
  const sizeGrowth = Math.floor(floorNumber * 1.2);
  const mapSize = Math.min(42, baseSize + sizeGrowth);

  const grid = Array.from({ length: mapSize }, () => Array(mapSize).fill('W'));
  const visitedGrid = Array.from({ length: mapSize }, () => Array(mapSize).fill(false));
  const visibleGrid = Array.from({ length: mapSize }, () => Array(mapSize).fill(false));
  const wallData = Array.from({ length: mapSize }, () => Array(mapSize).fill(null));

  const roomCount = Math.min(10, 4 + Math.floor(floorNumber * 0.6));
  const rooms = [];

  for (let i = 0; i < roomCount; i++) {
    const w = 4 + Math.floor(Math.random() * 4);
    const h = 4 + Math.floor(Math.random() * 4);
    const x = 1 + Math.floor(Math.random() * (mapSize - w - 2));
    const y = 1 + Math.floor(Math.random() * (mapSize - h - 2));

    let overlap = false;
    for (const r of rooms) {
      if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      rooms.push({ x, y, w, h });
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          grid[ry][rx] = 'F';
        }
      }
    }
  }

  if (rooms.length === 0) {
    rooms.push({ x: 2, y: 2, w: 6, h: 6 });
    for (let ry = 2; ry < 8; ry++) {
      for (let rx = 2; rx < 8; rx++) {
        grid[ry][rx] = 'F';
      }
    }
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    let cx = Math.floor(r1.x + r1.w / 2);
    let cy = Math.floor(r1.y + r1.h / 2);
    const targetCx = Math.floor(r2.x + r2.w / 2);
    const targetCy = Math.floor(r2.y + r2.h / 2);

    while (cx !== targetCx) {
      grid[cy][cx] = 'F';
      cx += cx < targetCx ? 1 : -1;
    }
    while (cy !== targetCy) {
      grid[cy][cx] = 'F';
      cy += cy < targetCy ? 1 : -1;
    }
  }

  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      if (grid[y][x] === 'W') {
        const rand = Math.random();
        let wallType = WALL_TYPES.EARTH;

        if (floorNumber >= 7 && rand < 0.1) {
          wallType = WALL_TYPES.OBSIDIAN;
        } else if (rand < 0.2) {
          wallType = WALL_TYPES.ORE;
        } else if (rand < 0.5) {
          wallType = WALL_TYPES.STONE;
        }

        wallData[y][x] = {
          type: wallType.type,
          name: wallType.name,
          emoji: wallType.emoji,
          hp: wallType.maxHp,
          maxHp: wallType.maxHp,
          color: wallType.color,
          dropChance: wallType.dropChance,
          dropType: wallType.dropType,
        };
      }
    }
  }

  const spawnRoom = rooms[0];
  const playerSpawn = {
    x: Math.floor(spawnRoom.x + spawnRoom.w / 2),
    y: Math.floor(spawnRoom.y + spawnRoom.h / 2),
  };

  const lastRoom = rooms[rooms.length - 1];
  const stairsPos = {
    x: Math.floor(lastRoom.x + lastRoom.w / 2),
    y: Math.floor(lastRoom.y + lastRoom.h / 2),
  };

  const getEmptyFloorInRoom = (r) => {
    let attempts = 0;
    while (attempts < 50) {
      const rx = r.x + Math.floor(Math.random() * r.w);
      const ry = r.y + Math.floor(Math.random() * r.h);
      if (grid[ry][rx] === 'F' && (rx !== playerSpawn.x || ry !== playerSpawn.y)) {
        return { x: rx, y: ry };
      }
      attempts++;
    }
    return { x: r.x, y: r.y };
  };

  const getEmptyFloor = () => {
    let attempts = 0;
    while (attempts < 100) {
      const rx = Math.floor(Math.random() * mapSize);
      const ry = Math.floor(Math.random() * mapSize);
      if (grid[ry][rx] === 'F' && (rx !== playerSpawn.x || ry !== playerSpawn.y)) {
        return { x: rx, y: ry };
      }
      attempts++;
    }
    return playerSpawn;
  };

  const items = [];
  const itemCount = 5 + Math.floor(floorNumber * 1.5);
  for (let i = 0; i < itemCount; i++) {
    const pos = getEmptyFloor();
    items.push(generateRandomItem(pos.x, pos.y, floorNumber));
  }

  const npcs = [];
  if (Math.random() < 0.85) {
    const npcTemplate = FRIENDLY_NPCS[Math.floor(Math.random() * FRIENDLY_NPCS.length)];
    const pos = getEmptyFloor();
    npcs.push({
      id: `npc_${Date.now()}_${Math.random()}`,
      name: npcTemplate.name,
      emoji: npcTemplate.emoji,
      type: npcTemplate.type,
      x: pos.x,
      y: pos.y,
      hp: 100,
      maxHp: 100,
      atk: 12 + Math.floor(floorNumber * 2),
      def: 10 + Math.floor(floorNumber * 1.5),
    });
  }

  const enemies = [];
  const enemyCount = 3 + Math.floor(floorNumber * 2.0);
  const eligibleMonsters = MONSTER_TEMPLATES.filter(
    (m) => floorNumber >= m.minFloor && floorNumber <= m.maxFloor
  );

  let monsterHouseRoom = null;
  if (floorNumber >= 2 && Math.random() < 0.25 && rooms.length >= 3) {
    monsterHouseRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];

    const mhMonsterCount = 6 + Math.floor(floorNumber * 1.0);
    for (let i = 0; i < mhMonsterCount; i++) {
      const template = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)] || MONSTER_TEMPLATES[0];
      const pos = getEmptyFloorInRoom(monsterHouseRoom);
      enemies.push({
        id: `mh_enemy_${Date.now()}_${i}`,
        name: template.name,
        emoji: template.emoji,
        x: pos.x,
        y: pos.y,
        hp: template.hp + Math.floor(floorNumber * 12),
        maxHp: template.hp + Math.floor(floorNumber * 12),
        atk: template.atk + Math.floor(floorNumber * 3.5),
        def: template.def + Math.floor(floorNumber * 2.0),
        exp: template.exp + Math.floor(floorNumber * 8),
        isBoss: false,
      });
    }

    const mhItemCount = 5 + Math.floor(floorNumber * 0.8);
    for (let i = 0; i < mhItemCount; i++) {
      const pos = getEmptyFloorInRoom(monsterHouseRoom);
      items.push(generateRandomItem(pos.x, pos.y, floorNumber));
    }
  }

  // Standard Enemies Placement with Floor Scaling Stats
  for (let i = 0; i < enemyCount; i++) {
    const template = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)] || MONSTER_TEMPLATES[0];
    const pos = getEmptyFloor();
    if (pos.x !== playerSpawn.x || pos.y !== playerSpawn.y) {
      enemies.push({
        id: `enemy_${Date.now()}_${i}`,
        name: template.name,
        emoji: template.emoji,
        x: pos.x,
        y: pos.y,
        hp: template.hp + Math.floor(floorNumber * 12),
        maxHp: template.hp + Math.floor(floorNumber * 12),
        atk: template.atk + Math.floor(floorNumber * 3.5),
        def: template.def + Math.floor(floorNumber * 2.0),
        exp: template.exp + Math.floor(floorNumber * 8),
        isBoss: false,
      });
    }
  }

  return {
    mapSize,
    grid,
    wallData,
    visitedGrid,
    visibleGrid,
    monsterHouseRoom,
    playerSpawn,
    stairsPos,
    items,
    npcs,
    enemies,
  };
}
