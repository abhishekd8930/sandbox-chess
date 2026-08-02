import React from 'react';
import { Users, Swords, Cpu, Share2, Sparkles, Trophy, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage({
  stats,
  onPlayOnline,
  onCreateRoom,
  onPlayAI,
  onPlayFriends
}) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="text-center space-y-4">
        
        {/* Real-time Server Stats Badges */}
        <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-white/80 border border-slate-200 text-xs font-semibold shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-600">Players Online:</span>
            <span className="font-mono font-bold text-blue-600 text-sm">{stats?.onlineUsers ?? 1}</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600">Live Matches:</span>
            <span className="font-mono font-bold text-emerald-600 text-sm">{stats?.activeGames ?? 0}</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
          SANDBOX CHESS
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto font-medium">
          Unconstrained physical surface chess where rules aren't enforced. Bluff with illegal moves until opponents call <span className="text-rose-600 font-bold">[MOVE FALSE!]</span>.
        </p>
      </div>

      {/* 4 Core Game Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mode 1: Play Online */}
        <button
          onClick={onPlayOnline}
          className="group relative text-left bg-white border border-slate-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:border-blue-400 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
            <Users className="w-32 h-32" />
          </div>

          <div className="space-y-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                Play Online
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Instant matchmaking. Auto-pair with waiting opponents in standard 8x8 quick match.
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Find Match Now</span> →
          </div>
        </button>

        {/* Mode 2: Create Room */}
        <button
          onClick={onCreateRoom}
          className="group relative text-left bg-white border border-slate-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:border-emerald-400 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <Sparkles className="w-32 h-32" />
          </div>

          <div className="space-y-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                Create Room
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Custom sandbox setup. Adjust the 3-32 Pawn Slider and dynamic grid size (6x6, 8x8, 12x8).
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Configure Room</span> →
          </div>
        </button>

        {/* Mode 3: Play with AI */}
        <button
          onClick={onPlayAI}
          className="group relative text-left bg-white border border-slate-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:border-indigo-400 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
            <Cpu className="w-32 h-32" />
          </div>

          <div className="space-y-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                Play with AI
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Challenge "Shadow Bot". Plays 80% legal moves and attempts occasional bluffs for you to catch!
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>Start AI Practice</span> →
          </div>
        </button>

        {/* Mode 4: Play with Friends */}
        <button
          onClick={onPlayFriends}
          className="group relative text-left bg-white border border-slate-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:border-teal-400 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-teal-500/10 group-hover:text-teal-500/20 transition-colors">
            <Share2 className="w-32 h-32" />
          </div>

          <div className="space-y-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold shadow-inner">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 group-hover:text-teal-600 transition-colors">
                Play with Friends
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Generate a private invite code to share directly with a friend for a 1v1 match.
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
            <span>Create Friend Invite</span> →
          </div>
        </button>

      </div>

      {/* Rules Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Dynamic Score Points: Legal Move (+5) | Catch Bluff (+50) | False Call (-30) | Caught (-40)</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-mono">
          <Zap className="w-4 h-4 text-emerald-600" /> Dynamic 6x6, 8x8, 12x8 Grids
        </div>
      </div>

    </div>
  );
}
