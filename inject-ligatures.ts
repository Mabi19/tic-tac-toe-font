import { GameTree } from "./helpers/game-tree";

const template = await Bun.file("./base-font.ttx.template").text();

console.time("generating game tree");
const gameTree = new GameTree();
console.timeEnd("generating game tree");

interface LigatureDefinition {
    moves: number[];
    boardID: number;
}
interface Lookup {
    baseDigit: number;
    ligatures: LigatureDefinition[];
}

// First sorted by length, then by first digit.
const ligatures = new Map<number, Map<number, LigatureDefinition[]>>();

let treeLigatureCount = 0;
for (const position of gameTree.getAllPositions()) {
    const MAX_DEPTH = 9;
    if (position.moves.length > MAX_DEPTH) {
        continue;
    }

    // we don't care about the starting position or single move positions
    if (position.moves.length < 2) {
        continue;
    }

    treeLigatureCount++;

    if (!ligatures.has(position.moves.length)) {
        ligatures.set(position.moves.length, new Map());
    }
    const mapByDigit = ligatures.get(position.moves.length)!;

    const firstMove = position.moves[0]!;
    if (!mapByDigit.has(firstMove)) {
        mapByDigit.set(firstMove, []);
    }
    const posList = mapByDigit.get(firstMove)!;

    posList.push({
        moves: position.moves,
        boardID: position.board,
    });
}

// console.log("Ligature counts by length:");
// for (const [length, mapByDigit] of ligatures.entries()) {
//     console.log(`${length}:`);
//     for (const [digit, ligas] of mapByDigit.entries()) {
//         console.log(`  - ${digit}: ${ligas.length}`);
//     }
// }

const lookups: Lookup[] = [];

// How many parts to split each digit into. Made with trial and error
// TODO(optimization): put multiple lengths into one lookup
const LOOKUP_SPLITS: Record<number, number> = {
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 2,
    7: 5,
    8: 8,
    9: 5,
};

for (const [length, mapByDigit] of ligatures.entries()) {
    for (const [digit, digitLigas] of mapByDigit.entries()) {
        const splitCount = LOOKUP_SPLITS[length] ?? 1;
        const partLength = Math.ceil(digitLigas.length / splitCount);

        for (let i = 0; i < digitLigas.length; i += partLength) {
            const split = digitLigas.slice(i, i + partLength);
            console.log(
                "length",
                length,
                "digit",
                digit,
                ...(splitCount > 1 ? ["split", i / partLength] : []),
                "- liga count",
                split.length
            );
            lookups.push({
                baseDigit: digit,
                ligatures: split,
            });
        }
    }
}

console.log("Total lookup count:", lookups.length);
const totalLigatureCount = lookups.reduce((prev, curr) => prev + curr.ligatures.length, 0);
console.log("Total ligature count:", totalLigatureCount);
console.assert(treeLigatureCount == totalLigatureCount);

// order longest to shortest
lookups.reverse();

let lookupIndex = 0;
const stringifiedLookups: string[] = [];
for (const lookup of lookups) {
    const pre = `      <Lookup index="${lookupIndex}">
        <LookupType value="4"/>
        <LookupFlag value="0"/>
        <!-- SubTableCount=1 -->
        <LigatureSubst index="0">
          <LigatureSet glyph="start${lookup.baseDigit}">`;

    const post = `          </LigatureSet>
        </LigatureSubst>
      </Lookup>`;

    const entries = [];
    for (const ligature of lookup.ligatures) {
        const moveChain = ligature.moves
            .slice(1)
            .map((digit) => `start${digit}`)
            .join(",");
        const glyphName = `board${ligature.boardID.toString(16)}`;
        entries.push(`            <Ligature components="${moveChain}" glyph="${glyphName}"/>`);
    }
    const result = `${pre}\n${entries.join("\n")}\n${post}`;
    stringifiedLookups.push(result);

    lookupIndex += 1;
}

const lookupIndices: string[] = [];
for (let i = 0; i < lookups.length; i++) {
    lookupIndices.push(`          <LookupListIndex index="${i}" value="${i}"/>`);
}

const newFontDefinition = template
    .replaceAll("{{LOOKUP_LIST_LENGTH}}", lookups.length.toString())
    .replace("{{LOOKUP_LIST}}", stringifiedLookups.join("\n"))
    .replace("{{LOOKUP_LIST_INDICES_LENGTH}}", lookupIndices.length.toString())
    .replace("{{LOOKUP_LIST_INDICES}}", lookupIndices.join("\n"));

await Bun.write("font-withliga.ttx", newFontDefinition);
