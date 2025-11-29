export interface KvartalAnswer {
  correct: number;
  incorrect: number;
  score: number;
}

export interface KvartalQuarter {
  finished: boolean;
  bonus: number;
  total: number;
  answers: KvartalAnswer[];
}

export interface KvartalRow {
  id: number;
  name: string;
  penalty: number;
  total: number;
  quarters: KvartalQuarter[];
}