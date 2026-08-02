const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import ES modules dynamically or via require for helper functions
let createInitialBoard, isLegalMove, DSP_SCORES, computeFinalAudit;

async function loadModules() {
  const boardMod = await import('./lib/boardMatrix.js');
  const refereeMod = await import('./lib/shadowReferee.js');
  const scoreMod = await import('./lib/scoreEngine.js');
  
  createInitialBoard = boardMod.createInitialBoard;
  isLegalMove = refereeMod.isLegalMove;
  DSP_SCORES = scoreMod.DSP_SCORES;
  computeFinalAudit = scoreMod.computeFinalAudit;
}

// In-Memory WebSocket Room Storage
// rooms[roomCode] = { config, board, rows, cols, files, turn, scores, moveHistory, previousState, players, clocks }
const rooms = {};

app.prepare().then(async () => {
  await loadModules();
  
  const server = http.createServer((req, res) => {
    return handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Create or Join Room
    socket.on('JOIN_ROOM', ({ roomCode, pawnCount, selectedRole, playerName }) => {
      const code = (roomCode || 'default').toUpperCase();
      socket.join(code);

      if (!rooms[code]) {
        // Initialize room state
        const boardData = createInitialBoard(pawnCount || 16);
        rooms[code] = {
          code,
          pawnCount: boardData.totalPawns,
          board: boardData.board,
          rows: boardData.rows,
          cols: boardData.cols,
          files: boardData.files,
          turn: 'w',
          scores: { w: 0, b: 0 },
          moveHistory: [], // Array of moves/challenges
          previousState: null, // For reverting illegal moves
          players: { w: null, b: null },
          clocks: { w: 300, b: 300 }, // 5-minute clocks
          timerInterval: null,
          gameOver: false,
          summary: null
        };
      }

      const room = rooms[code];

      // Assign player role if available
      let assignedRole = selectedRole;
      if (assignedRole === 'random') {
        assignedRole = !room.players.w ? 'w' : (!room.players.b ? 'b' : 'spectator');
      }

      if (assignedRole === 'w' && !room.players.w) {
        room.players.w = { id: socket.id, name: playerName || 'Player White' };
      } else if (assignedRole === 'b' && !room.players.b) {
        room.players.b = { id: socket.id, name: playerName || 'Player Black' };
      } else if (assignedRole === 'w' && room.players.w && room.players.w.id !== socket.id) {
        // Fallback to black if white taken
        if (!room.players.b) {
          assignedRole = 'b';
          room.players.b = { id: socket.id, name: playerName || 'Player Black' };
        } else {
          assignedRole = 'spectator';
        }
      } else if (assignedRole === 'b' && room.players.b && room.players.b.id !== socket.id) {
        if (!room.players.w) {
          assignedRole = 'w';
          room.players.w = { id: socket.id, name: playerName || 'Player White' };
        } else {
          assignedRole = 'spectator';
        }
      }

      socket.emit('ROOM_JOINED', {
        roomCode: code,
        role: assignedRole,
        roomState: getPublicRoomState(room)
      });

      io.to(code).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    // Handle Unconstrained DND Move
    socket.on('MOVE_PIECE', ({ roomCode, from, to, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      // Check turn (allow moves if it's player's turn)
      if (room.turn !== playerRole) {
        socket.emit('ERROR_MSG', 'Not your turn!');
        return;
      }

      const piece = room.board[from.row][from.col];
      if (!piece || piece.color !== playerRole) {
        socket.emit('ERROR_MSG', 'You can only move your own pieces!');
        return;
      }

      // Save previous state for challenge rollback
      room.previousState = {
        board: JSON.parse(JSON.stringify(room.board)),
        turn: room.turn,
        lastMove: { from, to, piece: { ...piece } }
      };

      // Backend Shadow Referee evaluates validity silently
      const refereeResult = isLegalMove(room.board, from, to);

      // Perform UNCONSTRAINED board update
      const capturedPiece = room.board[to.row][to.col];
      room.board[to.row][to.col] = piece;
      room.board[from.row][from.col] = null;

      // Check Win Condition 1: King Death (Capturing King piece ends game immediately)
      if (capturedPiece && capturedPiece.type === 'k') {
        room.scores[playerRole] += 100;
        room.gameOver = true;
        room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);
        room.moveHistory.push({
          id: Date.now(),
          type: 'SYSTEM',
          message: `KING CAPTURED! ${playerRole.toUpperCase()} wins by King Death!`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Update DSP score for legal move (+5 pts)
      if (refereeResult.isLegal && !room.gameOver) {
        room.scores[playerRole] += DSP_SCORES.LEGAL_MOVE;
      }

      const moveRecord = {
        id: Date.now(),
        type: 'MOVE',
        color: playerRole,
        from,
        to,
        piece: piece.type,
        captured: capturedPiece ? capturedPiece.type : null,
        isLegal: refereeResult.isLegal,
        reason: refereeResult.reason || 'Legal Move',
        challenged: false,
        timestamp: new Date().toLocaleTimeString()
      };

      room.moveHistory.push(moveRecord);

      // Switch turn
      room.turn = room.turn === 'w' ? 'b' : 'w';

      // Broadcast room update
      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    // Handle [MOVE FALSE!] Challenge Engine
    socket.on('MOVE_FALSE_CHALLENGE', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver || !room.previousState) return;

      // Only non-active player (or challenger) can challenge last move
      const lastMoveRecord = room.moveHistory.filter(m => m.type === 'MOVE').pop();
      if (!lastMoveRecord || lastMoveRecord.color === playerRole || lastMoveRecord.challenged) {
        socket.emit('ERROR_MSG', 'Cannot challenge this move.');
        return;
      }

      lastMoveRecord.challenged = true;
      const isLastMoveLegal = lastMoveRecord.isLegal;
      const offenderColor = lastMoveRecord.color;
      const challengerColor = playerRole;

      if (!isLastMoveLegal) {
        // --- SUCCESSFUL CHALLENGE (Caught Cheating) ---
        // Revert board state
        room.board = JSON.parse(JSON.stringify(room.previousState.board));
        room.turn = room.previousState.turn; // Offender must replay

        // Penalize offender (-40 pts), reward challenger (+50 pts)
        room.scores[offenderColor] += DSP_SCORES.CAUGHT_CHEATING_PENALTY;
        room.scores[challengerColor] += DSP_SCORES.SUCCESSFUL_CHALLENGE;

        room.moveHistory.push({
          id: Date.now(),
          type: 'CHALLENGE',
          by: challengerColor,
          against: offenderColor,
          successful: true,
          message: `MOVE FALSE SUCCESSFUL! ${challengerColor.toUpperCase()} caught ${offenderColor.toUpperCase()} bluffing! Board reverted.`,
          timestamp: new Date().toLocaleTimeString()
        });

      } else {
        // --- FALSE ACCUSATION ---
        // Penalize challenger (-30 pts), keep board unchanged
        room.scores[challengerColor] += DSP_SCORES.FALSE_ACCUSATION_PENALTY;

        room.moveHistory.push({
          id: Date.now(),
          type: 'CHALLENGE',
          by: challengerColor,
          against: offenderColor,
          successful: false,
          message: `FALSE ACCUSATION! Move by ${offenderColor.toUpperCase()} was legal. ${challengerColor.toUpperCase()} penalized -30 pts.`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      room.previousState = null; // Clear challenge buffer
      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    // Handle [CHECKMATE!] Declaration
    socket.on('DECLARE_CHECKMATE', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      // Shadow Referee verifies if opponent king is actually under attack/checkmate
      // For sandbox chess, any checkmate call is evaluated: +100 if valid, -50 if false declaration
      const opponentColor = playerRole === 'w' ? 'b' : 'w';
      
      // Basic check verification: find opponent king
      let opponentKingPos = null;
      for (let r = 0; r < room.rows; r++) {
        for (let c = 0; c < room.cols; c++) {
          const piece = room.board[r][c];
          if (piece && piece.type === 'k' && piece.color === opponentColor) {
            opponentKingPos = { row: r, col: c };
            break;
          }
        }
      }

      let isKingUnderAttack = false;
      if (opponentKingPos) {
        // Check if any of playerRole's pieces can legally reach opponent king square
        for (let r = 0; r < room.rows; r++) {
          for (let c = 0; c < room.cols; c++) {
            const piece = room.board[r][c];
            if (piece && piece.color === playerRole) {
              const res = isLegalMove(room.board, { row: r, col: c }, opponentKingPos);
              if (res.isLegal) {
                isKingUnderAttack = true;
                break;
              }
            }
          }
          if (isKingUnderAttack) break;
        }
      }

      if (isKingUnderAttack) {
        // Valid Checkmate
        room.scores[playerRole] += DSP_SCORES.VALID_CHECKMATE;
        room.gameOver = true;
        room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);
        
        room.moveHistory.push({
          id: Date.now(),
          type: 'SYSTEM',
          message: `CHECKMATE DECLARED BY ${playerRole.toUpperCase()}! (+100 pts)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        // False Checkmate Declaration
        room.scores[playerRole] += DSP_SCORES.INVALID_CHECKMATE_PENALTY;
        room.moveHistory.push({
          id: Date.now(),
          type: 'SYSTEM',
          message: `INVALID CHECKMATE CALL BY ${playerRole.toUpperCase()}! (-50 pts penalty)`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    // End Game Manual / Resign
    socket.on('RESIGN_GAME', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      const winnerColor = playerRole === 'w' ? 'b' : 'w';
      room.scores[winnerColor] += 50;
      room.gameOver = true;
      room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);

      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Sandbox Chess Server ready on http://${hostname}:${port}`);
  });
});

function getPublicRoomState(room) {
  return {
    code: room.code,
    pawnCount: room.pawnCount,
    board: room.board,
    rows: room.rows,
    cols: room.cols,
    files: room.files,
    turn: room.turn,
    scores: room.scores,
    moveHistory: room.moveHistory,
    players: room.players,
    clocks: room.clocks,
    gameOver: room.gameOver,
    summary: room.summary,
    canChallenge: !!(room.moveHistory.length > 0 && room.moveHistory.filter(m => m.type === 'MOVE').pop() && !room.moveHistory.filter(m => m.type === 'MOVE').pop().challenged)
  };
}
