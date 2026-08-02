import { isLegalMove } from './shadowReferee.js';

/**
 * AI Bot Logic with Sneaky Bluff Mechanics (lib/aiBot.js)
 * Generates plausible moves for AI bot ('b' or 'w'):
 * - Legal Move (80% on Medium difficulty)
 * - Sneaky Bluff Move (20% on Medium difficulty: Rook Drift, Extended Knight, Bishop Off-Diagonal, Pawn Sidestep)
 */

export function generateAIMove(boardState, aiColor = 'b', difficulty = 'medium') {
  if (!boardState) return null;

  const rows = boardState.length;
  const cols = boardState[0].length;

  let bluffChance = 0.20; // Medium default
  if (difficulty === 'easy') bluffChance = 0.35;
  if (difficulty === 'hard') bluffChance = 0.12;

  const isBluffAttempt = Math.random() < bluffChance;

  if (isBluffAttempt) {
    const bluffMove = getSneakyBluffMove(boardState, aiColor, rows, cols);
    if (bluffMove) return bluffMove;
  }

  // Fallback / Standard Legal Move execution
  return getLegalMove(boardState, aiColor, rows, cols);
}

/**
 * Scans boardState for legal moves, prioritizing piece captures
 */
function getLegalMove(boardState, aiColor, rows, cols) {
  const aiPieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const piece = boardState[r][c];
      if (piece && piece.color === aiColor) {
        aiPieces.push({ row: r, col: c, piece });
      }
    }
  }

  if (aiPieces.length === 0) return null;

  const legalMoves = [];

  aiPieces.forEach(({ row: r1, col: c1 }) => {
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c2 = 0; c2 < cols; c2++) {
        if (r1 === r2 && c1 === c2) continue;
        const target = boardState[r2][c2];
        if (target && target.color === aiColor) continue;

        const from = { row: r1, col: c1 };
        const to = { row: r2, col: c2 };
        const res = isLegalMove(boardState, from, to);

        if (res.isLegal) {
          legalMoves.push({ from, to, isCapture: target !== null });
        }
      }
    }
  });

  if (legalMoves.length === 0) return null;

  // Prioritize captures
  const captureMoves = legalMoves.filter(m => m.isCapture);
  if (captureMoves.length > 0) {
    return captureMoves[Math.floor(Math.random() * captureMoves.length)];
  }

  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

/**
 * Generates plausible sneaky illegal moves (bluffs)
 */
function getSneakyBluffMove(boardState, aiColor, rows, cols) {
  const aiPieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const piece = boardState[r][c];
      if (piece && piece.color === aiColor) {
        aiPieces.push({ row: r, col: c, piece });
      }
    }
  }

  const candidateBluffs = [];

  aiPieces.forEach(({ row: r1, col: c1, piece }) => {
    const type = piece.type.toLowerCase();
    const potentialTargets = [];

    if (type === 'r') {
      // 1. Rook Drift: Move 1 square diagonally
      potentialTargets.push(
        { row: r1 + 1, col: c1 + 1 },
        { row: r1 + 1, col: c1 - 1 },
        { row: r1 - 1, col: c1 + 1 },
        { row: r1 - 1, col: c1 - 1 }
      );
    } else if (type === 'n') {
      // 2. Extended Knight: Offset (3,1) or (2,2)
      potentialTargets.push(
        { row: r1 + 3, col: c1 + 1 },
        { row: r1 + 3, col: c1 - 1 },
        { row: r1 - 3, col: c1 + 1 },
        { row: r1 - 3, col: c1 - 1 },
        { row: r1 + 2, col: c1 + 2 },
        { row: r1 + 2, col: c1 - 2 },
        { row: r1 - 2, col: c1 + 2 },
        { row: r1 - 2, col: c1 - 2 }
      );
    } else if (type === 'b') {
      // 3. Bishop Off-Diagonal: Move 1 square orthogonally
      potentialTargets.push(
        { row: r1 + 1, col: c1 },
        { row: r1 - 1, col: c1 },
        { row: r1, col: c1 + 1 },
        { row: r1, col: c1 - 1 }
      );
    } else if (type === 'p') {
      // 4. Pawn Sidestep: Move 1 square sideways into empty square
      potentialTargets.push(
        { row: r1, col: c1 + 1 },
        { row: r1, col: c1 - 1 }
      );
    }

    potentialTargets.forEach(({ row: r2, col: c2 }) => {
      // Check boundaries
      if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols) {
        const target = boardState[r2][c2];
        if (!target || target.color !== aiColor) {
          const from = { row: r1, col: c1 };
          const to = { row: r2, col: c2 };
          const refereeCheck = isLegalMove(boardState, from, to);
          
          // Must NOT be accidentally legal
          if (!refereeCheck.isLegal) {
            candidateBluffs.push({ from, to, isBluff: true });
          }
        }
      }
    });
  });

  if (candidateBluffs.length > 0) {
    return candidateBluffs[Math.floor(Math.random() * candidateBluffs.length)];
  }

  return null;
}
