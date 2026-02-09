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

  // Weighted scoring — security and testing carry more weight
  const weights: Record<string, number> = {
    'Security': 2.0,
    'Testing': 1.5,
    'CI/CD': 1.2,
    'Documentation': 1.0,
    'Architecture': 1.0,
    'Performance': 1.2,
    'Collaboration': 0.8,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of categories) {
    const w = weights[c.name] ?? 1.0;
    weightedSum += c.score * w;
    totalWeight += w;
  }

  return Math.round(weightedSum / totalWeight);
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
