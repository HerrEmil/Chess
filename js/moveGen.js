import { boardAfterMove } from './main.js';
import { getPieces } from './util.js';
/*
Move generator based on the mailbox design
*/
//NB: this one needs to take a board as a parameter, or the AI will never get past move one.
//NB: It also needs to do the check-check in another way, so it won't be recursive and we can combine this one with the nocheck version
//NB: still missing the fancy pawns (Conversion + en passant)
//NB: This is being called by the AI, so need to update that aswell when fixing this one.
//PS: It's fairly optimized, just long and ugly.

function rookValids(curBoard, bIndex, index, type, color) {
  let up = true;
  let down = true;
  let left = true;
  let right = true;
  let upPos = bIndex[index];
  let downPos = bIndex[index];
  let leftPos = bIndex[index];
  let rightPos = bIndex[index];
  let upPiece;
  let downPiece;
  let leftPiece;
  let rightPiece;
  const valids = [];
  while (up || down || left || right) {
    if (up) {
      //Check the spot above
      upPos -= 10;
      upPiece = curBoard[upPos].charCodeAt(0);
      if (upPiece === 45) {
        valids.push(bIndex.indexOf(upPos));
      } else if (upPiece !== 42 && color === 'black') {
        if (upPiece > 96) {
          valids.push(bIndex.indexOf(upPos));
        }
        up = false;
      } else if (upPiece !== 42 && color === 'white') {
        if (upPiece < 96) {
          valids.push(bIndex.indexOf(upPos));
        }
        up = false;
      } else {
        up = false;
      }
    }
    if (down) {
      downPos += 10;
      downPiece = curBoard[downPos].charCodeAt(0);
      if (downPiece === 45) {
        valids.push(bIndex.indexOf(downPos));
      } else if (downPiece !== 42 && color === 'black') {
        if (downPiece > 96) {
          valids.push(bIndex.indexOf(downPos));
        }
        down = false;
      } else if (downPiece !== 42 && color === 'white') {
        if (downPiece < 96) {
          valids.push(bIndex.indexOf(downPos));
        }
        down = false;
      } else {
        down = false;
      }
    }
    if (left) {
      leftPos -= 1;
      leftPiece = curBoard[leftPos].charCodeAt(0);
      if (leftPiece === 45) {
        valids.push(bIndex.indexOf(leftPos));
      } else if (leftPiece !== 42 && color === 'black') {
        if (leftPiece > 96) {
          valids.push(bIndex.indexOf(leftPos));
        }
        left = false;
      } else if (leftPiece !== 42 && color === 'white') {
        if (leftPiece < 96) {
          valids.push(bIndex.indexOf(leftPos));
        }
        left = false;
      } else {
        left = false;
      }
    }
    if (right) {
      rightPos += 1;
      rightPiece = curBoard[rightPos].charCodeAt(0);
      if (rightPiece === 45) {
        valids.push(bIndex.indexOf(rightPos));
      } else if (rightPiece !== 42 && color === 'black') {
        if (rightPiece > 96) {
          valids.push(bIndex.indexOf(rightPos));
        }
        right = false;
      } else if (rightPiece !== 42 && color === 'white') {
        if (rightPiece < 96) {
          valids.push(bIndex.indexOf(rightPos));
        }
        right = false;
      } else {
        right = false;
      }
    }
  }
  return valids;
}

