import { BloomsTaxonomyAnalyzer } from '../../src/tools/blooms-taxonomy-analyzer.js';

describe('BloomsTaxonomyAnalyzer', () => {
  describe('analyze', () => {
    test('should correctly identify Bloom\'s levels from primary keywords', async () => {
      const questions = [
        'Define the main components of cellular respiration.',  // Level 1: Remember
        'Explain how photosynthesis converts light energy.',    // Level 2: Understand
        'Apply the principle of conservation of energy to this system.', // Level 3: Apply
        'Analyze the relationship between these two processes.', // Level 4: Analyze
        'Evaluate the effectiveness of this experimental design.', // Level 5: Evaluate
        'Create a new model to represent energy flow.'          // Level 6: Create
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.questionLevels).toHaveLength(6);
      expect(result.questionLevels[0].level).toBe(1);
      expect(result.questionLevels[0].confidence).toBeGreaterThan(0.8);
      expect(result.questionLevels[5].level).toBe(6);
      expect(result.overallLevel).toBeGreaterThanOrEqual(4);
    });

    test('should detect patterns when explicit keywords are missing', async () => {
      const questions = [
        'What would happen if you changed the temperature?',    // Apply (3)
        'Why do these results differ from the hypothesis?',     // Analyze (4)
        'Which approach would be more effective and why?',      // Evaluate (5)
        'How would you design a better experiment?'             // Create (6)
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.questionLevels[0].level).toBeGreaterThanOrEqual(3);
      expect(result.questionLevels[0].reasoning).toContain('Pattern suggests');
      expect(result.overallLevel).toBeGreaterThanOrEqual(4);
    });

    test('should calculate correct distribution percentages', async () => {
      const questions = [
        'List the steps in the process.',           // Remember (1)
        'Name the key components.',                 // Remember (1)
        'Explain the purpose of each step.',        // Understand (2)
        'Describe how the system works.',           // Understand (2)
        'Analyze the efficiency of the process.',   // Analyze (4)
        'Evaluate the overall effectiveness.'       // Evaluate (5)
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.distribution.remember).toBe(33); // 2/6 ≈ 33%
      expect(result.distribution.understand).toBe(33); // 2/6 ≈ 33%
      expect(result.distribution.apply).toBe(0);
      expect(result.distribution.analyze).toBe(17); // 1/6 ≈ 17%
      expect(result.distribution.evaluate).toBe(17); // 1/6 ≈ 17%
      expect(result.distribution.create).toBe(0);
    });

    test('should generate recommendations for low-level questions', async () => {
      const questions = [
        'What is the definition?',
        'When did this happen?',
        'Who was involved?',
        'Where did it occur?'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions, 4, 'undergraduate');

      expect(result.overallLevel).toBeLessThanOrEqual(2);
      expect(result.recommendations).toContain(
        expect.stringContaining('below target')
      );
      expect(result.recommendations).toContain(
        expect.stringContaining('recall-based questions')
      );
      expect(result.educationalAlignment.isAppropriate).toBe(false);
    });

    test('should recommend higher-order thinking questions', async () => {
      const questions = [
        'What is the name?',
        'List the components.',
        'State the formula.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.recommendations).toContain(
        expect.stringContaining('higher-order thinking')
      );
      expect(result.distribution.analyze + result.distribution.evaluate + result.distribution.create).toBe(0);
    });

    test('should assess educational alignment for different academic levels', async () => {
      const questions = [
        'Compare and contrast these two theories.',
        'Analyze the underlying assumptions.',
        'Evaluate the validity of the argument.',
        'Critique the methodology used.'
      ];

      // Test for high school level
      const highSchoolResult = await BloomsTaxonomyAnalyzer.analyze(questions, undefined, 'high');
      expect(highSchoolResult.educationalAlignment.isAppropriate).toBe(true);
      expect(highSchoolResult.educationalAlignment.targetLevel).toBe(4);

      // Test for elementary level
      const elementaryResult = await BloomsTaxonomyAnalyzer.analyze(questions, undefined, 'elementary');
      expect(elementaryResult.educationalAlignment.isAppropriate).toBe(false);
      expect(elementaryResult.educationalAlignment.adjustment).toBe('decrease_complexity');
      expect(elementaryResult.recommendations).toContain(
        expect.stringContaining('elementary')
      );
    });

    test('should handle target level validation', async () => {
      const questions = [
        'Explain the concept.',
        'Describe the process.',
        'Summarize the main points.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions, 5); // Target level 5 (Evaluate)

      expect(result.overallLevel).toBeLessThan(5);
      expect(result.recommendations).toContain(
        expect.stringContaining('below target')
      );
      expect(result.educationalAlignment.actualLevel).toBeLessThan(5);
      expect(result.educationalAlignment.targetLevel).toBe(5);
    });

    test('should identify questions with ambiguous cognitive levels', async () => {
      const questions = [
        'Think about the problem.',
        'Consider the options.',
        'Look at the data.',
        'Review the material.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.questionLevels.some(q => q.confidence < 0.6)).toBe(true);
      expect(result.recommendations).toContain(
        expect.stringContaining('ambiguous cognitive levels')
      );
    });

    test('should recommend variety when questions lack diversity', async () => {
      const questions = [
        'Analyze the first factor.',
        'Analyze the second factor.',
        'Analyze the third factor.',
        'Analyze the relationship between factors.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.recommendations).toContain(
        expect.stringContaining('variety in cognitive levels')
      );
    });

    test('should handle graduate level expectations', async () => {
      const questions = [
        'Synthesize a new theoretical framework.',
        'Critique the existing paradigm.',
        'Design an innovative research methodology.',
        'Evaluate the epistemological implications.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions, undefined, 'graduate');

      expect(result.educationalAlignment.isAppropriate).toBe(true);
      expect(result.overallLevel).toBeGreaterThanOrEqual(5);
      expect(result.distribution.create + result.distribution.evaluate).toBeGreaterThan(50);
    });
  });

  describe('edge cases', () => {
    test('should handle empty questions array', async () => {
      const questions: string[] = [];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.overallLevel).toBe(1);
      expect(result.questionLevels).toHaveLength(0);
      expect(Object.values(result.distribution).every(v => v === 0)).toBe(true);
    });

    test('should handle questions without clear indicators', async () => {
      const questions = [
        'What about this topic interests you?',
        'How do you feel about this?',
        'What comes to mind?'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      expect(result.questionLevels.every(q => q.confidence <= 0.7)).toBe(true);
      expect(result.questionLevels[0].reasoning).toContain('No clear higher-order thinking patterns');
    });

    test('should handle very long questions with multiple parts', async () => {
      const questions = [
        'First identify the key components, then explain how they interact, analyze their effectiveness, and finally evaluate whether the system achieves its goals while considering alternative approaches.'
      ];

      const result = await BloomsTaxonomyAnalyzer.analyze(questions);

      // Should detect the highest level verb (evaluate)
      expect(result.questionLevels[0].level).toBeGreaterThanOrEqual(4);
    });
  });
});