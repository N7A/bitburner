import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import * as Log from 'workspace/socle/utils/logging';

enum BoardSize {
    CINQ = 5, 
    SEPT = 7, 
    NEUF = 9, 
    TREIZE = 13
}

enum GoOpponent {
    Netburners = "Netburners",
    Slum_Snakes = "Slum Snakes",
    The_Black_Hand = "The Black Hand",
    Tetrads = "Tetrads",
    Daedalus = "Daedalus",
    Illuminati = "Illuminati",
    UNKNOWN = "????????????",
    No_AI = "No AI"
}

export async function main(ns: NS) {
    // singleton
    const script: RunningScript | null = ns.getRunningScript('cmd/resource-generator/hacknet/ipvgo/play-board.ts');
    if (script) {
        ns.kill(script.pid);
    }

    const daemon: PlayBoardDaemon = new PlayBoardDaemon(ns);
    
    daemon.setupDashboard();

    /*if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }*/
    
    await daemon.run();
    
    ns.ui.closeTail();
}

class PlayBoardDaemon extends Daemon {
    readonly GAME_OVER = "gameOver";

    private dashboard: Dashboard;
    private goOpponent: GoOpponent;
    private boardSize: BoardSize;
    private player: 'X' | 'O';
    getOpponent = (): 'X' | 'O' => this.player === 'X' ? 'O' : 'X';

    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, 'IPvGO', {icon: '🌐', role: 'daemon'});

        this.setup();
    }

    setup() {
        this.goOpponent = GoOpponent.Netburners;
        this.boardSize = BoardSize.CINQ;
        this.player = 'X';

        if (this.ns.go.getCurrentPlayer() === "None") {
            // reset board
            this.ns.go.resetBoardState(this.goOpponent, this.boardSize);
        }
    }

    async work(): Promise<any> {
        await this.playBoard();

        // reset board
        this.ns.go.resetBoardState(this.goOpponent, this.boardSize);
    }

    private async playBoard() {
        let alreadyPass: boolean = false;
        let result: {
            type: "gameOver" | "move" | "pass";
            x: number | null;
            y: number | null;
        };
        
        if (this.ns.go.getCurrentPlayer() === "White") {
            // Log opponent's next move, once it happens
            await this.ns.go.opponentNextTurn();
        }

        // biggest liberties
        // capture opponent (&& always capturable with next move)
        // prevent opponent link networks
        // expend
        // reduce liberties opponent
        // defense
        // capture oppenent (&& no more capturable with next move)
        // not isAutoCapturable
        // valid
        do {
            this.ns.print(Log.getStartLog());
            const board = this.ns.go.getBoardState();

            // TODO: more move options
            // Choose a move
            const nodeMove: Node | undefined = this.getMoveChoice(this.ns, board);

            if (nodeMove === undefined) {
                if (alreadyPass) {
                    this.ns.print('Pass twice, quit the game.')
                    break;
                }
                // Pass turn if no moves are found
                result = await this.ns.go.passTurn();
                alreadyPass = true;
            } else {
                this.ns.print(nodeMove.x, ':', nodeMove.y);
                // Play the selected move
                result = await this.ns.go.makeMove(nodeMove.x, nodeMove.y);
            }

            // Log opponent's next move, once it happens
            const opponentMove = await this.ns.go.opponentNextTurn();

            if (
                // l'adversaire pass
                opponentMove.type === 'pass'
                // et il n'a plus de routeur
                && this.ns.go.getBoardState().every(x => !x.includes(this.getOpponent()))
            ) {
                this.ns.print('No more opponent');
                // continuer la partie ne rapporte pas plus
                result = await this.ns.go.passTurn();
            }

            this.ns.print(Log.getEndLog());
            await this.ns.sleep(200);

            // Keep looping as long as the opponent is playing moves
        } while (result?.type !== this.GAME_OVER);

        if (this.ns.go.getGameState().whiteScore < this.ns.go.getGameState().blackScore) {
            this.ns.print('🏆 Win !');
            this.ns.print(`${this.ns.formatNumber(this.ns.go.analysis.getStats().Netburners?.bonusPercent ?? 0)}%`);
        } else if (this.ns.go.getGameState().whiteScore > this.ns.go.getGameState().blackScore) {
            this.ns.print('😔 Lose...');
        } else {
            this.ns.print('🏳️ Equality.');
        }
    }

    private getMoveChoice(ns: NS, board: string[]): Node | undefined {
        // init nodes
        const nodes: Node[] = []
        for (let y = this.boardSize-1; y >= 0; y--) {
            for (let x = 0; x < this.boardSize; x++) {
                nodes.push(new Node(x, y));
            }
        }

        const validNodes: Node[] = nodes.filter(x => x.isValidMove(ns, board, this.player));
        const stratPriority: {function: ((availableNodes:Node[]) => Node[]), name: string}[] = [
            {name: 'Not auto caturable', function: (availableNodes: Node[]) => availableNodes.filter(x => x.isAutoCapturableMove(ns, board, this.player))},
            // TODO: get bigest network first
            {name: 'Capture move', function: (availableNodes: Node[]) => availableNodes.filter(x => this.isCaptureMove(ns, board, x))},
            {name: 'Defense move', function: (availableNodes: Node[]) => availableNodes.filter(x => this.isDefenseMove(ns, board, x))},
            // TODO: prevent link network opponent
            // TODO: get max liberty in prior
            {name: 'Reduce opponent liberties', function: (availableNodes: Node[]) => availableNodes.filter(x => x.isNeighborFriendly(board, this.getOpponent()))},
            // TODO: add link network
            {name: 'Epansion move', function: (availableNodes: Node[]) => availableNodes.filter(x => this.isExpansionMove(board, x))},
            {name: 'Maximum liberty', function: (availableNodes: Node[]) => {
                const personnalLibertyMax: number = availableNodes.map(x => x.getPersonnalLiberty(board))
                    .reduce((a,b) => Math.max(a,b));
                return availableNodes.filter(point => point.getPersonnalLiberty(board) === personnalLibertyMax)
            }},
            // Leave some spaces to make it harder to capture our pieces.
            // We don't want to run out of empty node connections!
            {name: 'Give some space', function: (availableNodes: Node[]) => availableNodes.filter(point => point.x % 2 === 1 || point.y % 2 === 1)},
            // any valid move
            {function: (availableNodes: Node[]) => availableNodes, name: 'Random move'}
        ]

        const availableNodes = this.getAvailableNodes(stratPriority, validNodes);
        if (availableNodes.length > 0) {
            // Choose one of the found moves at random
            const randomIndex = Math.round(Math.random() * (availableNodes.length-1));
            return availableNodes[randomIndex];
        }

        // no move found
        return undefined;
    }

    getAvailableNodes(strats: {function: ((availableNodes:Node[]) => Node[]), name: string}[], availableNodes: Node[]): Node[] {
        // strat suivante
        if (
            // plus de strategie à tester
            strats.length <= 0
            // choix unique
            || availableNodes.length <= 1
        ) {
            return availableNodes;
        }

        // application strat si possible, puis test strat suivante
        const strat = strats.shift();
        const stratNodes: Node[] = strat.function(availableNodes);
        this.ns.print(strat.name, ' : ', stratNodes.length);
        if (stratNodes.length > 0) {
            this.ns.print('SUCCESS ', strat.name)
            return this.getAvailableNodes(strats, stratNodes);
        }
        
        // test strat suivante
        return this.getAvailableNodes(strats, availableNodes);
    }

    private isExpansionMove(board: string[], node: Node) {
        return node.isNeighborFriendly(board, this.player);
    }

    private isCaptureMove(ns: NS, board: string[], node: Node) {
        return node.isInDanger(ns, board, this.getOpponent());
    }

    private isDefenseMove(ns: NS, board: string[], node: Node) {
        const futurNetworkLiberties = ns.go.analysis.getLiberties(node.getFutureBoard(ns, board, this.player))[node.x][node.y]; 
        const isSaveMove = futurNetworkLiberties >= 2;

        return node.isInDanger(ns, board, this.player) && isSaveMove;
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog('go.makeMove');
        this.ns.disableLog('sleep');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}

