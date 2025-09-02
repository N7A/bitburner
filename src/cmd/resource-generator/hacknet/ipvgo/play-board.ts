export async function main(ns: NS) {
    // singleton
    const script: RunningScript | null = ns.getRunningScript('cmd/resource-generator/hacknet/ipvgo/play-board.ts');
    if (script) {
        ns.kill(script.pid);
    }

    ns.disableLog('go.makeMove');
    ns.disableLog('sleep');

    if (ns.go.getCurrentPlayer() === "None") {
        // reset board
        ns.go.resetBoardState("Netburners", 5);
    }
    // TODO: extend daemon
    while(true) {
        await playBoard(ns);

        // reset board
        ns.go.resetBoardState("Netburners", 5);
    }
}

async function playBoard(ns: NS) {
    let result, x, y;

    do {
        const board = ns.go.getBoardState();
        const validMoves = ns.go.analysis.getValidMoves();

        // TODO: more move options
        const [randX, randY] = getDefenseMove(ns, board, validMoves);

        // Choose a move from our options (currently just "random move")
        x = randX;
        y = randY;

        if (x === undefined) {
            // Pass turn if no moves are found
            result = await ns.go.passTurn();
        } else {
            // Play the selected move
            result = await ns.go.makeMove(x, y);
        }

        // Log opponent's next move, once it happens
        await ns.go.opponentNextTurn();

        await ns.sleep(200);

        // Keep looping as long as the opponent is playing moves
    } while (result?.type !== "gameOver");

    if (ns.go.getGameState().whiteScore < ns.go.getGameState().blackScore) {
        ns.print('Win !');
        ns.print(`${ns.formatNumber(ns.go.analysis.getStats().Netburners?.bonusPercent ?? 0)}%`);
    } else if (ns.go.getGameState().whiteScore > ns.go.getGameState().blackScore) {
        ns.print('Lose...');
    } else {
        ns.print('Equality.');
    }
}

/**
 * Choose one of the empty points on the board at random to play
 */
const getRandomMove = (board: string[], validMoves: boolean[][]) => {
  const moveOptions = [];
  const size = board[0].length;

  // Look through all the points on the board
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      // Make sure the point is a valid move
      const isValidMove = validMoves[x][y] === true;
      // Leave some spaces to make it harder to capture our pieces.
      // We don't want to run out of empty node connections!
      const isNotReservedSpace = x % 2 === 1 || y % 2 === 1;

      if (isValidMove && isNotReservedSpace) {
        moveOptions.push([x, y]);
      }
    }
  }

  // Choose one of the found moves at random
  const randomIndex = Math.round(Math.random() * moveOptions.length);
  return moveOptions[randomIndex] ?? [];
};

function getExpansionMove(board: string[], validMoves: boolean[][]) {
    const moveOptions = [];
    const size = board[0].length;

    // Look through all the points on the board
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Make sure the point is a valid move
            const isValidMove = validMoves[x][y] === true;
            // Leave some spaces to make it harder to capture our pieces.
            // We don't want to run out of empty node connections!
            const isNotReservedSpace = x % 2 === 1 || y % 2 === 1;
            
            // If a point to the north, south, east, or west is a friendly router
            const isNeighborFriendly = board[x + 1]?.[y] === 'X'
                || board[x - 1]?.[y] === 'X'
                || board[x]?.[y + 1] === 'X'
                || board[x]?.[y - 1] === 'X';

            if (isValidMove && isNotReservedSpace && isNeighborFriendly) {
                moveOptions.push([x, y]);
            }
        }
    }

    // Choose one of the found moves at random
    const randomIndex = Math.round(Math.random() * moveOptions.length);
    return moveOptions[randomIndex] ?? getRandomMove(board, validMoves);
}

function getCaptureMove(ns: NS, board: string[], validMoves: boolean[][]) {
    const moveOptions = [];
    const size = board[0].length;

    // Look through all the points on the board
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Make sure the point is a valid move
            const isValidMove = validMoves[x][y] === true;
            
            const isOppenentInDanger = getInDanger(ns, board, x, y, 'O');

            if (isValidMove && isOppenentInDanger) {
                moveOptions.push([x, y]);
            }
        }
    }

    // Choose one of the found moves at random
    const randomIndex = Math.round(Math.random() * moveOptions.length);
    return moveOptions[randomIndex] ?? getExpansionMove(board, validMoves);
}

function getAdjacent(x: number, y: number): {x: number, y: number}[] {
    return [
        // north
        {x: x + 1, y: y},
        // south
        {x: x - 1, y: y},
        // est
        {x: x, y: y + 1},
        // west
        {x: x, y: y - 1}
    ]
}

function getInDanger(ns: NS, board: string[], x: number, y: number, player: 'X' | 'O') {
    return getAdjacent(x, y)
        .some(point => board[point.x]?.[point.y] === player 
            && ns.go.analysis.getLiberties(board)[point.x]?.[point.y] === 1);
}

function getDefenseMove(ns: NS, board: string[], validMoves: boolean[][]) {      
    const moveOptions = [];
    const size = board[0].length;

    // Look through all the points on the board
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Make sure the point is a valid move
            const isValidMove = validMoves[x][y] === true;
            
            // If a point to the north, south, east, or west is a friendly router
            const isPlayerInDanger = getInDanger(ns, board, x, y, 'X');

            const isSaveMove = getAdjacent(x, y)
                .filter(point => board[point.x]?.[point.y] === '.').length >=2
                || getAdjacent(x, y)
                .filter(point => board[point.x]?.[point.y] === 'X')
                .some(point => ns.go.analysis.getLiberties(board)[point.x]?.[point.y] >= 3);

            if (isValidMove && isPlayerInDanger && isSaveMove) {
                moveOptions.push([x, y]);
            }
        }
    }

    // Choose one of the found moves at random
    const randomIndex = Math.round(Math.random() * moveOptions.length);
    return moveOptions[randomIndex] ?? getCaptureMove(ns, board, validMoves);
}