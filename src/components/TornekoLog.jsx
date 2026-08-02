import React, { useEffect, useRef } from 'react';

export function TornekoLog({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full bg-black/90 border-t-2 border-white p-2.5 font-retro text-xs text-white h-24 sm:h-28 overflow-y-auto z-20 shadow-2xl">
      <div className="flex flex-col space-y-1">
        {logs.slice(-20).map((log, idx) => (
          <div
            key={idx}
            className={`leading-relaxed tracking-wide ${
              log.includes('ダメージ')
                ? 'text-red-300'
                : log.includes('レベルアップ')
                ? 'text-yellow-300 font-bold'
                : log.includes('移動')
                ? 'text-cyan-300'
                : 'text-gray-200'
            }`}
          >
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
