// Strategic reporting and export capabilities
import { v4 as uuidv4 } from 'uuid';
import { StrategyConversation, BusinessGoal } from '../types/index.js';
import { TechnicalMilestone } from '../intelligence/technicalMilestoneTracker.js';
import { ScenarioForecast, StrategyGap } from '../forecasting/advancedForecastingEngine.js';
import { CompetitiveIntelligence } from '../forecasting/competitiveIntelligenceTracker.js';
import { StrategyReview } from '../intelligence/strategyReviewAutomation.js';
import { CollaborationSession } from '../collaboration/strategicCollaboration.js';

export interface StrategicReport {
  id: string;
  title: string;
  type: 'executive-summary' | 'detailed-analysis' | 'board-presentation' | 'investor-update' | 'team-dashboard';
  generated: string;
  period: {
    start: string;
    end: string;
  };
  
  sections: ReportSection[];
  metadata: {
    generatedBy: string;
    version: string;
    confidentiality: 'public' | 'internal' | 'confidential' | 'board-only';
    recipients?: string[];
  };
  
  format: 'markdown' | 'html' | 'pdf' | 'json';
  exportPath?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'metrics' | 'analysis' | 'forecast' | 'recommendations' | 'appendix';
  order: number;
  content: any;
  visualizations?: Visualization[];
  tables?: DataTable[];
}

export interface Visualization {
  id: string;
  type: 'chart' | 'graph' | 'timeline' | 'heatmap' | 'scorecard';
  title: string;
  data: any;
  config: any;
}

export interface DataTable {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  styling?: {
    highlightRows?: number[];
    columnWidths?: number[];
    alignment?: string[];
  };
}

export class StrategicReporting {
  private reports: Map<string, StrategicReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Executive Summary Template
    this.templates.set('executive-summary', {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      type: 'executive-summary',
      sections: [
        { type: 'summary', title: 'Executive Overview', order: 1 },
        { type: 'metrics', title: 'Key Performance Indicators', order: 2 },
        { type: 'analysis', title: 'Strategic Highlights', order: 3 },
        { type: 'forecast', title: 'Outlook & Projections', order: 4 },
        { type: 'recommendations', title: 'Strategic Recommendations', order: 5 }
      ],
      requiredData: ['milestones', 'goals', 'forecasts', 'competitiveIntel'],
      confidentiality: 'board-only'
    });

    // Board Presentation Template
    this.templates.set('board-presentation', {
      id: 'board-presentation',
      name: 'Board Presentation Report',
      type: 'board-presentation',
      sections: [
        { type: 'summary', title: 'Strategic Overview', order: 1 },
        { type: 'metrics', title: 'Business Performance', order: 2 },
        { type: 'analysis', title: 'Competitive Position', order: 3 },
        { type: 'forecast', title: 'Financial Projections', order: 4 },
        { type: 'recommendations', title: 'Board Actions Required', order: 5 },
        { type: 'appendix', title: 'Supporting Data', order: 6 }
      ],
      requiredData: ['milestones', 'goals', 'forecasts', 'competitiveIntel', 'strategyGaps'],
      confidentiality: 'board-only'
    });

