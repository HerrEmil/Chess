export {};

declare global {
  interface Window {
    startGame: () => void;
    convertPawn: () => void;
  }
}
