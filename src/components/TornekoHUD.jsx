import React from 'react';

export function TornekoHUD({ gameState }) {
  const { floor, player, companion, companions, gold } = gameState;
  const activePets = companions || (companion ? [companion] : []);

  return (
    <div className="w-full bg-black border-b-2 border-white px-3 py-1.5 font-retro text-xs sm:text-sm text-white flex flex-wrap items-center justify-between shadow-lg select-none z-20">
      {/* Floor & Level */}
      <div className="flex items-center space-x-3">
        <span className="text-yellow-400 font-bold tracking-wider">
          🏰 {floor}F
        </span>
        <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
          {player.emoji} {player.name} (Lv.{player.level})
        </span>
      </div>

      {/* HP & Saturation */}
      <div className="flex items-center space-x-4 my-1 sm:my-0">
        {/* HP */}
        <div className="flex items-center space-x-1.5">
          <span className="text-red-400 font-bold">HP:</span>
          <div className="w-20 sm:w-28 bg-gray-900 border border-gray-600 h-4 rounded relative overflow-hidden">
            <div
              className="bg-red-600 h-full transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold drop-shadow">
              {player.hp}/{player.maxHp}
            </span>
          </div>
        </div>

        {/* Saturation */}
        <div className="flex items-center space-x-1">
          <span className="text-amber-400">🍞</span>
          <span className={player.food <= 20 ? 'text-red-500 font-bold animate-pulse' : 'text-amber-200'}>
            {player.food}/100
          </span>
        </div>
      </div>

      {/* Stats & Gold */}
      <div className="flex items-center space-x-3">
        <span className="text-yellow-300">🪙 {gold}G</span>
        <span className="text-gray-300">⚔️{player.atk}</span>
        <span className="text-gray-300">🛡️{player.def}</span>

        {/* Companion Pets Status (Unlimited Multi-Pet Army List) */}
        {activePets.length > 0 && (
          <div className="flex items-center space-x-1.5 border-l border-gray-700 pl-2 text-green-400 max-w-xs sm:max-w-md overflow-x-auto">
            <span className="text-[10px] text-yellow-300 font-bold shrink-0">🐾 仲間({activePets.length}):</span>
            {activePets.map((pet) => (
              <div key={pet.id} className="flex items-center space-x-0.5 shrink-0 bg-gray-900 px-1 py-0.5 rounded border border-gray-800">
                <span>{pet.emoji}</span>
                <span className="text-[9px] text-gray-300">({pet.hp}/{pet.maxHp})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
