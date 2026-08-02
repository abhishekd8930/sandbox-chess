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
let waitingMatchmaker = null; // Queue socket ID for Quick Match

function broadcastStats(io) {
  const connectedUsers = io.sockets.sockets.size;
  const activeGames = Object.values(rooms).filter(r => !r.gameOver && (r.players.w && r.players.b)).length;

  io.emit('SERVER_STATS_UPDATE', {
    onlineUsers: connectedUsers,
    activeGames
  });
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
        // Pair with waiting player
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
        // Create new public room and wait
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

      if (playerColor === 'black' || (playerColor === 'random' && Math.random() < 0.5)) {
        wPlayer = { id: 'AI_BOT', name: 'Shadow Bot (AI)' };
        bPlayer = { id: socket.id, name: playerName || 'You' };
        userRole = 'b';
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
        isAI: true,
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

      // If AI is White, trigger AI first move
      if (userRole === 'b') {
        setTimeout(() => {
          const aiMove = generateAIMove(rooms[roomCode].board, 'w', rooms[roomCode].bluffRate);
          if (aiMove) {
            const aiPiece = rooms[roomCode].board[aiMove.from.row][aiMove.from.col];
            if (aiPiece) {
              rooms[roomCode].board[aiMove.to.row][aiMove.to.col] = aiPiece;
              rooms[roomCode].board[aiMove.from.row][aiMove.from.col] = null;
              rooms[roomCode].turn = 'b';
              io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(rooms[roomCode]));
            }
          }
        }, 600);
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

    // Handle Unconstrained Piece Move & Trigger AI
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

      // King Capture Win Condition
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
      io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));

      // Trigger AI turn if room isAI and it's AI's turn
      const aiColor = room.players.w.id === 'AI_BOT' ? 'w' : 'b';
      if (room.isAI && room.turn === aiColor && !room.gameOver) {
        setTimeout(() => {
          const aiMove = generateAIMove(room.board, aiColor, room.bluffRate);
          if (aiMove) {
            const aiPiece = room.board[aiMove.from.row][aiMove.from.col];
            if (aiPiece) {
              room.previousState = {
                board: JSON.parse(JSON.stringify(room.board)),
                turn: aiColor,
                lastMove: { from: aiMove.from, to: aiMove.to, piece: { ...aiPiece } }
              };

              const aiRefRes = isLegalMove(room.board, aiMove.from, aiMove.to);
              const aiCaptured = room.board[aiMove.to.row][aiMove.to.col];

              room.board[aiMove.to.row][aiMove.to.col] = aiPiece;
              room.board[aiMove.from.row][aiMove.from.col] = null;

              if (aiCaptured && aiCaptured.type === 'k') {
                room.scores[aiColor] += 100;
                room.gameOver = true;
                room.summary = computeFinalAudit(room.players, room.moveHistory, room.scores);
              }

              if (aiRefRes.isLegal && !room.gameOver) {
                room.scores[aiColor] += DSP_SCORES.LEGAL_MOVE;
              }

              room.moveHistory.push({
                id: Date.now(),
                type: 'MOVE',
                color: aiColor,
                from: aiMove.from,
                to: aiMove.to,
                piece: aiPiece.type,
                captured: aiCaptured ? aiCaptured.type : null,
                isLegal: aiRefRes.isLegal,
                reason: aiRefRes.reason || (aiMove.isBluff ? 'Sneaky Bluff Attempt' : 'Legal Move'),
                challenged: false,
                timestamp: new Date().toLocaleTimeString()
              });

              room.turn = aiColor === 'w' ? 'b' : 'w';
              io.to(roomCode).emit('ROOM_UPDATED', getPublicRoomState(room));
            }
          }
        }, 600);
      }
    });

    // Handle Challenge
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
      } else {
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
    gameOver: room.gameOver,
    summary: room.summary,
    canChallenge: !!(room.moveHistory.length > 0 && room.moveHistory.filter(m => m.type === 'MOVE').pop() && !room.moveHistory.filter(m => m.type === 'MOVE').pop().challenged)
  };
}
