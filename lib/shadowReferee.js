/**
 * Shadow Referee (Isolated Piece Vector Engine)
 * Evaluates individual move vectors V = (dRow, dCol) and raycast collision detection:
 * - Rook: dRow = 0 XOR dCol = 0, no pieces blocking straight raycast path.
 * - Knight: |dRow| * |dCol| = 2.
 * - Bishop: |dRow| = |dCol| != 0, no pieces blocking diagonal raycast path.
 * - Pawn: Forward move (dRow = dir, dCol = 0) non-capture, diagonal (dRow = dir, |dCol| = 1) capture.
 *   (Also allows initial 2-square pawn jump if unimpeded).
 * - King: |dRow| <= 1 AND |dCol| <= 1 (dRow!=0 or dCol!=0).
 * - Queen: Rook OR Bishop rules.
 */

export function isLegalMove(boardState, from, to) {
  if (!boardState || !from || !to) return { isLegal: false, reason: 'Invalid parameters' };
  
  const rows = boardState.length;
  const cols = boardState[0].length;
  
  const { row: r1, col: c1 } = from;
  const { row: r2, col: c2 } = to;

  // 1. Boundary check
  if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols) return { isLegal: false, reason: 'Source out of bounds' };
  if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) return { isLegal: false, reason: 'Destination out of bounds' };

  // 2. Same square check
  if (r1 === r2 && c1 === c2) return { isLegal: false, reason: 'Cannot move to the same square' };

  const piece = boardState[r1][c1];
  if (!piece) return { isLegal: false, reason: 'No piece at source square' };

  const targetPiece = boardState[r2][c2];
  // Cannot capture own piece
  if (targetPiece && targetPiece.color === piece.color) {
    return { isLegal: false, reason: 'Cannot capture friendly piece' };
  }

  const dRow = r2 - r1;
  const dCol = c2 - c1;
  const absDRow = Math.abs(dRow);
  const absDCol = Math.abs(dCol);

  // Vector validation by piece type
  switch (piece.type.toLowerCase()) {
    case 'r': // Rook
      if (dRow !== 0 && dCol !== 0) {
        return { isLegal: false, reason: 'Rook must move along straight ranks or files' };
      }
      if (isRaycastBlocked(boardState, r1, c1, r2, c2)) {
        return { isLegal: false, reason: 'Path blocked for Rook' };
      }
      return { isLegal: true, pieceType: 'Rook' };

    case 'n': // Knight
      if (absDRow * absDCol !== 2) {
        return { isLegal: false, reason: 'Knight must move in L-shape' };
      }
      return { isLegal: true, pieceType: 'Knight' };

    case 'b': // Bishop
      if (absDRow !== absDCol || absDRow === 0) {
        return { isLegal: false, reason: 'Bishop must move diagonally' };
      }
      if (isRaycastBlocked(boardState, r1, c1, r2, c2)) {
        return { isLegal: false, reason: 'Path blocked for Bishop' };
      }
      return { isLegal: true, pieceType: 'Bishop' };

    case 'q': // Queen
      const isDiagonal = absDRow === absDCol && absDRow !== 0;
      const isStraight = (dRow === 0 && dCol !== 0) || (dRow !== 0 && dCol === 0);
      if (!isDiagonal && !isStraight) {
        return { isLegal: false, reason: 'Queen must move straight or diagonally' };
      }
      if (isRaycastBlocked(boardState, r1, c1, r2, c2)) {
        return { isLegal: false, reason: 'Path blocked for Queen' };
      }
      return { isLegal: true, pieceType: 'Queen' };

    case 'k': // King
      if (absDRow > 1 || absDCol > 1) {
        return { isLegal: false, reason: 'King can only move 1 square in any direction' };
      }
      return { isLegal: true, pieceType: 'King' };

    case 'p': // Pawn
      const dir = piece.color === 'w' ? -1 : 1; // White moves up (negative row delta), Black moves down
      const startingRow = piece.color === 'w' ? rows - 2 : 1;

      // Case A: Forward non-capture move
      if (dCol === 0 && !targetPiece) {
        // Single forward step
        if (dRow === dir) {
          return { isLegal: true, pieceType: 'Pawn' };
        }
        // Double forward step from starting position
        if (r1 === startingRow && dRow === 2 * dir) {
          const intermediateRow = r1 + dir;
          if (boardState[intermediateRow][c1] !== null) {
            return { isLegal: false, reason: 'Path blocked for Pawn double step' };
          }
          return { isLegal: true, pieceType: 'Pawn' };
        }
        return { isLegal: false, reason: 'Invalid forward step distance for Pawn' };
      }

      // Case B: Diagonal capture
      if (absDCol === 1 && dRow === dir) {
        if (targetPiece && targetPiece.color !== piece.color) {
          return { isLegal: true, pieceType: 'Pawn' };
        }
        return { isLegal: false, reason: 'Pawn can only move diagonally to capture enemy piece' };
      }

      return { isLegal: false, reason: 'Invalid Pawn move pattern' };

    default:
      return { isLegal: false, reason: 'Unknown piece type' };
  }
}

/**
 * Checks if squares strictly between (r1, c1) and (r2, c2) are occupied
 */
function isRaycastBlocked(board, r1, c1, r2, c2) {
  const stepRow = Math.sign(r2 - r1);
  const stepCol = Math.sign(c2 - c1);

  let currRow = r1 + stepRow;
  let currCol = c1 + stepCol;

  while (currRow !== r2 || currCol !== c2) {
    if (board[currRow][currCol] !== null) {
      return true; // Collision found!
    }
    currRow += stepRow;
    currCol += stepCol;
  }

  return false;
}
