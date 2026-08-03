// Gemini API Helper for Dynamic Roguelike Story, Bosses, Dialogues & AI Artifact Generation

const API_KEY_STORAGE_KEY = 'pien_gemini_api_key';

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function storeApiKey(key) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

// 🤖 DYNAMIC GEMINI BOSS GENERATOR (Scales dynamically per floor)
export async function generateBossData(floorNumber) {
  const apiKey = getStoredApiKey();
  const scaledHp = Math.floor(150 + floorNumber * 50);
  const scaledAtk = Math.floor(20 + floorNumber * 6);
  const scaledDef = Math.floor(10 + floorNumber * 3.5);

  if (!apiKey) {
    return getFallbackBoss(floorNumber, scaledHp, scaledAtk, scaledDef);
  }

  try {
    const prompt = `ローグライクRPG「🥺の不思議な迷宮」の地下${floorNumber}階に君臨する巨大ボスモンスターを創作してください。
地下${floorNumber}階にふさわしい、恐ろしくも個性的でかっこいいボス名と決めセリフを考えてください。
JSONフォーマットのみで返答してください。
JSON構造:
{
  "name": "地下${floorNumber}階の裏ボス名",
  "emoji": "ボスを表す迫力ある絵文字1文字 (🐉, 💀, 👿, 👹, 🐙, 👾, 👁️, 👑など)",
  "hp": ${scaledHp},
  "atk": ${scaledAtk},
  "def": ${scaledDef},
  "quote": "ボス登場時の威圧的な決めセリフ"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        ...parsed,
        hp: parsed.hp || scaledHp,
        atk: parsed.atk || scaledAtk,
        def: parsed.def || scaledDef,
      };
    }
  } catch (err) {
    console.warn('Gemini API Boss Gen failed, fallback used:', err);
  }
  return getFallbackBoss(floorNumber, scaledHp, scaledAtk, scaledDef);
}

export async function generateNpcDialogue(npcEmoji, npcName, gameState) {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return getFallbackDialogue(npcEmoji, npcName);
  }

  try {
    const prompt = `あなたはローグライクRPGのNPC「${npcEmoji} ${npcName}」です。
プレイヤー「${gameState?.playerName || '🥺'}」(地下${gameState?.floor || 1}階、HP:${gameState?.player?.hp}/${gameState?.player?.maxHp}) に話しかけられました。
世界観に合った個性的でユニークな1〜2文の会話セリフを日本語で作成してください。直テキストのみで返してください。`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return text.trim();
    }
  } catch (err) {
    console.warn('Gemini API Dialogue Gen failed, fallback used:', err);
  }
  return getFallbackDialogue(npcEmoji, npcName);
}

// DYNAMIC GEMINI AI ARTIFACT GENERATOR
export async function generateArtifactByGemini(floorNumber, playerName) {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return getFallbackArtifact(floorNumber);
  }

  try {
    const prompt = `ローグライクRPG「🥺の不思議な迷宮」の地下${floorNumber}階で発見される、世界に一つだけの超ユニークな「伝説のアーティファクト（神器）」を創作してください。
プレイヤー名: 「${playerName || '🥺'}」
JSONフォーマットのみで返答してください。
JSON構造:
{
  "name": "神々しい伝説アーティファクト名",
  "emoji": "適切な絵文字1文字 (👑, 🔮, 🔱, 💎, 🧿, 📿, 🌟など)",
  "effect": "神秘的な超絶効果のフレーバー説明",
  "atkBonus": ${20 + floorNumber * 4},
  "defBonus": ${15 + floorNumber * 3},
  "enchantments": ["全知全能", "会心", "暗視"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        id: `gemini_art_${Date.now()}`,
        name: `🤖 AI創世 ${parsed.name}`,
        emoji: parsed.emoji || '🔮',
        category: 'ARTIFACT',
        type: 'PHILOSOPHER_STONE',
        effect: parsed.effect || 'Gemini AIが創造した神秘の力',
        atkBonus: parsed.atkBonus || 25,
        defBonus: parsed.defBonus || 15,
        enchantments: parsed.enchantments || ['全知全能', '暗視'],
        isIdentified: true,
      };
    }
  } catch (err) {
    console.warn('Gemini API Artifact Gen failed, fallback used:', err);
  }
  return getFallbackArtifact(floorNumber);
}

function getFallbackBoss(floor, hp, atk, def) {
  const bossNames = [
    { name: `🔥 地下${floor}F 獄炎の魔竜`, emoji: '🐉', quote: '我が灼熱の炎で灰と化すがよい！' },
    { name: `💀 地下${floor}F 狂乱のデスロード`, emoji: '💀', quote: '貴様の魂を我がコレクションに加えよう…' },
    { name: `👑 地下${floor}F 迷宮の支配者・ぴえん帝`, emoji: '🥺', quote: '🥺 よくぞここまで到達した… 我を倒してみせよ！' },
    { name: `👿 地下${floor}F 虚無の魔神クラーケン`, emoji: '🐙', quote: '深淵の闇に呑まれて消え去れ！' },
    { name: `👹 地下${floor}F 冥府の破滅王バイモン`, emoji: '👹', quote: 'クハハハ！ 我が絶対的な力にひれ伏すがよい！' },
  ];
  const tpl = bossNames[(Math.floor(floor / 5) - 1) % bossNames.length] || bossNames[0];
  return {
    name: tpl.name,
    emoji: tpl.emoji,
    hp,
    atk,
    def,
    quote: tpl.quote,
  };
}

