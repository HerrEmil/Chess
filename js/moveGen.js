/*
Move generator based on the mailbox design
*/
//NB: this one needs to take a board as a parameter, or the AI will never get past move one.
//NB: It also needs to do the check-check in another way, so it won't be recursive and we can combine this one with the nocheck version
//NB: still missing the fancy pawns (Conversion + en passant)
//NB: This is being called by the AI, so need to update that aswell when fixing this one.
//PS: It's fairly optimized, just long and ugly.
function getValid(index, aBoard) {
    'use strict';
    var curBoard = aBoard.slice(),
        bIndex = game.boardIndex,
        valids = [],
        piece = curBoard[bIndex[index]],
        type = piece.toLowerCase(),
        color = type === piece ? "white" : "black",
        i,
        potentialBoard,
        checked;
    if (piece === '-' || piece === '_') {
        console.log("Silly you: Not a piece:", index);
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
        valids = rookValids(curBoard, bIndex, index, type, color).concat(bishopValids(curBoard, bIndex, index, type, color));
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
    if (type === 'k' && color === 'black' && (game.castle.blackShortCastle || game.castle.blackLongCastle)) {
        if (game.castle.blackShortCastle && valids.indexOf(5) > -1) {
            if (curBoard[bIndex[6]] === '-') {
                valids.push(6);
            }
        }
        if (game.castle.blackLongCastle && valids.indexOf(3) > -1) {
            if (curBoard[bIndex[2]] === '-' && curBoard[bIndex[1]] === '-') {
                valids.push(2);
            }
        }

    } else if (type === 'k' && color === 'white' && (game.castle.whiteShortCastle || game.castle.whiteLongCastle)) {
        if (game.castle.whiteShortCastle && valids.indexOf(61) > -1) {
            // Check that G1 is empty
            if (curBoard[bIndex[62]] === '-') {
                // Check that white king in F1 would not cause check
                if (!isInCheck(boardAfterMove(curBoard.slice(), 60, 61), color)) {
                    valids.push(62);
                }
            }
        }
        if (game.castle.whiteLongCastle && valids.indexOf(59) > -1) {
            // Check that B1 and C1 are empty
            if (curBoard[bIndex[58]] === '-' && curBoard[bIndex[57]] === '-') {
                // Check that white King in D1 would not cause check
                if (!isInCheck(boardAfterMove(curBoard.slice(), 60, 59), color)) {
                    valids.push(58);
                }
            }
        }
    }
    //Remove all the valids that cause check
    i = 0;
    for (i; i < valids.length; i += 1) {
        potentialBoard = boardAfterMove(curBoard.slice(), index, valids[i]);
        checked = isInCheck(potentialBoard.slice(), color);
        if (checked) {
            valids.splice(i, 1);
            i -= 1;
            //the array is now shorter by one, so take the counter down one!
        }
    }
    return valids;
}
function rookValids(curBoard, bIndex, index, type, color) {
    'use strict';
    var up = true,
        down = true,
        left = true,
        right = true,
        upPos = bIndex[index],
        downPos = bIndex[index],
        leftPos = bIndex[index],
        rightPos = bIndex[index],
        upPiece,
        downPiece,
        leftPiece,
        rightPiece,
        valids = [];
    while (up || down || left || right) {
        if (up) {
            //Check the spot above
            upPos -= 10;
            upPiece = curBoard[upPos].charCodeAt(0);
            if (upPiece === 45) {
                valids.push(bIndex.indexOf(upPos));
            } else if (upPiece !== 42 && color === "black") {
                if (upPiece > 96) {
                    valids.push(bIndex.indexOf(upPos));
                }
                up = false;
            } else if (upPiece !== 42 && color === "white") {
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
            } else if (downPiece !== 42 && color === "black") {
                if (downPiece > 96) {
                    valids.push(bIndex.indexOf(downPos));
                }
                down = false;
            } else if (downPiece !== 42 && color === "white") {
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
            } else if (leftPiece !== 42 && color === "black") {
                if (leftPiece > 96) {
                    valids.push(bIndex.indexOf(leftPos));
                }
                left = false;
            } else if (leftPiece !== 42 && color === "white") {
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
            } else if (rightPiece !== 42 && color === "black") {
                if (rightPiece > 96) {
                    valids.push(bIndex.indexOf(rightPos));
                }
                right = false;
            } else if (rightPiece !== 42 && color === "white") {
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
    'use strict';
    //Using the Rook function turned 45degree to the <insert some side that makes sense, since I have no idea how to explain it>
    //This is just me being lazy.
    var up = true,
        down = true,
        left = true,
        right = true,
        upPos = bIndex[index],
        downPos = bIndex[index],
        leftPos = bIndex[index],
        rightPos = bIndex[index],
        upPiece,
        downPiece,
        leftPiece,
        rightPiece,
        valids = [];
    while (up || down || left || right) {
        if (up) {
            //Check the spot above
            upPos -= 9;
            upPiece = curBoard[upPos].charCodeAt(0);
            if (upPiece === 45) {
                valids.push(bIndex.indexOf(upPos));
            } else if (upPiece !== 42 && color === "black") {
                if (upPiece > 96) {
                    valids.push(bIndex.indexOf(upPos));
                }
                up = false;
            } else if (upPiece !== 42 && color === "white") {
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
            } else if (downPiece !== 42 && color === "black") {
                if (downPiece > 96) {
                    valids.push(bIndex.indexOf(downPos));
                }
                down = false;
            } else if (downPiece !== 42 && color === "white") {
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
            } else if (leftPiece !== 42 && color === "black") {
                if (leftPiece > 96) {
                    valids.push(bIndex.indexOf(leftPos));
                }
                left = false;
            } else if (leftPiece !== 42 && color === "white") {
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
            } else if (rightPiece !== 42 && color === "black") {
                if (rightPiece > 96) {
                    valids.push(bIndex.indexOf(rightPos));
                }
                right = false;
            } else if (rightPiece !== 42 && color === "white") {
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
    'use strict';
    var pos = bIndex[index],
        valids = [],
        rightUp = pos - 8,
        leftUp = pos - 12,
        upRight = pos - 19,
        upLeft = pos - 21,
        leftDown = pos + 8,
        rightDown = pos + 12,
        downLeft = pos + 19,
        downRight = pos + 21,
        rightUpPiece = curBoard[rightUp].charCodeAt(0),
        leftUpPiece = curBoard[leftUp].charCodeAt(0),
        upRightPiece = curBoard[upRight].charCodeAt(0),
        upLeftPiece = curBoard[upLeft].charCodeAt(0),
        leftDownPiece = curBoard[leftDown].charCodeAt(0),
        rightDownPiece = curBoard[rightDown].charCodeAt(0),
        downLeftPiece = curBoard[downLeft].charCodeAt(0),
        downRightPiece = curBoard[downRight].charCodeAt(0);
    if (rightUpPiece !== 42) {
        if (rightUpPiece === 45) {
            valids.push(bIndex.indexOf(rightUp));
        } else if (rightUpPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(rightUp));
        } else if (rightUpPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(rightUp));
        }
    }
    if (leftUpPiece !== 42) {
        if (leftUpPiece === 45) {
            valids.push(bIndex.indexOf(leftUp));
        } else if (leftUpPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(leftUp));
        } else if (leftUpPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(leftUp));
        }
    }
    if (upRightPiece !== 42) {
        if (upRightPiece === 45) {
            valids.push(bIndex.indexOf(upRight));
        } else if (upRightPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(upRight));
        } else if (upRightPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(upRight));
        }
    }
    if (upLeftPiece !== 42) {
        if (upLeftPiece === 45) {
            valids.push(bIndex.indexOf(upLeft));
        } else if (upLeftPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(upLeft));
        } else if (upLeftPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(upLeft));
        }
    }
    if (leftDownPiece !== 42) {
        if (leftDownPiece === 45) {
            valids.push(bIndex.indexOf(leftDown));
        } else if (leftDownPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(leftDown));
        } else if (leftDownPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(leftDown));
        }
    }
    if (rightDownPiece !== 42) {
        if (rightDownPiece === 45) {
            valids.push(bIndex.indexOf(rightDown));
        } else if (rightDownPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(rightDown));
        } else if (rightDownPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(rightDown));
        }
    }
    if (downLeftPiece !== 42) {
        if (downLeftPiece === 45) {
            valids.push(bIndex.indexOf(downLeft));
        } else if (downLeftPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(downLeft));
        } else if (downLeftPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(downLeft));
        }
    }
    if (downRightPiece !== 42) {
        if (downRightPiece === 45) {
            valids.push(bIndex.indexOf(downRight));
        } else if (downRightPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(downRight));
        } else if (downRightPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(downRight));
        }
    }
    return valids;
}
function kingValids(curBoard, bIndex, index, type, color) {
    'use strict';
    var pos = bIndex[index],
        valids = [],
        left = pos - 1,
        upRight = pos - 9,
        up = pos - 10,
        upLeft = pos - 11,
        right = pos + 1,
        downLeft = pos + 9,
        down = pos + 10,
        downRight = pos + 11,
        leftPiece = curBoard[left].charCodeAt(0),
        upRightPiece = curBoard[upRight].charCodeAt(0),
        upPiece = curBoard[up].charCodeAt(0),
        upLeftPiece = curBoard[upLeft].charCodeAt(0),
        rightPiece = curBoard[right].charCodeAt(0),
        downLeftPiece = curBoard[downLeft].charCodeAt(0),
        downPiece = curBoard[down].charCodeAt(0),
        downRightPiece = curBoard[downRight].charCodeAt(0);
    if (leftPiece !== 42) {
        if (leftPiece === 45) {
            valids.push(bIndex.indexOf(left));
        } else if (leftPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(left));
        } else if (leftPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(left));
        }
    }
    if (upRightPiece !== 42) {
        if (upRightPiece === 45) {
            valids.push(bIndex.indexOf(upRight));
        } else if (upRightPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(upRight));
        } else if (upRightPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(upRight));
        }
    }
    if (upPiece !== 42) {
        if (upPiece === 45) {
            valids.push(bIndex.indexOf(up));
        } else if (upPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(up));
        } else if (upPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(up));
        }
    }
    if (upLeftPiece !== 42) {
        if (upLeftPiece === 45) {
            valids.push(bIndex.indexOf(upLeft));
        } else if (upLeftPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(upLeft));
        } else if (upLeftPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(upLeft));
        }
    }
    if (rightPiece !== 42) {
        if (rightPiece === 45) {
            valids.push(bIndex.indexOf(right));
        } else if (rightPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(right));
        } else if (rightPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(right));
        }
    }
    if (downLeftPiece !== 42) {
        if (downLeftPiece === 45) {
            valids.push(bIndex.indexOf(downLeft));
        } else if (downLeftPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(downLeft));
        } else if (downLeftPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(downLeft));
        }
    }
    if (downPiece !== 42) {
        if (downPiece === 45) {
            valids.push(bIndex.indexOf(down));
        } else if (downPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(down));
        } else if (downPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(down));
        }
    }
    if (downRightPiece !== 42) {
        if (downRightPiece === 45) {
            valids.push(bIndex.indexOf(downRight));
        } else if (downRightPiece > 96 && color === "black") {
            valids.push(bIndex.indexOf(downRight));
        } else if (downRightPiece < 96 && color === "white") {
            valids.push(bIndex.indexOf(downRight));
        }
    }
    return valids;
}
function pawnValids(curBoard, bIndex, index, type, color) {
    'use strict';
    var pos = bIndex[index],
        valids = [],
        forward,
        doubleForward,
        attackRight,
        attackLeft,
        forwardPiece,
        doubleForwardPiece,
        attackRightPiece,
        attackLeftPiece,
        doubleForwardAllowed,
        leftAllowed,
        rightAllowed;
    if (color === "black") {
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
    if (doubleForwardAllowed && doubleForwardPiece === 45 && forwardPiece === 45) {
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
function isInCheck(aBoard, color) {
    'use strict';
    var bIndex = game.boardIndex,
        enemy = color === 'white' ? 'black' : 'white',
        enemyPieces = getPieces(aBoard, enemy),
        enemyValids2D = getAllValidMovesNoCheck(aBoard, enemyPieces),
        enemyValidsFlat = [].concat.apply([], enemyValids2D),
        friendlyKing = color === 'white' ? 'k' : 'K',
        friendlyKingPos = bIndex.indexOf(aBoard.indexOf(friendlyKing)),
        inThere = enemyValidsFlat.indexOf(friendlyKingPos);
    return inThere === -1 ? false : true;
}
function getAllValidMovesNoCheck(aBoard, pieces) {
    'use strict';
    var allValidMoves = [],
        i = 0;
    for (i; i < pieces.length; i += 1) {
        allValidMoves[i] = getValidNoCheck(aBoard, pieces[i]);
    }
    return allValidMoves;
}
function getValidNoCheck(aBoard, index) {
    'use strict';
    var curBoard = aBoard.slice(),
        bIndex = game.boardIndex,
        valids = [],
        piece = curBoard[bIndex[index]],
        type = piece.toLowerCase(),
        color = type === piece ? "white" : "black";
    if (piece === '-' || piece === '_') {
        console.log("Silly you: Not a piece - No Check Version");
        return valids;
    }
    if (type === 'r') {
        //Rooks
        valids = rookValids(curBoard, bIndex, index, type, color);
    } else if (type === 'n') {
        //kNights
        valids = knightValids(curBoard, bIndex, index, type, color);
    } else if (type === 'b') {
        //Bishops
        valids = bishopValids(curBoard, bIndex, index, type, color);
    } else if (type === 'q') {
        //Queens
        valids = rookValids(curBoard, bIndex, index, type, color).concat(bishopValids(curBoard, bIndex, index, type, color));
    } else if (type === 'k') {
        //Kings
        valids = kingValids(curBoard, bIndex, index, type, color);
    } else if (type === 'p') {
        //Pawns
        valids = pawnValids(curBoard, bIndex, index, type, color);
    }
    //No check in this one.
    //Stop the timer and return
    return valids;
}