    // Investor Update Template
    this.templates.set('investor-update', {
      id: 'investor-update',
      name: 'Investor Update Report',
      type: 'investor-update',
      sections: [
        { type: 'summary', title: 'Company Highlights', order: 1 },
        { type: 'metrics', title: 'Growth Metrics', order: 2 },
        { type: 'analysis', title: 'Market Progress', order: 3 },
        { type: 'forecast', title: 'Revenue Outlook', order: 4 }
      ],
      requiredData: ['milestones', 'goals', 'forecasts'],
      confidentiality: 'confidential'
    });
  }

  async generateReport(params: {
    type: StrategicReport['type'];
    templateId?: string;
    period: { start: string; end: string };
    data: {
      milestones?: TechnicalMilestone[];
      goals?: BusinessGoal[];
      conversations?: StrategyConversation[];
      forecasts?: ScenarioForecast[];
      competitiveIntel?: CompetitiveIntelligence;
      strategyGaps?: StrategyGap[];
      reviews?: StrategyReview[];
      collaborations?: CollaborationSession[];
    };
    options?: {
      format?: StrategicReport['format'];
      includeConfidential?: boolean;
      recipients?: string[];
    };
  }): Promise<StrategicReport> {
    
    const template = params.templateId ? this.templates.get(params.templateId) : null;
    
    const report: StrategicReport = {
      id: uuidv4(),
      title: this.generateReportTitle(params.type, params.period),
      type: params.type,
      generated: new Date().toISOString(),
      period: params.period,
      sections: [],
      metadata: {
        generatedBy: 'Strategic CTO MCP Server',
        version: '1.0.0',
        confidentiality: template?.confidentiality || 'internal',
        recipients: params.options?.recipients
      },
      format: params.options?.format || 'markdown'
    };

    // Generate sections based on template or type
    if (template) {
      report.sections = await this.generateSectionsFromTemplate(template, params.data, params.period);
    } else {
      report.sections = await this.generateDefaultSections(params.type, params.data, params.period);
    }

    // Store report
    this.reports.set(report.id, report);

    // Export if requested
    if (params.options?.format && params.options.format !== 'json') {
      report.exportPath = await this.exportReport(report);
    }

    return report;
  }

  private generateReportTitle(type: string, period: { start: string; end: string }): string {
    const startDate = new Date(period.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endDate = new Date(period.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const titles: Record<string, string> = {
      'executive-summary': `Executive Strategy Summary`,
      'detailed-analysis': `Detailed Strategic Analysis`,
      'board-presentation': `Board Strategic Review`,
      'investor-update': `Investor Update`,
      'team-dashboard': `Team Strategy Dashboard`
    };

    return `${titles[type] || 'Strategic Report'} | ${startDate} - ${endDate}`;
  }

  private async generateSectionsFromTemplate(
    template: ReportTemplate,
    data: any,
    period: any
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    for (const sectionTemplate of template.sections) {
      const section = await this.generateSection(
        sectionTemplate.type,
        sectionTemplate.title,
        sectionTemplate.order,
        data,
        period
      );
      sections.push(section);
    }

    return sections;
  }

  private async generateDefaultSections(
    type: string,
    data: any,
    period: any
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    // Always include executive summary
    sections.push(await this.generateSection('summary', 'Executive Summary', 1, data, period));

    // Add type-specific sections
    switch (type) {
      case 'executive-summary':
        sections.push(await this.generateSection('metrics', 'Key Metrics', 2, data, period));
        sections.push(await this.generateSection('forecast', 'Strategic Outlook', 3, data, period));
        sections.push(await this.generateSection('recommendations', 'Recommendations', 4, data, period));
        break;
      
      case 'detailed-analysis':
        sections.push(await this.generateSection('metrics', 'Performance Metrics', 2, data, period));
        sections.push(await this.generateSection('analysis', 'Strategic Analysis', 3, data, period));
        sections.push(await this.generateSection('forecast', 'Projections', 4, data, period));
        sections.push(await this.generateSection('recommendations', 'Strategic Actions', 5, data, period));
        sections.push(await this.generateSection('appendix', 'Supporting Data', 6, data, period));
        break;
      
      case 'board-presentation':
        sections.push(await this.generateSection('metrics', 'Business Performance', 2, data, period));
        sections.push(await this.generateSection('analysis', 'Market Position', 3, data, period));
        sections.push(await this.generateSection('forecast', 'Financial Outlook', 4, data, period));
        sections.push(await this.generateSection('recommendations', 'Board Actions', 5, data, period));
        break;
    }

    return sections;
  }

  private async generateSection(
    type: ReportSection['type'],
    title: string,
    order: number,
    data: any,
    period: any
  ): Promise<ReportSection> {
    const section: ReportSection = {
      id: uuidv4(),
      title,
      type,
      order,
      content: {},
      visualizations: [],
      tables: []
    };

    switch (type) {
      case 'summary':
        section.content = this.generateExecutiveSummary(data, period);
        break;
      
      case 'metrics':
        section.content = this.generateMetricsSection(data, period);
        section.visualizations = this.generateMetricsVisualizations(data);
        section.tables = this.generateMetricsTables(data);
        break;
      
      case 'analysis':
        section.content = this.generateAnalysisSection(data, period);
        section.visualizations = this.generateAnalysisVisualizations(data);
        break;
      
      case 'forecast':
        section.content = this.generateForecastSection(data, period);
        section.visualizations = this.generateForecastVisualizations(data);
        section.tables = this.generateForecastTables(data);
        break;
      
      case 'recommendations':
        section.content = this.generateRecommendationsSection(data, period);
        section.tables = this.generateRecommendationsTables(data);
        break;
      
      case 'appendix':
        section.content = this.generateAppendixSection(data, period);
        section.tables = this.generateAppendixTables(data);
        break;
    }

    return section;
  }

  private generateExecutiveSummary(data: any, period: any): any {
    const summary: any = {
      overview: '',
      keyHighlights: [],
      criticalIssues: [],
      strategicWins: []
    };

    // Milestone progress
    if (data.milestones) {
      const completed = data.milestones.filter((m: any) => m.status === 'completed').length;
      const total = data.milestones.length;
      summary.overview += `Technical Progress: ${completed}/${total} milestones completed (${Math.round(completed/total * 100)}%). `;
    }

    // Goal health
    if (data.goals) {
      const healthyGoals = data.goals.filter((g: any) => g.confidence >= 70).length;
      const totalGoals = data.goals.length;
      summary.overview += `Business Goals: ${healthyGoals}/${totalGoals} on track. `;
    }

    // Revenue projections
    if (data.forecasts && data.forecasts.length > 0) {
      const avgRevenue = data.forecasts.reduce((sum: number, f: any) => 
        sum + f.businessMetrics.projectedRevenue.realistic, 0
      ) / data.forecasts.length;
      summary.overview += `Projected Revenue: $${Math.round(avgRevenue).toLocaleString()}. `;
    }

    // Key highlights
    if (data.milestones) {
      const criticalCompleted = data.milestones.filter((m: any) => 
        m.status === 'completed' && m.businessContext.strategicImportance >= 80
      );
      criticalCompleted.forEach((m: any) => {
        summary.keyHighlights.push(`Completed: ${m.name} - ${m.businessContext.competitiveAdvantage}`);
      });
    }

    // Critical issues
    if (data.strategyGaps) {
      const criticalGaps = data.strategyGaps.filter((g: any) => g.severity === 'critical');
      criticalGaps.forEach((g: any) => {
        summary.criticalIssues.push(`${g.description} (Impact: $${g.estimatedImpact.revenueAtRisk.toLocaleString()})`);
      });
    }

    // Strategic wins
    if (data.competitiveIntel) {
      data.competitiveIntel.opportunityMapping.forEach((o: any) => {
        if (o.potentialReturn > 100000) {
          summary.strategicWins.push(`Opportunity: ${o.description} ($${o.potentialReturn.toLocaleString()} potential)`);
        }
      });
    }

    return summary;
  }

  private generateMetricsSection(data: any, period: any): any {
    const metrics: any = {
      technical: {},
      business: {},
      competitive: {}
    };

    // Technical metrics
    if (data.milestones) {
      metrics.technical = {
        totalMilestones: data.milestones.length,
        completed: data.milestones.filter((m: any) => m.status === 'completed').length,
        inProgress: data.milestones.filter((m: any) => m.status === 'in-progress').length,
        delayed: data.milestones.filter((m: any) => m.status === 'delayed').length,
        velocity: this.calculateVelocity(data.milestones),
        complexityDistribution: this.getComplexityDistribution(data.milestones)
      };
    }

    // Business metrics
    if (data.goals) {
      metrics.business = {
        totalGoals: data.goals.length,
        activeGoals: data.goals.filter((g: any) => g.status === 'active').length,
        averageConfidence: data.goals.reduce((sum: number, g: any) => sum + (g.confidence || 50), 0) / data.goals.length,
        categoryBreakdown: this.getCategoryBreakdown(data.goals)
      };
    }

    // Competitive metrics
    if (data.competitiveIntel) {
      metrics.competitive = {
        threatLevel: data.competitiveIntel.threatAssessment.overallThreatLevel,
        opportunities: data.competitiveIntel.opportunityMapping.length,
        competitorCount: data.competitiveIntel.competitorProfiles.length,
        marketPosition: data.competitiveIntel.marketAnalysis.competitiveIntensity
      };
    }

    return metrics;
  }

  private generateAnalysisSection(data: any, period: any): any {
    const analysis: any = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      strategicPosition: ''
    };

    // Analyze strengths
    if (data.milestones) {
      const highImpactCompleted = data.milestones.filter((m: any) => 
        m.status === 'completed' && m.businessContext.revenueImplication > 50000
      );
      highImpactCompleted.forEach((m: any) => {
        analysis.strengths.push({
          area: m.category,
          description: m.businessContext.competitiveAdvantage,
          impact: m.businessContext.revenueImplication
        });
      });
    }

    // Analyze weaknesses from gaps
    if (data.strategyGaps) {
      data.strategyGaps.forEach((gap: any) => {
        analysis.weaknesses.push({
          area: gap.category,
          description: gap.description,
          severity: gap.severity,
          impact: gap.estimatedImpact.revenueAtRisk
        });
      });
    }

    // Opportunities from competitive intel
    if (data.competitiveIntel) {
      data.competitiveIntel.opportunityMapping.forEach((opp: any) => {
        analysis.opportunities.push({
          description: opp.description,
          source: opp.sourceOfAdvantage,
          potential: opp.potentialReturn,
          investment: opp.investmentRequired
        });
      });
    }

    // Threats from competitive intel
    if (data.competitiveIntel) {
      data.competitiveIntel.threatAssessment.immediateThreats.forEach((threat: any) => {
        analysis.threats.push({
          source: threat.source,
          description: threat.description,
          probability: threat.probability,
          impact: threat.potentialImpact.revenueAtRisk
        });
      });
    }

    // Strategic position summary
    const strengthCount = analysis.strengths.length;
    const threatCount = analysis.threats.length;
    const opportunityCount = analysis.opportunities.length;
    
    if (strengthCount > threatCount && opportunityCount > 2) {
      analysis.strategicPosition = 'Strong position with growth opportunities';
    } else if (threatCount > strengthCount) {
      analysis.strategicPosition = 'Defensive position requiring strategic action';
    } else {
      analysis.strategicPosition = 'Balanced position with selective opportunities';
    }

    return analysis;
  }

  private generateForecastSection(data: any, period: any): any {
    const forecast: any = {
      scenarios: [],
      weightedProjections: {},
      confidenceIntervals: {},
      assumptions: []
    };

    if (data.forecasts && data.forecasts.length > 0) {
      // Scenario summaries
      data.forecasts.forEach((scenario: any) => {
        forecast.scenarios.push({
          name: scenario.name,
          confidence: scenario.confidence,
          revenue: scenario.businessMetrics.projectedRevenue.realistic,
          customers: scenario.businessMetrics.customerAcquisition.realistic,
          marketShare: scenario.businessMetrics.marketShare.realistic,
          keyAssumptions: scenario.assumptions.slice(0, 2).map((a: any) => a.description)
        });
      });

      // Weighted projections (25%/50%/25%)
      const weights = { conservative: 0.25, realistic: 0.5, optimistic: 0.25 };
      const baseScenario = data.forecasts.find((f: any) => f.name.includes('Base')) || data.forecasts[0];
      
      forecast.weightedProjections = {
        revenue: Math.round(
          baseScenario.businessMetrics.projectedRevenue.conservative * weights.conservative +
          baseScenario.businessMetrics.projectedRevenue.realistic * weights.realistic +
          baseScenario.businessMetrics.projectedRevenue.optimistic * weights.optimistic
        ),
        customers: Math.round(
          baseScenario.businessMetrics.customerAcquisition.conservative * weights.conservative +
          baseScenario.businessMetrics.customerAcquisition.realistic * weights.realistic +
          baseScenario.businessMetrics.customerAcquisition.optimistic * weights.optimistic
        )
      };

      // Key assumptions
      baseScenario.assumptions.forEach((assumption: any) => {
        if (assumption.impactIfWrong === 'critical' || assumption.impactIfWrong === 'significant') {
          forecast.assumptions.push({
            description: assumption.description,
            confidence: assumption.confidence,
            impact: assumption.impactIfWrong
          });
        }
      });
    }

    return forecast;
  }

  private generateRecommendationsSection(data: any, period: any): any {
    const recommendations: any = {
      immediate: [],
      shortTerm: [],
      strategic: []
    };

    // Immediate actions from strategy gaps
    if (data.strategyGaps) {
      data.strategyGaps
        .filter((gap: any) => gap.urgency === 'critical' || gap.urgency === 'high')
        .forEach((gap: any) => {
          gap.recommendedActions.forEach((action: any) => {
            recommendations.immediate.push({
              action: action.action,
              rationale: gap.description,
              timeframe: action.timeframe,
              cost: action.cost,
              successProbability: action.successProbability
            });
          });
        });
    }

    // Short-term from competitive intel
    if (data.competitiveIntel) {
      data.competitiveIntel.strategicRecommendations
        .filter((rec: any) => rec.priority === 'high')
        .forEach((rec: any) => {
          recommendations.shortTerm.push({
            recommendation: rec.recommendation,
            category: rec.category,
            rationale: rec.rationale,
            timeframe: rec.timeframe,
            effort: rec.resourceRequirement
          });
        });
    }

    // Strategic from reviews
    if (data.reviews) {
      data.reviews
        .filter((review: any) => review.status === 'completed')
        .forEach((review: any) => {
          review.decisions.forEach((decision: any) => {
            if (decision.impact === 'high') {
              recommendations.strategic.push({
                decision: decision.decision,
                implementation: decision.implementation,
                owner: decision.owner,
                deadline: decision.deadline
              });
            }
          });
        });
    }

    return recommendations;
  }

  private generateAppendixSection(data: any, period: any): any {
    return {
      dataSourcesSummary: {
        milestones: data.milestones?.length || 0,
        goals: data.goals?.length || 0,
        conversations: data.conversations?.length || 0,
        forecasts: data.forecasts?.length || 0,
        reviews: data.reviews?.length || 0
      },
      methodology: 'Data compiled from Strategic CTO MCP Server using balanced forecasting (25%/50%/25%) and 85% maximum confidence thresholds.',
      glossary: [
        { term: 'Weighted Forecast', definition: 'Projection using 25% pessimistic, 50% realistic, 25% optimistic weightings' },
        { term: 'Strategy Gap', definition: 'Identified misalignment between current capabilities and strategic requirements' },
        { term: 'Confidence Cap', definition: 'Maximum 85% confidence to maintain realistic expectations' }
      ]
    };
  }

  // Visualization generators
  private generateMetricsVisualizations(data: any): Visualization[] {
    const visualizations: Visualization[] = [];

    if (data.milestones) {
      visualizations.push({
        id: uuidv4(),
        type: 'chart',
        title: 'Milestone Progress',
        data: {
          labels: ['Completed', 'In Progress', 'Planned', 'Delayed'],
          datasets: [{
            data: [
              data.milestones.filter((m: any) => m.status === 'completed').length,
              data.milestones.filter((m: any) => m.status === 'in-progress').length,
              data.milestones.filter((m: any) => m.status === 'planned').length,
              data.milestones.filter((m: any) => m.status === 'delayed').length
            ]
          }]
        },
        config: { type: 'doughnut' }
      });
    }

    if (data.goals) {
      visualizations.push({
        id: uuidv4(),
        type: 'chart',
        title: 'Goal Health Distribution',
        data: {
          labels: ['Excellent (80-100%)', 'Good (60-79%)', 'At Risk (40-59%)', 'Critical (<40%)'],
          datasets: [{
            data: [
              data.goals.filter((g: any) => g.confidence >= 80).length,
              data.goals.filter((g: any) => g.confidence >= 60 && g.confidence < 80).length,
              data.goals.filter((g: any) => g.confidence >= 40 && g.confidence < 60).length,
              data.goals.filter((g: any) => g.confidence < 40).length
            ]
          }]
        },
        config: { type: 'bar' }
      });
    }

    return visualizations;
  }

  private generateAnalysisVisualizations(data: any): Visualization[] {
    const visualizations: Visualization[] = [];

    if (data.competitiveIntel) {
      visualizations.push({
        id: uuidv4(),
        type: 'scorecard',
        title: 'Competitive Position',
        data: {
          metrics: [
            { label: 'Market Position', value: data.competitiveIntel.marketAnalysis.competitiveIntensity },
            { label: 'Threat Level', value: data.competitiveIntel.threatAssessment.overallThreatLevel },
            { label: 'Opportunities', value: data.competitiveIntel.opportunityMapping.length },
            { label: 'Advantages', value: data.competitiveIntel.competitorProfiles[0]?.weaknessAreas.length || 0 }
          ]
        },
        config: { style: 'grid' }
      });
    }

    return visualizations;
  }

  private generateForecastVisualizations(data: any): Visualization[] {
    const visualizations: Visualization[] = [];

    if (data.forecasts && data.forecasts.length > 0) {
      const scenarios = data.forecasts;
      
      visualizations.push({
        id: uuidv4(),
        type: 'chart',
        title: 'Revenue Scenarios',
        data: {
          labels: scenarios.map((s: any) => s.name),
          datasets: [
            {
              label: 'Conservative',
              data: scenarios.map((s: any) => s.businessMetrics.projectedRevenue.conservative)
            },
            {
              label: 'Realistic',
              data: scenarios.map((s: any) => s.businessMetrics.projectedRevenue.realistic)
            },
            {
              label: 'Optimistic',
              data: scenarios.map((s: any) => s.businessMetrics.projectedRevenue.optimistic)
            }
          ]
        },
        config: { type: 'line' }
      });
    }

    return visualizations;
  }

  // Table generators
  private generateMetricsTables(data: any): DataTable[] {
    const tables: DataTable[] = [];

    if (data.milestones) {
      const milestoneTable: DataTable = {
        id: uuidv4(),
        title: 'Technical Milestone Summary',
        headers: ['Milestone', 'Category', 'Status', 'Complexity', 'Revenue Impact'],
        rows: data.milestones
          .slice(0, 10)
          .map((m: any) => [
            m.name,
            m.category,
            m.status,
            m.complexity,
            `$${m.businessContext.revenueImplication.toLocaleString()}`
          ])
      };
      tables.push(milestoneTable);
    }

    return tables;
  }

  private generateForecastTables(data: any): DataTable[] {
    const tables: DataTable[] = [];

    if (data.forecasts && data.forecasts.length > 0) {
      const forecastTable: DataTable = {
        id: uuidv4(),
        title: 'Scenario Comparison',
        headers: ['Scenario', 'Confidence', 'Revenue', 'Customers', 'Market Share'],
        rows: data.forecasts.map((f: any) => [
          f.name,
          `${f.confidence}%`,
          `$${f.businessMetrics.projectedRevenue.realistic.toLocaleString()}`,
          f.businessMetrics.customerAcquisition.realistic,
          `${f.businessMetrics.marketShare.realistic}%`
        ])
      };
      tables.push(forecastTable);
    }

    return tables;
  }

  private generateRecommendationsTables(data: any): DataTable[] {
    const tables: DataTable[] = [];

    const recommendations: any[] = [];
    
    // Collect all recommendations
    if (data.strategyGaps) {
      data.strategyGaps.forEach((gap: any) => {
        gap.recommendedActions.forEach((action: any) => {
          recommendations.push({
            source: 'Strategy Gap',
            action: action.action,
            timeframe: action.timeframe,
            cost: action.cost,
            priority: gap.urgency
          });
        });
      });
    }

    if (recommendations.length > 0) {
      const recTable: DataTable = {
        id: uuidv4(),
        title: 'Strategic Recommendations',
        headers: ['Source', 'Action', 'Timeframe', 'Cost', 'Priority'],
        rows: recommendations
          .slice(0, 10)
          .map(r => [
            r.source,
            r.action,
            r.timeframe,
            `$${r.cost.toLocaleString()}`,
            r.priority
          ])
      };
      tables.push(recTable);
    }

    return tables;
  }

  private generateAppendixTables(data: any): DataTable[] {
    const tables: DataTable[] = [];

    // Data summary table
    const summaryTable: DataTable = {
      id: uuidv4(),
      title: 'Data Sources Summary',
      headers: ['Data Type', 'Count', 'Period Coverage'],
      rows: [
        ['Technical Milestones', data.milestones?.length || 0, 'Full period'],
        ['Business Goals', data.goals?.length || 0, 'Current snapshot'],
        ['Strategic Conversations', data.conversations?.length || 0, 'Full period'],
        ['Forecasts', data.forecasts?.length || 0, 'Forward-looking'],
        ['Strategy Reviews', data.reviews?.length || 0, 'Full period']
      ]
    };
    tables.push(summaryTable);

    return tables;
  }

  // Export functionality
  private async exportReport(report: StrategicReport): Promise<string> {
    const exportPath = `./reports/${report.id}-${report.type}-${new Date().toISOString().split('T')[0]}.${report.format}`;

    switch (report.format) {
      case 'markdown':
        const markdown = this.convertToMarkdown(report);
        // In real implementation, write to file
        return exportPath;
      
      case 'html':
        const html = this.convertToHTML(report);
        // In real implementation, write to file
        return exportPath;
      
      case 'pdf':
        // In real implementation, generate PDF
        return exportPath;
      
      default:
        return exportPath;
    }
  }

  private convertToMarkdown(report: StrategicReport): string {
    let markdown = `# ${report.title}\n\n`;
    markdown += `*Generated: ${new Date(report.generated).toLocaleString()}*\n\n`;
    markdown += `*Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}*\n\n`;

    report.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;

      // Content
      if (section.type === 'summary' && section.content) {
        markdown += `${section.content.overview}\n\n`;
        
        if (section.content.keyHighlights?.length > 0) {
          markdown += `### Key Highlights\n`;
          section.content.keyHighlights.forEach((h: string) => {
            markdown += `- ${h}\n`;
          });
          markdown += '\n';
        }

        if (section.content.criticalIssues?.length > 0) {
          markdown += `### Critical Issues\n`;
          section.content.criticalIssues.forEach((i: string) => {
            markdown += `- ⚠️ ${i}\n`;
          });
          markdown += '\n';
        }
      }

      // Tables
      section.tables?.forEach(table => {
        markdown += `### ${table.title}\n\n`;
        markdown += `| ${table.headers.join(' | ')} |\n`;
        markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
        table.rows.forEach(row => {
          markdown += `| ${row.join(' | ')} |\n`;
        });
        markdown += '\n';
      });
    });

    return markdown;
  }

  private convertToHTML(report: StrategicReport): string {
    // Simple HTML conversion - in real implementation would use templating
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .highlight { background-color: #fffacd; }
    .critical { color: #d32f2f; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p><em>Generated: ${new Date(report.generated).toLocaleString()}</em></p>
  <p><em>Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}</em></p>
`;

    report.sections.forEach(section => {
      html += `<h2>${section.title}</h2>\n`;
      // Add section content...
    });

    html += `</body></html>`;
    return html;
  }

  // Helper methods
  private calculateVelocity(milestones: any[]): number {
    const completed = milestones.filter(m => m.status === 'completed' && m.completionDate);
    if (completed.length < 2) return 0;

    const dates = completed.map(m => new Date(m.completionDate).getTime()).sort();
    const timeSpan = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 30); // months
    return completed.length / Math.max(timeSpan, 1);
  }

  private getComplexityDistribution(milestones: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    milestones.forEach(m => {
      distribution[m.complexity] = (distribution[m.complexity] || 0) + 1;
    });
    return distribution;
  }

  private getCategoryBreakdown(goals: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    goals.forEach(g => {
      breakdown[g.category] = (breakdown[g.category] || 0) + 1;
    });
    return breakdown;
  }

  getReport(reportId: string): StrategicReport | null {
    return this.reports.get(reportId) || null;
  }

  getReports(filter?: {
    type?: StrategicReport['type'];
    startDate?: string;
    endDate?: string;
  }): StrategicReport[] {
    let reports = Array.from(this.reports.values());

    if (filter) {
      if (filter.type) {
        reports = reports.filter(r => r.type === filter.type);
      }
      if (filter.startDate) {
        reports = reports.filter(r => new Date(r.generated) >= new Date(filter.startDate!));
      }
      if (filter.endDate) {
        reports = reports.filter(r => new Date(r.generated) <= new Date(filter.endDate!));
      }
    }

    return reports.sort((a, b) => 
      new Date(b.generated).getTime() - new Date(a.generated).getTime()
    );
  }

  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: StrategicReport['type'];
  sections: { type: ReportSection['type']; title: string; order: number }[];
  requiredData: string[];
  confidentiality: StrategicReport['metadata']['confidentiality'];
}