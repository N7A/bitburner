export async function main(ns: NS) {
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
        const [randX, randY] = getExpansionMove(board, validMoves);

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