import { MONSTER_TEMPLATES, FRIENDLY_NPCS, WALL_TYPES } from './typesAndConstants';

// 1 Floor = +1 Grid Dimension Expansion (1F: 16x16, 2F: 17x17, 10F: 25x25, 20F: 35x35, 50F: 65x65...)
export function getMapSizeForFloor(floorNumber) {
  return 16 + (floorNumber - 1);
}

// ----------------------------------------------------
// HACK & SLASH: EGO + MATERIAL + BASE ITEM DYNAMIC GENERATION
// ----------------------------------------------------
export const MATERIALS = [
  { prefix: '木製', emoji: '🪵', atkMult: 1.0, defMult: 1.0, costMult: 1.0 },
  { prefix: '石製', emoji: '🪨', atkMult: 1.3, defMult: 1.3, costMult: 1.3 },
  { prefix: '鉄製', emoji: '⚙️', atkMult: 1.7, defMult: 1.7, costMult: 1.6 },
  { prefix: '鋼鉄製', emoji: '⚔️', atkMult: 2.3, defMult: 2.2, costMult: 2.2 },
  { prefix: 'ダイヤ製', emoji: '💎', atkMult: 3.2, defMult: 3.0, costMult: 3.2 },
  { prefix: 'オリハルコン製', emoji: '🌟', atkMult: 4.2, defMult: 4.0, costMult: 4.5 },
];

export const EGOS = [
  { prefix: '狂乱の', atkBonus: 8, defBonus: 0, enchant: '狂乱', costAdd: 100 },
  { prefix: '灼熱の', atkBonus: 5, defBonus: 0, enchant: '火属性', costAdd: 80 },
  { prefix: '雷撃の', atkBonus: 6, defBonus: 0, enchant: '会心', costAdd: 90 },
  { prefix: '暗夜の', atkBonus: 2, defBonus: 2, enchant: '暗視', costAdd: 120 },
  { prefix: '堅牢な', atkBonus: 0, defBonus: 6, enchant: '防護', costAdd: 70 },
  { prefix: '吸血の', atkBonus: 4, defBonus: 1, enchant: '吸血', costAdd: 110 },
  { prefix: '採掘の', atkBonus: 3, defBonus: 0, enchant: '採掘強化', costAdd: 80 },
  { prefix: '伝説の', atkBonus: 12, defBonus: 6, enchant: '全知全能', costAdd: 250 },
];

export const BASE_ITEMS = [
  { name: '剣', emoji: '⚔️', category: 'EQUIPMENT', type: 'WEAPON', baseAtk: 4, baseDef: 0 },
  { name: '短剣', emoji: '🗡️', category: 'EQUIPMENT', type: 'WEAPON', baseAtk: 3, baseDef: 0 },
  { name: '大剣', emoji: '🪓', category: 'EQUIPMENT', type: 'WEAPON', baseAtk: 7, baseDef: 0 },
  { name: '盾', emoji: '🛡️', category: 'EQUIPMENT', type: 'SHIELD', baseAtk: 0, baseDef: 3 },
  { name: '大盾', emoji: '🔰', category: 'EQUIPMENT', type: 'SHIELD', baseAtk: 0, baseDef: 6 },
  { name: '鎧', emoji: '🦺', category: 'EQUIPMENT', type: 'SHIELD', baseAtk: 0, baseDef: 5 },
];

export function generateDungeonFloor(floorNumber) {
  const mapSize = getMapSizeForFloor(floorNumber);

  // Initialize Empty Grids with Per-Floor Incremental Map Size
  const grid = Array(mapSize)
    .fill(null)
    .map(() => Array(mapSize).fill('W'));

  const wallData = Array(mapSize)
    .fill(null)
    .map(() => Array(mapSize).fill(null));

  const visitedGrid = Array(mapSize)
    .fill(null)
    .map(() => Array(mapSize).fill(false));

  const visibleGrid = Array(mapSize)
    .fill(null)
    .map(() => Array(mapSize).fill(false));

  const rooms = [];
  const minRoomSize = 4;
  const maxRoomSize = Math.min(16, 6 + Math.floor(floorNumber * 0.35));
  const targetRoomCount = 4 + Math.floor(floorNumber * 0.45);

  // Generate Rooms
  for (let i = 0; i < targetRoomCount * 5 && rooms.length < targetRoomCount; i++) {
    const w = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const h = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const x = 1 + Math.floor(Math.random() * (mapSize - w - 2));
    const y = 1 + Math.floor(Math.random() * (mapSize - h - 2));

    const overlaps = rooms.some(
      (r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y
    );

    if (!overlaps) {
      rooms.push({ x, y, w, h });
    }
  }

  // Carve Rooms
  rooms.forEach((r) => {
    for (let ry = r.y; ry < r.y + r.h; ry++) {
      for (let rx = r.x; rx < r.x + r.w; rx++) {
        grid[ry][rx] = 'F';
      }
    }
  });

  // Connect Rooms with Corridors
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

  // Assign Wall Types to remaining Wall Tiles
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

  // Player Spawn Point in Room 0
  const spawnRoom = rooms[0];
  const playerSpawn = {
    x: Math.floor(spawnRoom.x + spawnRoom.w / 2),
    y: Math.floor(spawnRoom.y + spawnRoom.h / 2),
  };

  // Stairs Position in Last Room
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
      atk: 12,
      def: 10,
    });
  }

  const enemies = [];
  const enemyCount = 3 + Math.floor(floorNumber * 2.0);
  const eligibleMonsters = MONSTER_TEMPLATES.filter(
    (m) => floorNumber >= m.minFloor && floorNumber <= m.maxFloor + 2
  );

  // MONSTER HOUSE GENERATION (25% Chance on Floor >= 2)
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
        hp: template.hp + Math.floor(floorNumber * 3),
        maxHp: template.hp + Math.floor(floorNumber * 3),
        atk: template.atk + Math.floor(floorNumber * 1.5),
        def: template.def + Math.floor(floorNumber * 0.8),
        exp: template.exp,
        isBoss: false,
      });
    }

    const mhItemCount = 5 + Math.floor(floorNumber * 0.8);
    for (let i = 0; i < mhItemCount; i++) {
      const pos = getEmptyFloorInRoom(monsterHouseRoom);
      items.push(generateRandomItem(pos.x, pos.y, floorNumber));
    }
  }

  // Standard Enemies Placement
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
        hp: template.hp + Math.floor(floorNumber * 3),
        maxHp: template.hp + Math.floor(floorNumber * 3),
        atk: template.atk + Math.floor(floorNumber * 1.5),
        def: template.def + Math.floor(floorNumber * 0.8),
        exp: template.exp,
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
    rooms,
    monsterHouseRoom,
    playerSpawn,
    stairsPos,
    items,
    npcs,
    enemies,
  };
}