function bishopValids(curBoard, bIndex, index, type, color) {
  //Using the Rook function turned 45degree to the <insert some side that makes sense, since I have no idea how to explain it>
  //This is just me being lazy.
  let up = true;

  let down = true;
  let left = true;
  let right = true;
  let upPos = bIndex[index];
  let downPos = bIndex[index];
  let leftPos = bIndex[index];
  let rightPos = bIndex[index];
  let upPiece;
  let downPiece;
  let leftPiece;
  let rightPiece;
  const valids = [];
  while (up || down || left || right) {
    if (up) {
      //Check the spot above
      upPos -= 9;
      upPiece = curBoard[upPos].charCodeAt(0);
      if (upPiece === 45) {
        valids.push(bIndex.indexOf(upPos));
      } else if (upPiece !== 42 && color === 'black') {
        if (upPiece > 96) {
          valids.push(bIndex.indexOf(upPos));
        }
        up = false;
      } else if (upPiece !== 42 && color === 'white') {
        if (upPiece < 96) {
          valids.push(bIndex.indexOf(upPos));
        }
        up = false;
      } else {
        up = false;
      }
    }
    if (down) {
      downPos += 9;
      downPiece = curBoard[downPos].charCodeAt(0);
      if (downPiece === 45) {
        valids.push(bIndex.indexOf(downPos));
      } else if (downPiece !== 42 && color === 'black') {
        if (downPiece > 96) {
          valids.push(bIndex.indexOf(downPos));
        }
        down = false;
      } else if (downPiece !== 42 && color === 'white') {
        if (downPiece < 96) {
          valids.push(bIndex.indexOf(downPos));
        }
        down = false;
      } else {
        down = false;
      }
    }
    if (left) {
      leftPos -= 11;
      leftPiece = curBoard[leftPos].charCodeAt(0);
      if (leftPiece === 45) {
        valids.push(bIndex.indexOf(leftPos));
      } else if (leftPiece !== 42 && color === 'black') {
        if (leftPiece > 96) {
          valids.push(bIndex.indexOf(leftPos));
        }
        left = false;
      } else if (leftPiece !== 42 && color === 'white') {
        if (leftPiece < 96) {
          valids.push(bIndex.indexOf(leftPos));
        }
        left = false;
      } else {
        left = false;
      }
    }
    if (right) {
      rightPos += 11;
      rightPiece = curBoard[rightPos].charCodeAt(0);
      if (rightPiece === 45) {
        valids.push(bIndex.indexOf(rightPos));
      } else if (rightPiece !== 42 && color === 'black') {
        if (rightPiece > 96) {
          valids.push(bIndex.indexOf(rightPos));
        }
        right = false;
      } else if (rightPiece !== 42 && color === 'white') {
        if (rightPiece < 96) {
          valids.push(bIndex.indexOf(rightPos));
        }
        right = false;
      } else {
        right = false;
      }
    }
  }
  return valids;
}
function knightValids(curBoard, bIndex, index, type, color) {
  const pos = bIndex[index];
  const valids = [];
  const rightUp = pos - 8;
  const leftUp = pos - 12;
  const upRight = pos - 19;
  const upLeft = pos - 21;
  const leftDown = pos + 8;
  const rightDown = pos + 12;
  const downLeft = pos + 19;
  const downRight = pos + 21;
  const rightUpPiece = curBoard[rightUp].charCodeAt(0);
  const leftUpPiece = curBoard[leftUp].charCodeAt(0);
  const upRightPiece = curBoard[upRight].charCodeAt(0);
  const upLeftPiece = curBoard[upLeft].charCodeAt(0);
  const leftDownPiece = curBoard[leftDown].charCodeAt(0);
  const rightDownPiece = curBoard[rightDown].charCodeAt(0);
  const downLeftPiece = curBoard[downLeft].charCodeAt(0);
  const downRightPiece = curBoard[downRight].charCodeAt(0);
  if (rightUpPiece !== 42) {
    if (rightUpPiece === 45) {
      valids.push(bIndex.indexOf(rightUp));
    } else if (rightUpPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(rightUp));
    } else if (rightUpPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(rightUp));
    }
  }
  if (leftUpPiece !== 42) {
    if (leftUpPiece === 45) {
      valids.push(bIndex.indexOf(leftUp));
    } else if (leftUpPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(leftUp));
    } else if (leftUpPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(leftUp));
    }
  }
  if (upRightPiece !== 42) {
    if (upRightPiece === 45) {
      valids.push(bIndex.indexOf(upRight));
    } else if (upRightPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(upRight));
    } else if (upRightPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(upRight));
    }
  }
  if (upLeftPiece !== 42) {
    if (upLeftPiece === 45) {
      valids.push(bIndex.indexOf(upLeft));
    } else if (upLeftPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(upLeft));
    } else if (upLeftPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(upLeft));
    }
  }
  if (leftDownPiece !== 42) {
    if (leftDownPiece === 45) {
      valids.push(bIndex.indexOf(leftDown));
    } else if (leftDownPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(leftDown));
    } else if (leftDownPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(leftDown));
    }
  }
  if (rightDownPiece !== 42) {
    if (rightDownPiece === 45) {
      valids.push(bIndex.indexOf(rightDown));
    } else if (rightDownPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(rightDown));
    } else if (rightDownPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(rightDown));
    }
  }
  if (downLeftPiece !== 42) {
    if (downLeftPiece === 45) {
      valids.push(bIndex.indexOf(downLeft));
    } else if (downLeftPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(downLeft));
    } else if (downLeftPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(downLeft));
    }
  }
  if (downRightPiece !== 42) {
    if (downRightPiece === 45) {
      valids.push(bIndex.indexOf(downRight));
    } else if (downRightPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(downRight));
    } else if (downRightPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(downRight));
    }
  }
  return valids;
}
function kingValids(curBoard, bIndex, index, type, color) {
  const pos = bIndex[index];
  const valids = [];
  const left = pos - 1;
  const upRight = pos - 9;
  const up = pos - 10;
  const upLeft = pos - 11;
  const right = pos + 1;
  const downLeft = pos + 9;
  const down = pos + 10;
  const downRight = pos + 11;
  const leftPiece = curBoard[left].charCodeAt(0);
  const upRightPiece = curBoard[upRight].charCodeAt(0);
  const upPiece = curBoard[up].charCodeAt(0);
  const upLeftPiece = curBoard[upLeft].charCodeAt(0);
  const rightPiece = curBoard[right].charCodeAt(0);
  const downLeftPiece = curBoard[downLeft].charCodeAt(0);
  const downPiece = curBoard[down].charCodeAt(0);
  const downRightPiece = curBoard[downRight].charCodeAt(0);
  if (leftPiece !== 42) {
    if (leftPiece === 45) {
      valids.push(bIndex.indexOf(left));
    } else if (leftPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(left));
    } else if (leftPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(left));
    }
  }
  if (upRightPiece !== 42) {
    if (upRightPiece === 45) {
      valids.push(bIndex.indexOf(upRight));
    } else if (upRightPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(upRight));
    } else if (upRightPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(upRight));
    }
  }
  if (upPiece !== 42) {
    if (upPiece === 45) {
      valids.push(bIndex.indexOf(up));
    } else if (upPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(up));
    } else if (upPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(up));
    }
  }
  if (upLeftPiece !== 42) {
    if (upLeftPiece === 45) {
      valids.push(bIndex.indexOf(upLeft));
    } else if (upLeftPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(upLeft));
    } else if (upLeftPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(upLeft));
    }
  }
  if (rightPiece !== 42) {
    if (rightPiece === 45) {
      valids.push(bIndex.indexOf(right));
    } else if (rightPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(right));
    } else if (rightPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(right));
    }
  }
  if (downLeftPiece !== 42) {
    if (downLeftPiece === 45) {
      valids.push(bIndex.indexOf(downLeft));
    } else if (downLeftPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(downLeft));
    } else if (downLeftPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(downLeft));
    }
  }
  if (downPiece !== 42) {
    if (downPiece === 45) {
      valids.push(bIndex.indexOf(down));
    } else if (downPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(down));
    } else if (downPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(down));
    }
  }
  if (downRightPiece !== 42) {
    if (downRightPiece === 45) {
      valids.push(bIndex.indexOf(downRight));
    } else if (downRightPiece > 96 && color === 'black') {
      valids.push(bIndex.indexOf(downRight));
    } else if (downRightPiece < 96 && color === 'white') {
      valids.push(bIndex.indexOf(downRight));
    }
  }
  return valids;
}
function pawnValids(curBoard, bIndex, index, type, color) {
  const pos = bIndex[index];
  const valids = [];
  let forward;
  let doubleForward;
  let attackRight;
  let attackLeft;
  let forwardPiece;
  let doubleForwardPiece;
  let attackRightPiece;
  let attackLeftPiece;
  let doubleForwardAllowed;
  let leftAllowed;
  let rightAllowed;
  if (color === 'black') {
    forward = pos + 10;
    doubleForward = pos + 20;
    attackRight = pos + 11;
    attackLeft = pos + 9;
    forwardPiece = curBoard[forward].charCodeAt(0);
    doubleForwardPiece = curBoard[doubleForward].charCodeAt(0);
    attackRightPiece = curBoard[attackRight].charCodeAt(0);
    attackLeftPiece = curBoard[attackLeft].charCodeAt(0);
    leftAllowed = attackLeftPiece > 96 && attackLeftPiece < 115;
    rightAllowed = attackRightPiece > 96 && attackRightPiece < 115;
    doubleForwardAllowed = pos < 39 && pos > 30;
  } else {
    forward = pos - 10;
    doubleForward = pos - 20;
    attackRight = pos - 11;
    attackLeft = pos - 9;
    forwardPiece = curBoard[forward].charCodeAt(0);
    doubleForwardPiece = curBoard[doubleForward].charCodeAt(0);
    attackRightPiece = curBoard[attackRight].charCodeAt(0);
    attackLeftPiece = curBoard[attackLeft].charCodeAt(0);
    leftAllowed = attackLeftPiece > 64 && attackLeftPiece < 83;
    rightAllowed = attackRightPiece > 64 && attackRightPiece < 83;
    doubleForwardAllowed = pos < 89 && pos > 80;
  }
  if (forwardPiece === 45) {
    valids.push(bIndex.indexOf(forward));
  }
  if (
    doubleForwardAllowed &&
    doubleForwardPiece === 45 &&
    forwardPiece === 45
  ) {
    valids.push(bIndex.indexOf(doubleForward));
  }
  if (rightAllowed) {
    valids.push(bIndex.indexOf(attackRight));
  }
  if (leftAllowed) {
    valids.push(bIndex.indexOf(attackLeft));
  }
  return valids;
}

