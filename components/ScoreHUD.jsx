import React from 'react';
import { Crown, Award } from 'lucide-react';

export default function ScoreHUD({ roomState, playerRole }) {
  if (!roomState) return null;

  const { scores, turn, players } = roomState;
  const isWhiteTurn = turn === 'w';

  return (
    <div className="w-full bg-white/90 border border-slate-200 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-slate-800">
      
      {/* White Player Profile & DSP Score */}
      <div className={`flex items-center gap-4 p-3 rounded-xl border transition w-full md:w-auto ${
        isWhiteTurn ? 'bg-blue-50/90 border-blue-400 shadow-md shadow-blue-500/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
          <Crown className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {players?.w?.name || 'Player White'}
            </span>
            {playerRole === 'w' && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold uppercase">YOU</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-2xl font-black text-blue-700 font-mono">
              {scores?.w ?? 0} <span className="text-xs text-slate-500 font-normal">DSP</span>
            </span>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-center space-y-1">
        <div className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Current Turn</div>
        <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-sm ${
          isWhiteTurn
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
            : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
        }`}>
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          {isWhiteTurn ? "White's Move" : "Black's Move"}
        </div>
      </div>

      {/* Black Player Profile & DSP Score */}
      <div className={`flex items-center gap-4 p-3 rounded-xl border transition w-full md:w-auto ${
        !isWhiteTurn ? 'bg-emerald-50/90 border-emerald-400 shadow-md shadow-emerald-500/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
          <Crown className="w-7 h-7 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {players?.b?.name || 'Player Black'}
            </span>
            {playerRole === 'b' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono uppercase font-bold">YOU</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {scores?.b ?? 0} <span className="text-xs text-slate-500 font-normal">DSP</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
