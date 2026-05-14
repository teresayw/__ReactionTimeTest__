/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, AlertCircle, Timer, RotateCcw, TrendingUp } from 'lucide-react';

// 遊戲狀態定義
type GameState = 'idle' | 'waiting' | 'ready' | 'too-early' | 'result';

export default function App() {
  const [state, setState] = useState<GameState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  
  // 使用 useRef 避免重新渲染，並精準紀錄時間
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // 清除計時器的清理函數
  const clearGameTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    setState('waiting');
    setReactionTime(null);
    
    // 隨機等待 1 到 5 秒
    const randomDelay = Math.floor(Math.random() * 4000) + 1000;
    
    timerRef.current = window.setTimeout(() => {
      setState('ready');
      startTimeRef.current = performance.now();
    }, randomDelay);
  }, []);

  // 結束遊戲（成功點擊）
  const handleSuccess = useCallback(() => {
    const endTime = performance.now();
    const time = Math.round(endTime - startTimeRef.current);
    setReactionTime(time);
    setState('result');
    setHistory(prev => [time, ...prev].slice(0, 10)); // 只保留最近 10 筆
  }, []);

  // 提早點擊判定
  const handleTooEarly = useCallback(() => {
    clearGameTimer();
    setState('too-early');
  }, [clearGameTimer]);

  // 主要互動邏輯
  const handleInteraction = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    // 阻止某些預設行為（像是空白鍵滾動頁面）
    if (e && 'key' in e && e.key === ' ') {
      e.preventDefault();
    }

    switch (state) {
      case 'idle':
      case 'too-early':
      case 'result':
        startGame();
        break;
      case 'waiting':
        handleTooEarly();
        break;
      case 'ready':
        handleSuccess();
        break;
    }
  }, [state, startGame, handleTooEarly, handleSuccess]);

  // 鍵盤監聽（空白鍵）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInteraction]);

  // 計算平均時間
  const averageTime = history.length > 0 
    ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) 
    : 0;

  // 根據狀態回傳背景顏色類別
  const getBgColor = () => {
    switch (state) {
      case 'waiting': return 'bg-sky-500';
      case 'ready': return 'bg-emerald-500';
      case 'too-early': return 'bg-rose-500';
      case 'result': return 'bg-gray-100';
      default: return 'bg-white';
    }
  };

  return (
    <div 
      ref={gameAreaRef}
      onClick={() => handleInteraction()}
      className={`game-container transition-colors duration-200 ${getBgColor()}`}
      id="game-root"
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center px-6"
            id="screen-idle"
          >
            <div className="mb-6 inline-flex p-4 rounded-full bg-sky-50 text-sky-600">
              <Zap size={48} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              反應力測試
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
              當畫面變成 <span className="text-emerald-600 font-bold">綠色</span> 時，以最快速度點擊。
            </p>
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200">
              點擊畫面或空白鍵開始
            </button>
          </motion.div>
        )}

        {state === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white"
            id="screen-waiting"
          >
            <div className="mb-6 animate-pulse">
              <Timer size={80} />
            </div>
            <h2 className="text-5xl font-black mb-2">稍等一下...</h2>
            <p className="text-xl opacity-90">等到變綠色再按喔！</p>
          </motion.div>
        )}

        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center text-white"
            id="screen-ready"
          >
            <h2 className="text-8xl font-black drop-shadow-lg uppercase tracking-wider">
              按下去！
            </h2>
          </motion.div>
        )}

        {state === 'too-early' && (
          <motion.div
            key="too-early"
            initial={{ x: [-10, 10, -10, 10, 0] }}
            animate={{ x: 0 }}
            className="text-center text-white p-8"
            id="screen-too-early"
          >
            <AlertCircle size={80} className="mx-auto mb-6" />
            <h2 className="text-5xl font-black mb-4">太早了！</h2>
            <p className="text-2xl mb-8">還沒變綠色就按了，再試一次吧。</p>
            <div className="inline-block px-6 py-3 border-2 border-white/50 rounded-xl font-bold hover:bg-white/10 transition-colors">
              點擊重試
            </div>
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl mx-auto px-6"
            id="screen-result"
          >
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-gray-200 border border-gray-100">
              <div className="text-center mb-10">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">
                  測試結果
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-7xl font-black text-gray-900 tabular-nums">
                    {reactionTime}
                  </span>
                  <span className="text-2xl font-bold text-gray-400 pt-4">ms</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <TrendingUp size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">平均反應</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">
                    {averageTime} <span className="text-sm font-normal text-gray-500">ms</span>
                  </div>
                </div>
                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                  <div className="flex items-center gap-2 text-sky-600 mb-1">
                    <Zap size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">測試次數</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">
                    {history.length}
                  </div>
                </div>
              </div>

              {history.length > 1 && (
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    近期記錄
                  </p>
                  <div className="flex gap-2 overflow-hidden">
                    {history.map((time, i) => (
                      <div 
                        key={`${time}-${i}`} 
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                          i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {time}ms
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                id="btn-restart"
              >
                <RotateCcw size={20} className="group-hover:rotate-45 transition-transform" />
                重新測試
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 text-gray-400 font-medium pointer-events-none">
        按 <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-mono text-gray-600 border border-gray-200">SPACE</span> 或點擊任何地方開始
      </div>
    </div>
  );
}