function getFallbackDialogue(npcEmoji, npcName) {
  return `${npcEmoji} ${npcName}: 「迷宮の奥深くには、Gemini AI が創世する固有ネーム持ちの超レアユニークモンスター『...』が潜んでいるという噂だぞ…！」`;
}

// 👾 DYNAMIC GEMINI UNIQUE NAMED RARE MONSTER GENERATOR (世界に一頭だけの『固有ネーム持ち超希少変異種』)
export async function generateUniqueMonsterByGemini(floorNumber, playerName) {
  const apiKey = getStoredApiKey();
  const scaledHp = Math.floor(120 + floorNumber * 35);
  const scaledAtk = Math.floor(18 + floorNumber * 5);
  const scaledDef = Math.floor(10 + floorNumber * 3);
  const scaledExp = Math.floor(300 + floorNumber * 70);

  if (!apiKey) {
    return getFallbackUniqueMonster(floorNumber, scaledHp, scaledAtk, scaledDef, scaledExp);
  }

  try {
    const prompt = `ローグライクRPG「🥺の不思議な迷宮」の地下${floorNumber}階に超低確率で出現する、絶対に他のモンスターと名前が被らない【固有の名前がついた世界に一体だけの超レア・ユニークモンスター】を創作してください。
名前は必ず『...』で囲み、二つ名＋固有ネームを付けてください（例: 『星喰らいの銀竜・ルミナス』, 『時空を穿つ者・クロノス』, 『夢幻の妖魔・リリス』, 『黄金の強奪者・ジャックpot』など）。
JSONフォーマットのみで返答してください。
JSON構造:
{
  "name": "『二重カギ括弧で囲んだ固有ネーム持ち超レアユニークモンスター名』",
  "emoji": "神秘的または超レアな絵文字1文字 (🦄, 🐉, 🦚, 🐲, 👾, 🌌, 🦤, 🐙, 🔮など)",
  "species": "種族名 (例: 伝説幻獣, 虚空神, 古代魔竜, 幻影変異種)",
  "hp": ${scaledHp},
  "atk": ${scaledAtk},
  "def": ${scaledDef},
  "exp": ${scaledExp},
  "specialAbility": "超レアならではの固有特性・技（例: 遠距離火炎ブレス, 会心必殺, 身軽回避, 黄金強奪）"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      let rawName = parsed.name || `『地下${floorNumber}階の幻獣・アルファ』`;
      if (!rawName.startsWith('『')) rawName = `『${rawName}』`;
      return {
        ...parsed,
        name: rawName,
        isUnique: true,
        hp: parsed.hp || scaledHp,
        maxHp: parsed.hp || scaledHp,
        atk: parsed.atk || scaledAtk,
        def: parsed.def || scaledDef,
        exp: parsed.exp || scaledExp,
      };
    }
  } catch (err) {
    console.warn('Gemini API Unique Monster Gen failed, fallback used:', err);
  }
  return getFallbackUniqueMonster(floorNumber, scaledHp, scaledAtk, scaledDef, scaledExp);
}

function getFallbackUniqueMonster(floorNumber, hp, atk, def, exp) {
  const fallbackNames = [
    '『黄金の覇者・ピエンキング』',
    '『時空を断つ銀翼竜・クロノス』',
    '『深淵の虹色スライム王・プリズム』',
    '『虚空を奔る光速魔獣・ゼウス』',
    '『夢幻の星喰らい・ルミナス』',
  ];
  const fallbackEmojis = ['🦄', '🐉', '🦚', '🐲', '🌌'];
  const idx = Math.floor(Math.random() * fallbackNames.length);

  return {
    name: fallbackNames[idx],
    emoji: fallbackEmojis[idx],
    species: '固有ネーム超希少種',
    isUnique: true,
    hp,
    maxHp: hp,
    atk,
    def,
    exp,
    specialAbility: '超高ステータス & 高経験値',
  };
}

function getFallbackArtifact(floor) {
  return {
    id: `art_fallback_${Date.now()}`,
    name: '👑 賢者の石',
    emoji: '👑',
    category: 'ARTIFACT',
    type: 'PHILOSOPHER_STONE',
    effect: '毎ターンHP自然回復 & 満腹度無限',
    atkBonus: 15 + floor * 2,
    defBonus: 10 + floor,
    enchantments: ['全知全能', '暗視'],
    isIdentified: true,
  };
}
