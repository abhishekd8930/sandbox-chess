import React from 'react';
import { Crown, Swords, Users, Shield, Zap, Sparkles } from 'lucide-react';

export default function Lobby({ pawnCount, setPawnCount, selectedRole, setSelectedRole, playerName, setPlayerName, roomCode, setRoomCode, onJoin }) {
  
  const getBoardLabel = (count) => {
    if (count <= 8) return '6 x 6 Small Board (a1 to f6)';
    if (count <= 20) return '8 x 8 Standard Board (a1 to h8)';
    return '12 x 8 Expanded Board (a1 to l8)';
  };

  const handleRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/90 border border-slate-200 rounded-3xl p-8 shadow-2xl text-slate-800 space-y-8 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600" /> Poker Chess Mechanics
        </div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
          SANDBOX CHESS
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto font-medium">
          No legal move blockers. Bluff your opponent, make illegal moves, and trigger <span className="text-rose-600 font-bold">[MOVE FALSE!]</span> to claim dynamic points!
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Player Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Player Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your handle..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner font-medium"
          />
        </div>

        {/* Room Code */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Room Code</label>
            <button
              onClick={handleRandomCode}
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700 transition font-semibold"
            >
              Generate Random Code
            </button>
          </div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE (e.g. ALPHA)"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner font-bold"
          />
        </div>

        {/* Pawn Slider */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" /> Dynamic Pawn Slider: <span className="text-blue-600 text-lg">{pawnCount} Pawns</span>
            </label>
            <span className="text-xs text-slate-500 font-mono font-medium">{getBoardLabel(pawnCount)}</span>
          </div>

          <input
            type="range"
            min="3"
            max="32"
            value={pawnCount}
            onChange={(e) => setPawnCount(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1 font-semibold">
            <span>3 Pawns (6x6 Grid)</span>
            <span>16 Pawns (8x8 Standard)</span>
            <span>32 Pawns (12x8 Grid)</span>
          </div>
        </div>

        {/* Side / Role Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Choose Your Army</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('w')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition ${
                selectedRole === 'w'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
              }`}
            >
              <Crown className="w-6 h-6" />
              <span className="text-xs font-bold uppercase">White</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('b')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition ${
                selectedRole === 'b'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 scale-105 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
              }`}
            >
              <Crown className="w-6 h-6 fill-current" />
              <span className="text-xs font-bold uppercase">Black</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('random')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition ${
                selectedRole === 'random'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30 scale-105 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
              }`}
            >
              <Swords className="w-6 h-6" />
              <span className="text-xs font-bold uppercase">Auto / Join</span>
            </button>
          </div>
        </div>

        {/* Enter Arena Button */}
        <button
          onClick={onJoin}
          className="w-full bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <Shield className="w-5 h-5" /> Enter Arena
        </button>

      </div>
    </div>
  );
}
