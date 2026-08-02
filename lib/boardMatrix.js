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
  
  if (cols === 6) {
    // --- 3 PAWNS (Min - 6x6 Grid) ---
    // White Major pieces on Rank 1 (row 5); Black Major pieces on Rank 6 (row 0)
    const majorLayout = ['r', 'n', 'q', 'k', 'b', 'r'];
    for (let c = 0; c < 6; c++) {
      board[0][c] = { type: majorLayout[c], color: 'b', id: `b_${majorLayout[c]}_0_${c}` };
      board[5][c] = { type: majorLayout[c], color: 'w', id: `w_${majorLayout[c]}_5_${c}` };
    }
    // White 2 pawns on c2, d2 -> (row 4, col 2), (row 4, col 3)
    board[4][2] = { type: 'p', color: 'w', id: 'w_p_4_2' };
    board[4][3] = { type: 'p', color: 'w', id: 'w_p_4_3' };
    // Black 1 pawn on c5 -> (row 1, col 2)
    board[1][2] = { type: 'p', color: 'b', id: 'b_p_1_2' };

  } else if (cols === 8) {
    // --- 16 PAWNS (Standard - 8x8 Grid) ---
    const majorLayout = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: majorLayout[c], color: 'b', id: `b_${majorLayout[c]}_0_${c}` };
      board[7][c] = { type: majorLayout[c], color: 'w', id: `w_${majorLayout[c]}_7_${c}` };
      board[1][c] = { type: 'p', color: 'b', id: `b_p_1_${c}` };
      board[6][c] = { type: 'p', color: 'w', id: `w_p_6_${c}` };
    }

  } else {
    // --- 32 PAWNS (Max - 12x8 Grid: 8 rows x 12 cols) ---
    // Major pieces centered on Ranks 1 & 8 (c1-j1 and c8-j8, cols 2-9)
    const majorLayout = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      const col = i + 2; // cols 2..9 (c..j)
      board[0][col] = { type: majorLayout[i], color: 'b', id: `b_${majorLayout[i]}_0_${col}` };
      board[7][col] = { type: majorLayout[i], color: 'w', id: `w_${majorLayout[i]}_7_${col}` };
    }
    // Corner rooks/pieces for full row
    board[0][0] = { type: 'r', color: 'b', id: 'b_r_0_0' };
    board[0][1] = { type: 'n', color: 'b', id: 'b_n_0_1' };
    board[0][10] = { type: 'n', color: 'b', id: 'b_n_0_10' };
    board[0][11] = { type: 'r', color: 'b', id: 'b_r_0_11' };

    board[7][0] = { type: 'r', color: 'w', id: 'w_r_7_0' };
    board[7][1] = { type: 'n', color: 'w', id: 'w_n_7_1' };
    board[7][10] = { type: 'n', color: 'w', id: 'w_n_7_10' };
    board[7][11] = { type: 'r', color: 'w', id: 'w_r_7_11' };

    // Full pawn rows of 12 pawns on Rank 2 (White, row 6) and Rank 7 (Black, row 1)
    for (let c = 0; c < 12; c++) {
      board[1][c] = { type: 'p', color: 'b', id: `b_p_1_${c}` };
      board[6][c] = { type: 'p', color: 'w', id: `w_p_6_${c}` };
    }

    // Extra 4 pawns centered on Rank 3 (White e3-h3, row 5 cols 4-7) and Rank 6 (Black e6-h6, row 2 cols 4-7)
    for (let c = 4; c <= 7; c++) {
      board[2][c] = { type: 'p', color: 'b', id: `b_p_2_${c}` };
      board[5][c] = { type: 'p', color: 'w', id: `w_p_5_${c}` };
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
