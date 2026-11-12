import type { FudziStatus } from "./log.js";
export type FudziSnapshot = { name: string; penalty: number; place: number | null; questions: { status: FudziStatus; }[]; };
export type KvartalySnapshot = { name: string; penalty: number; place: number | null; quarters: { finished: boolean; bonus: number; questions: { correct: number; incorrect: number; }[]; }[]; };
