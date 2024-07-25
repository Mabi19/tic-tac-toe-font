import * as opentype from "opentype.js";
import { decodeBoardID, getBoardVictory, type VICTORY_NAMES } from "./helpers/board";
import { GameTree } from "./helpers/game-tree";

const ADVANCE_WIDTH = 1000;
const FONT_HEIGHT = 1000;

// Generates a glyph with dots counting in binary
function generatePlaceholderPath(counter: number) {
    const path = new opentype.Path();

    const counterBits = (counter | 0).toString(2).padStart(16, "0");
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const bitIdx = y * 4 + x;

            const halfWidth = counterBits[bitIdx] == "1" ? 75 : 40;

            const centerX = 200 + (800 * x) / 4;
            const centerY = 200 + (800 * y) / 4;

            const box = new opentype.BoundingBox();
            box.x1 = centerX - halfWidth;
            box.y1 = centerY - halfWidth;
            box.x2 = centerX + halfWidth;
            box.y2 = centerY + halfWidth;

            path.extend(box);
        }
    }

    return path;
}

const STROKE_WIDTH = 30;
const GRID_SPACE_WIDTH = 300;
const GRID_SPACE_RADIUS = GRID_SPACE_WIDTH / 2;
const SYMBOL_WIDTH = 200;
const SYMBOL_RADIUS = SYMBOL_WIDTH / 2;

function generateSymbolPath(x: 0 | 1 | 2, y: 0 | 1 | 2, symbol: "X" | "O") {
    const ox = 50 + x * 300;
    const oy = 50 + y * 300;
    const cx = 150 + ox;
    const cy = 150 + oy;
    let path: opentype.Path;

    if (symbol == "X") {
        const diagBase = STROKE_WIDTH / Math.SQRT2;
        const endingDistance = SYMBOL_RADIUS - diagBase;

        path = new opentype.Path();
        // top
        path.moveTo(cx, cy + diagBase);
        // tr
        path.lineTo(cx + endingDistance, cy + SYMBOL_RADIUS);
        path.lineTo(cx + SYMBOL_RADIUS, cy + endingDistance);
        // right
        path.lineTo(cx + diagBase, cy);
        // br
        path.lineTo(cx + SYMBOL_RADIUS, cy - endingDistance);
        path.lineTo(cx + endingDistance, cy - SYMBOL_RADIUS);
        // bottom
        path.lineTo(cx, cy - diagBase);
        // bl
        path.lineTo(cx - endingDistance, cy - SYMBOL_RADIUS);
        path.lineTo(cx - SYMBOL_RADIUS, cy - endingDistance);
        // left
        path.lineTo(cx - diagBase, cy);
        // tl
        path.lineTo(cx - SYMBOL_RADIUS, cy + endingDistance);
        path.lineTo(cx - endingDistance, cy + SYMBOL_RADIUS);

        path.close();
    } else {
        path = new opentype.Path();
        function circle(radius: number, counterClockwise: boolean) {
            const invertFactor = counterClockwise ? -1 : 1;
            const controlPointOffset = (4 / 3) * Math.tan(Math.PI / 8) * radius;

            path.moveTo(cx, cy + radius);
            // top right
            path.bezierCurveTo(
                cx + controlPointOffset * invertFactor,
                cy + radius,
                cx + radius * invertFactor,
                cy + controlPointOffset,
                cx + radius * invertFactor,
                cy
            );
            // bottom right
            path.bezierCurveTo(
                cx + radius * invertFactor,
                cy - controlPointOffset,
                cx + controlPointOffset * invertFactor,
                cy - radius,
                cx,
                cy - radius
            );
            // bottom left
            path.bezierCurveTo(
                cx - controlPointOffset * invertFactor,
                cy - radius,
                cx - radius * invertFactor,
                cy - controlPointOffset,
                cx - radius * invertFactor,
                cy
            );
            // top left
            path.bezierCurveTo(
                cx - radius * invertFactor,
                cy + controlPointOffset,
                cx - controlPointOffset * invertFactor,
                cy + radius,
                cx,
                cy + radius
            );
        }

        circle(SYMBOL_RADIUS, false);
        circle(SYMBOL_RADIUS - STROKE_WIDTH, true);
    }

    return path;
}

