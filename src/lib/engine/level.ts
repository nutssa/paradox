import { COLS, ROWS, type Board, type PlayerState, type Tile } from "./types";

// Legend: # wall, . floor, ~ lava, k key, D door, S start, E exit
export const STARTER_LEVEL = [
  "S..#....~...",
  "##.#.##.~.#.",
  ".....#k...#.",
  ".###~####.#.",
  "...#....#...",
  "##.###.####D",
  ".....#...~#.",
  ".###.###.~#.",
  "...~...#..DE",
];

const CHAR: Record<string, Tile> = {
  "#": "WALL",
  ".": "FLOOR",
  "~": "LAVA",
  k: "KEY",
  D: "DOOR",
  S: "FLOOR",
  E: "EXIT",
};

export function parseLevel(rows: string[]): { board: Board; start: PlayerState } {
  if (rows.length !== ROWS) throw new Error(`level must have ${ROWS} rows`);
  let start: PlayerState | null = null;
  const board: Board = rows.map((line, r) => {
    if (line.length !== COLS) throw new Error(`row ${r} must have ${COLS} cols`);
    return line.split("").map((ch, c) => {
      if (ch === "S") start = { r, c, hasKey: false };
      const t = CHAR[ch];
      if (!t) throw new Error(`bad char ${ch}`);
      return t;
    });
  });
  if (!start) throw new Error("level has no start");
  return { board, start };
}

export function starter() {
  return parseLevel(STARTER_LEVEL);
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.slice());
}

export function findExit(b: Board): { r: number; c: number } | null {
  for (let r = 0; r < b.length; r++)
    for (let c = 0; c < b[r].length; c++) if (b[r][c] === "EXIT") return { r, c };
  return null;
}

const TO_CHAR: Record<Tile, string> = {
  WALL: "#",
  FLOOR: ".",
  LAVA: "~",
  KEY: "k",
  DOOR: "D",
  EXIT: "E",
};

/** ASCII render with a coordinate header, used in AI context. */
export function boardToAscii(b: Board, player?: { r: number; c: number }): string {
  const header = "    " + Array.from({ length: COLS }, (_, c) => (c % 10).toString()).join("");
  const lines = b.map(
    (row, r) =>
      `r${r.toString().padStart(2, " ")} ` +
      row.map((t, c) => (player && player.r === r && player.c === c ? "P" : TO_CHAR[t])).join(""),
  );
  return [header, ...lines].join("\n");
}
