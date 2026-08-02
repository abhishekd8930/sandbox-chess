import { isLegalMove } from './shadowReferee.js';

/**
 * AI Bot Evaluator for Sandbox Chess ("Shadow Bot")
 * Uses shadowReferee vector logic to generate candidate moves for Black:
 * - 80% legal moves
 * - 20% bluff/illegal moves (e.g., long pawn steps, knight oversteps)
 */

export function generateAIMove(board, rows, cols) {
  const blackPieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const piece = board[r][c];
      if (piece && piece.color === 'b') {
        blackPieces.push({ row: r, col: c, piece });
      }
    }
  }

  if (blackPieces.length === 0) return null;

  // Decide if AI attempts a legal move (80%) or a bluff move (20%)
  const isBluff = Math.random() < 0.2;

  // 1. Try generating legal moves
  const legalMoves = [];
  const allMoves = [];

  blackPieces.forEach(({ row: r1, col: c1 }) => {
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c2 = 0; c2 < cols; c2++) {
        if (r1 === r2 && c1 === c2) continue;
        const target = board[r2][c2];
        if (target && target.color === 'b') continue; // Skip friendly capture

        const from = { row: r1, col: c1 };
        const to = { row: r2, col: c2 };
        const res = isLegalMove(board, from, to);

        if (res.isLegal) {
          legalMoves.push({ from, to });
        } else {
          allMoves.push({ from, to });
        }
      }
    }
  });

  if (isBluff && allMoves.length > 0) {
    // Pick random illegal move as a bluff
    const bluffMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    return { ...bluffMove, isBluff: true };
  }

  if (legalMoves.length > 0) {
    // Prefer capture move if available
    const captureMoves = legalMoves.filter(m => board[m.to.row][m.to.col] !== null);
    if (captureMoves.length > 0) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Fallback if no legal moves exist: pick any valid destination
  if (allMoves.length > 0) {
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  return null;
}
