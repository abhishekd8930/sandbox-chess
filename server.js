const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let createInitialBoard, isLegalMove, DSP_SCORES, computeFinalAudit, generateAIMove;

async function loadModules() {
  const boardMod = await import('./lib/boardMatrix.js');
  const refereeMod = await import('./lib/shadowReferee.js');
  const scoreMod = await import('./lib/scoreEngine.js');
  const aiMod = await import('./lib/aiBot.js');
  
  createInitialBoard = boardMod.createInitialBoard;
  isLegalMove = refereeMod.isLegalMove;
  DSP_SCORES = scoreMod.DSP_SCORES;
  computeFinalAudit = scoreMod.computeFinalAudit;
  generateAIMove = aiMod.generateAIMove;
}

const rooms = {};
let waitingMatchmaker = null;

function broadcastStats(io) {
  const connectedUsers = io.sockets.sockets.size;
  const activeGames = Object.values(rooms).filter(r => !r.gameOver && (r.players.w && r.players.b)).length;

  io.emit('SERVER_STATS_UPDATE', {
    onlineUsers: connectedUsers,
    activeGames
  });
}

function handleAITurn(io, roomCode) {
  const room = rooms[roomCode];
  if (!room || room.gameOver) return;

  const aiColor = room.aiColor || (room.players.w && room.players.w.id === 'AI_BOT' ? 'w' : 'b');
  const humanColor = aiColor === 'w' ? 'b' : 'w';

  setTimeout(() => {
    if (!room || room.gameOver || room.turn !== aiColor) return;

    const aiMove = generateAIMove(room.board, aiColor, room.bluffRate || 0.20);
    if (!aiMove) return;

    const aiPiece = room.board[aiMove.from.row][aiMove.from.col];
    if (!aiPiece) return;

    // Save previous state for rollback
    room.previousState = {
      board: JSON.parse(JSON.stringify(room.board)),
      turn: aiColor,
      lastMove: { from: aiMove.from, to: aiMove.to, piece: { ...aiPiece } }
    };

    const refereeCheck = isLegalMove(room.board, aiMove.from, aiMove.to);
    const capturedPiece = room.board[aiMove.to.row][aiMove.to.col];

    // Execute Move
    room.board[aiMove.to.row][aiMove.to.col] = aiPiece;
    room.board[aiMove.from.row][aiMove.from.col] = null;

    // Check King Death
    if (capturedPiece && capturedPiece.type === 'k') {
      room.scores[aiColor] += 100;
      room.gameOver = true;
      room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);
    }

    if (refereeCheck.isLegal && !room.gameOver) {
      room.scores[aiColor] += DSP_SCORES.LEGAL_MOVE;
    }

    // Append to move history with hidden shadow referee flag
    room.moveHistory.push({
      id: Date.now(),
      type: 'MOVE',
      color: aiColor,
      from: aiMove.from,
      to: aiMove.to,
      piece: aiPiece.type,
      captured: capturedPiece ? capturedPiece.type : null,
      isLegal: refereeCheck.isLegal,
      reason: refereeCheck.reason || (aiMove.isBluff ? 'Sneaky Bluff Attempt' : 'Legal Move'),
      challenged: false,
      timestamp: new Date().toLocaleTimeString()
    });

    room.turn = humanColor;

    // Broadcast standard MOVE_EXECUTED event & ROOM_UPDATED
    io.to(roomCode).emit('MOVE_EXECUTED', {
      boardState: room.board,
      lastMove: {
        from: aiMove.from,
        to: aiMove.to,
        piece: aiPiece.type
      },
      currentTurn: room.turn,
      scores: room.scores,
      isAiMove: true
    });

    io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
  }, 800);
}

