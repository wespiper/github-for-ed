import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization || '');
    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const payload = verifyToken(token);
    (request as any).userId = payload.userId;
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

// Import preset data - simplified version for migration
const learningObjectivesPresets = [
  {
    id: 'know-vocab-writing',
    description: 'Identify and define key writing terminology and concepts',
    category: 'knowledge',
    bloomsLevel: 1,
    assessmentCriteria: [
      'Correctly defines writing terms',
      'Identifies rhetorical devices',
      'Recognizes text structures'
    ],
    weight: 15,
    subject: 'writing-fundamentals'
  },
  {
    id: 'understand-audience',
    description: 'Demonstrate understanding of audience analysis and adaptation',
    category: 'comprehension',
    bloomsLevel: 2,
    assessmentCriteria: [
      'Identifies target audience characteristics',
      'Explains audience needs and expectations',
      'Adapts tone and style appropriately'
    ],
    weight: 20,
    subject: 'rhetorical-analysis'
  },
  {
    id: 'apply-writing-process',
    description: 'Apply the writing process effectively in practice',
    category: 'application',
    bloomsLevel: 3,
    assessmentCriteria: [
      'Uses prewriting strategies',
      'Drafts with clear organization',
      'Revises for content and clarity'
    ],
    weight: 25,
    subject: 'writing-process'
  },
  {
    id: 'analyze-arguments',
    description: 'Analyze argumentative structure and logical reasoning',
    category: 'analysis',
    bloomsLevel: 4,
    assessmentCriteria: [
      'Identifies claims and evidence',
      'Evaluates logical connections',
      'Recognizes rhetorical strategies'
    ],
    weight: 20,
    subject: 'critical-thinking'
  },
  {
    id: 'create-original-work',
    description: 'Create original written work that synthesizes multiple sources',
    category: 'synthesis',
    bloomsLevel: 5,
    assessmentCriteria: [
      'Integrates multiple perspectives',
      'Develops original insights',
      'Creates coherent narrative'
    ],
    weight: 25,
    subject: 'creative-writing'
  }
];

const assessmentTemplates = {
  'writing-fundamentals': [
    { criterion: 'Vocabulary usage', weight: 25 },
    { criterion: 'Concept application', weight: 35 },
    { criterion: 'Terminology accuracy', weight: 40 }
  ],
  'academic-writing': [
    { criterion: 'Citation accuracy', weight: 30 },
    { criterion: 'Source integration', weight: 40 },
    { criterion: 'Academic tone', weight: 30 }
  ],
  'creative-writing': [
    { criterion: 'Originality', weight: 40 },
    { criterion: 'Narrative structure', weight: 35 },
    { criterion: 'Voice and style', weight: 25 }
  ]
};

const subjectAreas = {
  'writing-fundamentals': 'Writing Fundamentals',
  'academic-writing': 'Academic Writing',
  'creative-writing': 'Creative Writing',
  'rhetorical-analysis': 'Rhetorical Analysis',
  'writing-process': 'Writing Process',
  'critical-thinking': 'Critical Thinking',
  'language-mechanics': 'Language Mechanics'
};

// TypeBox Schemas
const ValidateObjectivesSchema = Type.Object({
  objectives: Type.Array(Type.Object({
    description: Type.Optional(Type.String()),
    category: Type.Optional(Type.String()),
    bloomsLevel: Type.Optional(Type.Number({ minimum: 1, maximum: 6 })),
    weight: Type.Optional(Type.Number({ minimum: 0, maximum: 100 }))
  }))
});

const SuccessResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Any()
});

const ErrorResponseSchema = Type.Object({
  error: Type.String()
});

