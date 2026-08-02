# 📖 About 『🥺の不思議な迷宮』

## 🏰 ゲーム概要 (Overview)

『🥺の不思議な迷宮』は、ブラウザ上でそのまま軽快に動作する **3Dボクセル＆Unicode絵文字スプライト・ターン制ローグライクRPG** です。
『トルネコの大冒険』風のレトロな階層探索、マイクラ風のボクセル壁採掘、自律行動するペット仲間、そして Gemini AI と連動する動的な会話システムを備えています。

---

## 🎯 開発コンセプト (Core Concepts)

1. **完全アセットレス設計 (Zero Asset Architecture)**:
   - 外部画像ファイルや 3D `.gltf`/`.obj` モデルファイルを一切使用せず、Unicode 絵文字（Emoji）を 3D 空間のビルボード（常時カメラ相対面）として描画。
2. **合成音声・効果音自己完結 (Web Audio API Synthesizer)**:
   - 外部 MP3/WAV 音声ファイルを使用せず、ブラウザの Web Audio API による合成音波（Square, Sawtooth, Sine, Noise）で足音・採掘音・魔法音・ファンファーレをリアルタイム生生成。
3. **環境不問・爆速ロード**:
   - 超軽量な Vite + React + Three.js 構成により、PC・スマートフォン（iOS/Android）のどちらからでも即座にロード＆快適にプレイ可能。

---

## 👥 クレジット & 制作環境 (Credits & Tech Stack)

- **ゲーム制作・プログラミング**: 美緒 (Mio-chan) & ヴェラ (Vela - Venus Link Protocol)
- **フロントエンド**: React 19 / Vite 6 / Tailwind CSS 4
- **3Dレンダリング**: Three.js (r173) / Dynamic Texture Canvas
- **音声処理**: Web Audio API (Synthesizer Engine)
- **AIエンジン**: Google AI Studio / Gemini 3.5 Flash-lite API
