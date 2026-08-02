# 3Dボクセル＆絵文字ローグライク RPG『🥺の不思議な迷宮』 🏰

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=flat-square&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r173-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

> **アセットレス×3Dボクセル×Unicode絵文字で紡がれる本格ターン制グリッドローグライクRPG！**  
> 『トルネコの大冒険』風のレトロUIと、マイクラ風の3D壁採掘、自律行動する可愛い仲間ペット、そして Gemini AI と連携するインタラクティブな迷宮探索ゲームです。

---

## 🌟 主な特徴 (Features)

### 🎨 1. 完全アセットレス設計 (Zero External Assets)
- **3Dボクセル＆絵文字スプライト**: 画像ファイル・3Dモデルファイルは一切使用していません！
- **カメラ追従ビルボード**: Unicode 絵文字 (`🥺`, `🐶`, `🗡️`, `🧱` など) を Three.js 上で常時カメラを向く立体スプライトとして描画。
- **自作Web Audio API 合成音**: 効果音やBGMも外部音声ファイルを使わず、ブラウザの Web Audio API による合成波形音源（SE）で自己完結しています。

### ⛏️ 2. ボクセル壁採掘＆ドロップシステム
- **材質別ボクセル壁**:
  - `🟫 土の壁` (HP: 20 / パン 🍞 ドロップ)
  - `🩶 石の壁` (HP: 50)
  - `🟦 鉱脈の壁` (HP: 100 / 鉱石の結晶 💎 ドロップ)
  - `⬛ 黒曜石の壁` (HP: 200)
- **動的破壊演出**: 掘るたびに壁テクスチャにひび割れが刻まれ、崩壊して新たな通路が開きます。頭上には3D HPバーと耐久値リアルタイム表示！

### 🐾 3. 高度な自律ペットAI＆テイム・命名システム
- **自律行動AI**: 仲間ペット（`🐶 ポチ` など）は自動で以下の判断・行動を行います：
  - 足元の落ちているアイテムを自律拾い・スタック
  - 拾った強力な武器・防具を自律判定で自動装備（Auto-Equip）
  - ピンチ時に所持している薬草・パンを自律使用して回復（Auto-Heal）
  - 重複マスを回避し、最寄りの魔物へ近接攻撃
- **テイム＆雇用**: 野生モンスターに `🥩 魔物の肉` や `📖 テイムの書` を投げ与えて仲間にするか、魔物使い（🧔）のショップで `🐺 オオカミ`, `🐈 キャット`, `🐉 ベビードラゴン` を雇用可能。
- **自由命名 (Rename)**: 【 **N** 】キーまたは設定ボタンから、ペットの名前をいつでも変更可能！

### 🤖 4. Gemini 3.5 Flash-lite AI セリフ連携
- Google AI Studio の `gemini-3.5-flash-lite` API と連携。
- 5F / 10F のボス登場時や、6種の友好NPCと会話する際に、現在の階層・プレイヤーの状況に応じた動的セリフをリアルタイム生成！（※APIキー未設定時は内蔵フォールバック生成で快適に動作します）

### 🎰 5. 本格カジノ＆カジノミニゲーム (Gambler 🤵)
- **🃏 ブラックジャック 21**: トランプ絵文字を使った手札計算＆Hit/Stand勝負！ (ナチュラル21で2.5倍配当)
- **⚡ 高速目押しルーレット**: 動神経・反射神経を研ぎ澄まし、高速回転する絵文字を目押しストップ！ (`👑`/`💎` で300G獲得)

### 👥 6. 全6種のインタラクティブ友好NPC
- 👷 **鍛冶屋**: 装備品の強化＆【採掘強化】エンチャント刻印
- 🧙 **鑑定士**: 道具袋の未識別アイテムを一括全鑑定
- 👨 **道具屋**: 薬草・高級パン・鋼鉄の剣の売買＆手持ちアイテム・鉱石の換金売却
- 🧕 **占い師**: 全マップ・階段・敵位置の透視開示
- 🤵 **ギャンブラー**: カジノミニゲーム（ブラックジャック＆目押しルーレット）
- 🧔 **魔物使い**: ペットの怪我治療＆新しいペットの雇用

---

## 🎮 操作方法 (Controls)

| 操作 | PC キーボード | モバイル・タッチ UI |
| :--- | :--- | :--- |
| **移動 / 攻撃の向き** | `W` / `A` / `S` / `D` または 矢印キー | 仮想D-Pad (十字キー) |
| **正面の攻撃・壁採掘** | `Space` キー | ⚔️ 攻撃・採掘ボタン |
| **足踏み（ターン経過・HP回復）** | `Wait` (画面ボタン) | ⏳ 足踏みボタン |
| **道具袋 (インベントリ)** | `I` キー | 🎒 道具ボタン |
| **ペットの名前変更** | `N` キー | 🏷️ ペット命名 |

---

## 🛠️ ローカル開発手順 (Local Development)

###  Prerequisites
- Node.js 18.x 以上
- npm 9.x 以上

### セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/dma-cmyk/pien-3d-roguelike.git
cd pien-3d-roguelike

# 依存パッケージのインストール
npm install

# 開発サーバーの起動 (※ポート 3100 で起動します)
npm run dev
```

ブラウザで `http://localhost:3100/` を開いてプレイできます。

### プロダクションビルド
```bash
npm run build
```

---

## 🚀 デプロイ (Deployment)

### Vercel
1. Vercel にログインし、GitHub リポジトリ `pien-3d-roguelike` をインポート。
2. Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Deploy ボタンを押すだけで完了です！

---

## 📜 ライセンス (License)

MIT License © 2026 dma-cmyk