export default async function learningObjectiveRoutes(fastify: FastifyInstance) {
  // Retrieve all available learning objective presets
  fastify.get('/presets', {
    schema: {
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        bloomsLevel: Type.Optional(Type.String()),
        subject: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { category, bloomsLevel, subject } = request.query as any;
        
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
        
        reply.send({
          message: 'Learning objectives presets retrieved successfully',
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
        reply.status(500).send({
          error: 'Failed to fetch learning objectives presets'
        });
      }
    }
  });

  // Get all available categories and their counts
  fastify.get('/categories', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        reply.send({
          message: 'Categories retrieved successfully',
          data: {
            categories,
            totalPresets: learningObjectivesPresets.length
          }
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
        reply.status(500).send({
          error: 'Failed to fetch categories'
        });
      }
    }
  });

  // Get all available subject areas and their descriptions
  fastify.get('/subjects', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        reply.send({
          message: 'Subject areas retrieved successfully',
          data: {
            subjects: subjects.filter(subject => subject.count > 0),
            allSubjects: subjects
          }
        });
      } catch (error) {
        console.error('Error fetching subjects:', error);
        reply.status(500).send({
          error: 'Failed to fetch subjects'
        });
      }
    }
  });

  // Get objectives organized by Bloom's taxonomy levels
  fastify.get('/blooms-levels', {
    schema: {
      response: {
        200: SuccessResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        reply.send({
          message: 'Bloom\'s taxonomy levels retrieved successfully',
          data: {
            bloomsLevels: levelsWithPresets,
            totalLevels: bloomsLevels.length
          }
        });
      } catch (error) {
        console.error('Error fetching Bloom\'s levels:', error);
        reply.status(500).send({
          error: 'Failed to fetch Bloom\'s taxonomy levels'
        });
      }
    }
  });

  // Get assessment criteria templates by subject area
  fastify.get('/assessment-templates', {
    schema: {
      querystring: Type.Object({
        subject: Type.Optional(Type.String())
      }),
      response: {
        200: SuccessResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { subject } = request.query as any;
        
        if (subject && typeof subject === 'string') {
          // Return template for specific subject
          const template = (assessmentTemplates as any)[subject];
          if (!template) {
            return reply.status(404).send({
              error: `Assessment template not found for subject: ${subject}`
            });
          }
          
          reply.send({
            message: 'Assessment template retrieved successfully',
            data: {
              subject,
              subjectName: (subjectAreas as any)[subject] || subject,
              criteria: template
            }
          });
        } else {
          // Return all templates
          const templates = Object.entries(assessmentTemplates).map(([key, criteria]) => ({
            subject: key,
            subjectName: (subjectAreas as any)[key] || key,
            criteria
          }));
          
          reply.send({
            message: 'Assessment templates retrieved successfully',
            data: {
              templates,
              totalTemplates: templates.length
            }
          });
        }
      } catch (error) {
        console.error('Error fetching assessment templates:', error);
        reply.status(500).send({
          error: 'Failed to fetch assessment templates'
        });
      }
    }
  });

  // Validate a set of learning objectives (weights, coverage, etc.)
  fastify.post('/validate-set', {
    schema: {
      body: ValidateObjectivesSchema,
      response: {
        200: SuccessResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { objectives } = request.body as any;
        
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
        const totalWeight = weights.reduce((sum: number, weight: number) => sum + weight, 0);
        const bloomsLevels = Array.from(new Set(objectives.map((obj: any) => obj.bloomsLevel))).sort();
        const categories = Array.from(new Set(objectives.map((obj: any) => obj.category)));
        
        validation.summary.totalWeight = totalWeight;
        validation.summary.bloomsLevels = bloomsLevels as number[];
        validation.summary.categories = categories as string[];
        
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
        const higherOrderThinking = (bloomsLevels as number[]).filter((level: number) => level >= 4).length;
        const lowerOrderThinking = (bloomsLevels as number[]).filter((level: number) => level <= 3).length;
        
        if (higherOrderThinking === 0) {
          validation.warnings.push('Consider including higher-order thinking objectives (Analysis, Synthesis, Evaluation)');
        }
        
        if (validation.errors.length > 0) {
          validation.isValid = false;
        }
        
        reply.send({
          message: 'Learning objectives validated successfully',
          data: validation
        });
      } catch (error) {
        console.error('Error validating learning objectives:', error);
        reply.status(500).send({
          error: 'Failed to validate learning objectives'
        });
      }
    }
  });
}