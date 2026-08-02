/**
 * Dynamic Score Point (DSP) Engine for Sandbox Chess
 * Scoring Constants:
 * - Legal Move Executed: +5 pts
 * - Successful "Move False" Call: +50 pts
 * - False Accusation Made: -30 pts
 * - Caught Cheating (Illegal Move Challenged): -40 pts
 * - Valid Checkmate Declared via [CHECKMATE!]: +100 pts
 * - Retroactive Uncaught Bluff Bonus: +20 pts per uncaught illegal move (calculated at end game)
 * - Retroactive Missed Checkmate Penalty: -50 pts (if declared checkmate was invalid)
 */

export const DSP_SCORES = {
  LEGAL_MOVE: 5,
  SUCCESSFUL_CHALLENGE: 50,
  FALSE_ACCUSATION_PENALTY: -30,
  CAUGHT_CHEATING_PENALTY: -40,
  VALID_CHECKMATE: 100,
  UNCAUGHT_BLUFF_BONUS: 20,
  INVALID_CHECKMATE_PENALTY: -50
};

export function createInitialScores() {
  return {
    w: 0,
    b: 0
  };
}

/**
 * Computes end game audit breakdown including uncaught bluffs
 */
export function computeFinalAudit(players, moveHistory, scores) {
  // Uncaught bluffs are move history items where isLegal === false and challenged === false
  const uncaughtBluffs = {
    w: 0, // White made uncaught bluffs
    b: 0  // Black made uncaught bluffs
  };

  const legalMovesCount = { w: 0, b: 0 };
  const illegalMovesCount = { w: 0, b: 0 };
  const successfulChallenges = { w: 0, b: 0 };
  const falseAccusations = { w: 0, b: 0 };

  moveHistory.forEach(item => {
    if (item.type === 'MOVE') {
      if (item.isLegal) {
        legalMovesCount[item.color]++;
      } else {
        illegalMovesCount[item.color]++;
        if (!item.challenged) {
          uncaughtBluffs[item.color]++;
        }
      }
    } else if (item.type === 'CHALLENGE') {
      if (item.successful) {
        // item.by is the challenger
        successfulChallenges[item.by]++;
      } else {
        falseAccusations[item.by]++;
      }
    }
  });

  const finalScores = {
    w: scores.w + (uncaughtBluffs.w * DSP_SCORES.UNCAUGHT_BLUFF_BONUS),
    b: scores.b + (uncaughtBluffs.b * DSP_SCORES.UNCAUGHT_BLUFF_BONUS)
  };

  let winner = null;
  if (finalScores.w > finalScores.b) {
    winner = 'w';
  } else if (finalScores.b > finalScores.w) {
    winner = 'b';
  } else {
    winner = 'DRAW';
  }

  return {
    finalScores,
    baseScores: { ...scores },
    uncaughtBluffs,
    uncaughtBluffPoints: {
      w: uncaughtBluffs.w * DSP_SCORES.UNCAUGHT_BLUFF_BONUS,
      b: uncaughtBluffs.b * DSP_SCORES.UNCAUGHT_BLUFF_BONUS
    },
    legalMovesCount,
    illegalMovesCount,
    successfulChallenges,
    falseAccusations,
    winner
  };
}
