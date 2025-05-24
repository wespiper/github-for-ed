/**
 * Learning Objectives Preset Data
 * 
 * Pre-defined learning objectives organized by category and Bloom's taxonomy level
 * Educators can select from these presets when creating assignments
 */

const learningObjectivesPresets = [
  // KNOWLEDGE (Bloom's Level 1) - Remembering
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
    id: 'know-citation-styles',
    description: 'Recall proper citation format for academic sources',
    category: 'knowledge',
    bloomsLevel: 1,
    assessmentCriteria: [
      'Demonstrates knowledge of APA format',
      'Identifies components of citations',
      'Recognizes citation errors'
    ],
    weight: 10,
    subject: 'academic-writing'
  },
  {
    id: 'know-grammar-rules',
    description: 'Remember and state fundamental grammar and punctuation rules',
    category: 'knowledge',
    bloomsLevel: 1,
    assessmentCriteria: [
      'Identifies parts of speech',
      'States punctuation rules',
      'Recognizes sentence structures'
    ],
    weight: 15,
    subject: 'language-mechanics'
  },

  // COMPREHENSION (Bloom's Level 2) - Understanding
  {
    id: 'comp-audience-purpose',
    description: 'Explain the relationship between audience, purpose, and writing choices',
    category: 'comprehension',
    bloomsLevel: 2,
    assessmentCriteria: [
      'Explains audience considerations',
      'Describes purpose alignment',
      'Interprets context clues'
    ],
    weight: 20,
    subject: 'rhetorical-awareness'
  },
  {
    id: 'comp-argument-structure',
    description: 'Interpret and summarize the structure of effective arguments',
    category: 'comprehension',
    bloomsLevel: 2,
    assessmentCriteria: [
      'Identifies thesis statements',
      'Explains supporting evidence',
      'Summarizes logical flow'
    ],
    weight: 25,
    subject: 'argument-development'
  },
  {
    id: 'comp-source-credibility',
    description: 'Understand and explain criteria for evaluating source credibility',
    category: 'comprehension',
    bloomsLevel: 2,
    assessmentCriteria: [
      'Explains credibility factors',
      'Interprets bias indicators',
      'Describes reliability markers'
    ],
    weight: 20,
    subject: 'research-literacy'
  },

  // APPLICATION (Bloom's Level 3) - Applying
  {
    id: 'app-thesis-development',
    description: 'Apply principles of effective thesis statement construction',
    category: 'application',
    bloomsLevel: 3,
    assessmentCriteria: [
      'Constructs clear thesis statements',
      'Applies specificity principles',
      'Demonstrates argumentative stance'
    ],
    weight: 25,
    subject: 'argument-development'
  },
  {
    id: 'app-evidence-integration',
    description: 'Use appropriate strategies to integrate evidence into writing',
    category: 'application',
    bloomsLevel: 3,
    assessmentCriteria: [
      'Smoothly integrates quotations',
      'Applies signal phrases effectively',
      'Uses evidence to support claims'
    ],
    weight: 30,
    subject: 'evidence-use'
  },
  {
    id: 'app-paragraph-structure',
    description: 'Apply principles of effective paragraph organization and development',
    category: 'application',
    bloomsLevel: 3,
    assessmentCriteria: [
      'Uses topic sentences effectively',
      'Develops supporting details',
      'Applies transition strategies'
    ],
    weight: 25,
    subject: 'organization'
  },
  {
    id: 'app-revision-strategies',
    description: 'Apply systematic revision strategies to improve writing',
    category: 'application',
    bloomsLevel: 3,
    assessmentCriteria: [
      'Implements global revision',
      'Applies editing techniques',
      'Uses feedback effectively'
    ],
    weight: 20,
    subject: 'writing-process'
  },

  // ANALYSIS (Bloom's Level 4) - Analyzing
  {
    id: 'anal-rhetorical-situation',
    description: 'Analyze rhetorical situations and their impact on writing choices',
    category: 'analysis',
    bloomsLevel: 4,
    assessmentCriteria: [
      'Breaks down rhetorical context',
      'Analyzes audience needs',
      'Examines purpose constraints'
    ],
    weight: 30,
    subject: 'rhetorical-analysis'
  },
  {
    id: 'anal-argument-effectiveness',
    description: 'Analyze the effectiveness of argumentative strategies in texts',
    category: 'analysis',
    bloomsLevel: 4,
    assessmentCriteria: [
      'Evaluates logical reasoning',
      'Analyzes evidence quality',
      'Examines counterargument handling'
    ],
    weight: 35,
    subject: 'critical-thinking'
  },
  {
    id: 'anal-style-choices',
    description: 'Analyze how stylistic choices affect meaning and impact',
    category: 'analysis',
    bloomsLevel: 4,
    assessmentCriteria: [
      'Examines word choice effects',
      'Analyzes sentence structure',
      'Evaluates tone appropriateness'
    ],
    weight: 25,
    subject: 'style-analysis'
  },

  // SYNTHESIS (Bloom's Level 5) - Evaluating/Creating
  {
    id: 'syn-original-argument',
    description: 'Synthesize multiple sources to develop original arguments',
    category: 'synthesis',
    bloomsLevel: 5,
    assessmentCriteria: [
      'Combines multiple perspectives',
      'Creates original insights',
      'Balances competing viewpoints'
    ],
    weight: 40,
    subject: 'research-synthesis'
  },
  {
    id: 'syn-genre-adaptation',
    description: 'Create writing that effectively adapts to different genres and contexts',
    category: 'synthesis',
    bloomsLevel: 5,
    assessmentCriteria: [
      'Adapts tone for context',
      'Adjusts structure for purpose',
      'Synthesizes genre conventions'
    ],
    weight: 35,
    subject: 'genre-awareness'
  },
  {
    id: 'syn-multimedia-composition',
    description: 'Synthesize textual and visual elements in multimodal compositions',
    category: 'synthesis',
    bloomsLevel: 5,
    assessmentCriteria: [
      'Integrates visual rhetoric',
      'Creates coherent multimodal text',
      'Balances multiple modes'
    ],
    weight: 30,
    subject: 'multimodal-composition'
  },

  // EVALUATION (Bloom's Level 6) - Evaluating
  {
    id: 'eval-peer-writing',
    description: 'Evaluate peer writing using established criteria and provide constructive feedback',
    category: 'evaluation',
    bloomsLevel: 6,
    assessmentCriteria: [
      'Applies evaluation criteria consistently',
      'Provides specific, actionable feedback',
      'Justifies recommendations with evidence'
    ],
    weight: 25,
    subject: 'peer-review'
  },
  {
    id: 'eval-own-writing',
    description: 'Critically evaluate own writing process and products for continuous improvement',
    category: 'evaluation',
    bloomsLevel: 6,
    assessmentCriteria: [
      'Reflects on writing process',
      'Identifies strengths and weaknesses',
      'Plans targeted improvements'
    ],
    weight: 20,
    subject: 'metacognition'
  },
  {
    id: 'eval-research-quality',
    description: 'Evaluate the quality and appropriateness of research sources and methodologies',
    category: 'evaluation',
    bloomsLevel: 6,
    assessmentCriteria: [
      'Assesses source reliability',
      'Evaluates methodology appropriateness',
      'Judges evidence sufficiency'
    ],
    weight: 30,
    subject: 'research-evaluation'
  }
];