function getValidNoCheck(aBoard, index) {
  const curBoard = aBoard.slice();
  const bIndex = game.boardIndex;
  const piece = curBoard[bIndex[index]];
  const type = piece.toLowerCase();
  const color = type === piece ? 'white' : 'black';
  if (piece === '-' || piece === '_') {
    return [];
  }
  if (type === 'r') {
    //Rooks
    return rookValids(curBoard, bIndex, index, type, color);
  } else if (type === 'n') {
    //kNights
    return knightValids(curBoard, bIndex, index, type, color);
  } else if (type === 'b') {
    //Bishops
    return bishopValids(curBoard, bIndex, index, type, color);
  } else if (type === 'q') {
    //Queens
    return rookValids(curBoard, bIndex, index, type, color).concat(
      bishopValids(curBoard, bIndex, index, type, color)
    );
  } else if (type === 'k') {
    //Kings
    return kingValids(curBoard, bIndex, index, type, color);
  } else if (type === 'p') {
    //Pawns
    return pawnValids(curBoard, bIndex, index, type, color);
  }
  //No check in this one.
  //Stop the timer and return
  return [];
}

export function getAllValidMovesNoCheck(aBoard, pieces) {
  const allValidMoves = [];
  for (let i = 0; i < pieces.length; i += 1) {
    allValidMoves[i] = getValidNoCheck(aBoard, pieces[i]);
  }
  return allValidMoves;
}

