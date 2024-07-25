export function decodeBoardID(board: number) {
    return Array.from(board.toString(3).padStart(9, "0"))
        .map((digit) => {
            switch (digit) {
                case "0":
                    return "";
                case "1":
                    return "X";
                case "2":
                    return "O";
                default:
                    throw new Error("Bad ternary digit");
            }
        })
        .toReversed();
}

// 6 7 8
// 3 4 5
// 0 1 2
const VICTORY_INDICES: [number, number, number][] = [
    // horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // vertical
    [6, 3, 0],
    [7, 4, 1],
    [8, 5, 2],
    // diagonal
    [0, 4, 8],
    [6, 4, 2],
];

export const VICTORY_NAMES = [
    "row1",
    "row2",
    "row3",
    "col1",
    "col2",
    "col3",
    "bltr",
    "tlbr",
] as const;

export function getBoardVictory(board: ("" | "X" | "O")[]) {
    for (let i = 0; i < VICTORY_INDICES.length; i++) {
        const test = VICTORY_INDICES[i]!;
        if (
            board[test[0]] == board[test[1]] &&
            board[test[1]] == board[test[2]] &&
            board[test[0]] != ""
        ) {
            // a line was found!
            return {
                reason: VICTORY_NAMES[i]!,
                winner: board[test[0]] as "X" | "O",
            };
        }
    }

    return false;
}
