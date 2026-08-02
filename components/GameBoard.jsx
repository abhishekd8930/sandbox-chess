import React, { useState } from 'react';
import { coordsToAlgebraic } from '../lib/boardMatrix';

const PIECE_SYMBOLS = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙'
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟'
  }
};

export default function GameBoard({ roomState, playerRole, onMove }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);

  if (!roomState || !roomState.board) return null;

  const { board, rows, cols, files, turn } = roomState;
  const isMyTurn = turn === playerRole;

  const handleDragStart = (e, row, col) => {
    const piece = board[row][col];
    if (!piece) return;
    if (piece.color !== playerRole) return;

    setDraggedPiece({ row, col, piece });
    e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetRow, targetCol) => {
    e.preventDefault();
    if (!draggedPiece) return;

    const from = { row: draggedPiece.row, col: draggedPiece.col };
    const to = { row: targetRow, col: targetCol };

    onMove(from, to);
    setDraggedPiece(null);
    setSelectedSquare(null);
  };

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    if (!selectedSquare) {
      if (piece && piece.color === playerRole) {
        setSelectedSquare({ row, col });
      }
    } else {
      const from = { row: selectedSquare.row, col: selectedSquare.col };
      const to = { row, col };
      onMove(from, to);
      setSelectedSquare(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-4xl mx-auto">
      
      {/* Board Container */}
      <div className="relative bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-xl overflow-x-auto w-full flex flex-col items-center backdrop-blur-md">
        
        {/* Top File Labels */}
        <div className="flex w-full max-w-full justify-around mb-1 text-xs font-mono text-slate-500 font-bold px-6">
          {files.map((file) => (
            <div key={file} className="text-center w-full uppercase">{file}</div>
          ))}
        </div>

        {/* Matrix Grid with Light Blue/Green chess squares */}
        <div 
          className="grid gap-0 border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: cols === 12 ? '100%' : cols === 8 ? '85%' : '70%',
            maxWidth: '720px',
            aspectRatio: `${cols} / ${rows}`
          }}
        >
          {board.map((rowArr, rIdx) =>
            rowArr.map((piece, cIdx) => {
              const isDarkSquare = (rIdx + cIdx) % 2 === 1;
              const squareName = coordsToAlgebraic(rIdx, cIdx, rows, files);
              const isSelected = selectedSquare && selectedSquare.row === rIdx && selectedSquare.col === cIdx;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleSquareClick(rIdx, cIdx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rIdx, cIdx)}
                  className={`relative aspect-square flex items-center justify-center transition-all duration-150 select-none cursor-pointer ${
                    isDarkSquare ? 'bg-teal-600/80' : 'bg-sky-100'
                  } ${
                    isSelected ? 'ring-4 ring-amber-400 z-10 bg-amber-200/50' : ''
                  } hover:brightness-110`}
                >
                  {/* Rank & File Corner Labels */}
                  {cIdx === 0 && (
                    <span className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold ${isDarkSquare ? 'text-white/80' : 'text-slate-500'}`}>
                      {rows - rIdx}
                    </span>
                  )}

                  {/* Piece Symbol */}
                  {piece && (
                    <div
                      draggable={isMyTurn && piece.color === playerRole}
                      onDragStart={(e) => handleDragStart(e, rIdx, cIdx)}
                      className={`text-3xl sm:text-4xl md:text-5xl font-black transition-transform transform active:scale-125 hover:scale-110 cursor-grab active:cursor-grabbing ${
                        piece.color === 'w' ? 'text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-slate-900 filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      {PIECE_SYMBOLS[piece.color]?.[piece.type.toLowerCase()]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom File Labels */}
        <div className="flex w-full max-w-full justify-around mt-1 text-xs font-mono text-slate-500 font-bold px-6">
          {files.map((file) => (
            <div key={file} className="text-center w-full uppercase">{file}</div>
          ))}
        </div>

      </div>

    </div>
  );
}
