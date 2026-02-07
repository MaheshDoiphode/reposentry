export interface ScoreCategory {
  name: string;
  score: number;
  grade: string;
  details: string;
}

export function calculateGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

export function calculateOverallScore(categories: ScoreCategory[]): number {
  if (categories.length === 0) return 0;
  const total = categories.reduce((sum, c) => sum + c.score, 0);
  return Math.round(total / categories.length);
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
