import { MONSTER_TEMPLATES, FRIENDLY_NPCS, ENCHANTMENTS, WALL_TYPES } from './typesAndConstants';

export function getMapSizeForFloor(floorNumber) {
  if (floorNumber <= 3) return 16;
  if (floorNumber <= 6) return 20;
  if (floorNumber <= 9) return 24;
  return 28; // Deepest floors
}

export function generateDungeonFloor(floorNumber) {
  const mapSize = getMapSizeForFloor(floorNumber);

  // Initialize Empty Grids with Dynamic Map Size
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
  const maxRoomSize = floorNumber <= 3 ? 7 : floorNumber <= 6 ? 9 : 11;
  const targetRoomCount = floorNumber <= 3 ? 5 : floorNumber <= 6 ? 7 : 9;

  // Generate Rooms
  for (let i = 0; i < targetRoomCount * 4 && rooms.length < targetRoomCount; i++) {
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
  const itemCount = 5 + Math.floor(floorNumber * 1.2);
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
  const enemyCount = 3 + Math.floor(floorNumber * 1.8);
  const eligibleMonsters = MONSTER_TEMPLATES.filter(
    (m) => floorNumber >= m.minFloor && floorNumber <= m.maxFloor + 2
  );

  // MONSTER HOUSE GENERATION (25% Chance on Floor >= 2)
  let monsterHouseRoom = null;
  if (floorNumber >= 2 && Math.random() < 0.25 && rooms.length >= 3) {
    monsterHouseRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];

    const mhMonsterCount = 6 + Math.floor(floorNumber * 0.8);
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

    const mhItemCount = 5 + Math.floor(floorNumber * 0.5);
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
      name: isWep ? '鋼鉄の剣' : '木の盾',
      emoji: isWep ? '⚔️' : '🛡️',
      category: 'EQUIPMENT',
      type: isWep ? 'WEAPON' : 'SHIELD',
      atkBonus: isWep ? 5 : 0,
      defBonus: isWep ? 0 : 3,
      enchantments: enchant ? [enchant] : [],
      isIdentified: true,
    };
  } else if (rand < 0.88) {
    return {
      id, x, y,
      name: 'イオの書',
      emoji: '📜',
      category: 'SPELLBOOK',
      type: 'SPELLBOOK',
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
