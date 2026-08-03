import React, { useState, useEffect } from 'react';
import { generateDungeonFloor } from './game/dungeonGenerator';
import { sounds } from './utils/soundEngine';
import { generateBossData, generateNpcDialogue, generateArtifactByGemini } from './utils/geminiApi';

import { DungeonCanvas } from './components/DungeonCanvas';
import { TornekoHUD } from './components/TornekoHUD';
import { TornekoLog } from './components/TornekoLog';
import { MiniMap } from './components/MiniMap';
import { VirtualPad } from './components/VirtualPad';
import { InventoryModal } from './components/InventoryModal';
import { TitleModal } from './components/TitleModal';

const SAVE_KEY = 'pien_roguelike_save_v1';
// UNLIMITED PET COMPANIONS (No Limit Multi-Pet Army!)
const MAX_COMPANIONS = 99999;

// 10 Unique Human-Icon Friendly NPCs
export const FRIENDLY_NPCS = [
  { type: 'SHOP', name: '道具屋トネコ', emoji: '👨', role: 'アイテムの売買・日替わり限定品' },
  { type: 'SMITH', name: '鍛冶屋のガンテツ', emoji: '👷', role: '装備の鍛錬・強化 & 素材クラフト' },
  { type: 'IDENTIFIER', name: '鑑定士マロン', emoji: '🧙‍♂️', role: '未識別アイテムの一括全鑑定' },
  { type: 'TELLER', name: '占い師シルフィ', emoji: '🧕', role: 'マップ透視 & Gemini AI 神器降臨' },
  { type: 'GAMBLER', name: 'ギャンブラーのジャック', emoji: '🤵', role: '倍プッシュBJ & 高速目押しカジノ' },
  { type: 'TAMER', name: '魔物使いのガゼル', emoji: '👳‍♂️', role: 'ペット売買・治療 & 気絶NPC完全復活' },
  { type: 'ALCHEMIST', name: '錬金術師ゼノ', emoji: '👨‍🔬', role: '武具へ最高級エゴ属性（全知全能/吸血）確定注入' },
  { type: 'SCHOLAR', name: '魔法学者ルーン', emoji: '🧙‍♀️', role: '魔法書の使用回数充填 & 古代呪文伝授' },
  { type: 'DANCER', name: '踊り子リリィ', emoji: '💃', role: '熱狂ダンスで全員ATK・DEF・移動バフ' },
  { type: 'BODYGUARD', name: '用心棒タロ兵衛', emoji: '🥷', role: '頼もしい忍者用心棒としてパーティー同行契約' },
];

