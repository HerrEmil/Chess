import { ChessAI, color } from './src/chess/ai';
import { GlobalChess } from './src/chess/main';

declare global {
  interface Window {
    inHand: string | number;
    mousePos: string | JQuery<HTMLElement>;
    game: GlobalChess;
    AI: ChessAI;
    turn: color;
    startGame: () => void;
    convertPawn: () => void;
  }
}
