// Technical milestone tracking and business impact correlation
import { v4 as uuidv4 } from 'uuid';
import { AlignmentMapping } from '../types/index.js';

export interface TechnicalMilestone {
  id: string;
  name: string;
  description: string;
  category: 'architecture' | 'feature' | 'performance' | 'security' | 'integration' | 'infrastructure';
  status: 'planned' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
  completionDate?: string;
  plannedDate: string;
  effort: number; // Person-hours estimated
  complexity: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[]; // IDs of other milestones
  technicalDetails: {
    codebaseChanges: string[];
    performanceImpact?: {
      metric: string;
      improvement: string;
      measurement: string;
    };
    architecturalImpact?: string;
    risksMitigated?: string[];
  };
  businessContext: {
    strategicImportance: number; // 0-100
    customerImpact: string;
    revenueImplication: number;
    competitiveAdvantage: string;
    marketTiming: 'early' | 'competitive' | 'late' | 'critical';
  };
  linkedGoals: string[]; // Business goal IDs
  linkedConversations: string[]; // Strategic conversation IDs
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneProgress {
  milestoneId: string;
  timestamp: string;
  completionPercentage: number;
  blockers: string[];
  achievements: string[];
  nextSteps: string[];
  estimatedCompletionDate: string;
  confidenceLevel: number; // 0-100
  businessImpactUpdate?: string;
}

export interface BusinessImpactProjection {
  milestoneId: string;
  projectedRevenue: {
    immediate: number; // 0-3 months
    shortTerm: number; // 3-12 months
    longTerm: number; // 12+ months
  };
  customerBenefits: string[];
  competitiveAdvantages: string[];
  operationalImpacts: string[];
  riskMitigations: string[];
  marketOpportunities: string[];
}

export class TechnicalMilestoneTracker {
  private milestones: Map<string, TechnicalMilestone> = new Map();
  private progressHistory: Map<string, MilestoneProgress[]> = new Map();
  private storage?: any;

  constructor(storage?: any) {
    this.storage = storage;
  }

  async loadMilestones() {
    if (this.storage) {
      try {
        const data = await this.storage.load();
        if (data.milestones) {
          this.milestones = new Map(Object.entries(data.milestones));
        }
        if (data.milestoneProgress) {
          this.progressHistory = new Map(Object.entries(data.milestoneProgress));
        }
      } catch (error) {
        // Storage might not exist yet, that's ok
      }
    }
  }

  async saveMilestones() {
    if (this.storage) {
      const data = await this.storage.load();
      data.milestones = Object.fromEntries(this.milestones);
      data.milestoneProgress = Object.fromEntries(this.progressHistory);
      await this.storage.save(data);
    }
  }

  // Scribe Tree specific milestone detection patterns
  private static SCRIBE_TREE_PATTERNS = {
    architecture: [
      { pattern: /microservices?.*(?:migration|architecture|implementation)/i, importance: 90 },
      { pattern: /repository.*pattern.*implementation/i, importance: 75 },
      { pattern: /service.*(?:decoupling|factory|container)/i, importance: 80 },
      { pattern: /event.*(?:driven|bus|system)/i, importance: 85 }
    ],
    privacy: [
      { pattern: /privacy.*(?:by.*design|first|enhancement)/i, importance: 95 },
      { pattern: /gdpr|ferpa|coppa.*compliance/i, importance: 90 },
      { pattern: /encryption.*(?:aes|implementation)/i, importance: 70 },
      { pattern: /audit.*(?:trail|logging)/i, importance: 65 }
    ],
    ai: [
      { pattern: /bounded.*enhancement/i, importance: 100 },
      { pattern: /ai.*(?:boundary|detection|assistance)/i, importance: 85 },
      { pattern: /reflection.*(?:analysis|quality)/i, importance: 80 },
      { pattern: /cognitive.*load.*detection/i, importance: 75 }
    ],
    educational: [
      { pattern: /educational.*(?:ai|analytics|insights)/i, importance: 90 },
      { pattern: /trust.*through.*transparency/i, importance: 95 },
      { pattern: /writing.*process.*(?:visibility|analysis)/i, importance: 85 },
      { pattern: /academic.*integrity/i, importance: 80 }
    ]
  };