app.prepare().then(async () => {
  await loadModules();
  
  const server = http.createServer((req, res) => {
    return handle(req, res);
  });

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    broadcastStats(io);

    // Quick Matchmaking ("Play Online")
    socket.on('QUICK_MATCH', ({ playerName }) => {
      if (waitingMatchmaker && waitingMatchmaker.id !== socket.id && rooms[waitingMatchmaker.roomCode]) {
        const roomCode = waitingMatchmaker.roomCode;
        const room = rooms[roomCode];
        room.players.b = { id: socket.id, name: playerName || 'Player Black' };
        socket.join(roomCode);

        socket.emit('ROOM_JOINED', {
          roomCode,
          role: 'b',
          roomState: getPublicRoomState(room)
        });

        io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
        waitingMatchmaker = null;
        broadcastStats(io);
      } else {
        const roomCode = 'MATCH_' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const boardData = createInitialBoard(16);
        rooms[roomCode] = {
          code: roomCode,
          pawnCount: boardData.totalPawns,
          board: boardData.board,
          rows: boardData.rows,
          cols: boardData.cols,
          files: boardData.files,
          turn: 'w',
          scores: { w: 0, b: 0 },
          moveHistory: [],
          previousState: null,
          players: { w: { id: socket.id, name: playerName || 'Player White' }, b: null },
          mode: 'pvp',
          isAI: false,
          gameOver: false,
          summary: null
        };

        socket.join(roomCode);
        waitingMatchmaker = { id: socket.id, roomCode };

        socket.emit('ROOM_JOINED', {
          roomCode,
          role: 'w',
          roomState: getPublicRoomState(rooms[roomCode])
        });
        broadcastStats(io);
      }
    });

    // Create Single Player AI Match
    socket.on('CREATE_AI_ROOM', ({ pawnCount, playerName, bluffRate, playerColor }) => {
      const roomCode = 'AI_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const boardData = createInitialBoard(pawnCount || 16);

      let wPlayer = { id: socket.id, name: playerName || 'You' };
      let bPlayer = { id: 'AI_BOT', name: 'Shadow Bot (AI)' };
      let userRole = 'w';
      let aiColor = 'b';

      if (playerColor === 'black' || (playerColor === 'random' && Math.random() < 0.5)) {
        wPlayer = { id: 'AI_BOT', name: 'Shadow Bot (AI)' };
        bPlayer = { id: socket.id, name: playerName || 'You' };
        userRole = 'b';
        aiColor = 'w';
      }

      rooms[roomCode] = {
        code: roomCode,
        pawnCount: boardData.totalPawns,
        board: boardData.board,
        rows: boardData.rows,
        cols: boardData.cols,
        files: boardData.files,
        turn: 'w',
        scores: { w: 0, b: 0 },
        moveHistory: [],
        previousState: null,
        players: { w: wPlayer, b: bPlayer },
        mode: 'ai',
        isAI: true,
        aiColor,
        bluffRate: bluffRate || 0.20,
        gameOver: false,
        summary: null
      };

      socket.join(roomCode);
      socket.emit('ROOM_JOINED', {
        roomCode,
        role: userRole,
        roomState: getPublicRoomState(rooms[roomCode])
      });

      if (aiColor === 'w') {
        handleAITurn(io, roomCode);
      }

      broadcastStats(io);
    });

    // Standard Join Room
    socket.on('JOIN_ROOM', ({ roomCode, pawnCount, selectedRole, playerName }) => {
      const code = (roomCode || 'default').toUpperCase();
      socket.join(code);

      if (!rooms[code]) {
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
          moveHistory: [],
          previousState: null,
          players: { w: null, b: null },
          mode: 'pvp',
          isAI: false,
          gameOver: false,
          summary: null
        };
      }

      const room = rooms[code];
      let assignedRole = selectedRole;
      if (assignedRole === 'random') {
        assignedRole = !room.players.w ? 'w' : (!room.players.b ? 'b' : 'spectator');
      }

      if (assignedRole === 'w' && !room.players.w) {
        room.players.w = { id: socket.id, name: playerName || 'Player White' };
      } else if (assignedRole === 'b' && !room.players.b) {
        room.players.b = { id: socket.id, name: playerName || 'Player Black' };
      } else {
        assignedRole = 'spectator';
      }

      socket.emit('ROOM_JOINED', {
        roomCode: code,
        role: assignedRole,
        roomState: getPublicRoomState(room)
      });

      io.to(code).emit('ROOM_UPDATED', getPublicRoomState(room));
      broadcastStats(io);
    });

    // Handle Unconstrained Piece Move
    socket.on('MOVE_PIECE', ({ roomCode, from, to, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      if (room.turn !== playerRole) {
        socket.emit('ERROR_MSG', 'Not your turn!');
        return;
      }

      const piece = room.board[from.row][from.col];
      if (!piece || piece.color !== playerRole) {
        socket.emit('ERROR_MSG', 'You can only move your own pieces!');
        return;
      }

      room.previousState = {
        board: JSON.parse(JSON.stringify(room.board)),
        turn: room.turn,
        lastMove: { from, to, piece: { ...piece } }
      };

      const refereeResult = isLegalMove(room.board, from, to);
      const capturedPiece = room.board[to.row][to.col];

      room.board[to.row][to.col] = piece;
      room.board[from.row][from.col] = null;

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

      if (refereeResult.isLegal && !room.gameOver) {
        room.scores[playerRole] += DSP_SCORES.LEGAL_MOVE;
      }

      room.moveHistory.push({
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
      });

      room.turn = room.turn === 'w' ? 'b' : 'w';

      // Broadcast MOVE_EXECUTED & ROOM_UPDATED
      io.to(roomCode).emit('MOVE_EXECUTED', {
        boardState: room.board,
        lastMove: { from, to, piece: piece.type },
        currentTurn: room.turn,
        scores: room.scores,
        isAiMove: false
      });

      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));

      // Trigger AI turn if mode === 'ai' and it's AI's turn
      if (room.mode === 'ai' && room.turn === room.aiColor && !room.gameOver) {
        handleAITurn(io, roomCode);
      }
    });

    // Handle [MOVE FALSE!] Challenge
    socket.on('MOVE_FALSE_CHALLENGE', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver || !room.previousState) return;

      const lastMoveRecord = room.moveHistory.filter(m => m.type === 'MOVE').pop();
      if (!lastMoveRecord || lastMoveRecord.color === playerRole || lastMoveRecord.challenged) return;

      lastMoveRecord.challenged = true;
      const isLastMoveLegal = lastMoveRecord.isLegal;
      const offenderColor = lastMoveRecord.color;
      const challengerColor = playerRole;

      if (!isLastMoveLegal) {
        // Caught Cheating (AI or Human)
        room.board = JSON.parse(JSON.stringify(room.previousState.board));
        room.turn = room.previousState.turn;

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

        io.to(roomCode).emit('CHALLENGE_RESULT', {
          success: true,
          penalizeAi: offenderColor === room.aiColor,
          revertedBoardState: room.board
        });

        // If AI was caught bluffing, trigger AI replay turn
        if (room.mode === 'ai' && room.turn === room.aiColor) {
          handleAITurn(io, roomCode);
        }

      } else {
        // False Accusation
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

        io.to(roomCode).emit('CHALLENGE_RESULT', {
          success: false,
          penalizePlayer: true
        });
      }

      room.previousState = null;
      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
    });

    // Declare Checkmate
    socket.on('DECLARE_CHECKMATE', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      const opponentColor = playerRole === 'w' ? 'b' : 'w';
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
        room.scores[playerRole] += DSP_SCORES.VALID_CHECKMATE;
        room.gameOver = true;
        room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);
      } else {
        room.scores[playerRole] += DSP_SCORES.INVALID_CHECKMATE_PENALTY;
      }

      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
      broadcastStats(io);
    });

    socket.on('RESIGN_GAME', ({ roomCode, playerRole }) => {
      const room = rooms[roomCode];
      if (!room || room.gameOver) return;

      const winnerColor = playerRole === 'w' ? 'b' : 'w';
      room.scores[winnerColor] += 50;
      room.gameOver = true;
      room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);

      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
      broadcastStats(io);
    });

    socket.on('disconnect', () => {
      if (waitingMatchmaker && waitingMatchmaker.id === socket.id) {
        waitingMatchmaker = null;
      }
      broadcastStats(io);
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
    mode: room.mode,
    aiColor: room.aiColor,
    gameOver: room.gameOver,
    summary: room.summary,
    canChallenge: !!(room.moveHistory.length > 0 && room.moveHistory.filter(m => m.type === 'MOVE').pop() && !room.moveHistory.filter(m => m.type === 'MOVE').pop().challenged)
  };
}
