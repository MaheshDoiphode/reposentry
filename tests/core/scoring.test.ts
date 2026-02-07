import { describe, it, expect } from 'vitest';
import { calculateGrade, calculateOverallScore, clampScore, ScoreCategory } from '../../src/utils/scoring.js';

describe('scoring', () => {
  describe('calculateGrade', () => {
    it('should return A+ for 97+', () => {
      expect(calculateGrade(97)).toBe('A+');
      expect(calculateGrade(100)).toBe('A+');
    });

    it('should return A for 93-96', () => {
      expect(calculateGrade(93)).toBe('A');
      expect(calculateGrade(96)).toBe('A');
    });

    it('should return B+ for 87-89', () => {
      expect(calculateGrade(87)).toBe('B+');
    });

    it('should return F for below 60', () => {
      expect(calculateGrade(59)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });

    it('should handle boundary values', () => {
      expect(calculateGrade(90)).toBe('A-');
      expect(calculateGrade(80)).toBe('B-');
      expect(calculateGrade(70)).toBe('C-');
      expect(calculateGrade(60)).toBe('D-');
    });
  });

  describe('calculateOverallScore', () => {
    it('should return average of all category scores', () => {
      const categories: ScoreCategory[] = [
        { name: 'A', score: 80, grade: 'B-', details: '' },
        { name: 'B', score: 90, grade: 'A-', details: '' },
        { name: 'C', score: 70, grade: 'C-', details: '' },
      ];
      expect(calculateOverallScore(categories)).toBe(80);
    });

    it('should return 0 for empty array', () => {
      expect(calculateOverallScore([])).toBe(0);
    });

    it('should round to nearest integer', () => {
      const categories: ScoreCategory[] = [
        { name: 'A', score: 85, grade: 'B', details: '' },
        { name: 'B', score: 72, grade: 'C-', details: '' },
      ];
      expect(calculateOverallScore(categories)).toBe(79);
    });
  });

  describe('clampScore', () => {
    it('should clamp to 0-100 range', () => {
      expect(clampScore(-10)).toBe(0);
      expect(clampScore(150)).toBe(100);
      expect(clampScore(75)).toBe(75);
    });

    it('should round to integer', () => {
      expect(clampScore(75.7)).toBe(76);
      expect(clampScore(75.3)).toBe(75);
    });
  });
});
