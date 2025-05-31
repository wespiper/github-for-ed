export interface BloomKeywords {
  [level: number]: {
    primary: string[];
    secondary?: string[];
    patterns?: RegExp[];
  };
}

export class BloomsTaxonomyKeywords {
  private static keywords: BloomKeywords = {
    1: { // Remember
      primary: [
        'identify', 'list', 'name', 'define', 'describe', 'match', 
        'select', 'label', 'recall', 'recognize', 'state', 'locate'
      ],
      secondary: [
        'who', 'what', 'where', 'when', 'which', 'choose', 'find'
      ],
      patterns: [
        /^what is/i,
        /^who was/i,
        /^where is/i,
        /^when did/i,
        /^list the/i,
        /^name the/i
      ]
    },
    2: { // Understand
      primary: [
        'explain', 'summarize', 'paraphrase', 'describe', 'illustrate',
        'interpret', 'demonstrate', 'classify', 'discuss', 'predict',
        'compare', 'distinguish', 'extend', 'infer', 'relate'
      ],
      secondary: [
        'why', 'how', 'what does this mean', 'give an example',
        'in your own words', 'what is the main idea'
      ],
      patterns: [
        /explain why/i,
        /explain how/i,
        /what does .+ mean/i,
        /describe the relationship/i,
        /what is the difference/i
      ]
    },
    3: { // Apply
      primary: [
        'apply', 'demonstrate', 'use', 'implement', 'solve', 'execute',
        'construct', 'complete', 'show', 'examine', 'modify', 'relate',
        'change', 'experiment', 'discover', 'simulate'
      ],
      secondary: [
        'how would you use', 'what would happen if', 'can you apply',
        'solve this', 'demonstrate how', 'what approach would you use'
      ],
      patterns: [
        /how would you use/i,
        /apply .+ to/i,
        /what would happen if/i,
        /solve this problem/i,
        /demonstrate how/i
      ]
    },
    4: { // Analyze
      primary: [
        'analyze', 'compare', 'contrast', 'examine', 'investigate',
        'categorize', 'differentiate', 'discriminate', 'distinguish',
        'question', 'test', 'critique', 'diagnose', 'identify motives',
        'identify reasons', 'deduce', 'dissect'
      ],
      secondary: [
        'what evidence', 'what factors', 'what reasons', 'what causes',
        'how does this relate', 'what conclusions', 'what is the theme'
      ],
      patterns: [
        /analyze the/i,
        /compare and contrast/i,
        /what evidence/i,
        /what factors/i,
        /examine the relationship/i,
        /identify the causes/i
      ]
    },
    5: { // Evaluate
      primary: [
        'evaluate', 'judge', 'critique', 'justify', 'assess', 'argue',
        'defend', 'support', 'value', 'prove', 'disprove', 'recommend',
        'prioritize', 'rate', 'select', 'decide', 'rank', 'appraise'
      ],
      secondary: [
        'do you agree', 'what is your opinion', 'judge the value',
        'defend your position', 'what is most important', 'rate the'
      ],
      patterns: [
        /evaluate the/i,
        /judge the/i,
        /do you agree/i,
        /defend your/i,
        /what is .+ effective/i,
        /justify your/i,
        /which is better/i
      ]
    },
    6: { // Create
      primary: [
        'create', 'design', 'construct', 'develop', 'formulate', 'build',
        'invent', 'compose', 'generate', 'plan', 'produce', 'devise',
        'synthesize', 'prepare', 'propose', 'imagine', 'elaborate'
      ],
      secondary: [
        'what if', 'propose an alternative', 'how would you design',
        'create a new', 'what would you do differently', 'develop a plan'
      ],
      patterns: [
        /create a/i,
        /design a/i,
        /develop a new/i,
        /propose an alternative/i,
        /how would you improve/i,
        /construct a plan/i
      ]
    }
  };

  static getKeywords(): BloomKeywords {
    return this.keywords;
  }

  static getKeywordsForLevel(level: number): { primary: string[]; secondary?: string[]; patterns?: RegExp[] } {
    return this.keywords[level] || { primary: [] };
  }

  static getAllKeywords(): string[] {
    const allKeywords: string[] = [];
    Object.values(this.keywords).forEach(levelKeywords => {
      allKeywords.push(...levelKeywords.primary);
      if (levelKeywords.secondary) {
        allKeywords.push(...levelKeywords.secondary);
      }
    });
    return [...new Set(allKeywords)]; // Remove duplicates
  }

  static detectLevel(text: string): { level: number; confidence: number; keyword?: string } {
    const textLower = text.toLowerCase();
    
    // Check from highest to lowest level for better accuracy
    for (let level = 6; level >= 1; level--) {
      const levelKeywords = this.keywords[level];
      
      // Check primary keywords (highest confidence)
      for (const keyword of levelKeywords.primary) {
        if (textLower.includes(keyword)) {
          return { level, confidence: 0.9, keyword };
        }
      }
      
      // Check patterns (high confidence)
      if (levelKeywords.patterns) {
        for (const pattern of levelKeywords.patterns) {
          if (pattern.test(text)) {
            return { level, confidence: 0.85, keyword: pattern.source };
          }
        }
      }
      
      // Check secondary keywords (medium confidence)
      if (levelKeywords.secondary) {
        for (const keyword of levelKeywords.secondary) {
          if (textLower.includes(keyword)) {
            return { level, confidence: 0.7, keyword };
          }
        }
      }
    }
    
    // Default to level 1 with low confidence
    return { level: 1, confidence: 0.5 };
  }
}