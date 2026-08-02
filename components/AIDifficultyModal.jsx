import React, { useState } from 'react';
import { Cpu, X, Zap, Crown, Sliders, ChevronDown } from 'lucide-react';

export default function AIDifficultyModal({ isOpen, onClose, onStartMatch }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('standard');
  const [customBluffRate, setCustomBluffRate] = useState(0.20);
  const [showCustomSlider, setShowCustomSlider] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');

  if (!isOpen) return null;

  const handleStart = () => {
    let bluffRate = 0.20;
    if (selectedDifficulty === 'beginner') bluffRate = 0.35;
    if (selectedDifficulty === 'grandmaster') bluffRate = 0.12;
    if (selectedDifficulty === 'custom') bluffRate = customBluffRate;

    onStartMatch({
      mode: 'ai',
      difficulty: selectedDifficulty,
      bluffRate,
      playerColor
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-800 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Play vs Shadow Bot</h2>
              <p className="text-xs text-slate-500 font-medium">Configure AI Difficulty & Bluff Rate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Selection Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Difficulty
          </label>
          <div className="grid grid-cols-1 gap-3">
            
            {/* Beginner */}
            <button
              type="button"
              onClick={() => { setSelectedDifficulty('beginner'); setShowCustomSlider(false); }}
              className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
                selectedDifficulty === 'beginner'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Beginner</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 font-mono">
                    35% Bluff Rate
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Frequent, visible bluffs</p>
              </div>
            </button>

            {/* Standard */}
            <button
              type="button"
              onClick={() => { setSelectedDifficulty('standard'); setShowCustomSlider(false); }}
              className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
                selectedDifficulty === 'standard'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Standard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
                    20% Bluff Rate
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Balanced & sneaky bluffs</p>
              </div>
            </button>

            {/* Grandmaster */}
            <button
              type="button"
              onClick={() => { setSelectedDifficulty('grandmaster'); setShowCustomSlider(false); }}
              className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
                selectedDifficulty === 'grandmaster'
                  ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Grandmaster</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 font-mono">
                    12% Bluff Rate
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Sharp chess, rare bluffs</p>
              </div>
            </button>

          </div>
        </div>

        {/* Custom Slider Accordion */}
        <div className="border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => {
              setShowCustomSlider(!showCustomSlider);
              if (!showCustomSlider) setSelectedDifficulty('custom');
            }}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" /> Advanced Custom Bluff Rate
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCustomSlider ? 'rotate-180' : ''}`} />
          </button>

          {showCustomSlider && (
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Custom Rate:</span>
                <span className="font-mono text-indigo-600 text-sm">
                  {Math.round(customBluffRate * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={customBluffRate}
                onChange={(e) => setCustomBluffRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5% (Rare)</span>
                <span>50% (Wild)</span>
              </div>
            </div>
          )}
        </div>

        {/* Color Choice */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Your Piece Color</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPlayerColor('white')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                playerColor === 'white' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Crown className="w-4 h-4" /> White
            </button>

            <button
              type="button"
              onClick={() => setPlayerColor('black')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                playerColor === 'black' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Crown className="w-4 h-4 fill-current" /> Black
            </button>

            <button
              type="button"
              onClick={() => setPlayerColor('random')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                playerColor === 'random' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" /> Random
            </button>
          </div>
        </div>

        {/* Start Game Action */}
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-base py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <Zap className="w-5 h-5" /> Start Practice Match
        </button>

      </div>
    </div>
  );
}
