import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createNoiseTexture,
  createWallTextureWithCrack,
  createEmojiTexture,
  createHpBarTexture,
} from '../utils/textureGenerator';
import { getFloorTheme } from '../game/typesAndConstants';

export function DungeonCanvas({ gameState, hasNightVision }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesGroupRef = useRef(null);

  // Keep a mutable ref to current gameState to bypass React closure stales in requestAnimationFrame
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const hasNightVisionRef = useRef(hasNightVision);
  hasNightVisionRef.current = hasNightVision;

  // 1. Initialize Three.js Engine & Continuous Camera Lerp Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    sceneRef.current = scene;

    const initialPlayer = gameStateRef.current.player;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(initialPlayer.x, 10, initialPlayer.y + 7.5);
    camera.lookAt(initialPlayer.x, 0.5, initialPlayer.y);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    meshesGroupRef.current = group;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const floorTheme = getFloorTheme(gameStateRef.current.floor);
    const dirLight = new THREE.DirectionalLight(floorTheme.lightColor, 0.85);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Camera follow animation loop using latest gameStateRef
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current && gameStateRef.current) {
        const curPlayer = gameStateRef.current.player;
        const targetCamX = curPlayer.x;
        const targetCamZ = curPlayer.y + 7.5;

        // Lerp camera position
        cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.2;
        cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.2;
        cameraRef.current.position.y = 10;
        cameraRef.current.lookAt(cameraRef.current.position.x, 0.5, cameraRef.current.position.z - 7.5);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Re-build / Sync 3D Scene whenever gameState updates
  useEffect(() => {
    if (!meshesGroupRef.current || !gameState) return;
    const group = meshesGroupRef.current;

    // Clear previous dynamic meshes
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const {
      floor,
      grid,
      wallData,
      visitedGrid,
      visibleGrid,
      player,
      companion,
      enemies,
      npcs,
      items,
      stairsPos,
    } = gameState;

    const floorTheme = getFloorTheme(floor);
    const nightVision = hasNightVision;

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    // Render Floor and Wall Voxels
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const isVisible = nightVision || visibleGrid[y]?.[x];
        const isVisited = visitedGrid[y]?.[x];

        if (!isVisible && !isVisited) continue; // Fog of War

        const opacity = isVisible ? 1.0 : 0.35;

        if (grid[y][x] === 'F') {
          // Floor Tile
          const floorMat = new THREE.MeshStandardMaterial({
            map: createNoiseTexture(floorTheme.floorColor, 25),
            transparent: true,
            opacity: opacity,
            roughness: 0.8,
          });
          const floorMesh = new THREE.Mesh(planeGeo, floorMat);
          floorMesh.rotation.x = -Math.PI / 2;
          floorMesh.position.set(x, 0, y);
          floorMesh.receiveShadow = true;
          group.add(floorMesh);
        } else if (grid[y][x] === 'W') {
          // Wall Voxel Block
          const wData = wallData[y]?.[x];
          const wallColor = wData?.color || floorTheme.wallColor;

          let crackLevel = 0;
          if (wData && wData.hp < wData.maxHp) {
            const ratio = wData.hp / wData.maxHp;
            if (ratio <= 0.25) crackLevel = 3;
            else if (ratio <= 0.5) crackLevel = 2;
            else if (ratio <= 0.75) crackLevel = 1;
          }

          const wallMat = new THREE.MeshStandardMaterial({
            map: createWallTextureWithCrack(wallColor, crackLevel),
            transparent: true,
            opacity: opacity,
            roughness: 0.6,
          });

          const wallMesh = new THREE.Mesh(boxGeo, wallMat);
          wallMesh.position.set(x, 0.5, y);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          group.add(wallMesh);

          // Render Overhead HP Bar on Wall if Damaged
          if (wData && wData.hp < wData.maxHp && isVisible) {
            const hpMat = new THREE.SpriteMaterial({
              map: createHpBarTexture(wData.name, wData.hp, wData.maxHp),
              transparent: true,
              depthTest: false,
            });
            const hpSprite = new THREE.Sprite(hpMat);
            hpSprite.position.set(x, 1.3, y);
            hpSprite.scale.set(1.4, 0.35, 1);
            hpSprite.renderOrder = 30;
            group.add(hpSprite);
          }
        }
      }
    }

    // Render Stairs 🪜 Billboard
    if (nightVision || visibleGrid[stairsPos.y]?.[stairsPos.x] || visitedGrid[stairsPos.y]?.[stairsPos.x]) {
      const stairMat = new THREE.SpriteMaterial({
        map: createEmojiTexture('🪜'),
        transparent: true,
      });
      const stairSprite = new THREE.Sprite(stairMat);
      stairSprite.center.set(0.5, 0.2);
      stairSprite.position.set(stairsPos.x, 0.5, stairsPos.y);
      stairSprite.scale.set(1.1, 1.1, 1);
      stairSprite.renderOrder = 15;
      group.add(stairSprite);
    }

    // Render Items Billboards
    items.forEach((item) => {
      if (nightVision || visibleGrid[item.y]?.[item.x]) {
        const itemMat = new THREE.SpriteMaterial({
          map: createEmojiTexture(item.emoji),
          transparent: true,
        });
        const itemSprite = new THREE.Sprite(itemMat);
        itemSprite.center.set(0.5, 0.2);
        itemSprite.position.set(item.x, 0.4, item.y);
        itemSprite.scale.set(0.9, 0.9, 1);
        itemSprite.renderOrder = 15;
        group.add(itemSprite);
      }
    });

    // Render Friendly NPCs Billboards & Tag
    npcs.forEach((npc) => {
      if (nightVision || visibleGrid[npc.y]?.[npc.x]) {
        const npcMat = new THREE.SpriteMaterial({
          map: createEmojiTexture(npc.emoji),
          transparent: true,
        });
        const npcSprite = new THREE.Sprite(npcMat);
        npcSprite.center.set(0.5, 0.2);
        npcSprite.position.set(npc.x, 0.65, npc.y);
        npcSprite.scale.set(1.2, 1.2, 1);
        npcSprite.renderOrder = 20;
        group.add(npcSprite);

        const tagMat = new THREE.SpriteMaterial({
          map: createHpBarTexture(npc.name, npc.hp, npc.maxHp),
          transparent: true,
          depthTest: false,
        });
        const tagSprite = new THREE.Sprite(tagMat);
        tagSprite.position.set(npc.x, 1.4, npc.y);
        tagSprite.scale.set(1.3, 0.32, 1);
        tagSprite.renderOrder = 30;
        group.add(tagSprite);
      }
    });

    // Render Companion Pet Billboard & Tag
    if (companion) {
      if (nightVision || visibleGrid[companion.y]?.[companion.x]) {
        const petMat = new THREE.SpriteMaterial({
          map: createEmojiTexture(companion.emoji),
          transparent: true,
        });
        const petSprite = new THREE.Sprite(petMat);
        petSprite.center.set(0.5, 0.2);
        petSprite.position.set(companion.x, 0.65, companion.y);
        petSprite.scale.set(1.15, 1.15, 1);
        petSprite.renderOrder = 20;
        group.add(petSprite);

        const tagMat = new THREE.SpriteMaterial({
          map: createHpBarTexture(`${companion.name} Lv.${companion.level}`, companion.hp, companion.maxHp),
          transparent: true,
          depthTest: false,
        });
        const tagSprite = new THREE.Sprite(tagMat);
        tagSprite.position.set(companion.x, 1.4, companion.y);
        tagSprite.scale.set(1.4, 0.35, 1);
        tagSprite.renderOrder = 30;
        group.add(tagSprite);
      }
    }

    // Render Enemies Billboards & HP Tag
    enemies.forEach((enemy) => {
      if (nightVision || visibleGrid[enemy.y]?.[enemy.x]) {
        const enemyMat = new THREE.SpriteMaterial({
          map: createEmojiTexture(enemy.emoji),
          transparent: true,
        });
        const enemySprite = new THREE.Sprite(enemyMat);
        const scale = enemy.isBoss ? 2.0 : 1.2;
        enemySprite.center.set(0.5, 0.2);
        enemySprite.position.set(enemy.x, enemy.isBoss ? 0.9 : 0.65, enemy.y);
        enemySprite.scale.set(scale, scale, 1);
        enemySprite.renderOrder = 20;
        group.add(enemySprite);

        const tagMat = new THREE.SpriteMaterial({
          map: createHpBarTexture(enemy.name, enemy.hp, enemy.maxHp),
          transparent: true,
          depthTest: false,
        });
        const tagSprite = new THREE.Sprite(tagMat);
        tagSprite.position.set(enemy.x, enemy.isBoss ? 2.0 : 1.4, enemy.y);
        tagSprite.scale.set(enemy.isBoss ? 2.0 : 1.3, enemy.isBoss ? 0.5 : 0.32, 1);
        tagSprite.renderOrder = 30;
        group.add(tagSprite);
      }
    });

    // Render Player Billboard 🥺 & HP Tag
    const playerMat = new THREE.SpriteMaterial({
      map: createEmojiTexture(player.emoji),
      transparent: true,
    });
    const playerSprite = new THREE.Sprite(playerMat);
    playerSprite.center.set(0.5, 0.2);
    playerSprite.position.set(player.x, 0.65, player.y);
    playerSprite.scale.set(1.3, 1.3, 1);
    playerSprite.renderOrder = 25;
    group.add(playerSprite);

    const playerHpMat = new THREE.SpriteMaterial({
      map: createHpBarTexture(`${player.name} Lv.${player.level}`, player.hp, player.maxHp),
      transparent: true,
      depthTest: false,
    });
    const playerHpSprite = new THREE.Sprite(playerHpMat);
    playerHpSprite.position.set(player.x, 1.45, player.y);
    playerHpSprite.scale.set(1.5, 0.38, 1);
    playerHpSprite.renderOrder = 30;
    group.add(playerHpSprite);

  }, [gameState, hasNightVision]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
