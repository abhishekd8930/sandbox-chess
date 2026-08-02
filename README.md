# Sandbox Chess ("Poker Chess")

Full-stack, real-time multiplayer web application where move rules are unconstrained, allowing players to bluff with illegal moves until opponents call **[MOVE FALSE!]**.

## Features
- **Dynamic Board Grid**: 6x6, 8x8, or 12x8 dynamic board layout based on the Pawn Slider (3 to 32 pawns).
- **Unconstrained Drag-and-Drop**: Drag any piece to any square without client-side blockers.
- **Shadow Referee Engine**: Evaluates piece move vectors $\vec{V} = (\Delta\text{row}, \Delta\text{col})$ and raycast blockages.
- **Move False Challenge System**:
  - Catching an illegal move: Reverts board state, penalizes offender (-40 pts), rewards challenger (+50 pts).
  - False accusation: Penalizes challenger (-30 pts).
- **Dynamic Score Point (DSP) Engine**: Legal move (+5 pts), Checkmate (+100 pts), Uncaught bluff bonus (+20 pts).
- **Light Cyberpunk Theme**: Styled with Light Blue, Emerald Green, and Crisp White UI palette.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