function generateGrid(): opentype.Path {
    const GRID_RADIUS = 450;
    const GRID_CORNER_OFFSET = GRID_SPACE_RADIUS + STROKE_WIDTH / 2;
    const GRID_INNER_OFFSET = GRID_SPACE_RADIUS - STROKE_WIDTH / 2;

    const cx = 500;
    const cy = 500;

    const path = new opentype.Path();
    path.moveTo(cx - GRID_CORNER_OFFSET, 500 + GRID_CORNER_OFFSET);

    // top
    path.lineTo(cx - GRID_CORNER_OFFSET, cy + GRID_RADIUS);
    path.lineTo(cx - GRID_INNER_OFFSET, cy + GRID_RADIUS);
    path.lineTo(cx - GRID_INNER_OFFSET, cy + GRID_CORNER_OFFSET);
    path.lineTo(cx + GRID_INNER_OFFSET, cy + GRID_CORNER_OFFSET);
    path.lineTo(cx + GRID_INNER_OFFSET, cy + GRID_RADIUS);
    path.lineTo(cx + GRID_CORNER_OFFSET, cy + GRID_RADIUS);
    path.lineTo(cx + GRID_CORNER_OFFSET, cy + GRID_CORNER_OFFSET);

    // right
    path.lineTo(cx + GRID_RADIUS, cy + GRID_CORNER_OFFSET);
    path.lineTo(cx + GRID_RADIUS, cy + GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_CORNER_OFFSET, cy + GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_CORNER_OFFSET, cy - GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_RADIUS, cy - GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_RADIUS, cy - GRID_CORNER_OFFSET);
    path.lineTo(cx + GRID_CORNER_OFFSET, cy - GRID_CORNER_OFFSET);

    // bottom
    path.lineTo(cx + GRID_CORNER_OFFSET, cy - GRID_RADIUS);
    path.lineTo(cx + GRID_INNER_OFFSET, cy - GRID_RADIUS);
    path.lineTo(cx + GRID_INNER_OFFSET, cy - GRID_CORNER_OFFSET);
    path.lineTo(cx - GRID_INNER_OFFSET, cy - GRID_CORNER_OFFSET);
    path.lineTo(cx - GRID_INNER_OFFSET, cy - GRID_RADIUS);
    path.lineTo(cx - GRID_CORNER_OFFSET, cy - GRID_RADIUS);
    path.lineTo(cx - GRID_CORNER_OFFSET, cy - GRID_CORNER_OFFSET);

    // left
    path.lineTo(cx - GRID_RADIUS, cy - GRID_CORNER_OFFSET);
    path.lineTo(cx - GRID_RADIUS, cy - GRID_INNER_OFFSET);
    path.lineTo(cx - GRID_CORNER_OFFSET, cy - GRID_INNER_OFFSET);
    path.lineTo(cx - GRID_CORNER_OFFSET, cy + GRID_INNER_OFFSET);
    path.lineTo(cx - GRID_RADIUS, cy + GRID_INNER_OFFSET);
    path.lineTo(cx - GRID_RADIUS, cy + GRID_CORNER_OFFSET);

    path.close();

    // hole
    path.moveTo(cx - GRID_INNER_OFFSET, cy - GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_INNER_OFFSET, cy - GRID_INNER_OFFSET);
    path.lineTo(cx + GRID_INNER_OFFSET, cy + GRID_INNER_OFFSET);
    path.lineTo(cx - GRID_INNER_OFFSET, cy + GRID_INNER_OFFSET);
    path.close();

    return path;
}

function generateVictoryMarker(reason: (typeof VICTORY_NAMES)[number]) {
    const HALF_LENGTH = 475;
    const DIAG_BASE_HALF_LEN = HALF_LENGTH;
    const DIAG_SIDE_HALF_LEN = STROKE_WIDTH / Math.SQRT2;

    if (reason == "bltr") {
        const cx = 500;
        const cy = 500;

        const result = new opentype.Path();
        // bottom
        result.moveTo(cx - DIAG_BASE_HALF_LEN + DIAG_SIDE_HALF_LEN, cy - DIAG_BASE_HALF_LEN);
        // left
        result.lineTo(cx - DIAG_BASE_HALF_LEN, cy - DIAG_BASE_HALF_LEN + DIAG_SIDE_HALF_LEN);
        // top
        result.lineTo(cx + DIAG_BASE_HALF_LEN - DIAG_SIDE_HALF_LEN, cy + DIAG_BASE_HALF_LEN);
        // right
        result.lineTo(cx + DIAG_BASE_HALF_LEN, cy + DIAG_BASE_HALF_LEN - DIAG_SIDE_HALF_LEN);

        result.close();
        return result;
    } else if (reason == "tlbr") {
        const cx = 500;
        const cy = 500;

        const result = new opentype.Path();
        // top
        result.moveTo(cx - DIAG_BASE_HALF_LEN + DIAG_SIDE_HALF_LEN, cy + DIAG_BASE_HALF_LEN);
        // right
        result.lineTo(cx + DIAG_BASE_HALF_LEN, cy - DIAG_BASE_HALF_LEN + DIAG_SIDE_HALF_LEN);
        // bottom
        result.lineTo(cx + DIAG_BASE_HALF_LEN - DIAG_SIDE_HALF_LEN, cy - DIAG_BASE_HALF_LEN);
        // left
        result.lineTo(cx - DIAG_BASE_HALF_LEN, cy + DIAG_BASE_HALF_LEN - DIAG_SIDE_HALF_LEN);

        result.close();
        return result;
    } else if (reason.startsWith("row")) {
        const rowID = parseInt(reason[3]!);
        const cx = 500;
        const cy = 50 + GRID_SPACE_RADIUS + (rowID - 1) * GRID_SPACE_WIDTH;

        const result = new opentype.Path();
        result.moveTo(cx - HALF_LENGTH, cy + STROKE_WIDTH / 2);
        result.lineTo(cx + HALF_LENGTH, cy + STROKE_WIDTH / 2);
        result.lineTo(cx + HALF_LENGTH, cy - STROKE_WIDTH / 2);
        result.lineTo(cx - HALF_LENGTH, cy - STROKE_WIDTH / 2);
        result.close();

        return result;
    } else {
        const colID = parseInt(reason[3]!);

        const cx = 50 + GRID_SPACE_RADIUS + (colID - 1) * GRID_SPACE_WIDTH;
        const cy = 500;

        const result = new opentype.Path();
        result.moveTo(cx + STROKE_WIDTH / 2, cy + HALF_LENGTH);
        result.lineTo(cx + STROKE_WIDTH / 2, cy - HALF_LENGTH);
        result.lineTo(cx - STROKE_WIDTH / 2, cy - HALF_LENGTH);
        result.lineTo(cx - STROKE_WIDTH / 2, cy + HALF_LENGTH);
        result.close();

        return result;
    }
}

