// Gemini API Integration (gemini-3.5-flash-lite) with Complete Offline Fallback

const API_KEY_STORAGE_KEY = 'pien_gemini_api_key';

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

export function storeApiKey(key) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

/**
 * Call Gemini API with direct fetch
 */
async function callGeminiApi(prompt) {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('No API Key');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.8,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

/**
 * Fallback Boss Data Generator
 */
const DEFAULT_BOSSES = {
  5: {
    name: '迷宮の中ボス ぴえん魔王',
    emoji: '👹',
    quote: 'よくぞここまで辿り着いたぴえん！貴様の冒険もここまでだ！',
    hp: 150,
    atk: 18,
    def: 8,
  },
  10: {
    name: '混沌の邪神 ぴえんドラゴン',
    emoji: '🐉',
    quote: '我は迷宮の深淵を司る者… ぴえんの涙を喰らい、終焉を与えん！',
    hp: 350,
    atk: 32,
    def: 15,
  },
};

/**
 * Generate Boss Data dynamically via Gemini API or return preset
 */
export async function generateBossData(floor) {
  const isFinalBoss = floor >= 10;
  const targetFloorStr = isFinalBoss ? '10階の最終ラスボス' : '5階の中ボス';

  const prompt = `あなたはローグライクRPG『🥺の不思議な迷宮』のダンジョンマスターです。
${targetFloorStr}のボスキャラクターを1体考案し、以下の形式のJSONのみを出力してください。余計な解説は不要です。

JSONフォーマット例:
{
  "name": "ボスの名前",
  "emoji": "👹",
  "quote": "強烈な決め台詞(30文字以内)",
  "hp": ${isFinalBoss ? 350 : 150},
  "atk": ${isFinalBoss ? 30 : 16},
  "def": ${isFinalBoss ? 14 : 8}
}

ルール:
- emojiは王道の強そうな絵文字(👹, 🐉, 👿, 💀, 👁️, 🪓)から1つ選択。
- nameとquoteには「ぴえん」「🥺」「迷宮」を絡めて味わい深くしてください。`;

  try {
    const rawText = await callGeminiApi(prompt);
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || (isFinalBoss ? 'ぴえんドラゴン' : 'ぴえん魔王'),
        emoji: parsed.emoji || (isFinalBoss ? '🐉' : '👹'),
        quote: parsed.quote || '我を倒せると思うなよぴえん！',
        hp: Number(parsed.hp) || (isFinalBoss ? 350 : 150),
        atk: Number(parsed.atk) || (isFinalBoss ? 30 : 16),
        def: Number(parsed.def) || (isFinalBoss ? 14 : 8),
      };
    }
  } catch (err) {
    console.warn('Using default fallback boss due to:', err.message);
  }

  return DEFAULT_BOSSES[floor] || DEFAULT_BOSSES[5];
}

/**
 * Fallback NPC Dialogues
 */
const DEFAULT_NPC_DIALOGUES = {
  '👨': 'いらっしゃい！ダンジョン探索には準備が不可欠だよ。良いアイテムを揃えていきな！',
  '🧙': 'ふむ…私に任せれば未識別の壺や巻物の真の力を鑑定してあげよう。',
  '👷': 'カカッ！壁を彫るなら強固な武器と採掘強化のエンチャントが必要だぜ！',
  '🧕': 'あなたの未来が見える…深層には恐ろしいボスと奇跡の宝が眠っているわ。',
  '🧔': 'おいおい、可愛いペットを連れているじゃないか！しっかり育てれば頼もしい相棒になるぞ。',
  '🤵': 'ひひっ！運試しといくかい？一獲千金を狙うなら私とギャンブルしようじゃないか！',
};

/**
 * Generate dynamic NPC Dialogue via Gemini API
 */
export async function generateNpcDialogue(npcEmoji, npcName, gameState) {
  const { playerName, className, floor, hp, maxHp, companion } = gameState;
  const petInfo = companion ? `仲間ペット:${companion.name}(Lv.${companion.level})` : '仲間ペット:なし';

  const prompt = `ローグライクRPG『🥺の不思議な迷宮』の友好NPC「${npcName}」として、冒険者の「${playerName}」（職業:${className}, 階層:${floor}F, HP:${hp}/${maxHp}, ${petInfo}）に話しかけるセリフを1言（40文字以内）で生成してください。
雰囲気は温かく個性的で、レトロローグライクRPG風にしてください。セリフテキストのみを出力してください。`;

  try {
    const text = await callGeminiApi(prompt);
    if (text && text.length < 80) return text.replace(/^"|"$/g, '');
  } catch (err) {
    console.warn('Using fallback NPC dialogue due to:', err.message);
  }

  return DEFAULT_NPC_DIALOGUES[npcEmoji] || '無事を祈っているぞ、冒険者よ！';
}
