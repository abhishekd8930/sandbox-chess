/**
 * Board Matrix Engine for Sandbox Chess
 * Supports dynamic grid creation based on pawn slider count (3 to 32 pawns total):
 * - 3-8 pawns: 6x6 Grid ('a1' to 'f6')
 * - 9-20 pawns: 8x8 Grid ('a1' to 'h8')
 * - 21-32 pawns: 12x8 Grid ('a1' to 'l8')
 */

export const BOARD_CONFIGS = {
  MIN_PAWNS: 3,
  MAX_PAWNS: 32,
  STANDARD_PAWNS: 16
};

/**
 * Returns grid dimensions [rows, cols] and file letters based on pawn count
 */
export function getBoardDimensions(totalPawns) {
  const pawns = Math.max(3, Math.min(32, parseInt(totalPawns, 10) || 16));
  
  if (pawns <= 8) {
    // 6x6 Grid: rows 0..5, cols 0..5 ('a'..'f')
    return { rows: 6, cols: 6, files: ['a', 'b', 'c', 'd', 'e', 'f'] };
  } else if (pawns <= 20) {
    // 8x8 Grid: rows 0..7, cols 0..7 ('a'..'h')
    return { rows: 8, cols: 8, files: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] };
  } else {
    // 12x8 Grid ('a1' to 'l8') -> 8 rows x 12 cols
    return { rows: 8, cols: 12, files: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'] };
  }
}

/**
 * Convert matrix (row, col) to standard algebraic notation e.g., (7, 0) -> "a1"
 */
export function coordsToAlgebraic(row, col, rows, files) {
  const rank = rows - row;
  const file = files[col] || String.fromCharCode(97 + col);
  return `${file}${rank}`;
}

/**
 * Convert algebraic notation "a1" to matrix { row, col }
 */
export function algebraicToCoords(square, rows, files) {
  if (!square || square.length < 2) return null;
  const fileChar = square[0].toLowerCase();
  const rankNum = parseInt(square.slice(1), 10);
  const col = files.indexOf(fileChar);
  const row = rows - rankNum;
  if (col < 0 || row < 0 || row >= rows) return null;
  return { row, col };
}

/**
 * Initializes matrix board state array [rows][cols] containing piece objects or null
 * Piece Object: { type: 'p'|'r'|'n'|'b'|'q'|'k', color: 'w'|'b', id: string }
 */
export function createInitialBoard(totalPawns) {
  const { rows, cols, files } = getBoardDimensions(totalPawns);
  const board = Array(rows).fill(null).map(() => Array(cols).fill(null));
  
  const pawnsPerSide = Math.floor(totalPawns / 2);
  
  let backRankPieces = [];
  if (cols === 6) {
    backRankPieces = ['r', 'n', 'q', 'k', 'n', 'r'];
  } else if (cols === 8) {
    backRankPieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  } else {
    backRankPieces = ['r', 'n', 'b', 'q', 'k', 'q', 'k', 'b', 'b', 'b', 'n', 'r'];
  }

  // Black back rank (Row 0)
  for (let c = 0; c < cols; c++) {
    const type = backRankPieces[c % backRankPieces.length];
    board[0][c] = { type, color: 'b', id: `b_${type}_0_${c}` };
  }

  // Black pawns (Row 1)
  let bPawnsPlaced = 0;
  for (let r = 1; r < rows - 2 && bPawnsPlaced < pawnsPerSide; r++) {
    for (let c = 0; c < cols && bPawnsPlaced < pawnsPerSide; c++) {
      board[r][c] = { type: 'p', color: 'b', id: `b_p_${r}_${c}` };
      bPawnsPlaced++;
    }
  }

  // White back rank (Last Row)
  const lastRow = rows - 1;
  for (let c = 0; c < cols; c++) {
    const type = backRankPieces[c % backRankPieces.length];
    board[lastRow][c] = { type, color: 'w', id: `w_${type}_${lastRow}_${c}` };
  }

  // White pawns (Row rows - 2)
  let wPawnsPlaced = 0;
  for (let r = rows - 2; r > 1 && wPawnsPlaced < pawnsPerSide; r--) {
    for (let c = 0; c < cols && wPawnsPlaced < pawnsPerSide; c++) {
      board[r][c] = { type: 'p', color: 'w', id: `w_p_${r}_${c}` };
      wPawnsPlaced++;
    }
  }

  return {
    board,
    rows,
    cols,
    files,
    totalPawns
  };
}
