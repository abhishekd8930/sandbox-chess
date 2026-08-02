'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import LandingPage from '../components/LandingPage';
import Lobby from '../components/Lobby';
import ScoreHUD from '../components/ScoreHUD';
import GameBoard from '../components/GameBoard';
import ActionPanel from '../components/ActionPanel';
import MoveHistory from '../components/MoveHistory';
import SummaryModal from '../components/SummaryModal';
import AIDifficultyModal from '../components/AIDifficultyModal';
import { db } from '../lib/firebase';

let socket;

export default function Page() {
  const [viewState, setViewState] = useState('LANDING'); // 'LANDING', 'LOBBY', 'GAME'
  const [playerName, setPlayerName] = useState('Player 1');
  const [roomCode, setRoomCode] = useState('SANDBOX1');
  const [pawnCount, setPawnCount] = useState(16);
  const [selectedRole, setSelectedRole] = useState('w');

  const [playerRole, setPlayerRole] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [serverStats, setServerStats] = useState({ onlineUsers: 1, activeGames: 0 });
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    socket = io();

    socket.on('SERVER_STATS_UPDATE', (stats) => {
      setServerStats(stats);
    });

    socket.on('ROOM_JOINED', ({ roomCode, role, roomState }) => {
      setPlayerRole(role);
      setRoomState(roomState);
      setViewState('GAME');
    });

    socket.on('ROOM_UPDATED', (updatedRoomState) => {
      setRoomState(updatedRoomState);
    });

    socket.on('ERROR_MSG', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3500);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Mode 1: Play Online (Quick Match)
  const handlePlayOnline = () => {
    if (!socket) return;
    socket.emit('QUICK_MATCH', { playerName });
  };

  // Mode 2: Create Custom Room
  const handleCreateRoom = () => {
    setViewState('LOBBY');
  };

  // Mode 3: Play with AI (Opens Modal)
  const handlePlayAI = () => {
    setIsAIModalOpen(true);
  };

  const handleStartAIMatch = ({ difficulty, bluffRate, playerColor }) => {
    if (!socket) return;
    setIsAIModalOpen(false);
    socket.emit('CREATE_AI_ROOM', {
      pawnCount: 16,
      playerName,
      bluffRate,
      playerColor
    });
  };

  // Mode 4: Play with Friends (Private Room)
  const handlePlayFriends = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setViewState('LOBBY');
  };

  const handleJoinLobbyRoom = () => {
    if (!socket) return;
    socket.emit('JOIN_ROOM', {
      roomCode: roomCode || 'SANDBOX1',
      pawnCount,
      selectedRole,
      playerName
    });
  };

  const handleMove = (from, to) => {
    if (!socket || !roomState) return;
    socket.emit('MOVE_PIECE', {
      roomCode: roomState.code,
      from,
      to,
      playerRole
    });
  };

  const handleChallenge = () => {
    if (!socket || !roomState) return;
    socket.emit('MOVE_FALSE_CHALLENGE', {
      roomCode: roomState.code,
      playerRole
    });
  };

  const handleCheckmate = () => {
    if (!socket || !roomState) return;
    socket.emit('DECLARE_CHECKMATE', {
      roomCode: roomState.code,
      playerRole
    });
  };

  const handleResign = () => {
    if (!socket || !roomState) return;
    socket.emit('RESIGN_GAME', {
      roomCode: roomState.code,
      playerRole
    });
  };

  const handlePlayAgain = () => {
    setViewState('LANDING');
    setRoomState(null);
  };

  return (
    <main className="min-h-screen bg-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,1))] text-slate-800 p-4 md:p-8 flex flex-col justify-between items-center space-y-6">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-slate-200 pb-4">
        <div 
          onClick={() => setViewState('LANDING')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-teal-600 to-emerald-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            ♟
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
              SANDBOX CHESS
            </h1>
            <p className="text-[10px] text-blue-600 font-mono font-bold">POKER CHESS RULES & UNCONSTRAINED DND</p>
          </div>
        </div>

        {viewState === 'GAME' && roomState && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-600 shadow-sm">
            <span>ROOM:</span>
            <span className="font-bold text-blue-600">{roomState.code}</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
              {roomState.cols}x{roomState.rows} ({roomState.pawnCount} Pawns)
            </span>
          </div>
        )}

        {viewState !== 'LANDING' && (
          <button
            onClick={() => setViewState('LANDING')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            ← Back to Home
          </button>
        )}
      </header>

      {/* Floating Error Toast */}
      {errorMsg && (
        <div className="fixed top-6 z-50 bg-rose-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-semibold text-sm backdrop-blur-md animate-in slide-in-from-top duration-200">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Dynamic View State Router */}
      {viewState === 'LANDING' ? (
        <LandingPage
          stats={serverStats}
          onPlayOnline={handlePlayOnline}
          onCreateRoom={handleCreateRoom}
          onPlayAI={handlePlayAI}
          onPlayFriends={handlePlayFriends}
        />
      ) : viewState === 'LOBBY' ? (
        <Lobby
          pawnCount={pawnCount}
          setPawnCount={setPawnCount}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onJoin={handleJoinLobbyRoom}
        />
      ) : (
        <div className="w-full max-w-4xl space-y-6 flex flex-col items-center">
          <ScoreHUD roomState={roomState} playerRole={playerRole} />
          <GameBoard roomState={roomState} playerRole={playerRole} onMove={handleMove} />
          <ActionPanel
            roomState={roomState}
            playerRole={playerRole}
            onChallenge={handleChallenge}
            onCheckmate={handleCheckmate}
            onResign={handleResign}
          />
          <MoveHistory moveHistory={roomState?.moveHistory} />
        </div>
      )}

      {/* AI Difficulty Modal */}
      <AIDifficultyModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onStartMatch={handleStartAIMatch}
      />

      {/* Summary Modal */}
      {roomState && roomState.gameOver && (
        <SummaryModal
          summary={roomState.summary}
          playerRole={playerRole}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 font-mono font-medium pt-4">
        Sandbox Chess • Real-Time Stats & Multi-Mode Expansion Engine
      </footer>

    </main>
  );
}
