import React, { useState, useEffect } from 'react';
import { generateDungeonFloor, MAP_SIZE } from './game/dungeonGenerator';
import { sounds } from './utils/soundEngine';
import { generateBossData, generateNpcDialogue } from './utils/geminiApi';

import { DungeonCanvas } from './components/DungeonCanvas';
import { TornekoHUD } from './components/TornekoHUD';
import { TornekoLog } from './components/TornekoLog';
import { MiniMap } from './components/MiniMap';
import { VirtualPad } from './components/VirtualPad';
import { InventoryModal } from './components/InventoryModal';
import { TitleModal } from './components/TitleModal';

const SAVE_KEY = 'pien_roguelike_save_v1';

function calcHandScore(hand) {
  let score = 0;
  let aces = 0;
  hand.forEach((card) => {
    if (card.val === 1) {
      aces += 1;
      score += 11;
    } else if (card.val >= 10) {
      score += 10;
    } else {
      score += card.val;
    }
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

function getRandomCard() {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const val = vals[Math.floor(Math.random() * vals.length)];
  const label = val === 1 ? 'A' : val === 11 ? 'J' : val === 12 ? 'Q' : val === 13 ? 'K' : `${val}`;
  return { suit, val, label };
}

const ROULETTE_ITEMS = ['👑', '💎', '💰', '🍞', '💣', '⭐', '💎', '💣'];

export default function App() {
  // Modal State Management
  const [activeModal, setActiveModal] = useState('TITLE'); // 'TITLE', 'INVENTORY', 'NPC_DIALOGUE', 'BOSS_ANN', 'GAME_OVER', 'VICTORY', 'RENAME_PET', 'BLACKJACK', 'ROULETTE'

  // Game Engine State
  const [gameState, setGameState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [floorAnnounce, setFloorAnnounce] = useState(null);
  const [npcSpeech, setNpcSpeech] = useState(null);
  const [bossInfo, setBossInfo] = useState(null);
  const [newPetName, setNewPetName] = useState('');

  // BlackJack State
  const [bjPlayerHand, setBjPlayerHand] = useState([]);
  const [bjDealerHand, setBjDealerHand] = useState([]);
  const [bjStatus, setBjStatus] = useState('BET');
  const [bjResultMsg, setBjResultMsg] = useState('');

  // Timing Roulette State (Skill-Based Gambler Game)
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const [rouletteResultMsg, setRouletteResultMsg] = useState('');

  // Equipments
  const [equippedWeapon, setEquippedWeapon] = useState(null);
  const [equippedShield, setEquippedShield] = useState(null);

  const hasNightVision =
    equippedWeapon?.enchantments?.includes('暗視') ||
    equippedShield?.enchantments?.includes('暗視');

  const addLog = (text) => {
    setLogs((prev) => [...prev, text]);
  };

  const handleStartGame = (config) => {
    const { playerName, jobClass } = config;
    const initialFloor = 1;
    const dungeon = generateDungeonFloor(initialFloor);

    const initWep = jobClass.initialItems.find((i) => i.type === 'WEAPON') || null;
    const initShd = jobClass.initialItems.find((i) => i.type === 'SHIELD') || null;
    setEquippedWeapon(initWep);
    setEquippedShield(initShd);

    const atk = jobClass.atk + (initWep?.atkBonus || 0);
    const def = jobClass.def + (initShd?.defBonus || 0);

    const newGameState = {
      playerName,
      className: jobClass.name,
      floor: initialFloor,
      gold: jobClass.initialItems.find((i) => i.category === 'MONEY')?.amount || 150,
      player: {
        x: dungeon.playerSpawn.x,
        y: dungeon.playerSpawn.y,
        name: playerName,
        emoji: jobClass.emoji,
        hp: jobClass.hp,
        maxHp: jobClass.maxHp,
        atk,
        def,
        level: 1,
        exp: 0,
        food: 100,
        facing: { x: 0, y: 1 },
      },
      companion: {
        id: 'pet_dog',
        name: 'ポチ',
        emoji: '🐶',
        x: dungeon.playerSpawn.x - 1,
        y: dungeon.playerSpawn.y,
        hp: 30,
        maxHp: 30,
        atk: 8,
        def: 3,
        level: 1,
        exp: 0,
        inventory: [
          { id: 'pet_init_herb', name: '薬草', emoji: '🌿', category: 'CONSUMABLE', type: 'HERB', heal: 25 },
        ],
        equippedWeapon: null,
        equippedShield: null,
      },
      inventory: jobClass.initialItems,
      grid: dungeon.grid,
      wallData: dungeon.wallData,
      visitedGrid: dungeon.visitedGrid,
      visibleGrid: dungeon.visibleGrid,
      items: dungeon.items,
      npcs: dungeon.npcs,
      enemies: dungeon.enemies,
      stairsPos: dungeon.stairsPos,
    };

    updateFOV(newGameState);

    setGameState(newGameState);
    setActiveModal(null);
    setLogs([`🏰 ${playerName} は 🥺の不思議な迷宮 に挑んだ！`]);
    triggerFloorAnnounce(1);
    sounds.playSelect();
  };

  const triggerFloorAnnounce = (floorNum) => {
    setFloorAnnounce(`地下 ${floorNum} 階`);
    sounds.playFloorDown();
    setTimeout(() => {
      setFloorAnnounce(null);
    }, 2000);
  };

  const updateFOV = (state) => {
    const { grid, player, visitedGrid, visibleGrid } = state;
    const px = player.x;
    const py = player.y;

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        visibleGrid[y][x] = false;
      }
    }

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
          visibleGrid[ny][nx] = true;
          visitedGrid[ny][nx] = true;
        }
      }
    }
  };

  const processTurn = (playerAction) => {
    if (!gameState || activeModal) return;

    let state = { ...gameState };
    let { player, companion, enemies, npcs, items, grid, wallData, stairsPos } = state;
    let turnActionTaken = false;

    if (playerAction.type === 'MOVE') {
      const targetX = player.x + playerAction.dir.x;
      const targetY = player.y + playerAction.dir.y;
      player.facing = playerAction.dir;

      if (targetX >= 0 && targetX < MAP_SIZE && targetY >= 0 && targetY < MAP_SIZE) {
        const targetTile = grid[targetY][targetX];

        const enemyHere = enemies.find((e) => e.x === targetX && e.y === targetY);
        if (enemyHere) {
          executePlayerAttack(state, enemyHere);
          turnActionTaken = true;
        } else if (targetTile === 'W') {
          executeWallMining(state, targetX, targetY);
          turnActionTaken = true;
        } else if (targetTile === 'F') {
          const npcHere = npcs.find((n) => n.x === targetX && n.y === targetY);
          if (npcHere) {
            triggerNpcDialogue(npcHere);
          } else {
            if (!companion || companion.x !== targetX || companion.y !== targetY) {
              player.x = targetX;
              player.y = targetY;
              turnActionTaken = true;

              const itemIdx = items.findIndex((i) => i.x === targetX && i.y === targetY);
              if (itemIdx >= 0) {
                const pickedItem = items[itemIdx];
                items.splice(itemIdx, 1);
                state.inventory.push(pickedItem);
                addLog(`✨ ${pickedItem.emoji} ${pickedItem.name} を手に入れた！`);
                sounds.playHeal();
              }

              if (targetX === stairsPos.x && targetY === stairsPos.y) {
                advanceToNextFloor(state);
                return;
              }
            }
          }
        }
      }
    } else if (playerAction.type === 'ATTACK_MINE') {
      const targetX = player.x + player.facing.x;
      const targetY = player.y + player.facing.y;

      const enemyHere = enemies.find((e) => e.x === targetX && e.y === targetY);
      if (enemyHere) {
        executePlayerAttack(state, enemyHere);
        turnActionTaken = true;
      } else if (grid[targetY]?.[targetX] === 'W') {
        executeWallMining(state, targetX, targetY);
        turnActionTaken = true;
      }
    } else if (playerAction.type === 'WAIT') {
      if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + 1);
      if (companion && companion.hp < companion.maxHp) {
        companion.hp = Math.min(companion.maxHp, companion.hp + 1);
      }
      turnActionTaken = true;
    }

    if (!turnActionTaken) return;

    player.food = Math.max(0, player.food - 1);
    if (player.food === 0) {
      player.hp -= 2;
      addLog('⚠️ お腹が空きすぎてダメージを受けた！');
      sounds.playHit();
      if (player.hp <= 0) {
        handleGameOver('餓死してしまった…');
        return;
      }
    }

    if (companion && companion.hp > 0) {
      processCompanionAI(state);
    }

    processEnemiesAI(state);

    updateFOV(state);

    setGameState({ ...state });
  };

  const executePlayerAttack = (state, enemy) => {
    const { player, companion } = state;
    const dmg = Math.max(1, player.atk - enemy.def + Math.floor(Math.random() * 3));
    enemy.hp -= dmg;
    addLog(`⚔️ ${player.name} は ${enemy.emoji} ${enemy.name} に ${dmg} ダメージを与えた！`);
    sounds.playAttack();

    if (enemy.hp <= 0) {
      addLog(`💀 ${enemy.emoji} ${enemy.name} を倒した！ (Exp +${enemy.exp})`);
      player.exp += enemy.exp;
      state.enemies = state.enemies.filter((e) => e.id !== enemy.id);

      if (enemy.isBoss && state.floor >= 10) {
        setActiveModal('VICTORY');
        sounds.playFanfare();
        return;
      }

      if (companion) {
        companion.exp += Math.floor(enemy.exp * 0.5);
        if (companion.exp >= companion.level * 25) {
          companion.level += 1;
          companion.maxHp += 8;
          companion.hp = companion.maxHp;
          companion.atk += 3;
          companion.def += 2;
          addLog(`✨ ${companion.emoji} ${companion.name} は Lv.${companion.level} にレベルアップした！`);
          sounds.playLevelUp();
        }
      }
    }
  };

  const executeWallMining = (state, x, y) => {
    const { wallData, grid, items } = state;
    const wall = wallData[y]?.[x];
    if (!wall) return;

    const dmg = Math.max(5, state.player.atk * 2);
    wall.hp -= dmg;
    addLog(`⛏️ ${wall.name} を採掘した！ (耐久: ${Math.max(0, wall.hp)}/${wall.maxHp})`);
    sounds.playMine();

    if (wall.hp <= 0) {
      grid[y][x] = 'F';
      wallData[y][x] = null;
      addLog(`💥 ${wall.name} が崩壊して通路になった！`);
      sounds.playMineBreak();

      if (Math.random() < wall.dropChance) {
        const isFood = wall.dropType === 'FOOD';
        items.push({
          id: `drop_${Date.now()}`,
          x,
          y,
          name: isFood ? 'パン' : '鉱石の結晶',
          emoji: isFood ? '🍞' : '💎',
          category: isFood ? 'CONSUMABLE' : 'MONEY',
          type: isFood ? 'FOOD' : 'MONEY',
          amount: 100,
          foodRestore: 40,
        });
      }
    }
  };

  const processCompanionAI = (state) => {
    const { companion, enemies, player, grid, items } = state;
    if (!companion) return;

    if (companion.hp <= companion.maxHp * 0.5) {
      const healItemIdx = companion.inventory.findIndex(
        (i) => i.type === 'HERB' || i.type === 'POTION' || i.type === 'FOOD' || i.foodRestore > 0
      );
      if (healItemIdx >= 0) {
        const item = companion.inventory[healItemIdx];
        companion.inventory.splice(healItemIdx, 1);
        const healAmt = item.heal || 30;
        companion.hp = Math.min(companion.maxHp, companion.hp + healAmt);
        addLog(`🧪 🐾 ${companion.name} は自律判断で ${item.name} を使って HP を ${healAmt} 回復した！`);
        sounds.playHeal();
        return;
      }
    }

    companion.inventory.forEach((item) => {
      if (item.type === 'WEAPON') {
        if (!companion.equippedWeapon || item.atkBonus > companion.equippedWeapon.atkBonus) {
          if (companion.equippedWeapon) {
            companion.atk -= companion.equippedWeapon.atkBonus;
          }
          companion.equippedWeapon = item;
          companion.atk += item.atkBonus;
          addLog(`✨ 🐾 ${companion.name} は ${item.emoji} ${item.name} を自律装備した！ (攻撃力+${item.atkBonus})`);
          sounds.playSelect();
        }
      } else if (item.type === 'SHIELD') {
        if (!companion.equippedShield || item.defBonus > companion.equippedShield.defBonus) {
          if (companion.equippedShield) {
            companion.def -= companion.equippedShield.defBonus;
          }
          companion.equippedShield = item;
          companion.def += item.defBonus;
          addLog(`✨ 🐾 ${companion.name} は ${item.emoji} ${item.name} を自律装備した！ (防御力+${item.defBonus})`);
          sounds.playSelect();
        }
      }
    });

    const floorItemIdx = items.findIndex((i) => i.x === companion.x && i.y === companion.y);
    if (floorItemIdx >= 0) {
      const pickedItem = items[floorItemIdx];
      items.splice(floorItemIdx, 1);
      companion.inventory.push(pickedItem);
      addLog(`✨ 🐾 ${companion.name} は落ちていた ${pickedItem.emoji} ${pickedItem.name} を自律回収した！`);
      sounds.playHeal();
    }

    let nearestEnemy = null;
    let minDist = 999;
    enemies.forEach((e) => {
      const dist = Math.abs(e.x - companion.x) + Math.abs(e.y - companion.y);
      if (dist < minDist && dist <= 6) {
        minDist = dist;
        nearestEnemy = e;
      }
    });

    if (nearestEnemy) {
      if (minDist <= 1) {
        const dmg = Math.max(1, companion.atk - nearestEnemy.def);
        nearestEnemy.hp -= dmg;
        addLog(`🐾 ${companion.name} の攻撃！ ${nearestEnemy.emoji} ${nearestEnemy.name} に ${dmg} ダメージ！`);
        sounds.playAttack();

        if (nearestEnemy.hp <= 0) {
          state.enemies = state.enemies.filter((e) => e.id !== nearestEnemy.id);
          addLog(`💥 ${companion.name} は ${nearestEnemy.name} を倒した！`);
        }
      } else {
        const dx = Math.sign(nearestEnemy.x - companion.x);
        const dy = Math.sign(nearestEnemy.y - companion.y);

        const nextX = companion.x + dx;
        const nextY = companion.y + dy;

        const isEnemyOnNext = enemies.some((e) => e.x === nextX && e.y === nextY);
        const isPlayerOnNext = player.x === nextX && player.y === nextY;

        if (grid[nextY]?.[nextX] === 'F' && !isEnemyOnNext && !isPlayerOnNext) {
          companion.x = nextX;
          companion.y = nextY;
        }
      }
    } else {
      const distToPlayer = Math.abs(player.x - companion.x) + Math.abs(player.y - companion.y);
      if (distToPlayer > 2) {
        const dx = Math.sign(player.x - companion.x);
        const dy = Math.sign(player.y - companion.y);

        const nextX = companion.x + dx;
        const nextY = companion.y + dy;

        const isPlayerOnNext = player.x === nextX && player.y === nextY;
        if (grid[nextY]?.[nextX] === 'F' && !isPlayerOnNext) {
          companion.x = nextX;
          companion.y = nextY;
        }
      }
    }
  };

  const processEnemiesAI = (state) => {
    const { enemies, player, companion, grid } = state;

    enemies.forEach((enemy) => {
      const distPlayer = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
      const distComp = companion ? Math.abs(companion.x - enemy.x) + Math.abs(companion.y - enemy.y) : 999;

      const target = distComp < distPlayer && companion ? companion : player;
      const targetDist = Math.min(distPlayer, distComp);

      if (targetDist <= 1) {
        const dmg = Math.max(1, enemy.atk - target.def);
        target.hp -= dmg;
        addLog(`💥 ${enemy.emoji} ${enemy.name} の攻撃！ ${target.name} に ${dmg} ダメージ！`);
        sounds.playHit();

        if (target === player && player.hp <= 0) {
          handleGameOver(`${enemy.name} に倒された…`);
        } else if (target === companion && companion.hp <= 0) {
          addLog(`💀 ${companion.name} は ${enemy.name} に倒されてしまった！`);
          state.companion = null;
        }
      } else if (targetDist <= 5) {
        const dx = Math.sign(target.x - enemy.x);
        const dy = Math.sign(target.y - enemy.y);

        const nextX = enemy.x + dx;
        const nextY = enemy.y + dy;

        const isOccupied =
          (player.x === nextX && player.y === nextY) ||
          (companion && companion.x === nextX && companion.y === nextY) ||
          enemies.some((other) => other.id !== enemy.id && other.x === nextX && other.y === nextY);

        if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
          enemy.x = nextX;
          enemy.y = nextY;
        }
      }
    });
  };

  const advanceToNextFloor = async (state) => {
    const nextFloor = state.floor + 1;
    const dungeon = generateDungeonFloor(nextFloor);

    state.floor = nextFloor;
    state.grid = dungeon.grid;
    state.wallData = dungeon.wallData;
    state.visitedGrid = dungeon.visitedGrid;
    state.visibleGrid = dungeon.visibleGrid;
    state.items = dungeon.items;
    state.npcs = dungeon.npcs;
    state.enemies = dungeon.enemies;
    state.stairsPos = dungeon.stairsPos;
    state.player.x = dungeon.playerSpawn.x;
    state.player.y = dungeon.playerSpawn.y;
    if (state.companion) {
      state.companion.x = dungeon.playerSpawn.x - 1;
      state.companion.y = dungeon.playerSpawn.y;
    }

    if (nextFloor === 5 || nextFloor === 10) {
      const boss = await generateBossData(nextFloor);
      setBossInfo(boss);
      state.enemies.push({
        id: `boss_${nextFloor}`,
        name: boss.name,
        emoji: boss.emoji,
        x: dungeon.stairsPos.x - 1,
        y: dungeon.stairsPos.y,
        hp: boss.hp,
        maxHp: boss.hp,
        atk: boss.atk,
        def: boss.def,
        exp: 200,
        isBoss: true,
      });
      setActiveModal('BOSS_ANN');
    }

    updateFOV(state);
    setGameState({ ...state });
    triggerFloorAnnounce(nextFloor);
    addLog(`🪜 階層を降りて ${nextFloor}F に進んだ！`);
  };

  const triggerNpcDialogue = async (npc) => {
    sounds.playSelect();
    const speechText = await generateNpcDialogue(npc.emoji, npc.name, gameState);
    setNpcSpeech({ npc, text: speechText });
    setActiveModal('NPC_DIALOGUE');
  };

  const handleUseItem = (item) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player, companion, inventory, enemies } = state;

    if (item.type === 'TAME') {
      const frontX = player.x + player.facing.x;
      const frontY = player.y + player.facing.y;
      const targetEnemy = enemies.find((e) => e.x === frontX && e.y === frontY);

      if (targetEnemy) {
        addLog(`💖 ${item.name} を ${targetEnemy.emoji} ${targetEnemy.name} に投げ与えた！`);
        sounds.playMagic();
        state.enemies = enemies.filter((e) => e.id !== targetEnemy.id);
        state.companion = {
          id: `pet_${Date.now()}`,
          name: targetEnemy.name,
          emoji: targetEnemy.emoji,
          x: targetEnemy.x,
          y: targetEnemy.y,
          hp: targetEnemy.maxHp,
          maxHp: targetEnemy.maxHp,
          atk: targetEnemy.atk,
          def: targetEnemy.def,
          level: 1,
          exp: 0,
          inventory: [],
          equippedWeapon: null,
          equippedShield: null,
        };
        addLog(`✨ ${targetEnemy.emoji} ${targetEnemy.name} が心を開き、新しい仲間ペットになった！`);
        sounds.playFanfare();
      } else {
        addLog('⚠️ 正面にテイムできる魔物がいません！');
      }
    } else if (item.type === 'FOOD' || item.foodRestore > 0 || item.name.includes('パン')) {
      const restoreAmount = item.foodRestore || 40;
      player.food = Math.min(100, player.food + restoreAmount);
      addLog(`🍞 ${item.name} を食べて満腹度が ${restoreAmount} 回復した！ (満腹度: ${player.food}/100)`);
      sounds.playHeal();
    } else if (item.type === 'HERB' || item.type === 'POTION') {
      const healAmount = item.heal || 30;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      if (companion) {
        companion.hp = Math.min(companion.maxHp, companion.hp + healAmount);
        addLog(`🌿 薬草を使い、${player.name} と ${companion.name} の HP が ${healAmount} 回復した！`);
      } else {
        addLog(`🌿 薬草を使って HP が ${healAmount} 回復した！`);
      }
      sounds.playHeal();
    } else if (item.category === 'SPELLBOOK') {
      const enemyNear = state.enemies[0];
      if (enemyNear) {
        enemyNear.hp -= 30;
        addLog(`✨ 魔法の発動！ ${enemyNear.name} に 30 ダメージ！`);
        sounds.playMagic();
      }
    }

    state.inventory = inventory.filter((i) => i.id !== item.id);
    setGameState(state);
  };

  const handleSellItemToShop = (item) => {
    if (!gameState) return;
    const state = { ...gameState };
    if (item.id === equippedWeapon?.id || item.id === equippedShield?.id) {
      addLog('⚠️ 装備中のアイテムは売却できません！');
      return;
    }

    let price = 30;
    if (item.category === 'MONEY') price = item.amount || 100;
    else if (item.category === 'EQUIPMENT') price = 80;
    else if (item.category === 'JAR') price = 60;
    else if (item.category === 'SPELLBOOK') price = 50;

    state.gold += price;
    state.inventory = state.inventory.filter((i) => i.id !== item.id);
    addLog(`💰 ${item.emoji} ${item.name} を道具屋に売却し、${price}G を手に入れた！`);
    sounds.playHeal();
    setGameState(state);
  };

  const handleUpgradeEquipmentAtSmith = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 100) {
      addLog('⚠️ ゴールドが足りません！ (鍛錬費: 100G)');
      return;
    }
    if (!equippedWeapon && !equippedShield) {
      addLog('⚠️ 強化する装備品を装着していません！');
      return;
    }

    state.gold -= 100;
    if (equippedWeapon) {
      equippedWeapon.atkBonus += 3;
      if (!equippedWeapon.enchantments.includes('採掘強化')) {
        equippedWeapon.enchantments.push('採掘強化');
      }
      addLog(`🔨 鍛冶屋が ${equippedWeapon.name} を鍛え上げた！ (攻撃力+3 & 【採掘強化】刻印)`);
    }
    if (equippedShield) {
      equippedShield.defBonus += 2;
      addLog(`🔨 鍛冶屋が ${equippedShield.name} を補強した！ (防御力+2)`);
    }
    sounds.playMine();
    setGameState(state);
    setActiveModal(null);
  };

  const handleStartRoulette = () => {
    if (!gameState) return;
    if (gameState.gold < 100) {
      addLog('⚠️ ゴールドが足りません！ (掛け金: 100G)');
      return;
    }
    const state = { ...gameState };
    state.gold -= 100;
    setGameState(state);

    setRouletteIndex(0);
    setRouletteResultMsg('');
    setActiveModal('ROULETTE');
    sounds.playSelect();
  };

  useEffect(() => {
    let intervalId;
    if (activeModal === 'ROULETTE' && !rouletteResultMsg) {
      intervalId = setInterval(() => {
        setRouletteIndex((prev) => (prev + 1) % ROULETTE_ITEMS.length);
      }, 70);
    }
    return () => clearInterval(intervalId);
  }, [activeModal, rouletteResultMsg]);

  const handleStopRoulette = () => {
    if (rouletteResultMsg) return;

    const hitItem = ROULETTE_ITEMS[rouletteIndex];
    const state = { ...gameState };

    if (hitItem === '👑' || hitItem === '💎') {
      const winGold = 300;
      state.gold += winGold;
      setRouletteResultMsg(`🌟 JACKPOT!! ${hitItem} を目押し成功！ ${winGold}G 獲得！`);
      sounds.playFanfare();
      addLog(`🎰 ギャンブラーの目押し勝負【JACKPOT】！ ${winGold}G 獲得！`);
    } else if (hitItem === '💰' || hitItem === '⭐') {
      const winGold = 180;
      state.gold += winGold;
      setRouletteResultMsg(`✨ WIN! ${hitItem} 目押し成功！ ${winGold}G 獲得！`);
      sounds.playHeal();
      addLog(`🎰 ギャンブラーの目押し勝負【勝利】！ ${winGold}G 獲得！`);
    } else if (hitItem === '🍞') {
      state.gold += 100;
      setRouletteResultMsg('🍞 パン！ 引き分け (掛け金返金)');
      sounds.playSelect();
      addLog('🎰 ギャンブラーの目押し勝負【引き分け】');
    } else {
      setRouletteResultMsg('💥 BOMB!! 💣 で目押し失敗！ 100G没収');
      sounds.playHit();
      addLog('🎰 ギャンブラーの目押し勝負【敗北】 💣 で没収…');
    }

    setGameState(state);
  };

  const handleIdentifyAllAtWizard = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 50) {
      addLog('⚠️ ゴールドが足りません！ (鑑定料: 50G)');
      return;
    }

    state.gold -= 50;
    let identifiedCount = 0;
    state.inventory.forEach((item) => {
      if (!item.isIdentified) {
        item.isIdentified = true;
        identifiedCount++;
      }
    });
    addLog(`🔮 鑑定士が手持ちの ${identifiedCount} 個の未識別アイテムを鑑定した！`);
    sounds.playMagic();
    setGameState(state);
    setActiveModal(null);
  };

  const handleBuyShopItem = (itemType) => {
    if (!gameState) return;
    const state = { ...gameState };

    const shopCatalog = {
      HERB: { name: '薬草', emoji: '🌿', cost: 40, category: 'CONSUMABLE', type: 'HERB', heal: 35 },
      BREAD: { name: '高級パン', emoji: '🍞', cost: 35, category: 'CONSUMABLE', type: 'FOOD', foodRestore: 60 },
      SWORD: { name: '鋼鉄の剣', emoji: '⚔️', cost: 120, category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 6, enchantments: ['会心'] },
      JAR: { name: '合成の壺', emoji: '🏺', cost: 150, category: 'JAR', type: 'SYNTHESIS', capacity: 4, contents: [] },
    };

    const item = shopCatalog[itemType];
    if (!item) return;

    if (state.gold < item.cost) {
      addLog(`⚠️ ゴールドが足りません！ (${item.name}: ${item.cost}G)`);
      return;
    }

    state.gold -= item.cost;
    state.inventory.push({ ...item, id: `bought_${Date.now()}` });
    addLog(`💰 ${item.cost}G で ${item.emoji} ${item.name} を購入した！`);
    sounds.playHeal();
    setGameState(state);
    setActiveModal(null);
  };

  const handleFortuneTell = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 80) {
      addLog('⚠️ ゴールドが足りません！ (占い料: 80G)');
      return;
    }

    state.gold -= 80;
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        state.visibleGrid[y][x] = true;
        state.visitedGrid[y][x] = true;
      }
    }
    addLog('✨ 占い師の千里眼により、現在の階層の全マップと魔物の位置が開示された！');
    sounds.playMagic();
    setGameState(state);
    setActiveModal(null);
  };

  const handleStartBlackjack = () => {
    if (!gameState) return;
    if (gameState.gold < 100) {
      addLog('⚠️ ゴールドが足りません！ (掛け金: 100G)');
      return;
    }

    const state = { ...gameState };
    state.gold -= 100;
    setGameState(state);

    const c1 = getRandomCard();
    const c2 = getRandomCard();
    const d1 = getRandomCard();
    const d2 = getRandomCard();

    setBjPlayerHand([c1, c2]);
    setBjDealerHand([d1, d2]);
    setBjStatus('PLAYING');
    setBjResultMsg('');
    setActiveModal('BLACKJACK');
    sounds.playSelect();
  };

  const handleBjHit = () => {
    if (bjStatus !== 'PLAYING') return;
    const newCard = getRandomCard();
    const newHand = [...bjPlayerHand, newCard];
    setBjPlayerHand(newHand);
    sounds.playSelect();

    const pScore = calcHandScore(newHand);
    if (pScore > 21) {
      setBjStatus('FINISHED');
      setBjResultMsg('💥 バースト！ 21を超えたためあなたの負けです…');
      sounds.playHit();
      addLog('🎲 ギャンブラーとのブラックジャックに敗北… (100G没収)');
    }
  };

  const handleBjStand = () => {
    if (bjStatus !== 'PLAYING') return;
    let dHand = [...bjDealerHand];
    let dScore = calcHandScore(dHand);

    while (dScore < 17) {
      dHand.push(getRandomCard());
      dScore = calcHandScore(dHand);
    }
    setBjDealerHand(dHand);

    const pScore = calcHandScore(bjPlayerHand);
    setBjStatus('FINISHED');

    const state = { ...gameState };

    if (dScore > 21 || pScore > dScore) {
      const isBlackjack = pScore === 21 && bjPlayerHand.length === 2;
      const winRatio = isBlackjack ? 2.5 : 2.0;
      const winGold = Math.floor(100 * winRatio);
      state.gold += winGold;
      setGameState(state);

      if (isBlackjack) {
        setBjResultMsg(`🏆 BLACKJACK!! 大勝利！ ${winGold}G 獲得！`);
      } else {
        setBjResultMsg(`🎉 勝利！ ギャンブラーを打ち負かして ${winGold}G 獲得！`);
      }
      sounds.playFanfare();
      addLog(`🎲 ギャンブル勝利！ ${winGold}G を手に入れた！`);
    } else if (pScore === dScore) {
      state.gold += 100;
      setGameState(state);
      setBjResultMsg('⚖️ 引き分け (Push)！ 掛け金100Gが戻りました。');
      sounds.playSelect();
      addLog('🎲 ギャンブルは引き分け！ 掛け金が戻った。');
    } else {
      setBjResultMsg('💸 敗北… ギャンブラーに負けました。');
      sounds.playHit();
      addLog('🎲 ギャンブルに敗北… 掛け金100Gは没収された。');
    }
  };

  const handleBuyPetFromNpc = (petType) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player } = state;

    const petTemplates = {
      WOLF: { name: 'ウルフ', emoji: '🐺', cost: 120, hp: 40, atk: 12, def: 4 },
      CAT: { name: 'キャット', emoji: '🐈', cost: 80, hp: 30, atk: 9, def: 3 },
      DRAGON: { name: 'ベビードラゴン', emoji: '🐉', cost: 250, hp: 80, atk: 20, def: 8 },
    };

    const tpl = petTemplates[petType];
    if (!tpl) return;

    if (state.gold < tpl.cost) {
      addLog(`⚠️ ゴールドが足りません！ (${tpl.name}: ${tpl.cost}G)`);
      return;
    }

    state.gold -= tpl.cost;
    state.companion = {
      id: `pet_bought_${Date.now()}`,
      name: tpl.name,
      emoji: tpl.emoji,
      x: player.x - 1,
      y: player.y,
      hp: tpl.hp,
      maxHp: tpl.hp,
      atk: tpl.atk,
      def: tpl.def,
      level: 1,
      exp: 0,
      inventory: [],
      equippedWeapon: null,
      equippedShield: null,
    };
    addLog(`✨ ${tpl.cost}G を支払って ${tpl.emoji} ${tpl.name} を新しい仲間ペットに雇った！`);
    sounds.playFanfare();
    setGameState(state);
    setActiveModal(null);
  };

  const handleHealPetAtNpc = () => {
    if (!gameState || !gameState.companion) return;
    const state = { ...gameState };
    const { companion, gold } = state;

    if (gold < 50) {
      addLog('⚠️ ゴールドが足りません！ (治療費: 50G)');
      return;
    }

    state.gold -= 50;
    companion.hp = companion.maxHp;
    addLog(`✨ 50G を支払って ${companion.name} の傷を治療してもらった！ (HP全回復)`);
    sounds.playHeal();
    setGameState(state);
    setActiveModal(null);
  };

  const handleRenamePet = () => {
    if (!gameState || !gameState.companion) return;
    const state = { ...gameState };
    const name = newPetName.trim() || state.companion.name;
    state.companion.name = name;
    addLog(`🏷️ 仲間ペットの名前を 【${name}】 に変更した！`);
    sounds.playSelect();
    setGameState(state);
    setActiveModal(null);
  };

  const handleEquipItem = (item) => {
    if (item.type === 'WEAPON') {
      setEquippedWeapon(equippedWeapon?.id === item.id ? null : item);
    } else if (item.type === 'SHIELD') {
      setEquippedShield(equippedShield?.id === item.id ? null : item);
    }
    sounds.playSelect();
  };

  const handleSynthesize = (jar, targetEquipment) => {
    if (!equippedWeapon) return;
    addLog(`🏺 ${targetEquipment.name} を合成の壺に溶かし、${equippedWeapon.name} に能力を統合した！`);
    equippedWeapon.atkBonus += 2;
    sounds.playMagic();
  };

  const handleGameOver = (reason) => {
    setActiveModal('GAME_OVER');
    addLog(`💀 【GAME OVER】 ${reason}`);
    localStorage.removeItem(SAVE_KEY);
    sounds.playHit();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeModal) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        processTurn({ type: 'MOVE', dir: { x: 0, y: -1 } });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        processTurn({ type: 'MOVE', dir: { x: 0, y: 1 } });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        processTurn({ type: 'MOVE', dir: { x: -1, y: 0 } });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        processTurn({ type: 'MOVE', dir: { x: 1, y: 0 } });
      } else if (e.key === ' ') {
        processTurn({ type: 'ATTACK_MINE' });
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveModal('INVENTORY');
      } else if (e.key === 'n' || e.key === 'N') {
        if (gameState?.companion) {
          setNewPetName(gameState.companion.name);
          setActiveModal('RENAME_PET');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal]);

  const pScore = calcHandScore(bjPlayerHand);
  const dScore = calcHandScore(bjDealerHand);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col font-retro select-none">
      {gameState && <TornekoHUD gameState={gameState} />}

      <div className="relative flex-1 w-full h-full">
        {gameState && <DungeonCanvas gameState={gameState} hasNightVision={hasNightVision} />}

        {floorAnnounce && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-black/90 border-4 border-yellow-400 px-8 py-4 rounded-xl text-3xl sm:text-4xl text-yellow-300 font-bold tracking-widest text-shadow-retro animate-pulse">
              {floorAnnounce}
            </div>
          </div>
        )}

        {gameState && <MiniMap gameState={gameState} hasNightVision={hasNightVision} />}

        {gameState && !activeModal && (
          <VirtualPad
            onDirection={(dir) => processTurn({ type: 'MOVE', dir })}
            onAction={(act) => {
              if (act === 'ATTACK_MINE') processTurn({ type: 'ATTACK_MINE' });
              if (act === 'INVENTORY') setActiveModal('INVENTORY');
              if (act === 'WAIT') processTurn({ type: 'WAIT' });
            }}
          />
        )}
      </div>

      {gameState && <TornekoLog logs={logs} />}

      {activeModal === 'TITLE' && <TitleModal onStartGame={handleStartGame} />}

      {activeModal === 'INVENTORY' && gameState && (
        <InventoryModal
          inventory={gameState.inventory}
          equippedWeapon={equippedWeapon}
          equippedShield={equippedShield}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          onSynthesize={handleSynthesize}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ALL 6 FRIENDLY NPC INTERACTIVE MODAL */}
      {activeModal === 'NPC_DIALOGUE' && npcSpeech && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-white rounded-xl p-5 max-w-md w-full text-white text-center font-retro shadow-2xl">
            <div className="text-4xl mb-2">{npcSpeech.npc.emoji}</div>
            <div className="text-yellow-400 font-bold mb-3">【{npcSpeech.npc.name}】</div>
            <p className="text-sm leading-relaxed mb-4 bg-black/60 p-3 rounded border border-gray-700">
              「{npcSpeech.text}」
            </p>

            <div className="flex flex-col space-y-2 text-xs">
              {/* 👷 鍛冶屋 (Smith) */}
              {npcSpeech.npc.emoji === '👷' && (
                <button
                  onClick={handleUpgradeEquipmentAtSmith}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded flex items-center justify-center space-x-1"
                >
                  <span>🔨 100G で装備を鍛錬・強化する (攻撃/防御UP & 採掘強化)</span>
                </button>
              )}

              {/* 🧙 鑑定士 (Identifier) */}
              {npcSpeech.npc.emoji === '🧙' && (
                <button
                  onClick={handleIdentifyAllAtWizard}
                  className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded flex items-center justify-center space-x-1"
                >
                  <span>🔮 50G で手持ちの未識別アイテムを全鑑定する</span>
                </button>
              )}

              {/* 👨 道具屋 (Shopkeeper) */}
              {npcSpeech.npc.emoji === '👨' && (
                <div className="border-t border-gray-700 pt-2 flex flex-col space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div className="text-yellow-300 font-bold text-[11px]">💰 道具を購入する:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => handleBuyShopItem('HERB')} className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex justify-between px-2 text-[10px]">
                      <span>🌿 薬草</span><span className="text-yellow-300">40G</span>
                    </button>
                    <button onClick={() => handleBuyShopItem('BREAD')} className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex justify-between px-2 text-[10px]">
                      <span>🍞 高級パン</span><span className="text-yellow-300">35G</span>
                    </button>
                    <button onClick={() => handleBuyShopItem('SWORD')} className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex justify-between px-2 text-[10px]">
                      <span>⚔️ 鋼鉄の剣</span><span className="text-yellow-300">120G</span>
                    </button>
                    <button onClick={() => handleBuyShopItem('JAR')} className="py-1.5 bg-gray-800 hover:bg-gray-700 rounded flex justify-between px-2 text-[10px]">
                      <span>🏺 合成の壺</span><span className="text-yellow-300">150G</span>
                    </button>
                  </div>

                  <div className="text-emerald-300 font-bold text-[11px] pt-2 border-t border-gray-800">
                    💎 手持ちアイテムを道具屋に売る (換金):
                  </div>
                  {gameState.inventory.length === 0 ? (
                    <div className="text-gray-500 text-[10px]">売却できるアイテムがありません</div>
                  ) : (
                    gameState.inventory.map((invItem) => {
                      let price = 30;
                      if (invItem.category === 'MONEY') price = invItem.amount || 100;
                      else if (invItem.category === 'EQUIPMENT') price = 80;
                      else if (invItem.category === 'JAR') price = 60;
                      else if (invItem.category === 'SPELLBOOK') price = 50;

                      return (
                        <button
                          key={invItem.id}
                          onClick={() => handleSellItemToShop(invItem)}
                          className="py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 rounded flex justify-between px-2 text-[10px]"
                        >
                          <span>{invItem.emoji} {invItem.name}</span>
                          <span className="text-yellow-300 font-bold">売却: +{price}G</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* 🧕 占い師 (Fortune Teller) */}
              {npcSpeech.npc.emoji === '🧕' && (
                <button
                  onClick={handleFortuneTell}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded flex items-center justify-center space-x-1"
                >
                  <span>✨ 80G で全マップと魔物の位置を占う (透視)</span>
                </button>
              )}

              {/* 🤵 ギャンブラー (Gambler) */}
              {npcSpeech.npc.emoji === '🤵' && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <div className="text-yellow-300 font-bold text-[11px]">🎰 カジノミニゲームを選択 (賭け金: 100G):</div>
                  <button
                    onClick={handleStartBlackjack}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>🃏 1. ブラックジャック 21 勝負 (カード戦略)</span>
                  </button>
                  <button
                    onClick={handleStartRoulette}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>⚡ 2. 高速目押しルーレット勝負 (反射神経・動神経)</span>
                  </button>
                </div>
              )}

              {/* 🧔 魔物使い (Tamer) */}
              {npcSpeech.npc.emoji === '🧔' && (
                <div className="border-t border-gray-700 pt-2 flex flex-col space-y-1.5">
                  <div className="text-yellow-300 font-bold text-[11px] mb-1">🐾 新しいペットを雇う:</div>
                  <button onClick={() => handleBuyPetFromNpc('WOLF')} className="py-1.5 bg-blue-900 hover:bg-blue-800 rounded flex justify-between px-3">
                    <span>🐺 オオカミ (バランス型)</span><span className="text-yellow-300">120G</span>
                  </button>
                  <button onClick={() => handleBuyPetFromNpc('CAT')} className="py-1.5 bg-purple-900 hover:bg-purple-800 rounded flex justify-between px-3">
                    <span>🐈 キャット (回避重視)</span><span className="text-yellow-300">80G</span>
                  </button>
                  <button onClick={() => handleBuyPetFromNpc('DRAGON')} className="py-1.5 bg-red-900 hover:bg-red-800 rounded flex justify-between px-3">
                    <span>🐉 ベビードラゴン (超強力)</span><span className="text-yellow-300">250G</span>
                  </button>
                </div>
              )}

              {gameState?.companion && gameState.companion.hp < gameState.companion.maxHp && (
                <button
                  onClick={handleHealPetAtNpc}
                  className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded flex items-center justify-center space-x-1"
                >
                  <span>💖 50G で {gameState.companion.name} を治療する</span>
                </button>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs mt-2"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤵 GAMBLER SKILL GAME: TIMING EMOJI ROULETTE MODAL */}
      {activeModal === 'ROULETTE' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-yellow-950 border-4 border-yellow-400 rounded-xl p-5 max-w-md w-full text-white font-retro shadow-2xl flex flex-col items-center">
            <div className="text-3xl mb-1">🎰 🤵 目押しルーレット勝負</div>
            <p className="text-xs text-yellow-200 mb-4 text-center">
              高速回転する絵文字を目で追い、👑 や 💎 のタイミングでストップボタンを押せ！
            </p>

            <div className="w-full bg-black h-20 rounded-lg border-4 border-yellow-400 flex items-center justify-center space-x-3 mb-6 overflow-hidden shadow-inner">
              <div className="text-4xl animate-bounce">
                {ROULETTE_ITEMS[rouletteIndex]}
              </div>
            </div>

            {rouletteResultMsg && (
              <div className="mb-4 text-xs font-bold text-center bg-black/80 p-2.5 rounded border border-yellow-400 text-yellow-300">
                {rouletteResultMsg}
              </div>
            )}

            <div className="flex space-x-3 w-full">
              {!rouletteResultMsg ? (
                <button
                  onClick={handleStopRoulette}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-base shadow-xl active:scale-95 transition-transform"
                >
                  🛑 STOP!! (目押し)
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs"
                >
                  カジノを去る
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAMBLER (🤵) BLACKJACK MINIGAME MODAL */}
      {activeModal === 'BLACKJACK' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-emerald-950 border-4 border-yellow-400 rounded-xl p-5 max-w-md w-full text-white font-retro shadow-2xl flex flex-col items-center">
            <div className="text-3xl mb-1">🎰 🤵 ギャンブラーのカジノ</div>
            <h3 className="text-yellow-300 font-bold text-sm mb-4">ブラックジャック 21 勝負 (賭け金: 100G)</h3>

            <div className="w-full bg-emerald-900/60 p-3 rounded-lg border border-emerald-700 mb-4 flex flex-col items-center">
              <div className="text-xs text-emerald-200 font-bold mb-1">
                🤵 ギャンブラーの手札 (合計: {bjStatus === 'PLAYING' ? '?' : dScore})
              </div>
              <div className="flex space-x-2">
                {bjDealerHand.map((c, i) => (
                  <div
                    key={i}
                    className="w-12 h-16 bg-white text-black rounded border-2 border-gray-400 flex flex-col items-center justify-center font-bold text-sm shadow-md"
                  >
                    {i === 1 && bjStatus === 'PLAYING' ? (
                      <span className="text-red-600 text-lg">❓</span>
                    ) : (
                      <>
                        <span className={c.suit === '♥️' || c.suit === '♦️' ? 'text-red-600' : 'text-black'}>
                          {c.suit}
                        </span>
                        <span>{c.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full bg-emerald-900/60 p-3 rounded-lg border border-emerald-700 mb-4 flex flex-col items-center">
              <div className="text-xs text-yellow-300 font-bold mb-1">
                🥺 {gameState?.playerName} の手札 (合計: {pScore})
              </div>
              <div className="flex space-x-2">
                {bjPlayerHand.map((c, i) => (
                  <div
                    key={i}
                    className="w-12 h-16 bg-white text-black rounded border-2 border-gray-400 flex flex-col items-center justify-center font-bold text-sm shadow-md"
                  >
                    <span className={c.suit === '♥️' || c.suit === '♦️' ? 'text-red-600' : 'text-black'}>
                      {c.suit}
                    </span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {bjResultMsg && (
              <div className="mb-4 text-xs font-bold text-center bg-black/70 p-2.5 rounded border border-yellow-500 text-yellow-200">
                {bjResultMsg}
              </div>
            )}

            <div className="flex space-x-3 w-full">
              {bjStatus === 'PLAYING' ? (
                <>
                  <button
                    onClick={handleBjHit}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow"
                  >
                    🃏 ヒット (もう1枚)
                  </button>
                  <button
                    onClick={handleBjStand}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow"
                  >
                    ✋ 勝負！ (スタンド)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs"
                >
                  カジノを去る
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'RENAME_PET' && gameState?.companion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-yellow-400 rounded-xl p-5 max-w-sm w-full text-white text-center font-retro shadow-2xl">
            <div className="text-4xl mb-2">{gameState.companion.emoji}</div>
            <h3 className="text-yellow-400 font-bold mb-3">仲間ペットの名前変更 (N)</h3>
            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="新しい名前を入力"
              className="w-full bg-gray-800 border-2 border-gray-600 rounded p-2 text-sm text-yellow-200 focus:border-yellow-400 focus:outline-none mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleRenamePet}
                className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs"
              >
                決定する
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded text-xs"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'BOSS_ANN' && bossInfo && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-red-950 border-4 border-red-500 rounded-xl p-6 max-w-lg w-full text-white text-center font-retro shadow-2xl animate-pulse">
            <div className="text-5xl mb-3">{bossInfo.emoji}</div>
            <div className="text-red-400 text-xs font-bold tracking-widest mb-1">【強敵出現】</div>
            <h2 className="text-2xl text-yellow-300 font-bold mb-3">{bossInfo.name}</h2>
            <p className="text-sm text-red-200 bg-black/70 p-3 rounded border border-red-800 mb-6 italic">
              「{bossInfo.quote}」
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm shadow-lg"
            >
              いざ勝負！
            </button>
          </div>
        </div>
      )}

      {activeModal === 'GAME_OVER' && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-red-600 rounded-xl p-6 max-w-md w-full text-white text-center font-retro">
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-3xl text-red-500 font-bold mb-4">GAME OVER</h2>
            <button
              onClick={() => setActiveModal('TITLE')}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg"
            >
              タイトルへ戻る
            </button>
          </div>
        </div>
      )}

      {activeModal === 'VICTORY' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-yellow-950 border-4 border-yellow-400 rounded-xl p-6 max-w-lg w-full text-white text-center font-retro shadow-2xl">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl text-yellow-300 font-bold mb-2">迷宮完全制覇！</h2>
            <p className="text-sm text-yellow-100 mb-6">
              伝説のアーティファクトを手に入れ、🥺の不思議な迷宮 を見事脱出した！
            </p>
            <button
              onClick={() => setActiveModal('TITLE')}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg"
            >
              タイトルへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
