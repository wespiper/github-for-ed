// Integration with existing .claude/insights workflow
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { StrategyInsight, AlignmentMapping } from '../types/index.js';

export interface InsightFile {
  path: string;
  filename: string;
  lastModified: Date;
  content: string;
}

export interface ExtractedInsight {
  content: string;
  category: 'technical-pattern' | 'educational-insight' | 'business-learning' | 'process-improvement';
  source: string;
  confidence: number; // 0-100
  businessRelevance: number; // 0-100
  suggestedBusinessCategory?: 'competitive-advantage' | 'market-opportunity' | 'technical-capability' | 'business-model' | 'risk-mitigation' | 'resource-optimization';
}

export interface BusinessImplication {
  technicalPattern: string;
  businessValue: string;
  competitiveAdvantage: string;
  marketOpportunity: string;
  strategicRecommendation: string;
}

export class InsightsIntegration {
  private insightsPath: string;
  private reflectionsPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.insightsPath = join(projectRoot, '.claude', 'insights');
    this.reflectionsPath = join(projectRoot, '.claude', 'reflections');
  }

  async readInsightFiles(): Promise<InsightFile[]> {
    try {
      const files = await readdir(this.insightsPath);
      const insightFiles: InsightFile[] = [];

      for (const filename of files) {
        if (filename.endsWith('.md')) {
          const filePath = join(this.insightsPath, filename);
          const content = await readFile(filePath, 'utf-8');
          const stats = await import('fs').then(fs => fs.promises.stat(filePath));
          
          insightFiles.push({
            path: filePath,
            filename,
            lastModified: stats.mtime,
            content
          });
        }
      }

      return insightFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error reading insight files:', error);
      return [];
    }
  }

  async readReflectionFiles(): Promise<InsightFile[]> {
    try {
      const files = await readdir(this.reflectionsPath);
      const reflectionFiles: InsightFile[] = [];

      for (const filename of files) {
        if (filename.endsWith('.md')) {
          const filePath = join(this.reflectionsPath, filename);
          const content = await readFile(filePath, 'utf-8');
          const stats = await import('fs').then(fs => fs.promises.stat(filePath));
          
          reflectionFiles.push({
            path: filePath,
            filename,
            lastModified: stats.mtime,
            content
          });
        }
      }

      return reflectionFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error reading reflection files:', error);
      return [];
    }
  }

  extractStrategicInsights(content: string, source: string): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];
    
    // Extract insights from different section patterns
    const sectionPatterns = [
      /## Key Insights[\s\S]*?(?=##|$)/g,
      /## Strategic.*?[\s\S]*?(?=##|$)/g,
      /## Business.*?[\s\S]*?(?=##|$)/g,
      /## Competitive.*?[\s\S]*?(?=##|$)/g,
      /### .*Success.*[\s\S]*?(?=###|##|$)/g,
      /\*\*.*Key.*\*\*[\s\S]*?(?=\*\*|##|$)/g
    ];

    sectionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const sectionInsights = this.parseInsightsFromSection(match, source);
          insights.push(...sectionInsights);
        });
      }
    });

    // Extract bullet points that indicate insights
    const bulletPatterns = [
      /- \*\*[^*]+\*\*:[^-\n]*(?:\n(?!-)[^\n-]*)*(?=\n-|$)/g,
      /\d+\. \*\*[^*]+\*\*:[^-\n]*(?:\n(?!\d)[^\n-]*)*(?=\n\d|$)/g,
      /• [^•\n]*(?:\n(?!•)[^\n•]*)*(?=\n•|$)/g
    ];

    bulletPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const insight = this.parseInsightFromBullet(match, source);
          if (insight) insights.push(insight);
        });
      }
    });

    return insights.filter(insight => insight.content.length > 50); // Filter out short/incomplete insights
  }

  private parseInsightsFromSection(section: string, source: string): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];
    
    // Remove section header and clean up
    const content = section.replace(/^##+ [^\n]*\n/, '').trim();
    
    // Split into potential insights by bullet points or numbered lists
    const items = content.split(/\n(?=[-*•]|\d+\.)/);
    
    items.forEach(item => {
      const cleanItem = item.replace(/^[-*•]\s*|\d+\.\s*/, '').trim();
      if (cleanItem.length > 30) {
        const insight = this.categorizeInsight(cleanItem, source);
        if (insight) insights.push(insight);
      }
    });

    return insights;
  }

  private parseInsightFromBullet(bullet: string, source: string): ExtractedInsight | null {
    const cleanContent = bullet.replace(/^[-*•]\s*|\d+\.\s*/, '').trim();
    if (cleanContent.length < 30) return null;

    return this.categorizeInsight(cleanContent, source);
  }

  private categorizeInsight(content: string, source: string): ExtractedInsight | null {
    const lowerContent = content.toLowerCase();
    
    // Technical pattern keywords
    const technicalKeywords = ['repository pattern', 'microservices', 'architecture', 'database', 'api', 'performance', 'cache', 'service', 'implementation'];
    
    // Educational insight keywords
    const educationalKeywords = ['student', 'educator', 'learning', 'reflection', 'ai boundaries', 'educational', 'pedagogy', 'bounded enhancement'];
    
    // Business learning keywords
    const businessKeywords = ['revenue', 'market', 'competitive', 'customer', 'business model', 'monetization', 'pricing', 'strategy'];
    
    // Process improvement keywords
    const processKeywords = ['development', 'testing', 'deployment', 'workflow', 'efficiency', 'productivity', 'sprint', 'migration'];

    let category: ExtractedInsight['category'] = 'business-learning';
    let businessRelevance = 50;
    let suggestedBusinessCategory: ExtractedInsight['suggestedBusinessCategory'];

    if (technicalKeywords.some(keyword => lowerContent.includes(keyword))) {
      category = 'technical-pattern';
      businessRelevance = this.assessBusinessRelevance(content, 'technical');
      suggestedBusinessCategory = 'technical-capability';
    } else if (educationalKeywords.some(keyword => lowerContent.includes(keyword))) {
      category = 'educational-insight';
      businessRelevance = this.assessBusinessRelevance(content, 'educational');
      suggestedBusinessCategory = 'competitive-advantage';
    } else if (businessKeywords.some(keyword => lowerContent.includes(keyword))) {
      category = 'business-learning';
      businessRelevance = 90;
      if (lowerContent.includes('competitive') || lowerContent.includes('advantage')) {
        suggestedBusinessCategory = 'competitive-advantage';
      } else if (lowerContent.includes('market') || lowerContent.includes('opportunity')) {
        suggestedBusinessCategory = 'market-opportunity';
      } else if (lowerContent.includes('revenue') || lowerContent.includes('monetization')) {
        suggestedBusinessCategory = 'business-model';
      }
    } else if (processKeywords.some(keyword => lowerContent.includes(keyword))) {
      category = 'process-improvement';
      businessRelevance = this.assessBusinessRelevance(content, 'process');
      suggestedBusinessCategory = 'resource-optimization';
    }

    const confidence = this.assessConfidence(content);

    return {
      content,
      category,
      source,
      confidence,
      businessRelevance,
      suggestedBusinessCategory
    };
  }

  private assessBusinessRelevance(content: string, type: string): number {
    const lowerContent = content.toLowerCase();
    let relevance = 50;

    // Business impact indicators
    const highImpactTerms = ['competitive advantage', 'revenue', 'customer value', 'market position', 'scalability', 'efficiency'];
    const mediumImpactTerms = ['performance', 'capability', 'feature', 'improvement', 'optimization'];
    
    if (highImpactTerms.some(term => lowerContent.includes(term))) {
      relevance += 30;
    }
    if (mediumImpactTerms.some(term => lowerContent.includes(term))) {
      relevance += 15;
    }

    // Type-specific adjustments
    if (type === 'educational' && (lowerContent.includes('bounded enhancement') || lowerContent.includes('trust through transparency'))) {
      relevance += 25; // Core philosophy insights are highly business relevant
    }
    if (type === 'technical' && (lowerContent.includes('privacy') || lowerContent.includes('microservices'))) {
      relevance += 20; // Key technical differentiators
    }

    return Math.min(100, relevance);
  }

  private assessConfidence(content: string): number {
    let confidence = 60;

    // Confidence indicators
    if (content.includes('successfully') || content.includes('achieved') || content.includes('proven')) {
      confidence += 20;
    }
    if (content.includes('test') || content.includes('validated') || content.includes('measured')) {
      confidence += 15;
    }
    if (content.includes('should') || content.includes('might') || content.includes('potentially')) {
      confidence -= 10;
    }
    if (content.length > 200) {
      confidence += 10; // Longer insights tend to be more developed
    }

    return Math.min(100, Math.max(20, confidence));
  }

  async generateBusinessImplications(insights: ExtractedInsight[]): Promise<BusinessImplication[]> {
    const implications: BusinessImplication[] = [];

    // Group insights by category for analysis
    const technicalInsights = insights.filter(i => i.category === 'technical-pattern');
    const educationalInsights = insights.filter(i => i.category === 'educational-insight');
    const businessInsights = insights.filter(i => i.category === 'business-learning');

    // Generate implications for high-value technical patterns
    technicalInsights
      .filter(insight => insight.businessRelevance > 70)
      .forEach(insight => {
        const implication = this.generateTechnicalImplication(insight);
        if (implication) implications.push(implication);
      });

    // Generate implications for educational insights
    educationalInsights
      .filter(insight => insight.businessRelevance > 60)
      .forEach(insight => {
        const implication = this.generateEducationalImplication(insight);
        if (implication) implications.push(implication);
      });

    return implications;
  }

  private generateTechnicalImplication(insight: ExtractedInsight): BusinessImplication | null {
    const content = insight.content.toLowerCase();
    
    if (content.includes('microservices') || content.includes('architecture')) {
      return {
        technicalPattern: 'Microservices Architecture Implementation',
        businessValue: 'Enables independent team scaling, faster deployment cycles, and improved system reliability',
        competitiveAdvantage: 'Platform scalability that competitors using monolithic architectures cannot match',
        marketOpportunity: 'Ability to serve enterprise customers requiring high availability and scale',
        strategicRecommendation: 'Position as enterprise-ready platform and adjust pricing for institutional scale'
      };
    }

    if (content.includes('privacy') || content.includes('gdpr') || content.includes('ferpa')) {
      return {
        technicalPattern: 'Privacy-by-Design Architecture',
        businessValue: 'Built-in compliance reduces legal risk and builds institutional trust',
        competitiveAdvantage: 'Only platform with native privacy protection vs retrofitted compliance',
        marketOpportunity: 'Education market where privacy is regulatory requirement, not optional',
        strategicRecommendation: 'Lead with privacy-first messaging and target privacy-conscious institutions'
      };
    }

    if (content.includes('repository pattern') || content.includes('testability')) {
      return {
        technicalPattern: 'Systematic Code Quality and Testing',
        businessValue: 'Reduced technical debt and faster feature development',
        competitiveAdvantage: 'Sustainable development velocity while maintaining quality',
        marketOpportunity: 'Reliable platform that educational institutions can depend on',
        strategicRecommendation: 'Emphasize platform reliability and continuous improvement in sales materials'
      };
    }

    return null;
  }

  private generateEducationalImplication(insight: ExtractedInsight): BusinessImplication | null {
    const content = insight.content.toLowerCase();
    
    if (content.includes('bounded enhancement') || content.includes('ai dependency')) {
      return {
        technicalPattern: 'Bounded Enhancement AI Philosophy',
        businessValue: 'Unique educational approach that builds student independence rather than dependency',
        competitiveAdvantage: 'Only platform that solves the AI dependency crisis in education',
        marketOpportunity: 'Educational institutions seeking responsible AI integration solutions',
        strategicRecommendation: 'Position as the anti-dependency AI platform and create thought leadership content'
      };
    }

    if (content.includes('trust through transparency') || content.includes('integrity')) {
      return {
        technicalPattern: 'Transparency-Based Trust Building',
        businessValue: 'Eliminates adversarial relationship between students and educational technology',
        competitiveAdvantage: 'Collaborative rather than surveillance-based approach to academic integrity',
        marketOpportunity: 'Institutions struggling with AI detection and academic integrity policies',
        strategicRecommendation: 'Market as academic integrity solution that builds trust rather than enforcement'
      };
    }

    if (content.includes('process visibility') || content.includes('writing process')) {
      return {
        technicalPattern: 'Writing Process Visualization',
        businessValue: 'Makes invisible learning processes visible to educators for better support',
        competitiveAdvantage: 'Only platform that shows HOW students learn to write, not just what they write',
        marketOpportunity: 'Writing centers, composition programs, and process-focused educators',
        strategicRecommendation: 'Target writing-intensive programs and process-oriented educators with demo capabilities'
      };
    }

    return null;
  }

  async createAlignmentMappings(insights: ExtractedInsight[]): Promise<AlignmentMapping[]> {
    const mappings: AlignmentMapping[] = [];
    
    // Group related insights and create mappings
    const technicalInsights = insights.filter(i => i.category === 'technical-pattern' && i.businessRelevance > 60);
    
    technicalInsights.forEach((insight, index) => {
      const mapping: AlignmentMapping = {
        id: `alignment-${Date.now()}-${index}`,
        technicalFeature: this.extractTechnicalFeature(insight.content),
        codebaseEvidence: [insight.source],
        businessValue: {
          primaryGoals: this.inferPrimaryGoals(insight),
          impact: this.mapImpactLevel(insight.businessRelevance),
          revenueImplication: this.estimateRevenueImplication(insight),
          userImpact: this.describeUserImpact(insight),
          competitiveAdvantage: this.describeCompetitiveAdvantage(insight)
        },
        progressMetrics: {
          technicalCompletion: this.assessTechnicalCompletion(insight),
          businessReadiness: this.assessBusinessReadiness(insight),
          marketValidation: this.assessMarketValidation(insight)
        },
        insights: [insight.content],
        lastUpdated: new Date().toISOString()
      };
      
      mappings.push(mapping);
    });

    return mappings;
  }

  private extractTechnicalFeature(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('microservices')) return 'Microservices Architecture';
    if (lowerContent.includes('privacy') || lowerContent.includes('gdpr')) return 'Privacy-by-Design System';
    if (lowerContent.includes('repository pattern')) return 'Repository Pattern Architecture';
    if (lowerContent.includes('ai') && lowerContent.includes('boundary')) return 'AI Boundary Management';
    if (lowerContent.includes('reflection')) return 'Reflection Quality Analysis';
    if (lowerContent.includes('analytics')) return 'Educational Analytics Engine';
    
    return 'Technical Implementation';
  }

  private inferPrimaryGoals(insight: ExtractedInsight): string[] {
    const goals = [];
    const content = insight.content.toLowerCase();
    
    if (content.includes('revenue') || content.includes('monetization')) goals.push('revenue-growth');
    if (content.includes('competitive') || content.includes('advantage')) goals.push('market-differentiation');
    if (content.includes('scale') || content.includes('enterprise')) goals.push('platform-scalability');
    if (content.includes('student') || content.includes('educational')) goals.push('educational-outcomes');
    if (content.includes('efficiency') || content.includes('productivity')) goals.push('operational-efficiency');
    
    return goals.length > 0 ? goals : ['technical-capability'];
  }

  private mapImpactLevel(businessRelevance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (businessRelevance >= 85) return 'critical';
    if (businessRelevance >= 70) return 'high';
    if (businessRelevance >= 55) return 'medium';
    return 'low';
  }

  private estimateRevenueImplication(insight: ExtractedInsight): number {
    const content = insight.content.toLowerCase();
    
    if (content.includes('enterprise') || content.includes('institutional')) return 50000;
    if (content.includes('privacy') || content.includes('compliance')) return 30000;
    if (content.includes('competitive advantage')) return 25000;
    if (content.includes('efficiency') || content.includes('scale')) return 15000;
    
    return Math.round(insight.businessRelevance * 500); // Basic calculation
  }

  private describeUserImpact(insight: ExtractedInsight): string {
    const content = insight.content.toLowerCase();
    
    if (content.includes('trust') || content.includes('transparency')) {
      return 'Builds trust between students and educators through transparent AI assistance';
    }
    if (content.includes('privacy')) {
      return 'Protects student data privacy while enabling personalized learning experiences';
    }
    if (content.includes('independence') || content.includes('dependency')) {
      return 'Helps students develop independent thinking skills while using AI assistance';
    }
    if (content.includes('reflection') || content.includes('quality')) {
      return 'Improves writing quality through structured reflection and assessment';
    }
    
    return 'Enhances educational experience through improved platform capabilities';
  }

  private describeCompetitiveAdvantage(insight: ExtractedInsight): string {
    const content = insight.content.toLowerCase();
    
    if (content.includes('bounded enhancement')) {
      return 'Only platform that prevents AI dependency while enhancing learning';
    }
    if (content.includes('privacy by design')) {
      return 'Native privacy protection vs competitors retrofitting compliance';
    }
    if (content.includes('microservices')) {
      return 'Enterprise-scale architecture enabling independent team growth';
    }
    if (content.includes('process visibility')) {
      return 'Unique ability to make writing learning processes visible to educators';
    }
    
    return 'Technical capability that differentiates from existing solutions';
  }

  private assessTechnicalCompletion(insight: ExtractedInsight): number {
    const content = insight.content.toLowerCase();
    
    if (content.includes('successfully') || content.includes('implemented') || content.includes('complete')) {
      return 90;
    }
    if (content.includes('working') || content.includes('functional')) {
      return 75;
    }
    if (content.includes('progress') || content.includes('development')) {
      return 60;
    }
    
    return 50;
  }

  private assessBusinessReadiness(insight: ExtractedInsight): number {
    const content = insight.content.toLowerCase();
    
    if (content.includes('market') || content.includes('customer')) {
      return 70;
    }
    if (content.includes('pilot') || content.includes('test')) {
      return 60;
    }
    if (content.includes('prototype') || content.includes('proof of concept')) {
      return 40;
    }
    
    return 30;
  }

  private assessMarketValidation(insight: ExtractedInsight): number {
    const content = insight.content.toLowerCase();
    
    if (content.includes('user feedback') || content.includes('customer feedback')) {
      return 70;
    }
    if (content.includes('validation') || content.includes('tested')) {
      return 60;
    }
    if (content.includes('assumption') || content.includes('hypothesis')) {
      return 30;
    }
    
    return 20;
  }
}