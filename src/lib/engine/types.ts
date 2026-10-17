// Pure puzzle engine types. No UI, no network.
export const ROWS = 9;
export const COLS = 12;

export type Tile = "FLOOR" | "WALL" | "LAVA" | "KEY" | "DOOR" | "EXIT";
export type Board = Tile[][]; // [row][col]

export interface Pos {
  r: number;
  c: number;
}

export interface PlayerState extends Pos {
  hasKey: boolean;
}

export type OpType =
  | "addWall"
  | "removeWall"
  | "addLava"
  | "removeLava"
  | "placeKey"
  | "removeKey"
  | "placeDoor"
  | "removeDoor"
  | "moveExit";

export const OP_TYPES: OpType[] = [
  "addWall",
  "removeWall",
  "addLava",
  "removeLava",
  "placeKey",
  "removeKey",
  "placeDoor",
  "removeDoor",
  "moveExit",
];

export interface EditOp {
  op: OpType;
  r: number;
  c: number;
}

export interface Constraint {
  name: string;
  ok: boolean;
  detail: string;
}

export interface Verdict {
  solvable: boolean;
  path: Pos[]; // shortest path from player to exit (incl. both ends)
  pathLength: number; // number of steps
  visitedStates: number;
  needsKey: boolean;
  reason: string;
  constraints: Constraint[];
}

export const MAX_OPS = 3;
export const MAX_REPAIR_OPS = 4;