class Node {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    getPersonnalLiberty(board: string[]): number {
        // If a point to the north, south, east, or west is a friendly router
        return this.getAdjacent()
            .filter(point => board[point.x]?.[point.y] === '.').length;
    }
    
    isNeighborFriendly(board: string[], player: 'X' | 'O') {
        // If a point to the north, south, east, or west is a friendly router
        return this.getAdjacent()
            .some(point => board[point.x]?.[point.y] === player);
    }
    
    /**
     * @remarks RAM cost: 0 GB
     */
    getAdjacent(): Node[] {
        return [
            // north
            new Node(this.x + 1, this.y),
            // south
            new Node(this.x - 1, this.y),
            // est
            new Node(this.x, this.y + 1),
            // west
            new Node(this.x, this.y - 1)
        ]
    }
    
    isInDanger(ns: NS, board: string[], player: 'X' | 'O') {
        return this.getAdjacent()
            .some(point => board[point.x]?.[point.y] === player 
                && ns.go.analysis.getLiberties(board)[point.x]?.[point.y] === 1);
    }
    
    isAutoCaturable(ns: NS, board: string[], player: 'X' | 'O') {
        return ns.go.analysis.getLiberties(this.getFutureBoard(ns, board, player))[this.x][this.y] === 1;
    }
    