export function generateRandomItem(x, y, floorNumber) {
  const rand = Math.random();
  const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  if (rand < 0.2) {
    return { id, x, y, name: 'パン', emoji: '🍞', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 40, isIdentified: true };
  } else if (rand < 0.38) {
    const isHerb = Math.random() < 0.6;
    return {
      id, x, y,
      name: isHerb ? '薬草' : '謎のポーション',
      emoji: isHerb ? '🌿' : '🧪',
      category: 'CONSUMABLE',
      type: isHerb ? 'HERB' : 'POTION',
      heal: 30,
      isIdentified: isHerb,
    };
  } else if (rand < 0.52) {
    // MATERIAL DROPS
    const matRand = Math.random();
    let matName = '鉄鉱石';
    let matEmoji = '🪨';
    let matType = 'IRON_ORE';

    if (matRand < 0.4) {
      matName = '魔法の結晶';
      matEmoji = '💎';
      matType = 'MANA_CRYSTAL';
    } else if (matRand < 0.7) {
      matName = '竜のうろこ';
      matEmoji = '🪵';
      matType = 'DRAGON_SCALE';
    }

    return {
      id, x, y,
      name: matName,
      emoji: matEmoji,
      category: 'MATERIAL',
      type: matType,
      uses: 1,
      isIdentified: true,
    };
  } else if (rand < 0.65) {
    const isMeat = Math.random() < 0.5;
    return {
      id, x, y,
      name: isMeat ? '魔物の肉' : 'テイムの書',
      emoji: isMeat ? '🥩' : '📖',
      category: isMeat ? 'CONSUMABLE' : 'SPELLBOOK',
      type: isMeat ? 'FOOD' : 'TAME',
      uses: isMeat ? 1 : 3,
      foodRestore: isMeat ? 60 : 0,
      isIdentified: true,
    };
  } else if (rand < 0.88) {
    // HACK & SLASH DYNAMIC EQUIPMENT: EGO + MATERIAL + BASE ITEM
    const base = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];

    // Higher floor = higher chance for rare materials
    const maxMatIdx = Math.min(MATERIALS.length - 1, Math.floor(floorNumber * 0.8) + 1);
    const mat = MATERIALS[Math.floor(Math.random() * (maxMatIdx + 1))];

    // Ego Roll (60% chance to have Ego)
    const hasEgo = Math.random() < 0.6;
    const ego = hasEgo ? EGOS[Math.floor(Math.random() * EGOS.length)] : null;

    const fullName = `${ego ? ego.prefix + ' ' : ''}${mat.prefix} ${base.name}`;
    const calculatedAtk = Math.floor(base.baseAtk * mat.atkMult) + (ego?.atkBonus || 0);
    const calculatedDef = Math.floor(base.baseDef * mat.defMult) + (ego?.defBonus || 0);
    const enchantments = ego ? [ego.enchant] : [];

    return {
      id, x, y,
      name: fullName,
      emoji: base.emoji,
      category: 'EQUIPMENT',
      type: base.type,
      atkBonus: calculatedAtk,
      defBonus: calculatedDef,
      enchantments,
      isIdentified: true,
    };
  } else if (rand < 0.95) {
    return {
      id, x, y,
      name: 'イオの書',
      emoji: '📜',
      category: 'SPELLBOOK',
      type: 'SPELLBOOK',
      uses: 4,
      isIdentified: true,
    };
  } else {
    return {
      id, x, y,
      name: '合成の壺',
      emoji: '🏺',
      category: 'JAR',
      type: 'SYNTHESIS',
      capacity: 3,
      contents: [],
      isIdentified: true,
    };
  }
}