  async createMilestone(data: {
    name: string;
    description: string;
    category: TechnicalMilestone['category'];
    plannedDate: string;
    effort: number;
    complexity: TechnicalMilestone['complexity'];
    technicalDetails: TechnicalMilestone['technicalDetails'];
    businessContext?: Partial<TechnicalMilestone['businessContext']>;
  }): Promise<TechnicalMilestone> {
    const milestoneId = uuidv4();
    const now = new Date().toISOString();

    // Auto-detect business context based on Scribe Tree patterns
    const autoDetectedContext = this.detectBusinessContext(data.name, data.description);

    const milestone: TechnicalMilestone = {
      id: milestoneId,
      name: data.name,
      description: data.description,
      category: data.category,
      status: 'planned',
      plannedDate: data.plannedDate,
      effort: data.effort,
      complexity: data.complexity,
      dependencies: [],
      technicalDetails: data.technicalDetails,
      businessContext: {
        ...autoDetectedContext,
        ...data.businessContext
      },
      linkedGoals: [],
      linkedConversations: [],
      createdAt: now,
      updatedAt: now
    };

    this.milestones.set(milestoneId, milestone);
    this.progressHistory.set(milestoneId, []);

    await this.saveMilestones();

    return milestone;
  }

  private detectBusinessContext(name: string, description: string): TechnicalMilestone['businessContext'] {
    const text = `${name} ${description}`.toLowerCase();
    let strategicImportance = 50;
    let customerImpact = 'Technical improvement';
    let revenueImplication = 0;
    let competitiveAdvantage = 'Enhanced technical capability';
    let marketTiming: TechnicalMilestone['businessContext']['marketTiming'] = 'competitive';

    // Check against Scribe Tree specific patterns
    Object.entries(TechnicalMilestoneTracker.SCRIBE_TREE_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(({ pattern, importance }) => {
        if (pattern.test(text)) {
          strategicImportance = Math.max(strategicImportance, importance);
          
          // Set category-specific business context
          switch (category) {
            case 'architecture':
              customerImpact = 'Improved platform scalability and reliability';
              revenueImplication = 25000;
              competitiveAdvantage = 'Enterprise-scale architecture enables institutional customers';
              marketTiming = 'competitive';
              break;
            case 'privacy':
              customerImpact = 'Enhanced data protection and institutional trust';
              revenueImplication = 50000;
              competitiveAdvantage = 'Only platform with native privacy protection vs retrofitted compliance';
              marketTiming = 'early';
              break;
            case 'ai':
              customerImpact = 'Revolutionary AI that builds independence vs dependency';
              revenueImplication = 75000;
              competitiveAdvantage = 'Unique bounded enhancement philosophy solves AI dependency crisis';
              marketTiming = 'early';
              break;
            case 'educational':
              customerImpact = 'Transforms educator-student relationship through transparency';
              revenueImplication = 40000;
              competitiveAdvantage = 'Trust-based vs surveillance-based educational technology';
              marketTiming = 'competitive';
              break;
          }
        }
      });
    });

    return {
      strategicImportance,
      customerImpact,
      revenueImplication,
      competitiveAdvantage,
      marketTiming
    };
  }

  async updateMilestoneProgress(milestoneId: string, progress: Omit<MilestoneProgress, 'milestoneId' | 'timestamp'>): Promise<MilestoneProgress> {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const progressUpdate: MilestoneProgress = {
      milestoneId,
      timestamp: new Date().toISOString(),
      ...progress
    };

    // Update milestone status based on completion
    if (progress.completionPercentage >= 100) {
      milestone.status = 'completed';
      milestone.completionDate = progressUpdate.timestamp;
    } else if (progress.completionPercentage > 0 && milestone.status === 'planned') {
      milestone.status = 'in-progress';
    }

    milestone.updatedAt = progressUpdate.timestamp;

    // Add to progress history
    const history = this.progressHistory.get(milestoneId) || [];
    history.push(progressUpdate);
    this.progressHistory.set(milestoneId, history);

    await this.saveMilestones();

    return progressUpdate;
  }