    getFutureBoard(ns: NS, board: string[], player: 'X' | 'O'): string[] {
        const opponent = player === 'X' ? 'O' : 'X';
        const chainIds = Array.from(new Set(this.getAdjacent()
            // opponent
            .filter(node => board[node.x]?.[node.y] === opponent)
            // will be kill
            .filter(node => ns.go.analysis.getLiberties()[node.x]?.[node.y] === 1)
            // get chain id
            .map(node => ns.go.analysis.getChains()[node.x]?.[node.y])));

        return board.map((row, xIndex) => {
                return Array.from(row).map((value, yIndex) => {
                    if (xIndex === this.x && yIndex === this.y) { // move
                        return player;
                    } else if (chainIds.includes(ns.go.analysis.getChains()[xIndex][yIndex])) { // killed
                        return '.';
                    }
                    return value;
                }).join('')
            });
    }

    /**
     * Détermine si le placement est valide.
     * 
     * @param ns 
     * @param board 
     * @param player 
     * @returns 
     */
    isValidMove(ns: NS, board: string[], player: 'X' | 'O') {
        const opponent = player === 'X' ? 'O' : 'X';
        const futurBoard = this.getFutureBoard(ns, board, player);

        // empty node
        return board[this.x]?.[this.y] === '.'
            // not suicide
            && (
                // will have liberty
                this.getAdjacent()
                    .some(point => board[point.x]?.[point.y] === '.')
                || this.getAdjacent()
                    // connect with a network
                    .some(point => board[point.x]?.[point.y] === player 
                        // not it last liberty
                        && ns.go.analysis.getLiberties(board)[point.x]?.[point.y] > 1)
                // exception
                || this.getAdjacent()
                    // connect with a opponent network
                    .some(point => board[point.x]?.[point.y] === opponent 
                        // it will capture the opponent network
                        && ns.go.analysis.getLiberties(board)[point.x]?.[point.y] === 1)
            )
            // not same move as previous
            && !ns.go.getMoveHistory()
                .some(previousBoard => futurBoard.every((futurRow, index) => futurRow === previousBoard[index]))
    }

    /**
     * Détermine si après le placement ici le network est directement capturable.
     * 
     * @param ns 
     * @param board 
     * @param player 
     * @returns 
     */
    isAutoCapturableMove(ns: NS, board: string[], player: 'X' | 'O') {
        return this.getAdjacent()
            .filter(point => board[point.x]?.[point.y] === '.').length === 1
            && (
                board[this.x]?.[this.y] === '.' 
                && this.getAdjacent().every(point => point.isInDanger(ns, board, player))
                || this.getAdjacent().every(point => board[point.x]?.[point.y] !== player)
            );
    }
}

/**
 * Choose one of the empty points on the board at random to play
 */
const getRandomMove = (size: number, validMoves: boolean[][]) => {
  const moveOptions = [];

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
    return moveOptions[randomIndex] ?? getRandomMove(board[0].length, validMoves);
}

function getCaptureMove(ns: NS, board: string[], validMoves: boolean[][]) {
    const moveOptions = [];
    const size = board[0].length;

    // Look through all the points on the board
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Make sure the point is a valid move
            const isValidMove = validMoves[x][y] === true;
            
            const isOppenentInDanger = new Node(x, y).isInDanger(ns, board, 'O');

            if (isValidMove && isOppenentInDanger) {
                moveOptions.push([x, y]);
            }
        }
    }

    // Choose one of the found moves at random
    const randomIndex = Math.round(Math.random() * moveOptions.length);
    if (moveOptions.length > 0) {
        ns.print('Capture move');
    }
    return moveOptions[randomIndex] ?? getExpansionMove(board, validMoves);
}

function getDefenseMove(ns: NS, board: string[], validMoves: boolean[][]) {      
    const moveOptions = [];
    const size = board[0].length;

    // Look through all the points on the board
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const node = new Node(x, y);
            // Make sure the point is a valid move
            const isValidMove = validMoves[x][y] === true;
            
            // If a point to the north, south, east, or west is a friendly router
            const isPlayerInDanger = node.isInDanger(ns, board, 'X');

            const isSaveMove = node.getAdjacent()
                .filter(point => board[point.x]?.[point.y] === '.').length >=2
                || node.getAdjacent()
                .filter(point => board[point.x]?.[point.y] === 'X')
                .some(point => ns.go.analysis.getLiberties(board)[point.x]?.[point.y] >= 3);

            if (isValidMove && isPlayerInDanger && isSaveMove) {
                moveOptions.push([x, y]);
            }
        }
    }

    // Choose one of the found moves at random
    const randomIndex = Math.round(Math.random() * moveOptions.length);
    if (moveOptions.length > 0) {
        ns.print('Defense move');
    }
    return moveOptions[randomIndex] ?? getCaptureMove(ns, board, validMoves);
}