import React, { useEffect } from 'react';
import { Trophy, ShieldCheck, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SummaryModal({ summary, playerRole, onPlayAgain }) {
  if (!summary) return null;

  const { finalScores, baseScores, uncaughtBluffs, uncaughtBluffPoints, legalMovesCount, illegalMovesCount, successfulChallenges, falseAccusations, winner } = summary;

  const isWinner = winner === playerRole;
  const isDraw = winner === 'DRAW';

  useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-blue-600" /> Match Audit Summary
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            {isDraw ? (
              <span className="text-slate-600">DRAW MATCH!</span>
            ) : isWinner ? (
              <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                VICTORY! YOU WIN! 🏆
              </span>
            ) : (
              <span className="text-rose-600">DEFEAT! BETTER BLUFF NEXT TIME!</span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Final score computed with Dynamic Score Points (DSP) & Retroactive Uncaught Bluff Bonuses.
          </p>
        </div>

        {/* Final DSP Score Board */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          
          <div className="text-center p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">White Player</div>
            <div className="text-3xl font-black text-blue-600 font-mono">{finalScores.w} <span className="text-xs text-slate-400 font-normal">DSP</span></div>
            <div className="text-[10px] text-slate-400 font-mono font-medium">Base: {baseScores.w} | Uncaught: +{uncaughtBluffPoints.w}</div>
          </div>

          <div className="text-center p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Black Player</div>
            <div className="text-3xl font-black text-emerald-600 font-mono">{finalScores.b} <span className="text-xs text-slate-400 font-normal">DSP</span></div>
            <div className="text-[10px] text-slate-400 font-mono font-medium">Base: {baseScores.b} | Uncaught: +{uncaughtBluffPoints.b}</div>
          </div>

        </div>

        {/* Audit Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Performance Audit Metrics
          </h3>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-100 p-2.5 font-bold text-slate-700 border-b border-slate-200">
              <span>Metric</span>
              <span className="text-center">White</span>
              <span className="text-center">Black</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700">
              <span>Legal Moves Executed</span>
              <span className="text-center font-mono text-emerald-600 font-bold">{legalMovesCount.w} (+{legalMovesCount.w * 5} pts)</span>
              <span className="text-center font-mono text-emerald-600 font-bold">{legalMovesCount.b} (+{legalMovesCount.b * 5} pts)</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700">
              <span>Illegal Moves Attempted</span>
              <span className="text-center font-mono text-rose-600 font-bold">{illegalMovesCount.w}</span>
              <span className="text-center font-mono text-rose-600 font-bold">{illegalMovesCount.b}</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700">
              <span>Uncaught Bluffs (+20 pts ea)</span>
              <span className="text-center font-mono text-blue-600 font-bold">{uncaughtBluffs.w} (+{uncaughtBluffPoints.w} pts)</span>
              <span className="text-center font-mono text-blue-600 font-bold">{uncaughtBluffs.b} (+{uncaughtBluffPoints.b} pts)</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700">
              <span>Successful False Calls</span>
              <span className="text-center font-mono text-emerald-600 font-bold">{successfulChallenges.w} (+{successfulChallenges.w * 50} pts)</span>
              <span className="text-center font-mono text-emerald-600 font-bold">{successfulChallenges.b} (+{successfulChallenges.b * 50} pts)</span>
            </div>

            <div className="grid grid-cols-3 p-2.5 text-slate-700">
              <span>False Accusation Penalties</span>
              <span className="text-center font-mono text-rose-600 font-bold">{falseAccusations.w} ({falseAccusations.w * -30} pts)</span>
              <span className="text-center font-mono text-rose-600 font-bold">{falseAccusations.b} ({falseAccusations.b * -30} pts)</span>
            </div>
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <RefreshCw className="w-5 h-5" /> Play Again
        </button>

      </div>
    </div>
  );
}
