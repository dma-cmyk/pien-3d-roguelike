import React from 'react';

export function MiniMap({ gameState, hasNightVision }) {
  const { grid, visitedGrid, visibleGrid, player, companion, companions, enemies, npcs, stairsPos } = gameState;
  const size = grid.length;
  const activePets = companions || (companion ? [companion] : []);

  // Dynamically scale cell size (px) so large maps fit in the minimap container
  const cellSizePx = Math.max(2.5, Math.min(6, Math.floor(130 / size)));

  return (
    <div className="absolute top-14 right-3 bg-black/85 border-2 border-gray-600 p-1 rounded-lg shadow-2xl z-20 pointer-events-none max-w-[175px] max-h-[175px] overflow-hidden">
      <div
        className="grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSizePx}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSizePx}px)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isVisible = hasNightVision || visibleGrid[y]?.[x];
            const isVisited = visitedGrid[y]?.[x];

            if (!isVisible && !isVisited) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-black/90"
                />
              );
            }

            // Check Entities
            const isPlayer = player.x === x && player.y === y;
            const isCompanion = activePets.some((c) => c.x === x && c.y === y);
            const isStairs = stairsPos.x === x && stairsPos.y === y;
            const isNpc = npcs.some((n) => n.x === x && n.y === y);
            const enemyHere = enemies.find((e) => e.x === x && e.y === y);

            if (isPlayer) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-blue-400 rounded-full animate-ping"
                />
              );
            }
            if (isCompanion && (isVisible || isVisited)) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-green-400 rounded-full"
                />
              );
            }
            if (isStairs && (isVisible || isVisited)) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-yellow-400"
                />
              );
            }
            if (enemyHere && isVisible) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className={`rounded-full ${enemyHere.isBoss ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`}
                />
              );
            }
            // Friendly NPCs (Cyan / Sky Blue pulsing dot for high visibility)
            if (isNpc && (isVisible || isVisited)) {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-cyan-400 rounded-full animate-pulse shadow-cyan-400/50 shadow font-bold"
                />
              );
            }

            if (cell === 'W') {
              return (
                <div
                  key={`${x}-${y}`}
                  style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                  className="bg-gray-700"
                />
              );
            }
            return (
              <div
                key={`${x}-${y}`}
                style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}
                className="bg-gray-900"
              />
            );
          })
        )}
      </div>
    </div>
  );
}
