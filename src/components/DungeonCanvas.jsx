import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createNoiseTexture,
  createWallTextureWithCrack,
  createEmojiTexture,
  createHpBarTexture
} from '../utils/textureGenerator';
import { getFloorTheme } from '../game/typesAndConstants';

export function DungeonCanvas({ gameState, hasNightVision }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const mapGroupRef = useRef(null);
  const gameStateRef = useRef(gameState);

  // Keep state ref updated
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Initial Three.js Scene Setup
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    sceneRef.current = scene;

    // Perspective Camera for 3D retro voxel view
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer with Shadows & Pixel Ratio optimization
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 0.9);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);
    mapGroupRef.current = mapGroup;

    // Smooth Camera Follow Loop using Ref to prevent closure freezing
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const state = gameStateRef.current;
      if (state && state.player && cameraRef.current) {
        const targetX = state.player.x;
        const targetZ = state.player.y;

        // Smooth Lerp Camera Follow
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.15;
        cameraRef.current.position.z += (targetZ + 7.5 - cameraRef.current.position.z) * 0.15;
        cameraRef.current.position.y = 11.5;
        cameraRef.current.lookAt(targetX, 0, targetZ);
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount || !rendererRef.current || !cameraRef.current) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Render 3D Voxels, Sprites & Billboards on Game State Update
  useEffect(() => {
    if (!gameState || !mapGroupRef.current) return;

    const group = mapGroupRef.current;
    group.clear();

    const {
      grid,
      wallData,
      visitedGrid,
      visibleGrid,
      items,
      npcs,
      enemies,
      companions,
      companion,
      player,
      stairsPos,
      floor,
    } = gameState;

    const floorTheme = getFloorTheme(floor);
    const nightVision = hasNightVision;

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    const activePets = companions || (companion ? [companion] : []);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const isVisible = nightVision || visibleGrid[y]?.[x];
        const isVisited = visitedGrid[y]?.[x];

        if (!isVisible && !isVisited) continue;

        const opacity = isVisible ? 1.0 : 0.35;

        if (grid[y][x] === 'F') {
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

    // Render Stairs 🪜
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

    // Render Items
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

    // Render NPCs
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

    // Render All Active Companion Pets 🐾
    activePets.forEach((pet) => {
      if (nightVision || visibleGrid[pet.y]?.[pet.x]) {
        const petMat = new THREE.SpriteMaterial({
          map: createEmojiTexture(pet.emoji),
          transparent: true,
        });
        const petSprite = new THREE.Sprite(petMat);
        petSprite.center.set(0.5, 0.2);
        petSprite.position.set(pet.x, 0.65, pet.y);
        petSprite.scale.set(1.15, 1.15, 1);
        petSprite.renderOrder = 20;
        group.add(petSprite);

        const tagMat = new THREE.SpriteMaterial({
          map: createHpBarTexture(`${pet.name} Lv.${pet.level}`, pet.hp, pet.maxHp),
          transparent: true,
          depthTest: false,
        });
        const tagSprite = new THREE.Sprite(tagMat);
        tagSprite.position.set(pet.x, 1.4, pet.y);
        tagSprite.scale.set(1.4, 0.35, 1);
        tagSprite.renderOrder = 30;
        group.add(tagSprite);
      }
    });

    // Render Enemies
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

    // Render Player 🥺
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
