export {};

declare global {
  interface Window {
    convertPawn: () => void;
    restartGame: () => void;
    startGame: () => void;
    undoMove: () => void;
  }
}
