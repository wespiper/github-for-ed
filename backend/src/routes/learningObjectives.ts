import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Import preset data
const { learningObjectivesPresets, assessmentTemplates, subjectAreas } = require('../seeds/learningObjectives.js');

/**
 * GET /api/learning-objectives/presets
 * Retrieve all available learning objective presets
 */
router.get('/presets', authenticate, (req: Request, res: Response): void => {
  try {
    const { category, bloomsLevel, subject } = req.query;
    
    let filteredPresets = [...learningObjectivesPresets];
    
    // Filter by category if specified
    if (category && typeof category === 'string') {
      filteredPresets = filteredPresets.filter((preset: any) => 
        preset.category === category
      );
    }
    
    // Filter by Bloom's taxonomy level if specified
    if (bloomsLevel && !isNaN(Number(bloomsLevel))) {
      filteredPresets = filteredPresets.filter((preset: any) => 
        preset.bloomsLevel === Number(bloomsLevel)
      );
    }
    
    // Filter by subject area if specified
    if (subject && typeof subject === 'string') {
      filteredPresets = filteredPresets.filter((preset: any) => 
        preset.subject === subject
      );
    }
    
    res.json({
      success: true,
      data: {
        presets: filteredPresets,
        totalCount: filteredPresets.length,
        filters: {
          category: category || null,
          bloomsLevel: bloomsLevel ? Number(bloomsLevel) : null,
          subject: subject || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching learning objectives presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning objectives presets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/learning-objectives/categories
 * Get all available categories and their counts
 */
router.get('/categories', authenticate, (req: Request, res: Response): void => {
  try {
    const categoryCounts = learningObjectivesPresets.reduce((acc: Record<string, number>, preset: any) => {
      acc[preset.category] = (acc[preset.category] || 0) + 1;
      return acc;
    }, {});
    
    const categories = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      bloomsLevels: learningObjectivesPresets
        .filter((preset: any) => preset.category === category)
        .map((preset: any) => preset.bloomsLevel)
        .filter((level: any, index: number, array: any[]) => array.indexOf(level) === index)
        .sort()
    }));
    
    res.json({
      success: true,
      data: {
        categories,
        totalPresets: learningObjectivesPresets.length
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/learning-objectives/subjects
 * Get all available subject areas and their descriptions
 */
router.get('/subjects', authenticate, (req: Request, res: Response): void => {
  try {
    const subjectCounts = learningObjectivesPresets.reduce((acc: Record<string, number>, preset: any) => {
      acc[preset.subject] = (acc[preset.subject] || 0) + 1;
      return acc;
    }, {});
    
    const subjects = Object.entries(subjectAreas).map(([key, name]) => ({
      key,
      name,
      count: subjectCounts[key] || 0,
      presets: learningObjectivesPresets.filter((preset: any) => preset.subject === key)
    }));
    
    res.json({
      success: true,
      data: {
        subjects: subjects.filter(subject => subject.count > 0),
        allSubjects: subjects
      }
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/learning-objectives/blooms-levels
 * Get objectives organized by Bloom's taxonomy levels
 */
router.get('/blooms-levels', authenticate, (req: Request, res: Response): void => {
  try {
    const bloomsLevels = [
      { level: 1, name: 'Knowledge (Remembering)', description: 'Recall facts, terms, concepts, trends, sequences, classifications, categories, criteria, methodology' },
      { level: 2, name: 'Comprehension (Understanding)', description: 'Understand main ideas, grasp meaning, interpret charts, translate knowledge' },
      { level: 3, name: 'Application (Applying)', description: 'Use information in new situations, apply laws and theories to practical situations' },
      { level: 4, name: 'Analysis (Analyzing)', description: 'Break down complex topics, identify patterns, organize parts, recognize hidden meanings' },
      { level: 5, name: 'Synthesis (Evaluating/Creating)', description: 'Combine ideas to form new whole, build relationships, create original work' },
      { level: 6, name: 'Evaluation (Evaluating)', description: 'Make judgments, critique based on standards, recommend improvements' }
    ];
    
    const levelsWithPresets = bloomsLevels.map(level => ({
      ...level,
      presets: learningObjectivesPresets.filter((preset: any) => preset.bloomsLevel === level.level),
      count: learningObjectivesPresets.filter((preset: any) => preset.bloomsLevel === level.level).length
    }));
    
    res.json({
      success: true,
      data: {
        bloomsLevels: levelsWithPresets,
        totalLevels: bloomsLevels.length
      }
    });
  } catch (error) {
    console.error('Error fetching Bloom\'s levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Bloom\'s taxonomy levels',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/learning-objectives/assessment-templates
 * Get assessment criteria templates by subject area
 */
router.get('/assessment-templates', authenticate, (req: Request, res: Response): void => {
  try {
    const { subject } = req.query;
    
    if (subject && typeof subject === 'string') {
      // Return template for specific subject
      const template = assessmentTemplates[subject];
      if (!template) {
        res.status(404).json({
          success: false,
          message: `Assessment template not found for subject: ${subject}`
        });
        return;
      }
      
      res.json({
        success: true,
        data: {
          subject,
          subjectName: subjectAreas[subject] || subject,
          criteria: template
        }
      });
    } else {
      // Return all templates
      const templates = Object.entries(assessmentTemplates).map(([key, criteria]) => ({
        subject: key,
        subjectName: subjectAreas[key] || key,
        criteria
      }));
      
      res.json({
        success: true,
        data: {
          templates,
          totalTemplates: templates.length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching assessment templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/learning-objectives/validate-set
 * Validate a set of learning objectives (weights, coverage, etc.)
 */
router.post('/validate-set', authenticate, (req: Request, res: Response): void => {
  try {
    const { objectives } = req.body;
    
    if (!Array.isArray(objectives)) {
      res.status(400).json({
        success: false,
        message: 'Objectives must be provided as an array'
      });
      return;
    }
    
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      summary: {
        totalObjectives: objectives.length,
        totalWeight: 0,
        bloomsLevels: [] as number[],
        categories: [] as string[]
      }
    };
    
    // Calculate totals and collect data
    const weights = objectives.map((obj: any) => obj.weight || 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const bloomsLevels = [...new Set(objectives.map((obj: any) => obj.bloomsLevel))].sort();
    const categories = [...new Set(objectives.map((obj: any) => obj.category))];
    
    validation.summary.totalWeight = totalWeight;
    validation.summary.bloomsLevels = bloomsLevels;
    validation.summary.categories = categories;
    
    // Validate weight sum
    if (totalWeight !== 100) {
      validation.isValid = false;
      validation.errors.push(`Total weight must equal 100% (currently ${totalWeight}%)`);
    }
    
    // Check for missing required fields
    objectives.forEach((obj: any, index: number) => {
      if (!obj.description) {
        validation.errors.push(`Objective ${index + 1}: Description is required`);
      }
      if (!obj.category) {
        validation.errors.push(`Objective ${index + 1}: Category is required`);
      }
      if (!obj.bloomsLevel || obj.bloomsLevel < 1 || obj.bloomsLevel > 6) {
        validation.errors.push(`Objective ${index + 1}: Valid Bloom's level (1-6) is required`);
      }
      if (obj.weight < 0 || obj.weight > 100) {
        validation.errors.push(`Objective ${index + 1}: Weight must be between 0-100%`);
      }
    });
    
    // Educational recommendations
    if (bloomsLevels.length === 1) {
      validation.warnings.push('Consider including objectives from multiple Bloom\'s taxonomy levels for comprehensive learning');
    }
    
    if (objectives.length < 2) {
      validation.warnings.push('Consider adding multiple learning objectives for better assessment coverage');
    }
    
    if (objectives.length > 8) {
      validation.warnings.push('Consider reducing objectives count for focused assessment (recommended: 2-6 objectives)');
    }
    
    // Check for balanced cognitive levels
    const higherOrderThinking = bloomsLevels.filter(level => level >= 4).length;
    const lowerOrderThinking = bloomsLevels.filter(level => level <= 3).length;
    
    if (higherOrderThinking === 0) {
      validation.warnings.push('Consider including higher-order thinking objectives (Analysis, Synthesis, Evaluation)');
    }
    
    if (validation.errors.length > 0) {
      validation.isValid = false;
    }
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating learning objectives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate learning objectives',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;