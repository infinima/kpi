export interface FudziAnswer {
  score: number;
  status: "correct" | "incorrect" | "not_submitted";
}

export interface FudziRow {
  id: number;
  name: string;
  has_card: boolean;
  penalty: number;
  total: number;
  answers: FudziAnswer[];
}