function generateBoardPath(boardData: ("" | "X" | "O")[]) {
    const path = generateGrid();

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const idx = y * 3 + x;
            const symbol = boardData[idx]!;
            if (symbol != "") {
                path.commands.push(
                    ...generateSymbolPath(x as 0 | 1 | 2, y as 0 | 1 | 2, symbol).commands
                );
            }
        }
    }

    const victory = getBoardVictory(boardData);
    if (victory) {
        path.commands.push(...generateVictoryMarker(victory.reason).commands);
    }

    return path;
}

const notdefGlyph = new opentype.Glyph({
    name: ".notdef",
    unicode: 0,
    path: generatePlaceholderPath(65535),
    advanceWidth: 1000,
});

const spaceGlyph = new opentype.Glyph({
    name: "space",
    unicode: " ".codePointAt(0)!,
    path: new opentype.Path(),
    advanceWidth: ADVANCE_WIDTH,
});

console.time("generating game tree");
const gameTree = new GameTree();
console.timeEnd("generating game tree");
console.time("extracting all possible boards");
const possibleBoards = new Set<number>();
for (const position of gameTree.getAllPositions()) {
    possibleBoards.add(position.board);
}
console.timeEnd("extracting all possible boards");
console.log("Board count:", possibleBoards.size);

console.time("generating glyphs");

const DIGIT_BOARDS: Record<number, string> = {
    [3 ** 0]: "1",
    [3 ** 1]: "2",
    [3 ** 2]: "3",
    [3 ** 3]: "4",
    [3 ** 4]: "5",
    [3 ** 5]: "6",
    [3 ** 6]: "7",
    [3 ** 7]: "8",
    [3 ** 8]: "9",
};

const boardGlyphs: opentype.Glyph[] = [];

for (const boardID of possibleBoards) {
    // quick hack to reduce board count
    // if (Math.random() < 0.5) {
    //     continue;
    // }

    const boardData = decodeBoardID(boardID);
    const path = generateBoardPath(boardData);
    boardGlyphs.push(
        new opentype.Glyph({
            name: `board${boardID.toString(16)}`,
            unicode: 0xf0000 + boardID,
            path,
            advanceWidth: ADVANCE_WIDTH,
        })
    );

    if (boardID in DIGIT_BOARDS) {
        const char = DIGIT_BOARDS[boardID]!;
        boardGlyphs.push(
            new opentype.Glyph({
                name: `start${char}`,
                unicode: char.codePointAt(0)!,
                path,
                advanceWidth: ADVANCE_WIDTH,
            })
        );
    }
}

console.timeEnd("generating glyphs");
console.time("saving font");

const font = new opentype.Font({
    familyName: "TicTacToe",
    styleName: "Regular",
    unitsPerEm: FONT_HEIGHT,
    ascender: FONT_HEIGHT,
    descender: 0,
    glyphs: [notdefGlyph, spaceGlyph, ...boardGlyphs],
});

// add placeholder ligature
// @ts-ignore
font.substitution.addLigature("liga", { sub: [2, 3], by: 4 });

await Bun.write("./base-font.otf", font.toArrayBuffer());

console.timeEnd("saving font");