// Master Catalog for Dynamic Shop Inventory (with Ego + Material + Artifact Named Items)
const SHOP_MASTER_CATALOG = [
  { id: 'HERB', name: '薬草', emoji: '🌿', cost: 40, category: 'CONSUMABLE', type: 'HERB', heal: 35 },
  { id: 'BREAD', name: '高級パン', emoji: '🍞', cost: 35, category: 'CONSUMABLE', type: 'FOOD', foodRestore: 60 },
  { id: 'MEAT', name: '魔物の肉', emoji: '🥩', cost: 60, category: 'CONSUMABLE', type: 'FOOD', foodRestore: 80 },
  { id: 'POTION', name: '特効薬', emoji: '🧪', cost: 90, category: 'CONSUMABLE', type: 'POTION', heal: 70 },
  { id: 'IRON_ORE', name: '鉄鉱石', emoji: '🪨', cost: 50, category: 'MATERIAL', type: 'IRON_ORE', uses: 1 },
  { id: 'MANA_CRYSTAL', name: '魔法の結晶', emoji: '💎', cost: 80, category: 'MATERIAL', type: 'MANA_CRYSTAL', uses: 1 },
  { id: 'EGO_SWORD_1', name: '🔥 灼熱の 鋼鉄製 ⚔️ 剣', emoji: '⚔️', cost: 260, category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 11, defBonus: 0, enchantments: ['火属性'] },
  { id: 'EGO_SHIELD_1', name: '🌙 暗夜の ダイヤ製 🛡️ 盾', emoji: '🛡️', cost: 320, category: 'EQUIPMENT', type: 'SHIELD', atkBonus: 0, defBonus: 11, enchantments: ['暗視'] },
  { id: 'EGO_AXE_1', name: '⚡ 雷撃の オリハルコン製 🪓 大剣', emoji: '🪓', cost: 480, category: 'EQUIPMENT', type: 'WEAPON', atkBonus: 24, defBonus: 0, enchantments: ['会心'] },
  { id: 'EGO_ARMOR_1', name: '👑 伝説の 鉄製 🦺 鎧', emoji: '🦺', cost: 350, category: 'EQUIPMENT', type: 'SHIELD', atkBonus: 8, defBonus: 12, enchantments: ['全知全能'] },
  { id: 'IO_SCROLL', name: 'イオの書', emoji: '📜', cost: 160, category: 'SPELLBOOK', type: 'SPELLBOOK', uses: 4 },
  { id: 'TAME_BOOK', name: 'テイムの書', emoji: '📖', cost: 150, category: 'SPELLBOOK', type: 'TAME', uses: 3 },
  { id: 'SYNTHESIS_JAR', name: '合成の壺', emoji: '🏺', cost: 150, category: 'JAR', type: 'SYNTHESIS', capacity: 4, contents: [] },
  { id: 'ART_PHILOSOPHER', name: '👑 賢者の石', emoji: '👑', cost: 800, category: 'ARTIFACT', type: 'PHILOSOPHER_STONE', effect: '毎ターンHP自然回復 & 満腹度無限' },
];

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
  const [activeModal, setActiveModal] = useState('TITLE');

  // Game Engine State
  const [gameState, setGameState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [floorAnnounce, setFloorAnnounce] = useState(null);
  const [npcSpeech, setNpcSpeech] = useState(null);
  const [bossInfo, setBossInfo] = useState(null);
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);
  const [newPetName, setNewPetName] = useState('');
  const [mhTriggered, setMhTriggered] = useState(false);
  const [currentShopCatalog, setCurrentShopCatalog] = useState([]);
  const [selectedJar, setSelectedJar] = useState(null);

  // BlackJack State (Infinitely Scalable Double-Push Gamble)
  const [bjPlayerHand, setBjPlayerHand] = useState([]);
  const [bjDealerHand, setBjDealerHand] = useState([]);
  const [bjStatus, setBjStatus] = useState('BET');
  const [bjResultMsg, setBjResultMsg] = useState('');
  const [bjBetAmount, setBjBetAmount] = useState(100);
  const [bjStreakCount, setBjStreakCount] = useState(0);
  const [bjPotentialPayout, setBjPotentialPayout] = useState(200);

  // Timing Roulette State
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

    const initialCompanion = {
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
    };

    const newGameState = {
      playerName,
      className: jobClass.name,
      floor: initialFloor,
      mapSize: dungeon.mapSize,
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
      companions: [initialCompanion],
      inventory: [
        ...jobClass.initialItems,
        { id: 'init_ore', name: '鉄鉱石', emoji: '🪨', category: 'MATERIAL', type: 'IRON_ORE', uses: 2 },
        { id: 'init_synth_jar', name: '合成の壺', emoji: '🏺', category: 'JAR', type: 'SYNTHESIS', capacity: 4, contents: [] },
      ],
      grid: dungeon.grid,
      wallData: dungeon.wallData,
      visitedGrid: dungeon.visitedGrid,
      visibleGrid: dungeon.visibleGrid,
      monsterHouseRoom: dungeon.monsterHouseRoom,
      items: dungeon.items,
      npcs: dungeon.npcs,
      enemies: dungeon.enemies,
      stairsPos: dungeon.stairsPos,
    };

    updateFOV(newGameState);
    setMhTriggered(false);

    setGameState(newGameState);
    setActiveModal(null);
    setLogs([`🏰 ${playerName} は 🥺の不思議な迷宮 に挑んだ！ (1F: ${dungeon.mapSize}×${dungeon.mapSize})`]);
    triggerFloorAnnounce(1, dungeon.mapSize);
    sounds.playSelect();
  };

  const triggerFloorAnnounce = (floorNum, mapSize) => {
    setFloorAnnounce(`地下 ${floorNum} 階 (${mapSize}×${mapSize})`);
    sounds.playFloorDown();
    setTimeout(() => {
      setFloorAnnounce(null);
    }, 2200);
  };

  const updateFOV = (state) => {
    const { grid, player, visitedGrid, visibleGrid } = state;
    const mapSize = grid.length;
    const px = player.x;
    const py = player.y;

    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        visibleGrid[y][x] = false;
      }
    }

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
          visibleGrid[ny][nx] = true;
          visitedGrid[ny][nx] = true;
        }
      }
    }
  };

  const handleSwapPositionWithPet = (targetPet) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player, companions } = state;

    const pet = targetPet || companions.find((c) => Math.abs(c.x - player.x) + Math.abs(c.y - player.y) === 1);
    if (!pet) {
      addLog('⚠️ 隣接する位置に仲間ペットがいません！');
      return;
    }

    const tempX = player.x;
    const tempY = player.y;

    player.x = pet.x;
    player.y = pet.y;

    pet.x = tempX;
    pet.y = tempY;

    addLog(`🔄 ${player.name} は ${pet.emoji} ${pet.name} と位置を入れ替えた！`);
    sounds.playSelect();

    processTurnAfterAction(state);
  };

  const processTurn = (playerAction) => {
    if (!gameState || activeModal) return;

    let state = { ...gameState };
    let { player, companions, enemies, npcs, items, grid, wallData, stairsPos } = state;
    const mapSize = grid.length;
    let turnActionTaken = false;

    if (playerAction.type === 'MOVE') {
      const targetX = player.x + playerAction.dir.x;
      const targetY = player.y + playerAction.dir.y;
      player.facing = playerAction.dir;

      if (targetX >= 0 && targetX < mapSize && targetY >= 0 && targetY < mapSize) {
        const targetTile = grid[targetY][targetX];

        const enemyHere = enemies.find((e) => e.x === targetX && e.y === targetY);
        const companionHere = companions.find((c) => c.x === targetX && c.y === targetY);

        if (enemyHere) {
          executePlayerAttack(state, enemyHere);
          turnActionTaken = true;
        } else if (companionHere) {
          const tempX = player.x;
          const tempY = player.y;

          player.x = companionHere.x;
          player.y = companionHere.y;

          companionHere.x = tempX;
          companionHere.y = tempY;

          addLog(`🔄 ${player.name} は ${companionHere.emoji} ${companionHere.name} と位置を入れ替えた！`);
          sounds.playSelect();
          turnActionTaken = true;
        } else if (targetTile === 'W') {
          executeWallMining(state, targetX, targetY);
          turnActionTaken = true;
        } else if (targetTile === 'F') {
          const npcHere = npcs.find((n) => n.x === targetX && n.y === targetY);
          if (npcHere) {
            // SWAP POSITIONS WITH FRIENDLY NPC & OPEN DIALOGUE
            const tempX = player.x;
            const tempY = player.y;

            player.x = npcHere.x;
            player.y = npcHere.y;

            npcHere.x = tempX;
            npcHere.y = tempY;

            addLog(`🔄 ${player.name} は ${npcHere.emoji} ${npcHere.name} と位置を入れ替えた！`);
            sounds.playSelect();
            triggerNpcDialogue(npcHere);
            turnActionTaken = true;
          } else {
            player.x = targetX;
            player.y = targetY;
            turnActionTaken = true;

            const itemIdx = items.findIndex((i) => i.x === targetX && i.y === targetY);
            if (itemIdx >= 0) {
              const pickedItem = items[itemIdx];
              items.splice(itemIdx, 1);

              // ARTIFACT PICKUP LOGIC
              if (pickedItem.category === 'ARTIFACT') {
                addLog(`🏆 🌟 伝説の神器 ${pickedItem.emoji} ${pickedItem.name} を手に入れた！！ (${pickedItem.effect})`);
                sounds.playFanfare();
              }

              // STACK SYSTEM FOR SPELLBOOKS / MATERIALS / CONSUMABLES WITH USES
              const existingItem = state.inventory.find(
                (i) => i.name === pickedItem.name && i.category === pickedItem.category
              );

              if (existingItem && (existingItem.uses !== undefined || pickedItem.uses !== undefined)) {
                existingItem.uses = (existingItem.uses || 1) + (pickedItem.uses || 1);
                addLog(`✨ ${pickedItem.emoji} ${pickedItem.name} を手に入れ、スタック統合した！ (計 ${existingItem.uses} 個分)`);
              } else {
                state.inventory.push(pickedItem);
                const usesInfo = pickedItem.uses ? ` [${pickedItem.uses}個]` : '';
                if (pickedItem.category !== 'ARTIFACT') {
                  addLog(`✨ ${pickedItem.emoji} ${pickedItem.name}${usesInfo} を手に入れた！`);
                  sounds.playHeal();
                }
              }
            }

            if (targetX === stairsPos.x && targetY === stairsPos.y) {
              advanceToNextFloor(state);
              return;
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
      companions.forEach((c) => {
        if (c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + 1);
      });
      turnActionTaken = true;
    }

    if (!turnActionTaken) return;
    processTurnAfterAction(state);
  };

  const processTurnAfterAction = (state) => {
    let { player, monsterHouseRoom, inventory } = state;

    // ARTIFACT PASSIVE: PHILOSOPHER'S STONE (👑 賢者の石 or 覚醒神具 or isPhilosopherStone)
    const hasPhilosopherStone = inventory.some(
      (i) => i.type === 'PHILOSOPHER_STONE' || i.name?.includes('覚醒神具') || i.isPhilosopherStone
    );
    if (hasPhilosopherStone) {
      player.hp = Math.min(player.maxHp, player.hp + 2);
      player.food = 100;
    } else {
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
    }

    // MONSTER HOUSE ENTRY TRIGGER
    if (monsterHouseRoom && !mhTriggered) {
      const { x, y, w, h } = monsterHouseRoom;
      if (player.x >= x && player.x < x + w && player.y >= y && player.y < y + h) {
        setMhTriggered(true);
        addLog('🚨 【警告】 モンスターハウスに踏み込んだ！！ 大量の魔物と宝箱が待ち構えている！');
        sounds.playHit();
      }
    }

    processMultiCompanionsAI(state);
    processFriendlyNpcCombatAI(state);
    processEnemiesAI(state);
    updateFOV(state);

    setGameState({ ...state });
  };

  // HELPER: DISTRIBUTE EXP & CHECK LEVEL UPS FOR PLAYER AND ALL PETS
  const distributeExpAndCheckLevelUps = (state, expGained, killerName) => {
    const { player, companions } = state;

    // Player Exp & Level Up
    player.exp += expGained;
    if (player.exp >= player.level * 30) {
      player.level += 1;
      player.maxHp += 10;
      player.hp = player.maxHp;
      player.atk += 2;
      player.def += 1;
      addLog(`✨ 🌟 ${player.name} は Lv.${player.level} にレベルアップした！ (HP全回復 & ステータスUP)`);
      sounds.playLevelUp();
    }

    // Companions Exp & Level Up
    companions.forEach((c) => {
      const petExpGained = killerName === c.name ? expGained : Math.floor(expGained * 0.6);
      c.exp += petExpGained;
      if (c.exp >= c.level * 25) {
        c.level += 1;
        c.maxHp += 8;
        c.hp = c.maxHp;
        c.atk += 3;
        c.def += 2;
        addLog(`✨ 🐾 ${c.emoji} ${c.name} は Lv.${c.level} にレベルアップした！ (HP全回復 & ATK+3 DEF+2)`);
        sounds.playLevelUp();
      }
    });
  };

  // FRIENDLY NPCS SMART AUTONOMOUS AI (Combat, Evade & Patrol)
  const processFriendlyNpcCombatAI = (state) => {
    const { npcs, enemies, grid, player, companions } = state;

    npcs.forEach((npc) => {
      if (npc.hp <= 0) return;

      // Natural HP Regen for friendly NPCs
      if (npc.hp < npc.maxHp) {
        npc.hp = Math.min(npc.maxHp, npc.hp + 2);
      }

      // Check nearby enemies (within 4 tiles)
      let nearestEnemy = null;
      let minDist = 999;
      enemies.forEach((e) => {
        const d = Math.abs(e.x - npc.x) + Math.abs(e.y - npc.y);
        if (d < minDist) {
          minDist = d;
          nearestEnemy = e;
        }
      });

      // Combat Types: Smith, Bodyguard, Tamer, Alchemist
      const isFighter = ['SMITH', 'BODYGUARD', 'TAMER', 'ALCHEMIST'].includes(npc.type);

      if (nearestEnemy && minDist <= 1) {
        // Adjacent combat
        const dmg = Math.max(1, npc.atk - nearestEnemy.def + Math.floor(Math.random() * 2));
        nearestEnemy.hp -= dmg;
        addLog(`🛡️ 【自衛戦闘】 ${npc.emoji} ${npc.name} は立ち向かい ${nearestEnemy.emoji} ${nearestEnemy.name} に ${dmg} ダメージ与えた！`);
        sounds.playAttack();

        if (nearestEnemy.hp <= 0) {
          state.enemies = enemies.filter((e) => e.id !== nearestEnemy.id);
          addLog(`💥 ${npc.emoji} ${npc.name} は襲いかかってきた ${nearestEnemy.name} を撃退した！`);
        }
      } else if (nearestEnemy && minDist <= 3) {
        if (!isFighter || npc.hp < npc.maxHp * 0.4) {
          // NON-FIGHTERS OR LOW HP NPCS: ESCAPE / EVADE FROM ENEMIES!
          const escapeDx = Math.sign(npc.x - nearestEnemy.x);
          const escapeDy = Math.sign(npc.y - nearestEnemy.y);
          const nextX = npc.x + (escapeDx || (Math.random() < 0.5 ? 1 : -1));
          const nextY = npc.y + (escapeDy || (Math.random() < 0.5 ? 1 : -1));

          const isOccupied =
            (player.x === nextX && player.y === nextY) ||
            companions.some((c) => c.x === nextX && c.y === nextY) ||
            npcs.some((other) => other.id !== npc.id && other.x === nextX && other.y === nextY) ||
            enemies.some((e) => e.x === nextX && e.y === nextY);

          if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
            npc.x = nextX;
            npc.y = nextY;
            addLog(`💨 ${npc.emoji} ${npc.name} は迫り来る魔物 ${nearestEnemy.name} から逃げ惑って緊急回避移動した！`);
          }
        } else {
          // FIGHTERS: ADVANCE TOWARD ENEMY TO PROTECT THE AREA
          const dx = Math.sign(nearestEnemy.x - npc.x);
          const dy = Math.sign(nearestEnemy.y - npc.y);
          const nextX = npc.x + dx;
          const nextY = npc.y + dy;

          const isOccupied =
            (player.x === nextX && player.y === nextY) ||
            companions.some((c) => c.x === nextX && c.y === nextY) ||
            npcs.some((other) => other.id !== npc.id && other.x === nextX && other.y === nextY) ||
            enemies.some((e) => e.x === nextX && e.y === nextY);

          if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
            npc.x = nextX;
            npc.y = nextY;
          }
        }
      } else {
        // IDLE: 25% Chance to wander around room/corridor peacefully
        if (Math.random() < 0.25) {
          const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
          const dir = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = npc.x + dir.x;
          const nextY = npc.y + dir.y;

          const isOccupied =
            (player.x === nextX && player.y === nextY) ||
            companions.some((c) => c.x === nextX && c.y === nextY) ||
            npcs.some((other) => other.id !== npc.id && other.x === nextX && other.y === nextY) ||
            enemies.some((e) => e.x === nextX && e.y === nextY);

          if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
            npc.x = nextX;
            npc.y = nextY;
          }
        }
      }
    });
  };

  const executePlayerAttack = (state, enemy) => {
    const { player } = state;
    const dmg = Math.max(1, player.atk - enemy.def + Math.floor(Math.random() * 3));
    enemy.hp -= dmg;
    addLog(`⚔️ ${player.name} は ${enemy.emoji} ${enemy.name} に ${dmg} ダメージを与えた！`);
    sounds.playAttack();

    if (enemy.hp <= 0) {
      addLog(`💀 ${enemy.emoji} ${enemy.name} を倒した！ (Exp +${enemy.exp})`);
      state.enemies = state.enemies.filter((e) => e.id !== enemy.id);

      // BOSS DEFEAT REWARD LOGIC
      if (enemy.isBoss) {
        const expReward = 300 + state.floor * 100;
        addLog(`🏆 🌟 【裏ボス撃破】 ${enemy.emoji} ${enemy.name} を見事に討ち取った！！ (ボーナスExp +${expReward})`);
        sounds.playFanfare();

        // 99F FINAL VICTORY CLEAR
        if (state.floor >= 99) {
          setActiveModal('VICTORY');
          return;
        }

        // Drop Boss Legendary Artifact Reward
        state.items.push({
          id: `boss_artifact_${Date.now()}`,
          x: enemy.x,
          y: enemy.y,
          name: `👑 ${state.floor}F 撃破の証・神の宝珠`,
          emoji: '👑',
          category: 'ARTIFACT',
          type: 'PHILOSOPHER_STONE',
          effect: '毎ターンHP全回復 & 満腹度無限',
          atkBonus: 30 + state.floor * 2,
          defBonus: 20 + state.floor,
          enchantments: ['全知全能', '暗視', '魔法反射'],
          isIdentified: true,
        });

        distributeExpAndCheckLevelUps(state, expReward, player.name);
      } else {
        distributeExpAndCheckLevelUps(state, enemy.exp, player.name);
      }
    }
  };

  const executeWallMining = (state, x, y) => {
    const { wallData, grid, items } = state;
    const wall = wallData[y]?.[x];
    if (!wall) return;

    // Digging calculation: Miner class or Mining enchantment deals 2.5x ~ 3x digging damage!
    const isMiner = state.className === '採掘師';
    const hasMiningEnchant =
      equippedWeapon?.enchantments?.includes('採掘強化') ||
      equippedShield?.enchantments?.includes('採掘強化');
    const multiplier = (isMiner ? 2.5 : 1.0) * (hasMiningEnchant ? 2.0 : 1.0);

    const baseDmg = Math.max(4, Math.floor(state.player.atk * 0.7));
    const dmg = Math.floor(baseDmg * multiplier);

    wall.hp -= dmg;
    addLog(`⛏️ ${wall.name} を採掘中… (掘削: ${dmg} / 残り耐久: ${Math.max(0, wall.hp)}/${wall.maxHp})`);
    sounds.playMine();

    if (wall.hp <= 0) {
      grid[y][x] = 'F';
      wallData[y][x] = null;
      addLog(`💥 ${wall.name} を崩壊させて通路を開拓した！`);
      sounds.playMineBreak();

      if (Math.random() < wall.dropChance) {
        const isFood = wall.dropType === 'FOOD';
        items.push({
          id: `drop_${Date.now()}`,
          x,
          y,
          name: isFood ? 'パン' : '鉄鉱石',
          emoji: isFood ? '🍞' : '🪨',
          category: isFood ? 'CONSUMABLE' : 'MATERIAL',
          type: isFood ? 'FOOD' : 'IRON_ORE',
          uses: 1,
          foodRestore: 40,
        });
      }
    }
  };

  const processMultiCompanionsAI = (state) => {
    const { companions, enemies, player, grid, items } = state;

    companions.forEach((companion, idx) => {
      if (companion.hp <= 0) return;

      if (companion.hp <= companion.maxHp * 0.5) {
        const healItemIdx = companion.inventory.findIndex(
          (i) => i.type === 'HERB' || i.type === 'POTION' || i.type === 'FOOD' || i.foodRestore > 0
        );
        if (healItemIdx >= 0) {
          const item = companion.inventory[healItemIdx];
          companion.inventory.splice(healItemIdx, 1);
          const healAmt = item.heal || 30;
          companion.hp = Math.min(companion.maxHp, companion.hp + healAmt);
          addLog(`🧪 🐾 ${companion.name} は ${item.name} で HP を ${healAmt} 回復！`);
          sounds.playHeal();
          return;
        }
      }

      companion.inventory.forEach((item) => {
        if (item.type === 'WEAPON') {
          if (!companion.equippedWeapon || item.atkBonus > companion.equippedWeapon.atkBonus) {
            if (companion.equippedWeapon) companion.atk -= companion.equippedWeapon.atkBonus;
            companion.equippedWeapon = item;
            companion.atk += item.atkBonus;
            addLog(`✨ 🐾 ${companion.name} は ${item.emoji} ${item.name} を自律装備！`);
          }
        } else if (item.type === 'SHIELD') {
          if (!companion.equippedShield || item.defBonus > companion.equippedShield.defBonus) {
            if (companion.equippedShield) companion.def -= companion.equippedShield.defBonus;
            companion.equippedShield = item;
            companion.def += item.defBonus;
            addLog(`✨ 🐾 ${companion.name} は ${item.emoji} ${item.name} を自律装備！`);
          }
        }
      });

      const floorItemIdx = items.findIndex((i) => i.x === companion.x && i.y === companion.y);
      if (floorItemIdx >= 0) {
        const pickedItem = items[floorItemIdx];
        items.splice(floorItemIdx, 1);

        const existingItem = companion.inventory.find(
          (i) => i.name === pickedItem.name && (i.uses !== undefined || pickedItem.uses !== undefined)
        );

        if (existingItem) {
          existingItem.uses = (existingItem.uses || 1) + (pickedItem.uses || 1);
          addLog(`✨ 🐾 ${companion.name} は ${pickedItem.emoji} ${pickedItem.name} を拾ってスタック合算した！`);
        } else {
          companion.inventory.push(pickedItem);
          addLog(`✨ 🐾 ${companion.name} は ${pickedItem.emoji} ${pickedItem.name} を拾った！`);
        }
        sounds.playHeal();
      }

      let nearestEnemy = null;
      let minDist = 999;
      enemies.forEach((e) => {
        const dist = Math.abs(e.x - companion.x) + Math.abs(e.y - companion.y);
        if (dist < minDist && dist <= 5) {
          minDist = dist;
          nearestEnemy = e;
        }
      });

      if (nearestEnemy) {
        const isDragon = companion.emoji === '🐉' || companion.name.includes('ドラゴン');
        const isCat = companion.emoji === '🐈' || companion.name.includes('キャット');
        const isLowHp = companion.hp < companion.maxHp * 0.35;

        if (minDist <= 1) {
          if (isCat && isLowHp) {
            const escapeDx = Math.sign(companion.x - nearestEnemy.x);
            const escapeDy = Math.sign(companion.y - nearestEnemy.y);
            const nextX = companion.x + (escapeDx || (Math.random() < 0.5 ? 1 : -1));
            const nextY = companion.y + (escapeDy || (Math.random() < 0.5 ? 1 : -1));

            const isOccupied =
              (player.x === nextX && player.y === nextY) ||
              companions.some((c) => c.id !== companion.id && c.x === nextX && c.y === nextY) ||
              enemies.some((e) => e.x === nextX && e.y === nextY);

            if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
              companion.x = nextX;
              companion.y = nextY;
              addLog(`💨 🐾 ${companion.name} は危険を感じて身軽にバックステップ回避した！`);
              return;
            }
          }

          const dmg = Math.max(1, companion.atk - nearestEnemy.def);
          nearestEnemy.hp -= dmg;
          addLog(`🐾 ${companion.name} の攻撃！ ${nearestEnemy.emoji} ${nearestEnemy.name} に ${dmg} ダメージ！`);
          sounds.playAttack();

          if (nearestEnemy.hp <= 0) {
            state.enemies = state.enemies.filter((e) => e.id !== nearestEnemy.id);
            addLog(`💥 🐾 ${companion.name} は ${nearestEnemy.name} を見事に倒した！ (パーティー全員 Exp +${nearestEnemy.exp})`);
            distributeExpAndCheckLevelUps(state, nearestEnemy.exp, companion.name);
          }
          return;
        }

        if (isDragon && minDist <= 3) {
          // DRAGON: RANGED FLAME BREATH ATTACK!
          const breathDmg = Math.max(12, Math.floor(companion.atk * 1.3));
          nearestEnemy.hp -= breathDmg;
          addLog(`🔥 🐉 ${companion.name} は口から火炎ブレスを吐き出し、遠くの ${nearestEnemy.emoji} ${nearestEnemy.name} に ${breathDmg} 火炎ダメージを与えた！`);
          sounds.playMagic();

          if (nearestEnemy.hp <= 0) {
            state.enemies = enemies.filter((e) => e.id !== nearestEnemy.id);
            addLog(`💥 🔥 🐉 ${companion.name} のブレス焼き尽くしで ${nearestEnemy.name} は灰となった！ (Exp +${nearestEnemy.exp})`);
            distributeExpAndCheckLevelUps(state, nearestEnemy.exp, companion.name);
          }
          return;
        } else if (minDist <= 4) {
          // ADVANCE TOWARD ENEMY
          const dx = Math.sign(nearestEnemy.x - companion.x);
          const dy = Math.sign(nearestEnemy.y - companion.y);
          const nextX = companion.x + dx;
          const nextY = companion.y + dy;

          const isOccupied =
            (player.x === nextX && player.y === nextY) ||
            companions.some((c) => c.id !== companion.id && c.x === nextX && c.y === nextY) ||
            enemies.some((e) => e.x === nextX && e.y === nextY);

          if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
            companion.x = nextX;
            companion.y = nextY;
            return;
          }
        }
      }

      const leaderTarget = idx === 0 ? player : companions[idx - 1];
      const distToLeader = Math.abs(leaderTarget.x - companion.x) + Math.abs(leaderTarget.y - companion.y);

      if (distToLeader > 1) {
        const dx = Math.sign(leaderTarget.x - companion.x);
        const dy = Math.sign(leaderTarget.y - companion.y);

        const nextX = companion.x + dx;
        const nextY = companion.y + dy;

        const isPlayerOnNext = player.x === nextX && player.y === nextY;
        const isOtherPetOnNext = companions.some((c) => c.id !== companion.id && c.x === nextX && c.y === nextY);
        const isEnemyOnNext = enemies.some((e) => e.x === nextX && e.y === nextY);

        if (grid[nextY]?.[nextX] === 'F' && !isPlayerOnNext && !isOtherPetOnNext && !isEnemyOnNext) {
          companion.x = nextX;
          companion.y = nextY;
        }
      } else if (Math.random() < 0.3) {
        // IDLE WANDER AROUND PLAYER WHEN SAFE
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const nextX = companion.x + dir.x;
        const nextY = companion.y + dir.y;

        const isOccupied =
          (player.x === nextX && player.y === nextY) ||
          companions.some((c) => c.id !== companion.id && c.x === nextX && c.y === nextY) ||
          enemies.some((e) => e.x === nextX && e.y === nextY);

        if (grid[nextY]?.[nextX] === 'F' && !isOccupied) {
          companion.x = nextX;
          companion.y = nextY;
        }
      }
    });
  };

  const processEnemiesAI = (state) => {
    const { enemies, player, companions, npcs, grid } = state;

    enemies.forEach((enemy) => {
      let closestTarget = player;
      let targetType = 'PLAYER';
      let minDist = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);

      companions.forEach((c) => {
        const d = Math.abs(c.x - enemy.x) + Math.abs(c.y - enemy.y);
        if (d < minDist) {
          minDist = d;
          closestTarget = c;
          targetType = 'PET';
        }
      });

      npcs.forEach((n) => {
        const d = Math.abs(n.x - enemy.x) + Math.abs(n.y - enemy.y);
        if (d < minDist) {
          minDist = d;
          closestTarget = n;
          targetType = 'NPC';
        }
      });

      if (minDist <= 1) {
        let baseDmg = Math.max(1, enemy.atk - closestTarget.def);
        if (targetType === 'NPC') {
          const isPlayerNear = Math.abs(player.x - closestTarget.x) <= 1 && Math.abs(player.y - closestTarget.y) <= 1;
          const isPetNear = companions.some((c) => Math.abs(c.x - closestTarget.x) <= 1 && Math.abs(c.y - closestTarget.y) <= 1);
          if (isPlayerNear || isPetNear) {
            baseDmg = Math.max(1, Math.floor(baseDmg * 0.5));
            addLog(`🛡️ 【身代わり防護】 ${player.name} たちが近くで庇ったため ${closestTarget.name} への被ダメージが半減された！`);
          }
        }
        closestTarget.hp -= baseDmg;
        addLog(`💥 ${enemy.emoji} ${enemy.name} の攻撃！ ${closestTarget.name} に ${baseDmg} ダメージ！`);
        sounds.playHit();

        if (targetType === 'PLAYER' && player.hp <= 0) {
          handleGameOver(`${enemy.name} に倒された…`);
        } else if (targetType === 'PET' && closestTarget.hp <= 0) {
          addLog(`💀 ${closestTarget.name} は ${enemy.name} に倒されてしまった！`);
          state.companions = companions.filter((c) => c.id !== closestTarget.id);
        } else if (targetType === 'NPC' && closestTarget.hp <= 0) {
          addLog(`💀 ${closestTarget.emoji} ${closestTarget.name} は ${enemy.name} に倒されて気絶してしまった！`);
          state.npcs = npcs.filter((n) => n.id !== closestTarget.id);
        }
      } else if (minDist <= 5) {
        const dx = Math.sign(closestTarget.x - enemy.x);
        const dy = Math.sign(closestTarget.y - enemy.y);

        const nextX = enemy.x + dx;
        const nextY = enemy.y + dy;

        const isPlayerOnNext = player.x === nextX && player.y === nextY;
        const isPetOnNext = companions.some((c) => c.x === nextX && c.y === nextY);
        const isNpcOnNext = npcs.some((n) => n.x === nextX && n.y === nextY);
        const isEnemyOnNext = enemies.some((other) => other.id !== enemy.id && other.x === nextX && other.y === nextY);

        if (grid[nextY]?.[nextX] === 'F' && !isPlayerOnNext && !isPetOnNext && !isNpcOnNext && !isEnemyOnNext) {
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
    state.mapSize = dungeon.mapSize;
    state.grid = dungeon.grid;
    state.wallData = dungeon.wallData;
    state.visitedGrid = dungeon.visitedGrid;
    state.visibleGrid = dungeon.visibleGrid;
    state.monsterHouseRoom = dungeon.monsterHouseRoom;
    state.items = dungeon.items;
    state.npcs = dungeon.npcs;
    state.enemies = dungeon.enemies;
    state.stairsPos = dungeon.stairsPos;
    state.player.x = dungeon.playerSpawn.x;
    state.player.y = dungeon.playerSpawn.y;
    setMhTriggered(false);

    // Safe Multi-Pet Placement Algorithm (Prevent Wall / Out-of-Bounds Spawns)
    const px = dungeon.playerSpawn.x;
    const py = dungeon.playerSpawn.y;
    const mapSize = dungeon.mapSize;

    const availableFloors = [];
    for (let r = 1; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const tx = px + dx;
            const ty = py + dy;
            if (tx >= 0 && tx < mapSize && ty >= 0 && ty < mapSize && dungeon.grid[ty]?.[tx] === 'F') {
              availableFloors.push({ x: tx, y: ty });
            }
          }
        }
      }
    }

    state.companions.forEach((c, idx) => {
      const pos = availableFloors[idx] || { x: px, y: py };
      c.x = pos.x;
      c.y = pos.y;
    });

    // DYNAMIC GEMINI AI ARTIFACT GENERATION ON FLOOR >= 3 (Random Floor Drop)
    if (nextFloor >= 3 && Math.random() < 0.35) {
      const aiArtifact = await generateArtifactByGemini(nextFloor, state.playerName);
      if (aiArtifact) {
        state.items.push({
          ...aiArtifact,
          x: dungeon.stairsPos.x - 1,
          y: dungeon.stairsPos.y,
        });
        addLog(`🤖 【Gemini AI 創世】 冒険の軌跡に応じて Gemini AI が伝説の神器 【${aiArtifact.name}】 をオンデマンド生み出し、階層に降臨させた！`);
      }
    }

    // 🤖 EVERY 5 FLOORS (5F, 10F, 15F, 20F, 25F, 30F...) -> GEMINI SCALED BOSS SPONSOR
    if (nextFloor % 5 === 0) {
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
        exp: 300 + nextFloor * 50,
        isBoss: true,
      });
      setActiveModal('BOSS_ANN');
      addLog(`🚨 【Gemini AI 創世裏ボス降臨】 地下 ${nextFloor} 階に君臨する巨大ボス 【${boss.name}】 が出現した！！`);
    }

    updateFOV(state);
    setGameState({ ...state });
    triggerFloorAnnounce(nextFloor, dungeon.mapSize);
    addLog(`🪜 階層を降りて ${nextFloor}F に進んだ！ (マップサイズ: ${dungeon.mapSize}×${dungeon.mapSize})`);
  };

  const triggerNpcDialogue = async (npc) => {
    sounds.playSelect();
    const speechText = await generateNpcDialogue(npc.emoji, npc.name, gameState);

    // If Shopkeeper, randomly pick 5 items from Master Catalog
    if (npc.emoji === '👨') {
      const shuffled = [...SHOP_MASTER_CATALOG].sort(() => 0.5 - Math.random());
      setCurrentShopCatalog(shuffled.slice(0, 5));
    }

    setNpcSpeech({ npc, text: speechText });
    setActiveModal('NPC_DIALOGUE');
  };

  // GEMINI AI ON-DEMAND ARTIFACT SUMMON VIA FORTUNE TELLER
  const handleSummonGeminiArtifactAtFortuneTeller = async () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 200) {
      addLog('⚠️ ゴールドが足りません！ (祈祷料: 200G)');
      return;
    }

    state.gold -= 200;
    addLog('✨ 🧕 占い師が天に祈りを捧げ、Gemini AI と交信している…');
    sounds.playMagic();

    const aiArtifact = await generateArtifactByGemini(state.floor, state.playerName);
    state.inventory.push(aiArtifact);
    addLog(`🤖 🌟 【Gemini AI 降臨】 Gemini AI があなたの冒険のために世界に一つの神器 【${aiArtifact.name}】 を特別創世して授けた！！ (${aiArtifact.effect})`);
    sounds.playFanfare();

    setGameState(state);
  };

  // OPEN JAR ITEM SELECTION MODAL
  const handleOpenJarInputModal = (jarItem) => {
    setSelectedJar(jarItem);
    setActiveModal('JAR_INPUT');
  };

  // PUT ITEM INTO JAR LOGIC (SYNTHESIS, ARTIFACT FUSION, IDENTIFY, CHANGE, STORAGE)
  const handlePutItemIntoJar = (targetItem) => {
    if (!gameState || !selectedJar) return;
    const state = { ...gameState };

    if (targetItem.id === selectedJar.id) {
      addLog('⚠️ 壺の中に自分自身を入れることはできません！');
      return;
    }
    if (targetItem.id === equippedWeapon?.id || targetItem.id === equippedShield?.id) {
      addLog('⚠️ 装備中の武具は壺に入れられません！ 装備を外してから投入してください。');
      return;
    }

    const currentCap = selectedJar.capacity || 4;
    selectedJar.contents = selectedJar.contents || [];

    if (selectedJar.contents.length >= currentCap) {
      addLog(`⚠️ ${selectedJar.name} はすでに満杯です！ (容量: ${currentCap})`);
      return;
    }

    // Remove target item from inventory
    state.inventory = state.inventory.filter((i) => i.id !== targetItem.id);

    if (selectedJar.type === 'SYNTHESIS') {
      selectedJar.contents.push(targetItem);
      addLog(`🏺 ${targetItem.name} を ${selectedJar.name} に投入した！ (現在 ${selectedJar.contents.length}/${currentCap} 個投入)`);
      sounds.playMagic();

      // If at least 2 items in Synthesis Jar, combine them!
      if (selectedJar.contents.length >= 2) {
        const hasArtifact = selectedJar.contents.some((i) => i.category === 'ARTIFACT');
        let baseItem = { ...selectedJar.contents[0] };

        if (hasArtifact) {
          // ARTIFACT FUSION (神器合体覚醒! Equipable Equipment structure)
          baseItem.category = 'EQUIPMENT';
          baseItem.type = baseItem.type === 'SHIELD' ? 'SHIELD' : 'WEAPON';
          baseItem.atkBonus = (baseItem.atkBonus || 10) + 50;
          baseItem.defBonus = (baseItem.defBonus || 10) + 30;
          baseItem.enchantments = ['全知全能', '暗視', '魔法反射', '狂乱', '吸血', '採掘強化'];
          baseItem.isPhilosopherStone = true;
          baseItem.name = `🔥 覚醒神具 ${baseItem.name.replace(/✨ 合成済 /g, '')} (神の威光)`;

          state.inventory = state.inventory.filter((i) => i.id !== selectedJar.id);
          state.inventory.push(baseItem);
          addLog(`🌟【神器合体・覚醒】 🏺 ${selectedJar.name} の中で神器の聖なる光が武具と融合！！ 【${baseItem.name} (ATK+${baseItem.atkBonus} DEF+${baseItem.defBonus})】 が神々しく爆誕した！！`);
          sounds.playFanfare();
        } else {
          // Standard Equipment Synthesis
          for (let i = 1; i < selectedJar.contents.length; i++) {
            const subItem = selectedJar.contents[i];
            baseItem.atkBonus = (baseItem.atkBonus || 0) + (subItem.atkBonus || 0);
            baseItem.defBonus = (baseItem.defBonus || 0) + (subItem.defBonus || 0);

            const combinedEnchants = new Set([...(baseItem.enchantments || []), ...(subItem.enchantments || [])]);
            baseItem.enchantments = Array.from(combinedEnchants);
            baseItem.name = `✨ 合成済 ${baseItem.name.replace(/✨ 合成済 /g, '')} (+${baseItem.atkBonus || baseItem.defBonus})`;
          }

          state.inventory = state.inventory.filter((i) => i.id !== selectedJar.id);
          state.inventory.push(baseItem);
          addLog(`💥 🏺 ${selectedJar.name} が輝きと共に弾け飛び、超強化された【${baseItem.name}】が完成した！ (ATK+${baseItem.atkBonus || 0} DEF+${baseItem.defBonus || 0})`);
          sounds.playFanfare();
        }

        setActiveModal('INVENTORY');
        setGameState(state);
        return;
      }
    } else if (selectedJar.type === 'CHANGE') {
      const changedItem = {
        id: `changed_${Date.now()}`,
        name: '🔥 狂乱の オリハルコン製 ⚔️ 秘剣',
        emoji: '⚔️',
        category: 'EQUIPMENT',
        type: 'WEAPON',
        atkBonus: 20,
        enchantments: ['狂乱', '会心'],
        isIdentified: true,
      };
      state.inventory.push(changedItem);
      addLog(`✨ ${targetItem.name} を変化の壺に入れたら、なんと【${changedItem.name}】に変化した！`);
      sounds.playFanfare();
    } else if (selectedJar.type === 'IDENTIFY') {
      targetItem.isIdentified = true;
      state.inventory.push(targetItem);
      addLog(`🔮 ${targetItem.name} を識別の壺に入れたことで、完全に鑑別・鑑定された！`);
      sounds.playMagic();
    } else {
      // STORAGE
      selectedJar.contents.push(targetItem);
      addLog(`📦 ${targetItem.name} を ${selectedJar.name} に収納・保存した！`);
      sounds.playHeal();
    }

    setGameState(state);
  };

  const handleUseItem = (item) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player, companions, inventory, enemies } = state;

    if (item.type === 'VICTORY_ORB') {
      addLog(`🏆 ${item.name} をかかげ、迷宮完全脱出の奇跡を起こした！`);
      sounds.playFanfare();
      setActiveModal('VICTORY');
      return;
    } else if (item.type === 'PHILOSOPHER_STONE' || item.name?.includes('覚醒神具') || item.isPhilosopherStone) {
      addLog(`👑 ${item.name} は持っているだけで毎ターンHPが全快近く自動回復し、空腹が一切なくなります！`);
      sounds.playHeal();
      return;
    } else if (item.type === 'TAME') {
      const frontX = player.x + player.facing.x;
      const frontY = player.y + player.facing.y;
      const targetEnemy = enemies.find((e) => e.x === frontX && e.y === frontY);

      if (targetEnemy) {
        addLog(`💖 ${item.name} を ${targetEnemy.emoji} ${targetEnemy.name} に投げ与えた！`);
        sounds.playMagic();
        state.enemies = enemies.filter((e) => e.id !== targetEnemy.id);

        const newPet = {
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

        // UNLIMITED PETS (NO PUSH-OUT)
        companions.push(newPet);
        addLog(`✨ ${targetEnemy.emoji} ${targetEnemy.name} が心を開き、新しい仲間ペットになった！ (大軍団: 計${companions.length}体)`);
        sounds.playFanfare();
      } else {
        addLog('⚠️ 正面にテイムできる魔物がいません！');
        return;
      }
    } else if (item.type === 'RAGE_POTION' || item.name?.includes('狂乱')) {
      const atkBoost = 15;
      player.atk += atkBoost;
      player.hp = player.maxHp;
      companions.forEach((c) => {
        c.atk += 5;
        c.hp = c.maxHp;
      });
      addLog(`🩸 狂乱の薬を飲み干した！ 全身に血の気が巡り、攻撃力が +${atkBoost} 激増＆HPが全回復した！ (ATK: ${player.atk})`);
      sounds.playFanfare();
    } else if (item.type === 'FOOD' || item.foodRestore > 0 || item.name?.includes('パン')) {
      const restoreAmount = item.foodRestore || 40;
      player.food = Math.min(100, player.food + restoreAmount);
      addLog(`🍞 ${item.name} を食べて満腹度が ${restoreAmount} 回復した！ (満腹度: ${player.food}/100)`);
      sounds.playHeal();
    } else if (item.type === 'HERB' || item.type === 'POTION') {
      const healAmount = item.heal || 30;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      companions.forEach((c) => {
        c.hp = Math.min(c.maxHp, c.hp + healAmount);
      });
      // Heal adjacent friendly NPCs
      state.npcs.forEach((npc) => {
        if (Math.abs(npc.x - player.x) <= 1 && Math.abs(npc.y - player.y) <= 1) {
          npc.hp = Math.min(npc.maxHp, npc.hp + healAmount * 2);
          addLog(`💖 ${npc.emoji} ${npc.name} の傷を手当し、HP を ${healAmount * 2} 回復してあげた！ (HP: ${npc.hp}/${npc.maxHp})`);
        }
      });
      addLog(`🌿 薬草を使い、全員の HP が ${healAmount} 回復した！`);
      sounds.playHeal();
    } else if (item.category === 'SPELLBOOK') {
      const enemyNear = state.enemies[0];
      if (enemyNear) {
        enemyNear.hp -= 30;
        addLog(`✨ 魔法の発動！ ${item.name} を唱え、${enemyNear.name} に 30 ダメージ！`);
        sounds.playMagic();
      } else {
        addLog(`✨ 魔法の発動！ ${item.name} を唱えて空に魔法の光を放った！`);
        sounds.playMagic();
      }
    }

    // ITEM CONSUMPTION & STACK USES DECREMENT LOGIC
    if (item.uses && item.uses > 1) {
      item.uses -= 1;
      addLog(`📜 ${item.name} の使用個数が消費された (残り: ${item.uses} 個)`);
    } else {
      state.inventory = inventory.filter((i) => i.id !== item.id);
    }

    setGameState(state);
  };

  // SELL ITEM (Keep modal open for continuous selling)
  const handleSellItemToShop = (item) => {
    if (!gameState) return;
    const state = { ...gameState };
    if (item.id === equippedWeapon?.id || item.id === equippedShield?.id) {
      addLog('⚠️ 装備中のアイテムは売却できません！');
      return;
    }

    let price = 30;
    if (item.category === 'MONEY') price = item.amount || 100;
    else if (item.category === 'ARTIFACT') price = 500;
    else if (item.category === 'MATERIAL') price = 40 * (item.uses || 1);
    else if (item.category === 'EQUIPMENT') price = 80;
    else if (item.category === 'JAR') price = 60;
    else if (item.category === 'SPELLBOOK') price = 50 * (item.uses || 1);

    state.gold += price;
    state.inventory = state.inventory.filter((i) => i.id !== item.id);
    addLog(`💰 ${item.emoji} ${item.name} を道具屋に売却し、${price}G を手に入れた！`);
    sounds.playHeal();
    setGameState(state);
  };

  // UPGRADE AT SMITH (Keep modal open for continuous upgrading)
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
  };

  // CRAFT MATERIAL AT SMITH (素材クラフト武具作成)
  const handleCraftAtSmith = (recipeType) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { inventory, gold } = state;

    if (recipeType === 'DRAGON_SLAYER') {
      const ironOre = inventory.find((i) => i.type === 'IRON_ORE');
      if (!ironOre || gold < 150) {
        addLog('⚠️ クラフト失敗！ 鉄鉱石 🪨 と 150G が必要です！');
        return;
      }
      state.gold -= 150;
      if (ironOre.uses > 1) ironOre.uses -= 1;
      else state.inventory = inventory.filter((i) => i.id !== ironOre.id);

      const craftedWeapon = {
        id: `crafted_${Date.now()}`,
        name: '🔥 狂乱の 鋼鉄製 ⚔️ ドラゴンスレイヤー',
        emoji: '⚔️',
        category: 'EQUIPMENT',
        type: 'WEAPON',
        atkBonus: 18,
        enchantments: ['狂乱', '竜特効', '会心'],
        isIdentified: true,
      };
      state.inventory.push(craftedWeapon);
      addLog('🔥 🔨 鍛冶屋が 🪨 鉄鉱石 から【🔥 狂乱の 鋼鉄製 ⚔️ ドラゴンスレイヤー (ATK+18)】を錬成した！');
      sounds.playMineBreak();
    } else if (recipeType === 'DRAGON_SHIELD') {
      const crystal = inventory.find((i) => i.type === 'MANA_CRYSTAL' || i.type === 'DRAGON_SCALE');
      if (!crystal || gold < 150) {
        addLog('⚠️ クラフト失敗！ 魔法の結晶 💎 と 150G が必要です！');
        return;
      }
      state.gold -= 150;
      if (crystal.uses > 1) crystal.uses -= 1;
      else state.inventory = inventory.filter((i) => i.id !== crystal.id);

      const craftedShield = {
        id: `crafted_${Date.now()}`,
        name: '🌙 暗夜の ダイヤ製 🛡️ 竜鱗の鏡盾',
        emoji: '🛡️',
        category: 'EQUIPMENT',
        type: 'SHIELD',
        defBonus: 12,
        enchantments: ['暗視', '魔法反射', '防護'],
        isIdentified: true,
      };
      state.inventory.push(craftedShield);
      addLog('🔥 🔨 鍛冶屋が 💎 魔法の結晶 から【🌙 暗夜の ダイヤ製 🛡️ 竜鱗の鏡盾 (DEF+12)】を精錬した！');
      sounds.playMineBreak();
    }

    setGameState(state);
  };

  // ROULETTE START (Support continuous restart)
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

  // IDENTIFY AT WIZARD (Keep modal open)
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
  };

  // BUY DYNAMIC SHOP ITEM FROM CURRENT CATALOG
  const handleBuyDynamicShopItem = (item) => {
    if (!gameState) return;
    const state = { ...gameState };

    if (state.gold < item.cost) {
      addLog(`⚠️ ゴールドが足りません！ (${item.name}: ${item.cost}G)`);
      return;
    }

    state.gold -= item.cost;
    state.inventory.push({
      ...item,
      id: `bought_${Date.now()}_${Math.random()}`,
      contents: item.contents ? [] : undefined,
    });
    addLog(`💰 ${item.cost}G で ${item.emoji} ${item.name} を購入した！ (残金: ${state.gold}G)`);
    sounds.playHeal();
    setGameState(state);
  };

  // FORTUNE TELL (Keep modal open)
  const handleFortuneTell = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 80) {
      addLog('⚠️ ゴールドが足りません！ (占い料: 80G)');
      return;
    }

    state.gold -= 80;
    const mapSize = state.grid.length;
    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        state.visibleGrid[y][x] = true;
        state.visitedGrid[y][x] = true;
      }
    }
    addLog('✨ 占い師の千里眼により、現在の階層の全マップと魔物の位置が開示された！');
    sounds.playMagic();
    setGameState(state);
  };

  // BLACKJACK INITIAL START
  const handleStartBlackjack = () => {
    if (!gameState) return;
    if (gameState.gold < 100) {
      addLog('⚠️ ゴールドが足りません！ (掛け金: 100G)');
      return;
    }

    const state = { ...gameState };
    state.gold -= 100;
    setGameState(state);

    setBjBetAmount(100);
    setBjStreakCount(0);
    setBjPotentialPayout(200);

    startNewBjRound(100, 0);
  };

  const startNewBjRound = (bet, streak) => {
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

  // CONTINUOUS INFINITE DOUBLE PUSH (勝負継続)
  const handleContinueDoublePush = () => {
    const nextStreak = bjStreakCount + 1;
    const nextBet = bjPotentialPayout;
    const nextPayout = nextBet * 2;

    setBjStreakCount(nextStreak);
    setBjBetAmount(nextBet);
    setBjPotentialPayout(nextPayout);

    addLog(`🔥 【${nextStreak}連勝目 倍プッシュ】 賞金 ${nextBet}G をそのまま賭けて勝負継続！ (勝利配当: ${nextPayout}G)`);
    sounds.playFanfare();

    startNewBjRound(nextBet, nextStreak);
  };

  // COLLECT EARNED PAYOUT & LEAVE CASINO
  const handleCollectPayoutAndExit = () => {
    if (!gameState) return;
    const state = { ...gameState };
    state.gold += bjPotentialPayout;
    setGameState(state);

    addLog(`💰 【利益確定】 ${bjStreakCount} 連勝を達成し、${bjPotentialPayout}G を手に入れて勝負を終えた！`);
    sounds.playFanfare();
    setActiveModal(null);
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
      setBjResultMsg(`💥 バースト！ 21を超えたため ${bjBetAmount}G 没収… (倍プッシュ失敗)`);
      sounds.playHit();
      addLog(`🎲 倍プッシュ失敗！ バーストにより賭け金 ${bjBetAmount}G 全額没収…`);
    }
  };

  const handleBjStand = () => {
    if (bjStatus !== 'PLAYING') return;
    resolveBjDealerTurn(bjPlayerHand, bjBetAmount);
  };

  const resolveBjDealerTurn = (pHand, currentBet) => {
    let dHand = [...bjDealerHand];
    let dScore = calcHandScore(dHand);

    while (dScore < 17) {
      dHand.push(getRandomCard());
      dScore = calcHandScore(dHand);
    }
    setBjDealerHand(dHand);

    const pScore = calcHandScore(pHand);
    setBjStatus('WIN_DECIDED');

    if (dScore > 21 || pScore > dScore) {
      const isBlackjack = pScore === 21 && pHand.length === 2;
      const payoutMultiplier = isBlackjack ? 2.5 : 2.0;
      const winPayout = Math.floor(currentBet * payoutMultiplier);
      setBjPotentialPayout(winPayout);

      const nextStreak = bjStreakCount + 1;
      const nextDoublePayout = winPayout * 2;

      if (isBlackjack) {
        setBjResultMsg(`🏆 BLACKJACK!! ${nextStreak}連勝達成！ (獲得賞金: ${winPayout}G / 次の倍プッシュ配当: ${nextDoublePayout}G)`);
      } else {
        setBjResultMsg(`🎉 勝負勝利！ ${nextStreak}連勝達成！ (獲得賞金: ${winPayout}G / 次の倍プッシュ配当: ${nextDoublePayout}G)`);
      }
      sounds.playFanfare();
    } else if (pScore === dScore) {
      setBjStatus('FINISHED');
      const state = { ...gameState };
      state.gold += currentBet;
      setGameState(state);
      setBjResultMsg(`⚖️ 引き分け (Push)！ 賭け金${currentBet}Gが手元に戻りました。`);
      sounds.playSelect();
      addLog('🎲 ギャンブルは引き分け！ 賭け金が手元に戻った。');
    } else {
      setBjStatus('FINISHED');
      setBjResultMsg(`💸 敗北… ギャンブラーに ${currentBet}G 奪われました。`);
      sounds.playHit();
      addLog(`🎲 倍プッシュ敗北… 賭け金${currentBet}Gは全額没収された。`);
    }
  };

  // BUY PET (Keep modal open for continuous buying - UNLIMITED PETS!)
  const handleBuyPetFromNpc = (petType) => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player, companions } = state;

    const petTemplates = {
      WOLF: { name: 'オオカミ', emoji: '🐺', cost: 120, hp: 40, atk: 12, def: 4 },
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
    const newPet = {
      id: `pet_bought_${Date.now()}_${Math.random()}`,
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

    // UNLIMITED PETS (NO PUSH-OUT)
    companions.push(newPet);

    addLog(`✨ ${tpl.cost}G を支払って ${tpl.emoji} ${tpl.name} を新しい仲間ペットに雇った！ (大軍団: 計${companions.length}体)`);
    sounds.playFanfare();
    setGameState(state);
  };

  // HEAL PET & REVIVE FRIENDLY NPCS AT TAMER
  const handleHealPetAtNpc = () => {
    if (!gameState) return;
    const state = { ...gameState };
    const { companions, npcs, gold, floor } = state;

    if (gold < 50) {
      addLog('⚠️ ゴールドが足りません！ (治療・復活費: 50G)');
      return;
    }

    state.gold -= 50;
    companions.forEach((c) => {
      c.hp = c.maxHp;
    });

    // Check missing NPCs and revive them!
    const ALL_TYPES = ['SMITH', 'IDENTIFIER', 'SHOP', 'TELLER', 'GAMBLER', 'TAMER'];
    const currentTypes = npcs.map((n) => n.type);
    const missingTypes = ALL_TYPES.filter((t) => !currentTypes.includes(t));

    // Helper function to find adjacent unoccupied floor
    const getEmptyAdjacentPos = (px, py) => {
      const offsets = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
        { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 },
      ];
      for (const off of offsets) {
        const tx = px + off.x;
        const ty = py + off.y;
        if (state.grid[ty]?.[tx] === 'F') {
          const occupied =
            (state.player.x === tx && state.player.y === ty) ||
            state.npcs.some((n) => n.x === tx && n.y === ty) ||
            state.companions.some((c) => c.x === tx && c.y === ty);
          if (!occupied) return { x: tx, y: ty };
        }
      }
      return { x: px + 1, y: py };
    };

    let revivedCount = 0;
    missingTypes.forEach((mType) => {
      const template = FRIENDLY_NPCS.find((f) => f.type === mType);
      if (template) {
        const pos = getEmptyAdjacentPos(state.player.x, state.player.y);
        state.npcs.push({
          id: `revived_${Date.now()}_${Math.random()}`,
          name: template.name,
          emoji: template.emoji,
          type: template.type,
          x: pos.x,
          y: pos.y,
          hp: 150 + Math.floor(floor * 20),
          maxHp: 150 + Math.floor(floor * 20),
          atk: 18 + Math.floor(floor * 3.5),
          def: 15 + Math.floor(floor * 2.5),
        });
        revivedCount++;
      }
    });

    if (revivedCount > 0) {
      addLog(`✨ 💖 50G を支払って ペット全員の治療 ＆ 気絶していた友好NPC ${revivedCount} 人を奇跡の完全復活させた！！`);
      sounds.playFanfare();
    } else {
      addLog(`✨ 50G を支払って ペット全員 (${companions.length}体) および 友好NPC の傷を完治させた！`);
      sounds.playHeal();
    }
    setGameState(state);
  };

  // 👨‍🔬 ALCHEMIST: INJECT LEGENDARY EGO ATTRIBUTE
  const handleInjectEgoAtAlchemist = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 150) {
      addLog('⚠️ ゴールドが足りません！ (錬成費: 150G)');
      return;
    }
    if (!equippedWeapon && !equippedShield) {
      addLog('⚠️ エゴ属性を注入する装備品を装着していません！');
      return;
    }

    state.gold -= 150;
    const egoPool = ['全知全能', '吸血', '魔法反射', '暗視', '会心', '狂乱'];
    const chosenEgo = egoPool[Math.floor(Math.random() * egoPool.length)];

    const targetEquip = equippedWeapon || equippedShield;
    targetEquip.enchantments = targetEquip.enchantments || [];
    if (!targetEquip.enchantments.includes(chosenEgo)) {
      targetEquip.enchantments.push(chosenEgo);
    }
    targetEquip.atkBonus = (targetEquip.atkBonus || 0) + 5;
    targetEquip.name = `✨ 秘錬の ${targetEquip.name.replace(/✨ 秘錬の /g, '')}`;

    addLog(`👨‍🔬 錬金術師ゼノが秘薬を振りかけ、${targetEquip.name} に最高級エゴ【${chosenEgo}】を確定注入した！ (ATK+5)`);
    sounds.playMagic();
    setGameState(state);
  };

  // 📜 SCHOLAR: RECHARGE SPELLBOOKS
  const handleRechargeSpellbooksAtScholar = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 100) {
      addLog('⚠️ ゴールドが足りません！ (充填費: 100G)');
      return;
    }

    let rechargedCount = 0;
    state.inventory.forEach((item) => {
      if (item.category === 'SPELLBOOK') {
        item.uses = (item.uses || 0) + 5;
        rechargedCount++;
      }
    });

    if (rechargedCount > 0) {
      state.gold -= 100;
      addLog(`📜 🧙‍♀️ 魔法学者ルーンが魔力を注入し、手持ちの魔法書 ${rechargedCount} 冊の使用回数を +5 充填した！`);
      sounds.playMagic();
    } else {
      addLog('⚠️ 充填できる魔法書を持っていません！');
    }
    setGameState(state);
  };

  // 💃 DANCER: PARTY BUFF DANCE
  const handleDanceBuffAtDancer = () => {
    if (!gameState) return;
    const state = { ...gameState };
    if (state.gold < 60) {
      addLog('⚠️ ゴールドが足りません！ (おひねり: 60G)');
      return;
    }

    state.gold -= 60;
    state.player.atk += 8;
    state.player.def += 5;
    state.companions.forEach((c) => {
      c.atk += 5;
      c.def += 3;
    });

    addLog('💃 踊り子リリィが情熱的な応援ダンスを披露！ パーティー全員のテンションが上がり ATK+8 / DEF+5 の超強力バフ発動！');
    sounds.playFanfare();
    setGameState(state);
  };

  // 🧔‍♂️ BODYGUARD: HIRE HUMAN BODYGUARD TARO
  const handleHireBodyguardAtTaro = () => {
    if (!gameState) return;
    const state = { ...gameState };
    const { player, companions } = state;

    if (state.gold < 120) {
      addLog('⚠️ ゴールドが足りません！ (用心棒契約料: 120G)');
      return;
    }

    state.gold -= 120;
    const bodyguardPet = {
      id: `bodyguard_${Date.now()}`,
      name: '用心棒タロ兵衛',
      emoji: '🥷',
      x: player.x - 1,
      y: player.y,
      hp: 120 + state.floor * 15,
      maxHp: 120 + state.floor * 15,
      atk: 22 + state.floor * 3,
      def: 12 + state.floor * 2,
      level: 1,
      exp: 0,
      inventory: [],
      equippedWeapon: null,
      equippedShield: null,
    };

    companions.push(bodyguardPet);
    addLog(`✨ 🥷 120G で頼もしい【用心棒タロ兵衛 (HP:${bodyguardPet.hp} ATK:${bodyguardPet.atk})】と護衛契約を結び、同行参戦させた！`);
    sounds.playFanfare();
    setGameState(state);
  };

  const handleRenamePet = () => {
    if (!gameState || gameState.companions.length === 0) return;
    const state = { ...gameState };
    const targetPet = state.companions[selectedPetIdx];
    if (!targetPet) return;

    const name = newPetName.trim() || targetPet.name;
    targetPet.name = name;
    addLog(`🏷️ 仲間ペットの名前を 【${name}】 に変更した！`);
    sounds.playSelect();
    setGameState(state);
    setActiveModal(null);
  };

  const handleEquipItem = (item) => {
    if (!gameState) return;
    const isShield = item.type === 'SHIELD' || item.name?.includes('盾');

    if (isShield) {
      const nextEquipped = equippedShield?.id === item.id ? null : item;
      setEquippedShield(nextEquipped);
      const diffDef = (nextEquipped?.defBonus || 0) - (equippedShield?.defBonus || 0);
      gameState.player.def += diffDef;
      addLog(nextEquipped ? `🛡️ 【装備】 ${item.name} を盾として装着した！ (DEF +${item.defBonus || 0})` : `🛡️ 【解除】 ${item.name} を外した。`);
    } else {
      const nextEquipped = equippedWeapon?.id === item.id ? null : item;
      setEquippedWeapon(nextEquipped);
      const diffAtk = (nextEquipped?.atkBonus || 0) - (equippedWeapon?.atkBonus || 0);
      gameState.player.atk += diffAtk;
      addLog(nextEquipped ? `⚔️ 【装備】 ${item.name} を武器として装着した！ (ATK +${item.atkBonus || 0})` : `⚔️ 【解除】 ${item.name} を外した。`);
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
        if (gameState?.companions?.length > 0) {
          setSelectedPetIdx(0);
          setNewPetName(gameState.companions[0].name);
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
            <div className="bg-black/90 border-4 border-yellow-400 px-8 py-4 rounded-xl text-2xl sm:text-4xl text-yellow-300 font-bold tracking-widest text-shadow-retro animate-pulse">
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

        {/* Quick Position Swap Button for Mobile/Touch UI */}
        {gameState && !activeModal && gameState.companions?.length > 0 && (
          <div className="absolute bottom-28 left-4 z-20">
            <button
              onClick={() => handleSwapPositionWithPet()}
              className="px-3 py-2 bg-emerald-700/90 hover:bg-emerald-600 border-2 border-emerald-400 rounded-lg text-white font-bold text-xs shadow-xl active:scale-95 transition-transform flex items-center space-x-1"
            >
              <span>🔄 位置チェンジ ({gameState.companions.length}体)</span>
            </button>
          </div>
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
          onOpenJarInputModal={handleOpenJarInputModal}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* JAR INPUT SELECTION MODAL */}
      {activeModal === 'JAR_INPUT' && selectedJar && gameState && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-amber-500 rounded-xl p-5 max-w-md w-full text-white text-center font-retro shadow-2xl">
            <div className="text-3xl mb-1">{selectedJar.emoji}</div>
            <h3 className="text-yellow-300 font-bold mb-1">【{selectedJar.name}】に投入するアイテムを選択</h3>
            <p className="text-xs text-gray-300 mb-3">
              容量: {(selectedJar.capacity || 4) - (selectedJar.contents?.length || 0)} / {selectedJar.capacity || 4}
            </p>

            <div className="flex flex-col space-y-1.5 max-h-60 overflow-y-auto pr-1 mb-4 text-xs">
              {gameState.inventory
                .filter((i) => i.id !== selectedJar.id)
                .map((invItem) => (
                  <button
                    key={invItem.id}
                    onClick={() => handlePutItemIntoJar(invItem)}
                    className="py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded flex justify-between items-center text-left"
                  >
                    <span>{invItem.emoji} {invItem.name}</span>
                    <span className="text-amber-400 font-bold">投入 ➔</span>
                  </button>
                ))}
            </div>

            <button
              onClick={() => setActiveModal('INVENTORY')}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded text-xs"
            >
              キャンセルして戻る
            </button>
          </div>
        </div>
      )}

      {/* ALL 6 FRIENDLY NPC INTERACTIVE MODAL */}
      {activeModal === 'NPC_DIALOGUE' && npcSpeech && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-white rounded-xl p-5 max-w-md w-full text-white text-center font-retro shadow-2xl">
            <div className="text-4xl mb-2">{npcSpeech.npc.emoji}</div>
            <div className="text-yellow-400 font-bold mb-1">【{npcSpeech.npc.name}】</div>
            <div className="text-xs text-yellow-300 font-bold mb-3">所持金: {gameState.gold}G</div>
            <p className="text-sm leading-relaxed mb-4 bg-black/60 p-3 rounded border border-gray-700">
              「{npcSpeech.text}」
            </p>

            <div className="flex flex-col space-y-2 text-xs">
              {/* 👷 鍛冶屋 (Smith & Crafting) */}
              {npcSpeech.npc.emoji === '👷' && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleUpgradeEquipmentAtSmith}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>🔨 100G で装備を鍛錬・強化する (攻撃/防御UP & 採掘強化)</span>
                  </button>

                  <div className="text-yellow-300 font-bold text-[11px] pt-1">🧱 素材クラフト武具錬成 (素材を消費):</div>
                  <button
                    onClick={() => handleCraftAtSmith('DRAGON_SLAYER')}
                    className="w-full py-1.5 bg-red-950 hover:bg-red-900 border border-red-600 rounded flex justify-between px-3 text-[11px]"
                  >
                    <span>⚔️ 🔥 狂乱の 鋼鉄製 ⚔️ ドラゴンスレイヤー (ATK+18)</span>
                    <span className="text-yellow-300">🪨鉄鉱石 + 150G</span>
                  </button>
                  <button
                    onClick={() => handleCraftAtSmith('DRAGON_SHIELD')}
                    className="w-full py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600 rounded flex justify-between px-3 text-[11px]"
                  >
                    <span>🛡️ 🌙 暗夜の ダイヤ製 🛡️ 竜鱗の鏡盾 (DEF+12)</span>
                    <span className="text-yellow-300">💎魔法の結晶 + 150G</span>
                  </button>
                </div>
              )}

              {/* 🧙 鑑定士 (Identifier) */}
              {npcSpeech.npc.emoji === '🧙' && (
                <button
                  onClick={handleIdentifyAllAtWizard}
                  className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                >
                  <span>🔮 50G で手持ちの未識別アイテムを全鑑定する</span>
                </button>
              )}

              {/* 👨 道具屋 (Shopkeeper - Dynamic Random Catalog) */}
              {npcSpeech.npc.emoji === '👨' && (
                <div className="border-t border-gray-700 pt-2 flex flex-col space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div className="text-yellow-300 font-bold text-[11px]">🎲 本日の日替わり商品 (出会うたびに品揃え変化):</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {currentShopCatalog.map((shopItem) => (
                      <button
                        key={shopItem.id}
                        onClick={() => handleBuyDynamicShopItem(shopItem)}
                        className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded flex justify-between px-2 text-[10px]"
                      >
                        <span>{shopItem.emoji} {shopItem.name} {shopItem.uses ? `[${shopItem.uses}個]` : ''}</span>
                        <span className="text-yellow-300 font-bold">{shopItem.cost}G</span>
                      </button>
                    ))}
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
                      else if (invItem.category === 'ARTIFACT') price = 500;
                      else if (invItem.category === 'MATERIAL') price = 40 * (invItem.uses || 1);
                      else if (invItem.category === 'EQUIPMENT') price = 80;
                      else if (invItem.category === 'JAR') price = 60;
                      else if (invItem.category === 'SPELLBOOK') price = 50 * (invItem.uses || 1);

                      return (
                        <button
                          key={invItem.id}
                          onClick={() => handleSellItemToShop(invItem)}
                          className="py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 rounded flex justify-between px-2 text-[10px]"
                        >
                          <span>{invItem.emoji} {invItem.name} {invItem.uses ? `[個数:${invItem.uses}]` : ''}</span>
                          <span className="text-yellow-300 font-bold">売却: +{price}G</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* 🧕 占い師 (Fortune Teller & Gemini AI Artifact Summon) */}
              {npcSpeech.npc.emoji === '🧕' && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleFortuneTell}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>✨ 80G で全マップと魔物の位置を占う (透視)</span>
                  </button>
                  <button
                    onClick={handleSummonGeminiArtifactAtFortuneTeller}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-800 via-pink-700 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-yellow-300 font-bold rounded border border-yellow-400 shadow-xl animate-pulse flex items-center justify-center space-x-1"
                  >
                    <span>🤖 200G で Gemini AI に祈り、神器を即興創世・降臨させる</span>
                  </button>
                </div>
              )}

              {/* 🤵 ギャンブラー (Gambler) */}
              {npcSpeech.npc.emoji === '🤵' && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <div className="text-yellow-300 font-bold text-[11px]">🎰 カジノミニゲームを選択 (賭け金: 100G):</div>
                  <button
                    onClick={handleStartBlackjack}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>🃏 1. 連勝無限倍プッシュ！ ブラックジャック 21</span>
                  </button>
                  <button
                    onClick={handleStartRoulette}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>⚡ 2. 高速目押しルーレット勝負 (反射神経・連続プレイ可能)</span>
                  </button>
                </div>
              )}

              {/* 🧔 魔物使い (Tamer - UNLIMITED PET PURCHASING) */}
              {npcSpeech.npc.emoji === '🧔' && (
                <div className="border-t border-gray-700 pt-2 flex flex-col space-y-1.5">
                  <div className="text-yellow-300 font-bold text-[11px] mb-1">
                    🐾 新しいペットを連れ出す (現在: {gameState.companions.length}体・無制限!):
                  </div>
                  <button onClick={() => handleBuyPetFromNpc('WOLF')} className="py-1.5 bg-blue-900 hover:bg-blue-800 rounded flex justify-between px-3">
                    <span>🐺 オオカミ (バランス型)</span><span className="text-yellow-300">120G</span>
                  </button>
                  <button onClick={() => handleBuyPetFromNpc('CAT')} className="py-1.5 bg-purple-900 hover:bg-purple-800 rounded flex justify-between px-3">
                    <span>🐈 キャット (回避重視)</span><span className="text-yellow-300">80G</span>
                  </button>
                  <button onClick={() => handleBuyPetFromNpc('DRAGON')} className="py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 rounded flex justify-between px-3">
                    <span>🐉 ベビードラゴン (超強力)</span><span className="text-yellow-300">250G</span>
                  </button>

                  <button
                    onClick={handleHealPetAtNpc}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded flex items-center justify-center space-x-1 mt-2"
                  >
                    <span>💖 50G でペット治療 ＆ 気絶NPCを全員完全復活させる</span>
                  </button>
                </div>
              )}

              {/* 👨‍🔬 錬金術師ゼノ (Alchemist) */}
              {(npcSpeech.npc.emoji === '👨‍🔬' || npcSpeech.npc.emoji === '🧪') && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleInjectEgoAtAlchemist}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>👨‍🔬 150G で装備に【全知全能 / 吸血 / 魔法反射】等の最高級エゴを確定注入する</span>
                  </button>
                </div>
              )}

              {/* 🧙‍♀️ 魔法学者ルーン (Scholar) */}
              {(npcSpeech.npc.emoji === '🧙‍♀️' || npcSpeech.npc.emoji === '📜') && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleRechargeSpellbooksAtScholar}
                    className="w-full py-2.5 bg-cyan-800 hover:bg-cyan-700 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>📜 🧙‍♀️ 100G で手持ち全『魔法書』の使用回数を +5 充填（リチャージ）する</span>
                  </button>
                </div>
              )}

              {/* 💃 踊り子リリィ (Dancer) */}
              {npcSpeech.npc.emoji === '💃' && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleDanceBuffAtDancer}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded shadow-lg animate-bounce"
                  >
                    <span>💃 60G で熱狂応援ダンスをリクエストする (全員ATK+8 / DEF+5 大バフ)</span>
                  </button>
                </div>
              )}

              {/* 🥷 用心棒タロ兵衛 (Bodyguard) */}
              {(npcSpeech.npc.emoji === '🥷' || npcSpeech.npc.emoji === '🧔‍♂️' || npcSpeech.npc.emoji === '📦') && (
                <div className="flex flex-col space-y-2 border-t border-gray-700 pt-2">
                  <button
                    onClick={handleHireBodyguardAtTaro}
                    className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded flex items-center justify-center space-x-1 shadow"
                  >
                    <span>🥷 120G で超タフな【用心棒タロ兵衛】を忍者護衛としてパーティー同行契約する</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs mt-2"
              >
                会話を閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤵 GAMBLER SKILL GAME: CONTINUOUS TIMING EMOJI ROULETTE MODAL */}
      {activeModal === 'ROULETTE' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-yellow-950 border-4 border-yellow-400 rounded-xl p-5 max-w-md w-full text-white font-retro shadow-2xl flex flex-col items-center">
            <div className="text-2xl mb-1">🎰 🤵 目押しルーレット勝負</div>
            <div className="text-xs text-yellow-300 font-bold mb-2">所持金: {gameState.gold}G</div>
            <p className="text-xs text-yellow-200 mb-4 text-center">
              高速回転する絵文字を目で追い、👑 や 💎 のタイミングでストップボタンを押せ！
            </p>

            <div className="w-full bg-black h-20 rounded-lg border-4 border-yellow-400 flex items-center justify-center space-x-3 mb-4 overflow-hidden shadow-inner">
              <div className="text-4xl animate-bounce">
                {ROULETTE_ITEMS[rouletteIndex]}
              </div>
            </div>

            {rouletteResultMsg && (
              <div className="mb-4 text-xs font-bold text-center bg-black/80 p-2.5 rounded border border-yellow-400 text-yellow-300">
                {rouletteResultMsg}
              </div>
            )}

            <div className="flex flex-col space-y-2 w-full">
              {!rouletteResultMsg ? (
                <button
                  onClick={handleStopRoulette}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-base shadow-xl active:scale-95 transition-transform"
                >
                  🛑 STOP!! (目押し)
                </button>
              ) : (
                <div className="flex flex-col space-y-2 w-full">
                  <button
                    onClick={handleStartRoulette}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-yellow-300 font-bold rounded-lg text-xs shadow-xl border border-yellow-400 animate-pulse"
                  >
                    🔁 100G でもう一度目押しに挑戦 (連続勝負)
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs"
                  >
                    🚪 カジノを去る
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAMBLER (🤵) INFINITE DOUBLE-PUSH BLACKJACK MODAL */}
      {activeModal === 'BLACKJACK' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-emerald-950 border-4 border-yellow-400 rounded-xl p-5 max-w-md w-full text-white font-retro shadow-2xl flex flex-col items-center">
            <div className="text-2xl mb-1 flex items-center space-x-2">
              <span>🎰 🤵 倍プッシュ勝負</span>
              {bjStreakCount > 0 && (
                <span className="text-xs bg-red-600 text-yellow-300 px-2 py-0.5 rounded-full font-bold animate-pulse border border-yellow-400">
                  🔥 {bjStreakCount} 連勝中 ({bjBetAmount}G 賭け)
                </span>
              )}
            </div>
            <h3 className="text-yellow-300 font-bold text-xs mb-3 text-center">
              {bjStreakCount === 0
                ? '賭け金: 100G ➔ 勝利すれば倍プッシュで勝負継続可能！'
                : `【${bjStreakCount + 1}戦目】 現在の累積賭け金: ${bjBetAmount}G ➔ 勝利で ${bjPotentialPayout}G！`}
            </h3>

            <div className="w-full bg-emerald-900/60 p-3 rounded-lg border border-emerald-700 mb-3 flex flex-col items-center">
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

            <div className="w-full bg-emerald-900/60 p-3 rounded-lg border border-emerald-700 mb-3 flex flex-col items-center">
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
              <div className="mb-3 text-xs font-bold text-center bg-black/80 p-2.5 rounded border-2 border-yellow-400 text-yellow-300">
                {bjResultMsg}
              </div>
            )}

            <div className="flex flex-col space-y-2 w-full">
              {bjStatus === 'PLAYING' ? (
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={handleBjHit}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow text-xs"
                  >
                    🃏 ヒット (もう1枚)
                  </button>
                  <button
                    onClick={handleBjStand}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow text-xs"
                  >
                    ✋ 勝負！ (スタンド)
                  </button>
                </div>
              ) : bjStatus === 'WIN_DECIDED' ? (
                <div className="flex flex-col space-y-2 w-full">
                  <button
                    onClick={handleContinueDoublePush}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-yellow-300 font-bold rounded shadow-xl border-2 border-yellow-400 animate-pulse text-sm"
                  >
                    🔥 さらに倍プッシュ！ ({bjPotentialPayout}G を賭けて {bjPotentialPayout * 2}G 勝負へ継続！)
                  </button>
                  <button
                    onClick={handleCollectPayoutAndExit}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                  >
                    💰 利益確定！ ({bjPotentialPayout}G を手に入れて降りる)
                  </button>
                </div>
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

      {/* RENAME PET MODAL WITH PET SELECTOR */}
      {activeModal === 'RENAME_PET' && gameState?.companions?.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border-4 border-yellow-400 rounded-xl p-5 max-w-sm w-full text-white text-center font-retro shadow-2xl">
            <h3 className="text-yellow-400 font-bold mb-3">仲間ペットの名前変更 (N)</h3>

            {/* Pet Selector Tabs (Scrollable for Multi-Pet Army) */}
            <div className="flex space-x-1.5 overflow-x-auto justify-start mb-4 pb-1">
              {gameState.companions.map((pet, idx) => (
                <button
                  key={pet.id}
                  onClick={() => {
                    setSelectedPetIdx(idx);
                    setNewPetName(pet.name);
                  }}
                  className={`px-3 py-1.5 rounded border whitespace-nowrap text-xs shrink-0 ${
                    selectedPetIdx === idx
                      ? 'bg-yellow-500 text-black font-bold border-yellow-300'
                      : 'bg-gray-800 text-white border-gray-600'
                  }`}
                >
                  {pet.emoji} {pet.name}
                </button>
              ))}
            </div>

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
            <div className="text-red-400 text-xs font-bold tracking-widest mb-1">【強敵出現・階層裏ボス】</div>
            <h2 className="text-2xl text-yellow-300 font-bold mb-3">{bossInfo.name}</h2>
            <div className="text-xs text-yellow-400 mb-2">
              HP: {bossInfo.hp} / ATK: {bossInfo.atk} / DEF: {bossInfo.def}
            </div>
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
              伝説のアーティファクトを手に入れ、🥺の不思議な迷宮 最深部を見事踏破脱出した！
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