  generateBusinessImpactProjection(milestoneId: string): BusinessImpactProjection {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const baseRevenue = milestone.businessContext.revenueImplication;
    const importance = milestone.businessContext.strategicImportance / 100;

    return {
      milestoneId,
      projectedRevenue: {
        immediate: Math.round(baseRevenue * 0.1 * importance),
        shortTerm: Math.round(baseRevenue * 0.6 * importance),
        longTerm: Math.round(baseRevenue * importance)
      },
      customerBenefits: this.generateCustomerBenefits(milestone),
      competitiveAdvantages: this.generateCompetitiveAdvantages(milestone),
      operationalImpacts: this.generateOperationalImpacts(milestone),
      riskMitigations: milestone.technicalDetails.risksMitigated || [],
      marketOpportunities: this.generateMarketOpportunities(milestone)
    };
  }

  private generateCustomerBenefits(milestone: TechnicalMilestone): string[] {
    const benefits: string[] = [milestone.businessContext.customerImpact];
    
    if (milestone.technicalDetails.performanceImpact) {
      benefits.push(`${milestone.technicalDetails.performanceImpact.improvement} in ${milestone.technicalDetails.performanceImpact.metric}`);
    }

    switch (milestone.category) {
      case 'architecture':
        benefits.push('More reliable and scalable platform');
        benefits.push('Faster feature development and deployment');
        break;
      case 'security':
        benefits.push('Enhanced data protection and privacy');
        benefits.push('Increased institutional trust and compliance');
        break;
      case 'performance':
        benefits.push('Faster response times and better user experience');
        benefits.push('Ability to serve more concurrent users');
        break;
      case 'feature':
        benefits.push('Enhanced functionality and user capabilities');
        benefits.push('Improved educational outcomes and engagement');
        break;
    }

    return benefits;
  }

  private generateCompetitiveAdvantages(milestone: TechnicalMilestone): string[] {
    const advantages: string[] = [milestone.businessContext.competitiveAdvantage];

    if (milestone.businessContext.marketTiming === 'early') {
      advantages.push('First-mover advantage in educational AI market');
    }

    switch (milestone.category) {
      case 'architecture':
        advantages.push('Scalable foundation that competitors cannot quickly replicate');
        break;
      case 'security':
        advantages.push('Privacy-by-design vs competitors retrofitting compliance');
        break;
      case 'feature':
        advantages.push('Unique functionality that differentiates from generic solutions');
        break;
    }

    return advantages;
  }

  private generateOperationalImpacts(milestone: TechnicalMilestone): string[] {
    const impacts: string[] = [];

    switch (milestone.category) {
      case 'architecture':
        impacts.push('Improved development team productivity');
        impacts.push('Reduced technical debt and maintenance overhead');
        impacts.push('Easier scaling and feature additions');
        break;
      case 'infrastructure':
        impacts.push('Lower operational costs and improved reliability');
        impacts.push('Automated deployment and monitoring capabilities');
        break;
      case 'performance':
        impacts.push('Reduced server costs through efficiency gains');
        impacts.push('Improved user satisfaction and retention');
        break;
    }

    return impacts;
  }

  private generateMarketOpportunities(milestone: TechnicalMilestone): string[] {
    const opportunities: string[] = [];

    if (milestone.businessContext.strategicImportance >= 80) {
      opportunities.push('Opens enterprise market segment');
    }

    switch (milestone.category) {
      case 'security':
        opportunities.push('Privacy-conscious educational institutions');
        opportunities.push('International markets with strict data protection laws');
        break;
      case 'architecture':
        opportunities.push('Large-scale institutional deployments');
        opportunities.push('Platform partnerships and integrations');
        break;
      case 'feature':
        opportunities.push('New customer segments interested in specific capabilities');
        opportunities.push('Premium pricing for advanced functionality');
        break;
    }

    return opportunities;
  }

