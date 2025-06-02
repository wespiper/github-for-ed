// MCP tools for strategic reporting and export capabilities
import { JSONStorageAdapter } from '../storage/StorageAdapter.js';
import { StrategicReporting, StrategicReport } from '../reporting/strategicReporting.js';
import { TechnicalMilestone, TechnicalMilestoneTracker } from '../intelligence/technicalMilestoneTracker.js';
import { BusinessGoal } from '../types/index.js';

export class ReportingTools {
  private reporting: StrategicReporting;
  private milestoneTracker: TechnicalMilestoneTracker;

  constructor(private storage: JSONStorageAdapter) {
    this.reporting = new StrategicReporting();
    this.milestoneTracker = new TechnicalMilestoneTracker(storage);
  }

  async generateStrategicReport(params: {
    type: StrategicReport['type'];
    templateId?: string;
    periodStart: string;
    periodEnd: string;
    options?: {
      format?: StrategicReport['format'];
      includeConfidential?: boolean;
      recipients?: string[];
    };
  }) {
    try {
      // Gather data from storage
      const data = await this.storage.load();
      
      // Load milestones from milestone tracker
      await this.milestoneTracker.loadMilestones();
      const milestones = this.milestoneTracker.getAllMilestones();
      
      // Convert Record structures to arrays for report processing
      const reportData = {
        milestones: milestones,
        goals: data.goals ? Object.values(data.goals) : [],
        conversations: data.conversations ? Object.values(data.conversations) : [],
        forecasts: (data as any).forecasts || [],
        competitiveIntel: (data as any).competitiveIntel,
        strategyGaps: (data as any).strategyGaps || [],
        reviews: (data as any).reviews || [],
        collaborations: (data as any).collaborationSessions || []
      };

      const report = await this.reporting.generateReport({
        type: params.type,
        templateId: params.templateId,
        period: {
          start: params.periodStart,
          end: params.periodEnd
        },
        data: reportData,
        options: params.options
      });

      return {
        success: true,
        data: {
          report,
          sections: report.sections.length,
          visualizations: report.sections.reduce((sum, s) => sum + (s.visualizations?.length || 0), 0),
          tables: report.sections.reduce((sum, s) => sum + (s.tables?.length || 0), 0),
          exportPath: report.exportPath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getStrategicReport(params: { reportId: string }) {
    try {
      const report = this.reporting.getReport(params.reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      return {
        success: true,
        data: {
          report,
          metadata: {
            sectionCount: report.sections.length,
            visualizationCount: report.sections.reduce((sum, s) => sum + (s.visualizations?.length || 0), 0),
            tableCount: report.sections.reduce((sum, s) => sum + (s.tables?.length || 0), 0)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async listStrategicReports(params?: {
    type?: StrategicReport['type'];
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const reports = this.reporting.getReports(params);

      const reportSummaries = reports.map(report => ({
        id: report.id,
        title: report.title,
        type: report.type,
        generated: report.generated,
        period: report.period,
        format: report.format,
        confidentiality: report.metadata.confidentiality,
        sections: report.sections.length
      }));

      return {
        success: true,
        data: {
          reports: reportSummaries,
          summary: {
            total: reports.length,
            byType: this.groupReportsByType(reports),
            byConfidentiality: this.groupReportsByConfidentiality(reports)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list reports: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getReportTemplates() {
    try {
      const templates = this.reporting.getTemplates();

      return {
        success: true,
        data: {
          templates,
          summary: {
            total: templates.length,
            byType: this.groupTemplatesByType(templates)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateQuickInsights(params: {
    timeframe: '7-days' | '30-days' | '90-days';
    focusAreas?: string[];
  }) {
    try {
      const data = await this.storage.load();
      
      // Load milestones from milestone tracker
      await this.milestoneTracker.loadMilestones();
      const milestones = this.milestoneTracker.getAllMilestones();
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (params.timeframe) {
        case '7-days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30-days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90-days':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const insights = {
        timeframe: params.timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        milestoneProgress: this.calculateMilestoneProgress(milestones, startDate, endDate),
        goalHealth: this.calculateGoalHealth(data.goals ? Object.values(data.goals) : []),
        strategicHighlights: this.extractStrategicHighlights(data, startDate, endDate),
        criticalIssues: this.identifyCriticalIssues(data),
        upcomingMilestones: this.getUpcomingMilestones(milestones),
        recommendations: this.generateQuickRecommendations(data)
      };

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate quick insights: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exportReportData(params: {
    reportId?: string;
    format: 'json' | 'csv' | 'markdown';
    includeRawData?: boolean;
  }) {
    try {
      if (params.reportId) {
        const report = this.reporting.getReport(params.reportId);
        if (!report) {
          throw new Error('Report not found');
        }

        const exportData = this.prepareExportData(report, params.format, params.includeRawData);
        
        return {
          success: true,
          data: {
            format: params.format,
            content: exportData,
            report: report
          }
        };
      } else {
        // Export all current data
        const data = await this.storage.load();
        
        // Load milestones from milestone tracker
        await this.milestoneTracker.loadMilestones();
        const milestones = this.milestoneTracker.getAllMilestones();
        
        // Create data object with milestones for export
        const dataWithMilestones = {
          ...data,
          milestones: milestones
        };
        
        const exportData = this.prepareAllDataExport(dataWithMilestones, params.format);
        
        return {
          success: true,
          data: {
            format: params.format,
            content: exportData,
            summary: {
              conversations: data.conversations?.length || 0,
              goals: data.goals?.length || 0,
              milestones: milestones?.length || 0,
              insights: data.insights?.length || 0
            }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateDashboardMetrics(params: {
    timeframe: '30-days' | '90-days' | '6-months' | '12-months';
  }) {
    try {
      const data = await this.storage.load();
      
      const goals = data.goals ? Object.values(data.goals) : [];
      const milestones = (data as any).milestones ? Object.values((data as any).milestones) : [];
      const conversations = data.conversations ? Object.values(data.conversations) : [];
      
      const metrics = {
        overview: {
          activeGoals: goals.filter((g: any) => g.status === 'active').length,
          completedMilestones: milestones.filter((m: any) => m.status === 'completed').length,
          strategicDecisions: conversations.reduce((sum: number, c: any) => sum + (c.decisions?.length || 0), 0),
          actionItems: conversations.reduce((sum: number, c: any) => sum + (c.actionItems?.length || 0), 0)
        },
        trends: {
          goalCompletionRate: this.calculateCompletionRate(goals),
          milestoneVelocity: this.calculateMilestoneVelocity(milestones),
          decisionFrequency: this.calculateDecisionFrequency(conversations),
          confidenceTrend: this.calculateConfidenceTrend(goals)
        },
        health: {
          overallHealth: this.calculateOverallHealth(data),
          riskLevel: this.assessRiskLevel(data),
          opportunityScore: this.calculateOpportunityScore(data),
          alignmentScore: this.calculateAlignmentScore(data)
        },
        projections: {
          revenueProjection: this.projectRevenue(data),
          goalCompletionProjection: this.projectGoalCompletion(goals),
          milestoneCompletionProjection: this.projectMilestoneCompletion(milestones)
        }
      };

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate dashboard metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper methods
  private groupReportsByType(reports: StrategicReport[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupReportsByConfidentiality(reports: StrategicReport[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.metadata.confidentiality] = (acc[report.metadata.confidentiality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupTemplatesByType(templates: any[]): Record<string, number> {
    return templates.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateMilestoneProgress(milestones: any[], startDate: Date, endDate: Date): any {
    const relevantMilestones = milestones.filter((m: any) => {
      const date = new Date(m.created || m.plannedDate);
      return date >= startDate && date <= endDate;
    });

    return {
      total: relevantMilestones.length,
      completed: relevantMilestones.filter((m: any) => m.status === 'completed').length,
      inProgress: relevantMilestones.filter((m: any) => m.status === 'in-progress').length,
      delayed: relevantMilestones.filter((m: any) => m.status === 'delayed').length,
      completionRate: relevantMilestones.length > 0 
        ? (relevantMilestones.filter((m: any) => m.status === 'completed').length / relevantMilestones.length) * 100 
        : 0
    };
  }

  private calculateGoalHealth(goals: any[]): any {
    const activeGoals = goals.filter((g: any) => g.status === 'active');
    const avgConfidence = activeGoals.length > 0
      ? activeGoals.reduce((sum: number, g: any) => sum + (g.confidence || 50), 0) / activeGoals.length
      : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      averageConfidence: Math.round(avgConfidence),
      healthyGoals: goals.filter((g: any) => g.confidence >= 70).length,
      atRiskGoals: goals.filter((g: any) => g.confidence < 50).length
    };
  }

  private extractStrategicHighlights(data: any, startDate: Date, endDate: Date): string[] {
    const highlights: string[] = [];

    // Check milestone completions
    const completedMilestones = (data.milestones || []).filter((m: any) => 
      m.status === 'completed' && 
      new Date(m.completionDate) >= startDate && 
      new Date(m.completionDate) <= endDate
    );

    if (completedMilestones.length > 0) {
      highlights.push(`Completed ${completedMilestones.length} technical milestones`);
    }

    // Check high-impact decisions
    const recentDecisions = (data.conversations || []).reduce((decisions: any[], c: any) => {
      const conversationDecisions = (c.decisions || []).filter((d: any) => 
        new Date(d.timestamp) >= startDate && new Date(d.timestamp) <= endDate
      );
      return decisions.concat(conversationDecisions);
    }, []);

    if (recentDecisions.length > 0) {
      highlights.push(`Made ${recentDecisions.length} strategic decisions`);
    }

    return highlights;
  }

  private identifyCriticalIssues(data: any): string[] {
    const issues: string[] = [];

    // Check for delayed milestones
    const delayedMilestones = (data.milestones || []).filter((m: any) => m.status === 'delayed');
    if (delayedMilestones.length > 0) {
      issues.push(`${delayedMilestones.length} milestones are delayed`);
    }

    // Check for low confidence goals
    const lowConfidenceGoals = (data.goals || []).filter((g: any) => g.confidence < 40 && g.status === 'active');
    if (lowConfidenceGoals.length > 0) {
      issues.push(`${lowConfidenceGoals.length} goals have critically low confidence`);
    }

    // Check for critical strategy gaps
    const criticalGaps = (data.strategyGaps || []).filter((g: any) => g.severity === 'critical');
    if (criticalGaps.length > 0) {
      issues.push(`${criticalGaps.length} critical strategy gaps identified`);
    }

    return issues;
  }

  private getUpcomingMilestones(milestones: any[]): any[] {
    const upcoming = milestones
      .filter((m: any) => m.status !== 'completed' && m.plannedDate)
      .sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
      .slice(0, 5);

    return upcoming.map((m: any) => ({
      name: m.name,
      category: m.category,
      plannedDate: m.plannedDate,
      daysUntilDue: Math.ceil((new Date(m.plannedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  private generateQuickRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    // Check milestone velocity
    const inProgressMilestones = (data.milestones || []).filter((m: any) => m.status === 'in-progress');
    if (inProgressMilestones.length > 5) {
      recommendations.push('Consider focusing on completing in-progress milestones before starting new ones');
    }

    // Check goal confidence
    const lowConfidenceGoals = (data.goals || []).filter((g: any) => g.confidence < 50 && g.status === 'active');
    if (lowConfidenceGoals.length > 0) {
      recommendations.push('Address low-confidence goals to improve overall strategic health');
    }

    // Check for overdue action items
    const overdueActions = (data.conversations || []).reduce((overdue: number, c: any) => {
      const overdueItems = (c.actionItems || []).filter((a: any) => 
        a.status !== 'completed' && new Date(a.dueDate) < new Date()
      );
      return overdue + overdueItems.length;
    }, 0);

    if (overdueActions > 0) {
      recommendations.push(`Review and update ${overdueActions} overdue action items`);
    }

    return recommendations;
  }

  private prepareExportData(report: StrategicReport, format: string, includeRawData?: boolean): any {
    switch (format) {
      case 'json':
        return includeRawData ? report : {
          title: report.title,
          type: report.type,
          generated: report.generated,
          period: report.period,
          sections: report.sections.map(s => ({
            title: s.title,
            type: s.type,
            content: s.content
          }))
        };
      
      case 'csv':
        // Convert report data to CSV format
        const csvData: string[] = [];
        csvData.push('Section,Type,Content');
        report.sections.forEach(section => {
          csvData.push(`"${section.title}","${section.type}","${JSON.stringify(section.content).replace(/"/g, '""')}"`);
        });
        return csvData.join('\n');
      
      case 'markdown':
        // Already implemented in the reporting class
        return report;
      
      default:
        return report;
    }
  }

  private prepareAllDataExport(data: any, format: string): any {
    switch (format) {
      case 'json':
        return data;
      
      case 'csv':
        // Create multiple CSV sections
        const csvSections: string[] = [];
        
        // Goals
        if (data.goals?.length > 0) {
          csvSections.push('BUSINESS GOALS');
          csvSections.push('Title,Category,Status,Confidence,Owner');
          data.goals.forEach((g: any) => {
            csvSections.push(`"${g.title}","${g.category}","${g.status}",${g.confidence},"${g.owner}"`);
          });
          csvSections.push('');
        }
        
        // Milestones
        if (data.milestones?.length > 0) {
          csvSections.push('TECHNICAL MILESTONES');
          csvSections.push('Name,Category,Status,Complexity,Planned Date');
          data.milestones.forEach((m: any) => {
            csvSections.push(`"${m.name}","${m.category}","${m.status}","${m.complexity}","${m.plannedDate}"`);
          });
        }
        
        return csvSections.join('\n');
      
      case 'markdown':
        let markdown = '# Strategic Data Export\n\n';
        markdown += `*Generated: ${new Date().toISOString()}*\n\n`;
        
        if (data.goals?.length > 0) {
          markdown += '## Business Goals\n\n';
          data.goals.forEach((g: any) => {
            markdown += `### ${g.title}\n`;
            markdown += `- **Category**: ${g.category}\n`;
            markdown += `- **Status**: ${g.status}\n`;
            markdown += `- **Confidence**: ${g.confidence}%\n\n`;
          });
        }
        
        if (data.milestones?.length > 0) {
          markdown += '## Technical Milestones\n\n';
          data.milestones.forEach((m: any) => {
            markdown += `### ${m.name}\n`;
            markdown += `- **Category**: ${m.category}\n`;
            markdown += `- **Status**: ${m.status}\n`;
            markdown += `- **Complexity**: ${m.complexity}\n\n`;
          });
        }
        
        return markdown;
      
      default:
        return data;
    }
  }

  private calculateCompletionRate(goals: any[]): number {
    if (goals.length === 0) return 0;
    const completed = goals.filter((g: any) => g.status === 'completed').length;
    return Math.round((completed / goals.length) * 100);
  }

  private calculateMilestoneVelocity(milestones: any[]): number {
    const completed = milestones.filter((m: any) => m.status === 'completed' && m.completionDate);
    if (completed.length < 2) return 0;

    const dates = completed.map((m: any) => new Date(m.completionDate).getTime()).sort();
    const timeSpan = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 30); // months
    return Math.round(completed.length / Math.max(timeSpan, 1));
  }

  private calculateDecisionFrequency(conversations: any[]): number {
    const totalDecisions = conversations.reduce((sum: number, c: any) => sum + (c.decisions?.length || 0), 0);
    if (conversations.length === 0) return 0;
    return Math.round(totalDecisions / conversations.length);
  }

  private calculateConfidenceTrend(goals: any[]): string {
    if (goals.length === 0) return 'stable';
    
    const recentGoals = goals
      .filter((g: any) => g.progressHistory?.length > 0)
      .slice(-5);
    
    if (recentGoals.length < 2) return 'stable';
    
    let increasingCount = 0;
    let decreasingCount = 0;
    
    recentGoals.forEach((g: any) => {
      const history = g.progressHistory;
      if (history.length >= 2) {
        const recent = history[history.length - 1].confidence;
        const previous = history[history.length - 2].confidence;
        if (recent > previous) increasingCount++;
        if (recent < previous) decreasingCount++;
      }
    });
    
    if (increasingCount > decreasingCount) return 'improving';
    if (decreasingCount > increasingCount) return 'declining';
    return 'stable';
  }

  private calculateOverallHealth(data: any): number {
    let healthScore = 50; // Start at neutral
    
    // Goal confidence contributes 30%
    const avgGoalConfidence = this.calculateGoalHealth(data.goals || []).averageConfidence;
    healthScore += (avgGoalConfidence - 50) * 0.3;
    
    // Milestone completion contributes 30%
    const milestoneCompletion = this.calculateCompletionRate(data.milestones || []);
    healthScore += (milestoneCompletion - 50) * 0.3;
    
    // Active conversations contribute 20%
    const activeConversations = (data.conversations || []).filter((c: any) => c.status === 'active').length;
    if (activeConversations > 0) healthScore += 10;
    
    // Decision making contributes 20%
    const recentDecisions = (data.conversations || []).reduce((sum: number, c: any) => {
      const recent = (c.decisions || []).filter((d: any) => {
        const daysSince = (Date.now() - new Date(d.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });
      return sum + recent.length;
    }, 0);
    if (recentDecisions > 5) healthScore += 10;
    
    return Math.max(0, Math.min(100, Math.round(healthScore)));
  }

  private assessRiskLevel(data: any): string {
    let riskScore = 0;
    
    // Delayed milestones increase risk
    const delayedMilestones = (data.milestones || []).filter((m: any) => m.status === 'delayed').length;
    riskScore += delayedMilestones * 10;
    
    // Low confidence goals increase risk
    const lowConfidenceGoals = (data.goals || []).filter((g: any) => g.confidence < 40 && g.status === 'active').length;
    riskScore += lowConfidenceGoals * 15;
    
    // Critical strategy gaps increase risk
    const criticalGaps = (data.strategyGaps || []).filter((g: any) => g.severity === 'critical').length;
    riskScore += criticalGaps * 20;
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private calculateOpportunityScore(data: any): number {
    let score = 50; // Start neutral
    
    // Competitive opportunities
    if (data.competitiveIntel?.opportunityMapping?.length > 0) {
      score += Math.min(20, data.competitiveIntel.opportunityMapping.length * 5);
    }
    
    // High confidence goals
    const highConfidenceGoals = (data.goals || []).filter((g: any) => g.confidence >= 80).length;
    score += highConfidenceGoals * 5;
    
    // Completed milestones create opportunities
    const recentCompletions = (data.milestones || []).filter((m: any) => {
      if (m.status !== 'completed' || !m.completionDate) return false;
      const daysSince = (Date.now() - new Date(m.completionDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;
    score += recentCompletions * 10;
    
    return Math.min(100, score);
  }

  private calculateAlignmentScore(data: any): number {
    let alignmentScore = 0;
    let totalChecks = 0;
    
    // Check milestone-goal alignment
    const milestones = data.milestones || [];
    const goals = data.goals || [];
    
    milestones.forEach((m: any) => {
      if (m.linkedGoals?.length > 0) {
        alignmentScore += 1;
      }
      totalChecks += 1;
    });
    
    // Check conversation-goal alignment
    const conversations = data.conversations || [];
    conversations.forEach((c: any) => {
      if (c.context?.businessGoals?.length > 0) {
        alignmentScore += 1;
      }
      totalChecks += 1;
    });
    
    if (totalChecks === 0) return 50;
    return Math.round((alignmentScore / totalChecks) * 100);
  }

  private projectRevenue(data: any): number {
    // Simple projection based on current trajectory
    let baseRevenue = 0;
    
    // Use forecasts if available
    if (data.forecasts?.length > 0) {
      const latestForecast = data.forecasts[data.forecasts.length - 1];
      baseRevenue = latestForecast.businessMetrics?.projectedRevenue?.realistic || 0;
    }
    
    // Adjust based on goal confidence
    const avgConfidence = this.calculateGoalHealth(data.goals || []).averageConfidence;
    const confidenceMultiplier = avgConfidence / 100;
    
    return Math.round(baseRevenue * confidenceMultiplier);
  }

  private projectGoalCompletion(goals: any[]): any {
    const activeGoals = goals.filter((g: any) => g.status === 'active');
    const avgConfidence = activeGoals.length > 0
      ? activeGoals.reduce((sum: number, g: any) => sum + (g.confidence || 50), 0) / activeGoals.length
      : 0;
    
    const projectedCompletions = Math.round(activeGoals.length * (avgConfidence / 100));
    
    return {
      activeGoals: activeGoals.length,
      projectedCompletions,
      completionRate: activeGoals.length > 0 ? Math.round((projectedCompletions / activeGoals.length) * 100) : 0
    };
  }

  private projectMilestoneCompletion(milestones: any[]): any {
    const inProgress = milestones.filter((m: any) => m.status === 'in-progress');
    const planned = milestones.filter((m: any) => m.status === 'planned');
    
    // Calculate average completion rate
    const completed = milestones.filter((m: any) => m.status === 'completed').length;
    const total = milestones.length;
    const historicalRate = total > 0 ? completed / total : 0.5;
    
    const projectedCompletions = Math.round((inProgress.length + planned.length) * historicalRate);
    
    return {
      inProgress: inProgress.length,
      planned: planned.length,
      projectedCompletions,
      projectedTotal: completed + projectedCompletions
    };
  }
}