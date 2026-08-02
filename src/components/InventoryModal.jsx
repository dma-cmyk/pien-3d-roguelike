import React, { useState } from 'react';
import { X, Package } from 'lucide-react';

export function InventoryModal({
  inventory,
  equippedWeapon,
  equippedShield,
  onUseItem,
  onEquipItem,
  onOpenJarInputModal,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  // Tab Filters
  const filteredItems = inventory.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ARTIFACT') return item.category === 'ARTIFACT';
    if (activeTab === 'EQUIPMENT') return item.category === 'EQUIPMENT' || item.name?.includes('覚醒神具');
    if (activeTab === 'SPELLBOOK') return item.category === 'SPELLBOOK';
    if (activeTab === 'CONSUMABLE') return item.category === 'CONSUMABLE';
    if (activeTab === 'MATERIAL') return item.category === 'MATERIAL';
    if (activeTab === 'JAR') return item.category === 'JAR';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 select-none">
      <div className="bg-gray-900 border-4 border-white rounded-xl w-full max-w-lg p-4 font-retro shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2.5 mb-3">
          <div className="flex items-center space-x-2 text-yellow-400 text-base sm:text-lg font-bold">
            <Package className="w-5 h-5" />
            <span>道具袋 ({inventory.length}/20)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 7 Filter Tabs (Responsive Grid layout to prevent squishing) */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 border-b border-gray-800 pb-3 mb-3 text-xs">
          {[
            { id: 'ALL', label: 'すべて' },
            { id: 'JAR', label: '🏺 壺' },
            { id: 'EQUIPMENT', label: '⚔️ 装備' },
            { id: 'SPELLBOOK', label: '📖 魔法' },
            { id: 'CONSUMABLE', label: '🧪 消費' },
            { id: 'MATERIAL', label: '🧱 素材' },
            { id: 'ARTIFACT', label: '🏆 神器' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-1 rounded-md font-bold transition-all text-center flex items-center justify-center whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-yellow-500 border-yellow-300 text-black shadow-md scale-105'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inventory List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              このカテゴリのアイテムはありません
            </div>
          ) : (
            filteredItems.map((item) => {
              const isWeaponEquipped = equippedWeapon?.id === item.id;
              const isShieldEquipped = equippedShield?.id === item.id;
              const isEquipped = isWeaponEquipped || isShieldEquipped;
              const isEquipable =
                item.category === 'EQUIPMENT' ||
                item.type === 'WEAPON' ||
                item.type === 'SHIELD' ||
                item.name?.includes('覚醒神具');

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    item.name?.includes('覚醒神具') || item.category === 'ARTIFACT'
                      ? 'bg-gradient-to-r from-yellow-950/90 via-amber-900/70 to-red-950/90 border-yellow-400 shadow-xl'
                      : isEquipped
                      ? 'bg-indigo-950/80 border-indigo-500'
                      : 'bg-gray-800/80 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                    <div className="text-2xl sm:text-3xl shrink-0">{item.emoji}</div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span
                          className={`font-bold truncate ${
                            item.name?.includes('覚醒神具') || item.category === 'ARTIFACT'
                              ? 'text-yellow-300 text-sm'
                              : 'text-white'
                          }`}
                        >
                          {item.name}
                        </span>

                        {isEquipped && (
                          <span className="bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 animate-pulse">
                            【装備中】
                          </span>
                        )}

                        {item.uses !== undefined && (
                          <span className="bg-amber-600 text-yellow-100 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">
                            【{item.uses}個】
                          </span>
                        )}

                        {item.category === 'JAR' && (
                          <span className="bg-orange-800 text-orange-200 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">
                            容量: {(item.capacity || 4) - (item.contents?.length || 0)}/{item.capacity || 4} 〈{item.contents?.length > 0 ? `${item.contents.length}個保管中` : '空'}〉
                          </span>
                        )}
                      </div>

                      {/* Details / Stats */}
                      <div className="text-gray-400 text-[11px] mt-0.5 space-x-2">
                        {item.category === 'ARTIFACT' && (
                          <span className="text-yellow-200 font-bold">{item.effect}</span>
                        )}
                        {item.atkBonus > 0 && <span>攻撃+{item.atkBonus}</span>}
                        {item.defBonus > 0 && <span>防御+{item.defBonus}</span>}
                        {item.heal > 0 && <span>回復量: {item.heal}</span>}
                        {item.foodRestore > 0 && <span>満腹度回復: {item.foodRestore}</span>}
                        {item.category === 'MATERIAL' && <span>クラフト強化用素材</span>}
                        {item.category === 'SPELLBOOK' && <span>呪文・魔法書アイテム</span>}
                        {item.category === 'CONSUMABLE' && !item.heal && !item.foodRestore && (
                          <span>消費アイテム</span>
                        )}
                        {item.enchantments?.length > 0 && (
                          <span className="text-cyan-300 font-bold">
                            【{item.enchantments.join(', ')}】
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Jar Put-In Button */}
                    {item.category === 'JAR' && onOpenJarInputModal && (
                      <button
                        onClick={() => onOpenJarInputModal(item)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded text-xs shadow transition-transform active:scale-95 flex items-center space-x-1"
                      >
                        <span>🏺 入れる</span>
                      </button>
                    )}

                    {/* Equipment Equip/Unequip Button for Weapons, Shields, and Awakened Artifacts */}
                    {isEquipable && (
                      <button
                        onClick={() => onEquipItem(item)}
                        className={`px-3 py-1.5 font-bold rounded text-xs shadow transition-transform active:scale-95 ${
                          isEquipped
                            ? 'bg-purple-700 hover:bg-purple-600 text-white'
                            : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black border border-yellow-300 font-extrabold'
                        }`}
                      >
                        {isEquipped ? '外す' : '装備'}
                      </button>
                    )}

                    {/* Consumables / Spellbooks / Pure Artifacts Use Button */}
                    {(item.category === 'CONSUMABLE' ||
                      item.category === 'SPELLBOOK' ||
                      (item.category === 'ARTIFACT' && !isEquipable)) && (
                      <button
                        onClick={() => onUseItem(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow transition-transform active:scale-95"
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

        {/* Footer Hint */}
        <div className="border-t border-gray-800 pt-2.5 mt-3 text-[11px] text-gray-400 text-center flex items-center justify-center space-x-1">
          <span>🏺</span>
          <span>壺に装備を連続で放り込むと合成強化され、アイテムを入れると変化・識別が起こります！</span>
        </div>
      </div>
    </div>
  );
}