  getMilestone(milestoneId: string): TechnicalMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  getAllMilestones(): TechnicalMilestone[] {
    return Array.from(this.milestones.values());
  }

  getMilestonesByStatus(status: TechnicalMilestone['status']): TechnicalMilestone[] {
    return Array.from(this.milestones.values()).filter(m => m.status === status);
  }

  getMilestoneProgress(milestoneId: string): MilestoneProgress[] {
    return this.progressHistory.get(milestoneId) || [];
  }

  getBusinessImpactSummary(): {
    totalProjectedRevenue: number;
    milestoneCount: number;
    completionRate: number;
    averageStrategicImportance: number;
    topOpportunities: string[];
  } {
    const milestones = this.getAllMilestones();
    const completed = milestones.filter(m => m.status === 'completed');
    
    const totalProjectedRevenue = milestones.reduce((sum, m) => sum + m.businessContext.revenueImplication, 0);
    const averageStrategicImportance = milestones.length > 0 
      ? milestones.reduce((sum, m) => sum + m.businessContext.strategicImportance, 0) / milestones.length 
      : 0;

    // Get top opportunities from high-importance milestones
    const topOpportunities = milestones
      .filter(m => m.businessContext.strategicImportance >= 80)
      .map(m => m.businessContext.competitiveAdvantage)
      .slice(0, 5);

    return {
      totalProjectedRevenue,
      milestoneCount: milestones.length,
      completionRate: milestones.length > 0 ? (completed.length / milestones.length) * 100 : 0,
      averageStrategicImportance,
      topOpportunities
    };
  }

  generateAlignmentMapping(milestoneId: string): AlignmentMapping {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const progress = this.getMilestoneProgress(milestoneId);
    const latestProgress = progress[progress.length - 1];

    return {
      id: `alignment-${milestoneId}`,
      technicalFeature: milestone.name,
      codebaseEvidence: milestone.technicalDetails.codebaseChanges,
      businessValue: {
        primaryGoals: milestone.linkedGoals,
        impact: this.mapImportanceToImpact(milestone.businessContext.strategicImportance),
        revenueImplication: milestone.businessContext.revenueImplication,
        userImpact: milestone.businessContext.customerImpact,
        competitiveAdvantage: milestone.businessContext.competitiveAdvantage
      },
      progressMetrics: {
        technicalCompletion: latestProgress?.completionPercentage || 0,
        businessReadiness: this.calculateBusinessReadiness(milestone),
        marketValidation: this.calculateMarketValidation(milestone)
      },
      insights: [`Technical milestone: ${milestone.description}`],
      lastUpdated: milestone.updatedAt
    };
  }

  private mapImportanceToImpact(importance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (importance >= 90) return 'critical';
    if (importance >= 75) return 'high';
    if (importance >= 50) return 'medium';
    return 'low';
  }

  private calculateBusinessReadiness(milestone: TechnicalMilestone): number {
    let readiness = 30; // Base readiness

    if (milestone.linkedGoals.length > 0) readiness += 20;
    if (milestone.businessContext.revenueImplication > 0) readiness += 20;
    if (milestone.businessContext.marketTiming === 'early') readiness += 15;
    if (milestone.businessContext.strategicImportance >= 80) readiness += 15;

    return Math.min(100, readiness);
  }

  private calculateMarketValidation(milestone: TechnicalMilestone): number {
    let validation = 20; // Base validation

    if (milestone.businessContext.marketTiming === 'early') validation += 30;
    if (milestone.businessContext.strategicImportance >= 90) validation += 25;
    if (milestone.status === 'completed') validation += 25;

    return Math.min(100, validation);
  }
}