// Common assessment templates by category
const assessmentTemplates = {
  'argument-development': [
    'Clarity and specificity of thesis statement',
    'Quality and relevance of supporting evidence',
    'Logical progression of ideas',
    'Effective use of counterarguments',
    'Strength of conclusion'
  ],
  'evidence-use': [
    'Integration of source material',
    'Appropriate citation format',
    'Analysis of evidence significance',
    'Balance of evidence types',
    'Source credibility assessment'
  ],
  'organization': [
    'Clear introduction and conclusion',
    'Logical paragraph structure',
    'Effective transitions',
    'Coherent overall flow',
    'Appropriate section divisions'
  ],
  'style-analysis': [
    'Appropriate tone for audience',
    'Varied sentence structure',
    'Precise word choice',
    'Consistent voice',
    'Engaging presentation'
  ],
  'writing-process': [
    'Evidence of planning and prewriting',
    'Multiple meaningful revisions',
    'Response to feedback',
    'Editing for clarity and correctness',
    'Reflection on process'
  ]
};

// Subject area groupings for organization
const subjectAreas = {
  'writing-fundamentals': 'Writing Fundamentals',
  'academic-writing': 'Academic Writing',
  'language-mechanics': 'Language & Mechanics',
  'rhetorical-awareness': 'Rhetorical Awareness',
  'argument-development': 'Argument Development',
  'research-literacy': 'Research Literacy',
  'evidence-use': 'Evidence & Sources',
  'organization': 'Organization & Structure',
  'writing-process': 'Writing Process',
  'rhetorical-analysis': 'Rhetorical Analysis',
  'critical-thinking': 'Critical Thinking',
  'style-analysis': 'Style & Voice',
  'research-synthesis': 'Research & Synthesis',
  'genre-awareness': 'Genre & Context',
  'multimodal-composition': 'Multimodal Composition',
  'peer-review': 'Peer Review & Collaboration',
  'metacognition': 'Reflection & Metacognition',
  'research-evaluation': 'Research Evaluation'
};

module.exports = {
  learningObjectivesPresets,
  assessmentTemplates,
  subjectAreas
};