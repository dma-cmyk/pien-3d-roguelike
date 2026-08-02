import React from 'react';
import { Shield, Sparkles, Backpack, RotateCw, Pickaxe, Moon } from 'lucide-react';

export function VirtualPad({ onDirection, onAction }) {
  return (
    <div className="absolute inset-x-0 bottom-28 top-auto px-4 py-2 flex items-end justify-between pointer-events-none select-none z-30">
      {/* Left: D-Pad */}
      <div className="pointer-events-auto bg-black/60 backdrop-blur-sm p-2 rounded-full border border-gray-700 shadow-2xl flex flex-col items-center">
        <button
          onClick={() => onDirection({ x: 0, y: -1 })}
          className="w-12 h-12 bg-gray-800 hover:bg-gray-700 active:bg-yellow-600 rounded-t-lg border border-gray-600 flex items-center justify-center text-lg active:scale-95 transition-transform"
        >
          ▲
        </button>
        <div className="flex space-x-1 my-1">
          <button
            onClick={() => onDirection({ x: -1, y: 0 })}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700 active:bg-yellow-600 rounded-l-lg border border-gray-600 flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            ◀
          </button>
          <button
            onClick={() => onAction('WAIT')}
            className="w-10 h-12 bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-yellow-400 font-bold active:scale-95"
            title="足踏み回復"
          >
            💤
          </button>
          <button
            onClick={() => onDirection({ x: 1, y: 0 })}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700 active:bg-yellow-600 rounded-r-lg border border-gray-600 flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => onDirection({ x: 0, y: 1 })}
          className="w-12 h-12 bg-gray-800 hover:bg-gray-700 active:bg-yellow-600 rounded-b-lg border border-gray-600 flex items-center justify-center text-lg active:scale-95 transition-transform"
        >
          ▼
        </button>
      </div>

      {/* Right: Action Buttons */}
      <div className="pointer-events-auto flex flex-col space-y-2 items-end">
        <div className="flex space-x-2">
          {/* Magic Button */}
          <button
            onClick={() => onAction('MAGIC')}
            className="w-12 h-12 rounded-full bg-purple-900/80 hover:bg-purple-800 border-2 border-purple-400 flex flex-col items-center justify-center text-purple-200 shadow-lg active:scale-90 transition-transform"
            title="魔法発動 (M)"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-bold">魔法</span>
          </button>

          {/* Inventory Button */}
          <button
            onClick={() => onAction('INVENTORY')}
            className="w-12 h-12 rounded-full bg-blue-900/80 hover:bg-blue-800 border-2 border-blue-400 flex flex-col items-center justify-center text-blue-200 shadow-lg active:scale-90 transition-transform"
            title="道具袋 (I)"
          >
            <Backpack className="w-5 h-5" />
            <span className="text-[9px] font-bold">道具</span>
          </button>
        </div>

        {/* Big Attack / Mine Action Button */}
        <button
          onClick={() => onAction('ATTACK_MINE')}
          className="w-16 h-16 rounded-full bg-red-900/90 hover:bg-red-800 border-4 border-red-500 flex flex-col items-center justify-center text-white font-bold shadow-2xl active:scale-90 transition-transform"
          title="攻撃・採掘 (Space)"
        >
          <Pickaxe className="w-7 h-7" />
          <span className="text-[10px]">掘る/斬る</span>
        </button>
      </div>
    </div>
  );
}
