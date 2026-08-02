import React from 'react';

export function MiniMap({ gameState, hasNightVision }) {
  const { grid, visitedGrid, visibleGrid, player, companion, enemies, npcs, stairsPos } = gameState;
  const size = grid.length;

  return (
    <div className="absolute top-14 right-3 bg-black/75 border border-gray-600 p-1 rounded shadow-xl z-20 pointer-events-none">
      <div
        className="grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${size}, 6px)`,
          gridTemplateRows: `repeat(${size}, 6px)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isVisible = hasNightVision || visibleGrid[y]?.[x];
            const isVisited = visitedGrid[y]?.[x];

            if (!isVisible && !isVisited) {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-black/90" />;
            }

            // Check Entities
            const isPlayer = player.x === x && player.y === y;
            const isCompanion = companion && companion.x === x && companion.y === y;
            const isStairs = stairsPos.x === x && stairsPos.y === y;
            const isNpc = npcs.some((n) => n.x === x && n.y === y);
            const enemyHere = enemies.find((e) => e.x === x && e.y === y);

            if (isPlayer) {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-blue-400 rounded-full animate-ping" />;
            }
            if (isCompanion && isVisible) {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-green-400 rounded-full" />;
            }
            if (isStairs && (isVisible || isVisited)) {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-yellow-400" />;
            }
            if (enemyHere && isVisible) {
              return (
                <div
                  key={`${x}-${y}`}
                  className={`w-[6px] h-[6px] rounded-full ${enemyHere.isBoss ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`}
                />
              );
            }
            if (isNpc && isVisible) {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-emerald-400" />;
            }

            if (cell === 'W') {
              return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-gray-700" />;
            }
            return <div key={`${x}-${y}`} className="w-[6px] h-[6px] bg-gray-900" />;
          })
        )}
      </div>
    </div>
  );
}