export function isInCheck(aBoard, color) {
  const bIndex = game.boardIndex;
  const enemy = color === 'white' ? 'black' : 'white';
  const enemyPieces = getPieces(aBoard, enemy);
  const enemyValids2D = getAllValidMovesNoCheck(aBoard, enemyPieces);
  const enemyValidsFlat = [].concat(...enemyValids2D);
  const friendlyKing = color === 'white' ? 'k' : 'K';
  const friendlyKingPos = bIndex.indexOf(aBoard.indexOf(friendlyKing));
  const inThere = enemyValidsFlat.indexOf(friendlyKingPos);
  return inThere === -1 ? false : true;
}

export function getValid(index, aBoard) {
  const curBoard = aBoard.slice();
  const bIndex = game.boardIndex;
  let valids = [];
  const piece = curBoard[bIndex[index]];
  const type = piece.toLowerCase();
  const color = type === piece ? 'white' : 'black';
  if (piece === '-' || piece === '_') {
    return valids;
  }
  if (type === 'r') {
    //Rooks
    valids = rookValids(curBoard, bIndex, index, type, color);
  } else if (type === 'n') {
    //Knights
    valids = knightValids(curBoard, bIndex, index, type, color);
  } else if (type === 'b') {
    //Bishops
    valids = bishopValids(curBoard, bIndex, index, type, color);
  } else if (type === 'q') {
    //Queens
    valids = rookValids(curBoard, bIndex, index, type, color).concat(
      bishopValids(curBoard, bIndex, index, type, color)
    );
  } else if (type === 'k') {
    //Kings
    valids = kingValids(curBoard, bIndex, index, type, color);
  } else if (type === 'p') {
    //Pawns
    valids = pawnValids(curBoard, bIndex, index, type, color);
  }
  // Evaluate if castling is possible
  // 1 - check if castling flags are true (these are set to false when kings or rooks are moved)
  // 2 - check if spaces directly to the left and right of the king are in the valids array
  // 3 - check if resulting positions for king and rook are empty
  // 4 - check that king does not move over a position that is in check
  if (
    type === 'k' &&
    color === 'black' &&
    (game.castle.blackShortCastle || game.castle.blackLongCastle)
  ) {
    if (game.castle.blackShortCastle && valids.includes(5)) {
      // Check that G8 is empty
      if (curBoard[bIndex[6]] === '-') {
        // Check that black king is not checked
        if (!isInCheck(curBoard.slice(), 'black')) {
          // Check that black king in F8 would not be checked
          if (!isInCheck(boardAfterMove(curBoard.slice(), 4, 5), 'black')) {
            valids.push(6);
          }
        }
      }
    }
    if (game.castle.blackLongCastle && valids.includes(3)) {
      // Check that B8 and C8 are empty
      if (curBoard[bIndex[2]] === '-' && curBoard[bIndex[1]] === '-') {
        // Check that black king is not checked
        if (!isInCheck(curBoard.slice(), 'black')) {
          // Check that black king in D8 would not be checked
          if (!isInCheck(boardAfterMove(curBoard.slice(), 4, 3), 'black')) {
            valids.push(2);
          }
        }
      }
    }
  } else if (
    type === 'k' &&
    color === 'white' &&
    (game.castle.whiteShortCastle || game.castle.whiteLongCastle)
  ) {
    if (game.castle.whiteShortCastle && valids.includes(61)) {
      // Check that G1 is empty
      if (curBoard[bIndex[62]] === '-') {
        // Check that white king is not checked
        if (!isInCheck(curBoard.slice(), 'white')) {
          // Check that white king in F1 would not be checked
          if (!isInCheck(boardAfterMove(curBoard.slice(), 60, 61), 'white')) {
            valids.push(62);
          }
        }
      }
    }
    if (game.castle.whiteLongCastle && valids.includes(59)) {
      // Check that B1 and C1 are empty
      if (curBoard[bIndex[58]] === '-' && curBoard[bIndex[57]] === '-') {
        // Check that white king is not checked
        if (!isInCheck(curBoard.slice(), 'white')) {
          // Check that white King in D1 would not be checked
          if (!isInCheck(boardAfterMove(curBoard.slice(), 60, 59), 'white')) {
            valids.push(58);
          }
        }
      }
    }
  }
  //Remove all the valids that cause check
  for (let i = 0; i < valids.length; i += 1) {
    const potentialBoard = boardAfterMove(curBoard.slice(), index, valids[i]);
    const checked = isInCheck(potentialBoard.slice(), color);
    if (checked) {
      valids.splice(i, 1);
      i -= 1;
      //the array is now shorter by one, so take the counter down one!
    }
  }
  return valids;
}
