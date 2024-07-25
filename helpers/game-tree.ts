import { decodeBoardID, getBoardVictory } from "./board";

export interface GamePosition {
    moves: number[];
    board: number;
}

export interface GameNode extends GamePosition {
    children: Record<string, GameNode>;
}

export class GameTree implements GameNode {
    moves = [];
    board = 0;
    children: Record<string, GameNode>;

    constructor() {
        this.children = this.constructChildren({ moves: [], board: 0 }, "X");
    }

    getValidMoves(position: GamePosition): number[] {
        const decoded = decodeBoardID(position.board);

        if (getBoardVictory(decoded)) {
            return [];
        }

        const validPositions: number[] = [];
        for (let idx = 0; idx < decoded.length; idx++) {
            if (decoded[idx] == "") {
                validPositions.push(idx + 1);
            }
        }
        return validPositions;
    }

    // Mutates the position. Does not check whether the move is valid
    makeMove(position: GamePosition, space: number, player: "X" | "O") {
        position.moves.push(space);
        const playerID = player == "X" ? 1 : 2;
        position.board += playerID * 3 ** (space - 1);
        return position;
    }

    constructChildren(parent: GamePosition, player: "X" | "O"): Record<string, GameNode> {
        return Object.fromEntries(
            this.getValidMoves(parent).map((space) => {
                const newPosition = {
                    ...this.makeMove(structuredClone(parent), space, player),
                    children: {},
                };
                newPosition.children = this.constructChildren(
                    newPosition,
                    player == "X" ? "O" : "X"
                );

                return [space.toString(), newPosition];
            })
        );
    }

    *getAllPositions(node: GameNode = this): Generator<GameNode> {
        yield node;
        for (const child of Object.values(node.children)) {
            yield* this.getAllPositions(child);
        }
    }
}
