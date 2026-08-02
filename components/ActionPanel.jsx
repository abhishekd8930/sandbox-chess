import React from 'react';
import { AlertTriangle, Flag, Zap } from 'lucide-react';

export default function ActionPanel({ roomState, playerRole, onChallenge, onCheckmate, onResign }) {
  if (!roomState) return null;

  const { turn, canChallenge, gameOver } = roomState;
  const isOpponentTurn = turn !== playerRole;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
      
      {/* Prominent [MOVE FALSE!] Challenge Button */}
      <button
        onClick={onChallenge}
        disabled={gameOver || !canChallenge}
        className={`w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-3 border shadow-lg ${
          canChallenge && isOpponentTurn
            ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white border-rose-400 animate-pulse shadow-rose-500/30 hover:brightness-110'
            : canChallenge
            ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
        }`}
      >
        <AlertTriangle className={`w-6 h-6 ${canChallenge && isOpponentTurn ? 'animate-bounce' : ''}`} />
        <span>[MOVE FALSE!]</span>
        <span className="text-xs bg-slate-900/10 px-2 py-0.5 rounded font-mono font-normal">
          +50 / -30 / -40 PTS
        </span>
      </button>

      {/* Action Controls */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        
        {/* Declare Checkmate Button */}
        <button
          onClick={onCheckmate}
          disabled={gameOver}
          className="flex-1 sm:flex-initial py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition transform active:scale-95 flex items-center justify-center gap-2 border border-emerald-500 shadow-md shadow-emerald-500/20"
        >
          <Zap className="w-4 h-4" /> [CHECKMATE!]
        </button>

        {/* Resign Button */}
        <button
          onClick={onResign}
          disabled={gameOver}
          className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-300 flex items-center gap-1.5"
        >
          <Flag className="w-4 h-4 text-slate-500" /> Resign
        </button>

      </div>

    </div>
  );
}
