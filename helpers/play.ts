// Made to test the game tree.

import { decodeBoardID, getBoardVictory } from "./board";
import { GameTree, type GameNode } from "./game-tree";

function drawBoard(board: number) {
    function drawLine(line: string[]) {
        console.log(line.map((char) => (char == "" ? " " : char)).join(""));
    }

    const decoded = decodeBoardID(board);
    drawLine(decoded.slice(6, 9));
    drawLine(decoded.slice(3, 6));
    drawLine(decoded.slice(0, 3));
}

console.time("generating tree");
const tree = new GameTree();
console.timeEnd("generating tree");

let node: GameNode = tree;
const consoleIter = console[Symbol.asyncIterator]();

while (Object.keys(node.children).length > 0) {
    console.log("Board:", node.board);
    drawBoard(node.board);
    const validMoves = Object.keys(node.children);
    console.log("Valid moves:", validMoves);
    const choice: string = await consoleIter.next().then((result) => result.value);
    if (choice == "q") {
        console.log("Quitting");
        break;
    } else if (!validMoves.includes(choice)) {
        console.log("Invalid choice!");
        continue;
    }

    node = node.children[choice]!;
}
consoleIter.return?.();
console.log("End");

const victory = getBoardVictory(decodeBoardID(node.board));
console.log("Victory:", victory);
