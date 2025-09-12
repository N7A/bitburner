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

        this.showEndGameResult();

        // reset board
        this.ns.go.resetBoardState(this.goOpponent, this.boardSize);
    }

    private async playBoard() {
        const board: Board = new Board(this.ns, this.player);

        let opponentPass: boolean;
        if (this.ns.go.getCurrentPlayer() === "White") {
            // Log opponent's next move, once it happens
            opponentPass = (await this.ns.go.opponentNextTurn()).type === 'pass';
        } else {
            opponentPass = this.ns.go.getGameState().previousMove === null;
        }
            
        if (
            // l'adversaire pass
            opponentPass
            // et il n'a plus de routeur
            && this.isGameEndable(board)
        ) {
            this.ns.print('No more opponent');
            // continuer la partie ne rapporte pas plus
            await board.makeMove(undefined);
        }
        
        do {
            this.ns.print(Log.getStartLog());

            // TODO: more move options
            // Choose a move
            const nodeMove: Node | undefined = this.getMoveChoice(board);

            if (nodeMove === undefined) {
                if (board.alreadyPass) {
                    this.ns.print('Pass twice, quit the game.')
                    break;
                }
            }

            const opponentMove = await board.makeMove(nodeMove);

            if (
                // l'adversaire pass
                opponentMove.type === 'pass'
                && this.isGameEndable(board)
            ) {
                this.ns.print('No more opponent');
                // continuer la partie ne rapporte pas plus
                await board.makeMove(undefined);
            }

            this.ns.print(Log.getEndLog());
            await this.ns.sleep(200);

            // Keep looping as long as the opponent is playing moves
        } while (board.result?.type !== this.GAME_OVER);
    }

    showEndGameResult() {
        if (this.ns.go.getGameState().whiteScore < this.ns.go.getGameState().blackScore) {
            this.ns.print('🏆 Win !');
            this.ns.print(`${this.ns.formatNumber(this.ns.go.analysis.getStats().Netburners?.bonusPercent ?? 0)}%`);
        } else if (this.ns.go.getGameState().whiteScore > this.ns.go.getGameState().blackScore) {
            this.ns.print('😔 Lose...');
        } else {
            this.ns.print('🏳️ Equality.');
        }
    }

    private isGameEndable(board: Board): boolean {
        // init nodes
        const nodes: Node[] = board.getNodes();

        // get all valid moves
        const validMoves: Node[] = nodes.filter(x => board.isValidMove(x));
        // il n'a plus de routeur
        return board.hasNoMoreOpponent() 
            // il n'y a pas de capture future possible
            || validMoves.filter(x => x.hasFriendlyNeighbor(board.boardState, this.getOpponent())).length === 0
            // future moves sont auto capturables
            ||  this.getMoves(board).every(x => board.isAutoCapturableMove(x));
    }

    private getMoves(board: Board): Node[] {
        // init nodes
        const nodes: Node[] = board.getNodes();

        // get all valid moves
        const validMoves: Node[] = nodes.filter(x => board.isValidMove(x));
        const stratPriority: {function: ((availableNodes:Node[]) => Node[]), name: string}[] = [
            // prevent move that make network in danger
            {name: 'Not auto caturable', function: (availableNodes: Node[]) => availableNodes.filter(x => !board.isAutoCapturableMove(x))},
            // TODO: get bigest network first
            // TODO: if capture && defense possible => compare lost
            // capture un network ennemi qui peut être défendu
            {name: 'Capture move (defendable)', function: (availableNodes: Node[]) => {
                return availableNodes.filter(x => board.isAttackMove(x) && !board.isAutoCapturableMove(x, this.getOpponent()))
            }},
            {name: 'Defense move', function: (availableNodes: Node[]) => availableNodes.filter(x => board.isDefenseMove(x))},
            {name: 'Prevent opponent link', function: (availableNodes: Node[]) => availableNodes.filter(x => board.isLinkMove(x, this.getOpponent()))},
            // TODO: get min(futur liberties) in prior
            {name: 'Reduce opponent liberties', function: (availableNodes: Node[]) => availableNodes.filter(x => x.hasFriendlyNeighbor(board.boardState, this.getOpponent()))},
            {name: 'Link network', function: (availableNodes: Node[]) => availableNodes.filter(x => board.isLinkMove(x))},
            // TODO: if Reduce && expension possible => compare lost
            // TODO: get max(futur liberties) in prior || min(current liberties) then max(futur liberties) ?
            {name: 'Epansion move', function: (availableNodes: Node[]) => availableNodes.filter(x => board.isExpansionMove(x))},
            // TODO: ADD no reduce self liberties
            {name: 'Maximum liberty', function: (availableNodes: Node[]) => {
                const personnalLibertyMax: number = availableNodes.map(x => x.getPersonnalLiberty(board.boardState))
                    .reduce((a,b) => Math.max(a,b));
                return availableNodes.filter(point => point.getPersonnalLiberty(board.boardState) === personnalLibertyMax)
            }},
            // capture un network ennemi qui ne peut pas être défendu
            {name: 'Capture move (undefendable)', function: (availableNodes: Node[]) => {
                return availableNodes.filter(x => board.isAttackMove(x) && board.isAutoCapturableMove(x, this.getOpponent()))
            }},
            // Leave some spaces to make it harder to capture our pieces.
            // We don't want to run out of empty node connections!
            {name: 'Give some space', function: (availableNodes: Node[]) => availableNodes.filter(point => point.x % 2 === 1 || point.y % 2 === 1)},
            // any valid move
            {function: (availableNodes: Node[]) => availableNodes, name: 'Random move'}
        ]

        return this.getAvailableNodes(stratPriority, validMoves);
    }

    private getMoveChoice(board: Board): Node | undefined {
        const availableNodes = this.getMoves(board);

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

class Board {
    private ns: NS
    private boardSize: number;
    private player: 'X' | 'O';
    public boardState: string[];
    getOpponent = (player: 'X' | 'O' = this.player): 'X' | 'O' => player === 'X' ? 'O' : 'X';
    public alreadyPass: boolean = false;
    public result: {
        type: "gameOver" | "move" | "pass";
        x: number | null;
        y: number | null;
    };

    constructor(ns: NS, player: 'X' | 'O') {
        this.ns = ns;
        this.player = player;
        this.refreshState();
    }
    
    async makeMove(node: Node | undefined) {
        if (node === undefined) {
            // Pass turn if no moves are found
            this.ns.print('Pass');
            this.result = await this.ns.go.passTurn();
            this.alreadyPass = true;
        } else {
            this.alreadyPass = false;
            this.ns.print(node.x, ':', node.y);
            // Play the selected move
            this.result = await this.ns.go.makeMove(node.x, node.y);
        }

        // Log opponent's next move, once it happens
        const opponentMove = await this.ns.go.opponentNextTurn();

        this.refreshState();

        return opponentMove;
    }

    refreshState() {
        this.boardState = this.ns.go.getBoardState();
        this.boardSize = this.boardState.length
    }

    getNodes() {
        const nodes: Node[] = []
            for (let y = this.boardSize-1; y >= 0; y--) {
                for (let x = 0; x < this.boardSize; x++) {
                    nodes.push(new Node(x, y));
                }
            }
        return nodes
    }

    getValue(node: Node) {
        return this.boardState[node.x]?.[node.y];
    }

    getChain(node: Node, alreadyIn: Node[] = [node]): Node[] {
        const friends = node.getAdjacent()
            // filtrage de ceux déjà pris en compte
            .filter(currentNode => !alreadyIn.some(x => x.equals(currentNode)))
            // keep uniquement ceux dans le même camp
            .filter(currentNode => this.getValue(node) === this.getValue(currentNode));
        
        return [node, ...friends.flatMap(x => this.getChain(x, [...alreadyIn, ...friends]))];
    }

    getLibertiesNumber(node: Node) {
        return Board.unique(
            this.getChain(node)
                .flatMap(x => x.getAdjacent())
                // get free nodes
                .filter(x => this.getValue(x) === '.')
            ).length;
    }

    getFutureBoard(node: Node, player: 'X' | 'O' = this.player): string[] {
        const chainedNode = Array.from(new Set(node.getAdjacent()
            // opponent
            .filter(currentNode => this.getValue(currentNode) === this.getOpponent(player))
            // will be kill
            .filter(currentNode => this.getLibertiesNumber(currentNode) === 1)
            // get all node chained
            .flatMap(currentNode => this.getChain(currentNode))));

        return this.boardState.map((row, xIndex) => {
                return Array.from(row).map((value, yIndex) => {
                    if (xIndex === node.x && yIndex === node.y) { // move
                        return player;
                    } else if (chainedNode.some(currentNode => new Node(xIndex, yIndex).equals(currentNode))) { // killed
                        return '.';
                    }
                    return value;
                }).join('')
            });
    }

    static unique(nodes: Node[]) {
        return Array.from(new Set(nodes.map(node => JSON.stringify(node))))
            .map(json => JSON.parse(json));
    }
    
    isLinkMove(node: Node, player: 'X' | 'O' = this.player) {
        const allies = node.getAdjacent()
            .filter(point => this.getValue(point) === player);
        
        // les alliés n’appartiennent pas à la même chaîne
        return allies.map(ally => this.getChain(ally))
            .some(chain => {
                return allies.filter(ally => chain.some(currentNode => ally.equals(currentNode)))
                    .length < allies.length
            });
    }

    /**
     * Détermine si le placement est valide.
     * 
     * @param node node où le placement du router va se faire
     * @returns 
     */
    isValidMove(node: Node): boolean {
        const futurBoard = this.getFutureBoard(node);

        // empty node
        return this.boardState[node.x]?.[node.y] === '.'
            // not suicide
            && (
                // will have liberty
                node.getPersonnalLiberty(this.boardState) > 0
                || node.getAdjacent()
                    // connect with a network
                    .some(point => this.getValue(point) === this.player 
                        // not it last liberty
                        && this.getLibertiesNumber(point) > 1)
                // exception
                || node.getAdjacent()
                    // connect with a opponent network
                    .some(point => this.getValue(point) === this.getOpponent() 
                        // it will capture the opponent network
                        && this.getLibertiesNumber(point) === 1)
            )
            // not same move as previous
            && !this.ns.go.getMoveHistory()
                .some(previousBoard => futurBoard.every((futurRow, index) => futurRow === previousBoard[index]))
    }
    
    /**
     * Détermine si après le placement ici le network est directement capturable.
     * 
     * @param node node où le placement du router va se faire
     * @returns 
     */
    isAutoCapturableMove(node: Node, player: 'X' | 'O' = this.player): boolean {
        const opponentFutur = new Board(this.ns, this.getOpponent());
        opponentFutur.boardState = this.getFutureBoard(node, player);
        
        return opponentFutur.getLibertiesNumber(node) === 1
            // re-picable
            && node.getAdjacent().filter(x => this.getValue(x) === this.getOpponent())
                .every(x => this.getLibertiesNumber(x) !== 2);
    }

    isExpansionMove(node: Node) {
        return node.hasFriendlyNeighbor(this.boardState, this.player);
    }

    /**
     * Détermine si le placement capture un network.
     * 
     * @param node node où le placement du router va se faire
     * @param player type de capture de network recherché
     * @returns 
     */
    isCaptureMove(node: Node, player: 'X' | 'O' = this.player): boolean {
        return node.getAdjacent()
            .some(point => this.getValue(point) === player 
                && this.getLibertiesNumber(point) === 1);
    }

    /**
     * Détermine si le placement capture un network ennemi.
     * 
     * @param node node où le placement du router va se faire
     * @returns 
     */
    isAttackMove(node: Node): boolean {
        return this.isCaptureMove(node, this.getOpponent());
    }

    /**
     * Détermine si le placement empêche la capture d'un network allié.
     * 
     * @param node node où le placement du router va se faire
     * @returns 
     */
    isDefenseMove(node: Node): boolean {
        return this.isCaptureMove(node) && !this.isAutoCapturableMove(node);
    }

    hasNoMoreOpponent() {
        return !this.boardState.some(x => x.includes(this.getOpponent()))
    }

    showBoard() {
        for(let y = this.boardSize-1; y >= 0; y--) {
            let message = '';
            for(let x = 0; x < this.boardSize; x++) {
                message += this.boardState[x][y] + ' '
            }
            this.ns.print(message);
        }
    }
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
    
    hasFriendlyNeighbor(board: string[], player: 'X' | 'O') {
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
    

    equals(node: Node) {
        return this.x === node.x && this.y === node.y;
    }
}