import { WALL_TYPES, MONSTER_TEMPLATES, FRIENDLY_NPCS, ENCHANTMENTS } from './typesAndConstants';

export const MAP_SIZE = 21;

export function generateDungeonFloor(floorNumber) {
  const grid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill('W'));
  const wallData = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null));
  const visitedGrid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
  const visibleGrid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));

  const rooms = [];
  const minRoomSize = 4;
  const maxRoomSize = 6;
  const targetRoomCount = 5;

  for (let i = 0; i < 20 && rooms.length < targetRoomCount; i++) {
    const rw = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rh = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rx = Math.floor(Math.random() * (MAP_SIZE - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (MAP_SIZE - rh - 2)) + 1;

    const overlaps = rooms.some(
      (r) => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y
    );

    if (!overlaps) {
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let x = rx; x < rx + rw; x++) {
        for (let y = ry; y < ry + rh; y++) {
          grid[y][x] = 'F';
        }
      }
    }
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    let cx = Math.floor(r1.x + r1.w / 2);
    let cy = Math.floor(r1.y + r1.h / 2);
    const targetX = Math.floor(r2.x + r2.w / 2);
    const targetY = Math.floor(r2.y + r2.h / 2);

    while (cx !== targetX) {
      grid[cy][cx] = 'F';
      cx += cx < targetX ? 1 : -1;
    }
    while (cy !== targetY) {
      grid[cy][cx] = 'F';
      cy += cy < targetY ? 1 : -1;
    }
  }

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (grid[y][x] === 'W') {
        const rand = Math.random();
        let wallType = WALL_TYPES.STONE;
        if (rand < 0.35) wallType = WALL_TYPES.EARTH;
        else if (rand < 0.75) wallType = WALL_TYPES.STONE;
        else if (rand < 0.93) wallType = WALL_TYPES.ORE;
        else wallType = WALL_TYPES.OBSIDIAN;

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

  const getEmptyFloor = () => {
    let attempts = 0;
    while (attempts < 500) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const fx = Math.floor(room.x + Math.random() * room.w);
      const fy = Math.floor(room.y + Math.random() * room.h);
      return { x: fx, y: fy };
    }
    return { x: 1, y: 1 };
  };

  const playerSpawn = {
    x: Math.floor(rooms[0].x + rooms[0].w / 2),
    y: Math.floor(rooms[0].y + rooms[0].h / 2),
  };

  const lastRoom = rooms[rooms.length - 1];
  const stairsPos = {
    x: Math.floor(lastRoom.x + lastRoom.w / 2),
    y: Math.floor(lastRoom.y + lastRoom.h / 2),
  };

  const items = [];
  const itemCount = 5 + Math.floor(Math.random() * 3);
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
      atk: 10,
      def: 10,
    });
  }

  const enemies = [];
  const enemyCount = 3 + Math.floor(floorNumber * 1.5);
  const eligibleMonsters = MONSTER_TEMPLATES.filter(
    (m) => floorNumber >= m.minFloor && floorNumber <= m.maxFloor + 2
  );

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
    grid,
    wallData,
    visitedGrid,
    visibleGrid,
    rooms,
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

  if (rand < 0.25) {
    return { id, x, y, name: 'パン', emoji: '🍞', category: 'CONSUMABLE', type: 'FOOD', foodRestore: 40, isIdentified: true };
  } else if (rand < 0.45) {
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
  } else if (rand < 0.6) {
    // Taming Items (Monster Bait Meat / Tame Spellbook)
    const isMeat = Math.random() < 0.5;
    return {
      id, x, y,
      name: isMeat ? '魔物の肉' : 'テイムの書',
      emoji: isMeat ? '🥩' : '📖',
      category: isMeat ? 'CONSUMABLE' : 'SPELLBOOK',
      type: 'TAME',
      uses: 3,
      isIdentified: true,
    };
  } else if (rand < 0.75) {
    const isWep = Math.random() < 0.5;
    const enchant = Math.random() < 0.4 ? ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)] : null;
    return {
      id, x, y,
      name: isWep ? '錆びた剣' : '木の盾',
      emoji: isWep ? '⚔️' : '🛡️',
      category: 'EQUIPMENT',
      type: isWep ? 'WEAPON' : 'SHIELD',
      atkBonus: isWep ? 3 + Math.floor(floorNumber * 0.8) : 0,
      defBonus: !isWep ? 2 + Math.floor(floorNumber * 0.6) : 0,
      enchantments: enchant ? [enchant] : [],
      isIdentified: false,
    };
  } else if (rand < 0.88) {
    const isSynth = Math.random() < 0.5;
    return {
      id, x, y,
      name: isSynth ? '合成の壺' : '保存の壺',
      emoji: '🏺',
      category: 'JAR',
      type: isSynth ? 'SYNTHESIS' : 'STORAGE',
      capacity: 4,
      contents: [],
      isIdentified: false,
    };
  } else {
    return {
      id, x, y,
      name: '宝石',
      emoji: '💎',
      category: 'MONEY',
      amount: 150 + floorNumber * 50,
      isIdentified: true,
    };
  }
}
