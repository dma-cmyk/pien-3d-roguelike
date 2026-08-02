import React, { useState, useEffect } from 'react';
import { JOB_CLASSES } from '../game/typesAndConstants';
import { getStoredApiKey, storeApiKey } from '../utils/geminiApi';
import { Key, Sparkles, User, Sword } from 'lucide-react';

export function TitleModal({ onStartGame }) {
  const [name, setName] = useState('冒険者');
  const [selectedJob, setSelectedJob] = useState('WARRIOR');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  const handleStart = () => {
    storeApiKey(apiKey);
    const finalName = name.trim() || '冒険者';
    onStartGame({
      playerName: finalName,
      jobClass: JOB_CLASSES[selectedJob],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 z-50 select-none overflow-y-auto">
      <div className="bg-gray-900 border-4 border-yellow-400 rounded-xl w-full max-w-xl p-6 font-retro shadow-2xl text-white my-auto">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="text-4xl sm:text-5xl mb-2 animate-bounce">🥺</div>
          <h1 className="text-2xl sm:text-3xl text-yellow-400 font-bold text-shadow-retro tracking-widest">
            🥺の不思議な迷宮
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-dot">3Dボクセル & 絵文字ローグライク RPG</p>
        </div>

        {/* Player Name Input */}
        <div className="mb-4">
          <label className="text-xs text-yellow-300 font-bold mb-1 flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>冒険者の名前:</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: たろう"
            className="w-full bg-gray-800 border-2 border-gray-600 rounded p-2 text-sm text-yellow-200 focus:border-yellow-400 focus:outline-none"
          />
        </div>

        {/* Job Selection (8 Classes) */}
        <div className="mb-4">
          <label className="text-xs text-yellow-300 font-bold mb-1.5 flex items-center space-x-1">
            <Sword className="w-4 h-4" />
            <span>職業選択:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
            {Object.values(JOB_CLASSES).map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                  selectedJob === job.id
                    ? 'bg-yellow-600/30 border-yellow-400 text-yellow-300 shadow-md'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-1 font-bold text-sm">
                  <span>{job.emoji}</span>
                  <span>{job.name}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{job.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Gemini API Key Input (Optional) */}
        <div className="mb-6 bg-gray-950 p-3 rounded border border-purple-900">
          <label className="text-xs text-purple-300 font-bold mb-1 flex items-center space-x-1">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Gemini API Key (任意・AIボス/会話の動的生成):</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... (未入力時はプリセットで動作)"
            className="w-full bg-gray-900 border border-purple-800 rounded p-1.5 text-xs text-purple-200 focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold py-3.5 rounded-lg border-2 border-yellow-300 text-base shadow-xl transition-all flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>冒険をはじめる！</span>
        </button>
      </div>
    </div>
  );
}
