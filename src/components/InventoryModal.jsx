import React, { useState } from 'react';
import { X, Package, Shield, Wand2, Sparkles, Layers } from 'lucide-react';

export function InventoryModal({ inventory, equippedWeapon, equippedShield, onUseItem, onEquipItem, onSynthesize, onClose }) {
  const [activeTab, setActiveTab] = useState('ALL');

  // Tab Filters
  const filteredItems = inventory.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'EQUIPMENT') return item.category === 'EQUIPMENT';
    if (activeTab === 'SPELLBOOK') return item.category === 'SPELLBOOK';
    if (activeTab === 'CONSUMABLE') return item.category === 'CONSUMABLE';
    if (activeTab === 'MATERIAL') return item.category === 'MATERIAL';
    if (activeTab === 'JAR') return item.category === 'JAR';
    if (activeTab === 'MONEY') return item.category === 'MONEY';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-gray-900 border-4 border-white rounded-lg w-full max-w-lg p-4 font-retro shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm sm:text-base">
            <Package className="w-5 h-5" />
            <span>道具袋 ({inventory.length}/20)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 6 Filter Tabs */}
        <div className="flex space-x-1 border-b border-gray-800 pb-2 mb-3 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'すべて' },
            { id: 'EQUIPMENT', label: '⚔️ 装備' },
            { id: 'SPELLBOOK', label: '📖 魔法' },
            { id: 'CONSUMABLE', label: '🧪 消費' },
            { id: 'MATERIAL', label: '🧱 素材' },
            { id: 'JAR', label: '🏺 壺' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-yellow-600 border-yellow-300 text-black font-bold'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-xs">該当するアイテムを持っていません</div>
          ) : (
            filteredItems.map((item) => {
              const isEquippedWep = equippedWeapon?.id === item.id;
              const isEquippedShd = equippedShield?.id === item.id;
              const isEquipped = isEquippedWep || isEquippedShd;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded border flex items-center justify-between transition-colors ${
                    isEquipped ? 'bg-indigo-950 border-indigo-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5 text-xs text-white">
                        <span>{item.name}</span>
                        {item.uses && <span className="text-[10px] bg-yellow-900 border border-yellow-500 text-yellow-300 px-1 rounded font-bold">[{item.uses}回]</span>}
                        {isEquipped && <span className="text-[10px] bg-indigo-600 px-1 rounded font-bold">[装備中]</span>}
                        {item.enchantments?.map((e, idx) => (
                          <span key={idx} className="text-[9px] bg-purple-900 border border-purple-500 text-purple-200 px-1 rounded">
                            {e}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.category === 'EQUIPMENT' && `攻撃+${item.atkBonus || 0} 防御+${item.defBonus || 0}`}
                        {item.category === 'SPELLBOOK' && `呪文・魔法書アイテム`}
                        {item.category === 'CONSUMABLE' && (item.heal ? `回復量: ${item.heal}` : '消費アイテム')}
                        {item.category === 'MATERIAL' && `クラフト強化用素材 (所持数: ${item.uses || 1})`}
                        {item.category === 'JAR' && `合成可能 (容量: ${item.capacity - (item.contents?.length || 0)})`}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 text-xs">
                    {item.category === 'EQUIPMENT' && (
                      <button
                        onClick={() => onEquipItem(item)}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-[11px]"
                      >
                        {isEquipped ? '外す' : '装備'}
                      </button>
                    )}

                    {(item.category === 'CONSUMABLE' || item.category === 'SPELLBOOK') && (
                      <button
                        onClick={() => onUseItem(item)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[11px]"
                      >
                        使用
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-800 pt-2 mt-2 text-[11px] text-gray-400 text-center">
          💡 素材アイテム 🧱 は鍛冶屋で強力な武具クラフトに使用できます
        </div>
      </div>
    </div>
  );
}
