// Strategic collaboration features for team-based planning
import { v4 as uuidv4 } from 'uuid';
import { StrategyConversation, BusinessGoal } from '../types/index.js';

export interface CollaborationSession {
  id: string;
  title: string;
  description: string;
  type: 'planning' | 'review' | 'brainstorming' | 'decision-making';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created: string;
  scheduled?: string;
  started?: string;
  ended?: string;
  
  participants: Participant[];
  moderator: string;
  
  agenda: AgendaItem[];
  sharedContext: SharedContext;
  contributions: Contribution[];
  decisions: CollaborativeDecision[];
  actionItems: CollaborativeActionItem[];
  
  followUp?: {
    nextSession?: string;
    reviewDate?: string;
    checkpoints?: string[];
  };
}

export interface Participant {
  id: string;
  name: string;
  role: 'strategist' | 'technical-lead' | 'product-owner' | 'stakeholder' | 'advisor';
  email?: string;
  attendance: 'confirmed' | 'tentative' | 'declined' | 'attended' | 'absent';
  contributions: number;
  lastActive?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  timeAllocation: number; // minutes
  priority: 'must-discuss' | 'should-discuss' | 'if-time-permits';
  presenter?: string;
  relatedGoals?: string[];
  relatedMilestones?: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'deferred';
  notes?: string;
}

export interface SharedContext {
  businessGoals: string[]; // Goal IDs
  milestones: string[]; // Milestone IDs
  recentInsights: string[]; // Insight IDs
  competitiveIntel?: any;
  marketTrends?: string[];
  constraints?: string[];
  assumptions?: string[];
}

export interface Contribution {
  id: string;
  participantId: string;
  timestamp: string;
  type: 'insight' | 'question' | 'suggestion' | 'concern' | 'data';
  content: string;
  
  metadata?: {
    category?: string;
    importance?: 'low' | 'medium' | 'high' | 'critical';
    requiresFollowUp?: boolean;
    linkedContributions?: string[];
  };
  
  reactions?: {
    participantId: string;
    reaction: 'agree' | 'disagree' | 'question' | 'important';
    comment?: string;
  }[];
}

export interface CollaborativeDecision {
  id: string;
  decision: string;
  rationale: string;
  timestamp: string;
  
  votingRecord?: {
    method: 'consensus' | 'majority' | 'advisory';
    votes: {
      participantId: string;
      vote: 'approve' | 'reject' | 'abstain';
      comment?: string;
    }[];
    result: 'approved' | 'rejected' | 'deferred';
  };
  
  implementation: {
    owner: string;
    deadline: string;
    milestones?: string[];
    successCriteria: string[];
  };
  
  risks?: string[];
  dependencies?: string[];
}

export interface CollaborativeActionItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  relatedDecisions?: string[];
  relatedGoals?: string[];
  
  status: 'assigned' | 'in-progress' | 'blocked' | 'completed' | 'cancelled';
  updates?: {
    timestamp: string;
    participantId: string;
    update: string;
    newStatus?: string;
  }[];
}

export class StrategicCollaboration {
  private sessions: Map<string, CollaborationSession> = new Map();
  private templates: Map<string, CollaborationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Strategic Planning Session Template
    this.templates.set('strategic-planning', {
      id: 'strategic-planning',
      name: 'Strategic Planning Session',
      type: 'planning',
      suggestedDuration: 120, // minutes
      
      agendaTemplate: [
        {
          title: 'Current State Review',
          description: 'Review current goals, milestones, and progress',
          timeAllocation: 20,
          priority: 'must-discuss'
        },
        {
          title: 'Market & Competitive Analysis',
          description: 'Discuss market trends and competitive positioning',
          timeAllocation: 30,
          priority: 'must-discuss'
        },
        {
          title: 'Strategic Opportunities',
          description: 'Identify and prioritize strategic opportunities',
          timeAllocation: 40,
          priority: 'must-discuss'
        },
        {
          title: 'Resource Allocation',
          description: 'Discuss resource needs and allocation',
          timeAllocation: 20,
          priority: 'should-discuss'
        },
        {
          title: 'Next Steps & Action Items',
          description: 'Define concrete next steps and assignments',
          timeAllocation: 10,
          priority: 'must-discuss'
        }
      ],
      
      requiredRoles: ['strategist', 'technical-lead', 'product-owner'],
      recommendedPrep: [
        'Review recent milestone completions',
        'Analyze competitive intelligence',
        'Prepare market trend data',
        'List strategic questions'
      ]
    });

    // Decision Making Session Template
    this.templates.set('decision-making', {
      id: 'decision-making',
      name: 'Strategic Decision Session',
      type: 'decision-making',
      suggestedDuration: 90,
      
      agendaTemplate: [
        {
          title: 'Decision Context',
          description: 'Present the decision to be made and its context',
          timeAllocation: 15,
          priority: 'must-discuss'
        },
        {
          title: 'Options Analysis',
          description: 'Review and analyze available options',
          timeAllocation: 30,
          priority: 'must-discuss'
        },
        {
          title: 'Risk Assessment',
          description: 'Evaluate risks for each option',
          timeAllocation: 20,
          priority: 'must-discuss'
        },
        {
          title: 'Decision & Rationale',
          description: 'Make decision and document rationale',
          timeAllocation: 20,
          priority: 'must-discuss'
        },
        {
          title: 'Implementation Planning',
          description: 'Define implementation approach',
          timeAllocation: 5,
          priority: 'should-discuss'
        }
      ],
      
      requiredRoles: ['strategist', 'technical-lead'],
      recommendedPrep: [
        'Prepare decision options matrix',
        'Gather supporting data',
        'Identify key stakeholders',
        'Prepare risk analysis'
      ]
    });
  }

  createSession(params: {
    title: string;
    description: string;
    type: CollaborationSession['type'];
    templateId?: string;
    scheduled?: string;
    participants: Omit<Participant, 'contributions' | 'lastActive'>[];
    moderator: string;
    sharedContext?: Partial<SharedContext>;
  }): CollaborationSession {
    
    const template = params.templateId ? this.templates.get(params.templateId) : null;
    
    const session: CollaborationSession = {
      id: uuidv4(),
      title: params.title,
      description: params.description,
      type: params.type,
      status: params.scheduled ? 'scheduled' : 'active',
      created: new Date().toISOString(),
      scheduled: params.scheduled,
      
      participants: params.participants.map(p => ({
        ...p,
        contributions: 0,
        attendance: params.scheduled ? 'confirmed' : 'attended'
      })),
      moderator: params.moderator,
      
      agenda: template ? this.createAgendaFromTemplate(template.agendaTemplate) : [],
      sharedContext: {
        businessGoals: params.sharedContext?.businessGoals || [],
        milestones: params.sharedContext?.milestones || [],
        recentInsights: params.sharedContext?.recentInsights || [],
        competitiveIntel: params.sharedContext?.competitiveIntel,
        marketTrends: params.sharedContext?.marketTrends || [],
        constraints: params.sharedContext?.constraints || [],
        assumptions: params.sharedContext?.assumptions || []
      },
      
      contributions: [],
      decisions: [],
      actionItems: []
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private createAgendaFromTemplate(template: any[]): AgendaItem[] {
    return template.map(item => ({
      id: uuidv4(),
      status: 'pending',
      ...item
    }));
  }

  addContribution(
    sessionId: string,
    participantId: string,
    contribution: Omit<Contribution, 'id' | 'participantId' | 'timestamp'>
  ): Contribution | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return null;

    const newContribution: Contribution = {
      id: uuidv4(),
      participantId,
      timestamp: new Date().toISOString(),
      ...contribution
    };

    session.contributions.push(newContribution);
    
    // Update participant contribution count
    const participant = session.participants.find(p => p.id === participantId);
    if (participant) {
      participant.contributions++;
      participant.lastActive = newContribution.timestamp;
    }

    // Handle high-importance contributions
    if (contribution.metadata?.importance === 'critical') {
      this.flagCriticalContribution(session, newContribution);
    }

    return newContribution;
  }

  private flagCriticalContribution(session: CollaborationSession, contribution: Contribution) {
    // In a real implementation, this might trigger notifications
    // For now, we'll just ensure it's tracked
    if (contribution.metadata) {
      contribution.metadata.requiresFollowUp = true;
    }
  }

  recordDecision(
    sessionId: string,
    decision: Omit<CollaborativeDecision, 'id' | 'timestamp'>
  ): CollaborativeDecision | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return null;

    const newDecision: CollaborativeDecision = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...decision
    };

    session.decisions.push(newDecision);
    
    // Auto-create action items for decision implementation
    if (decision.implementation) {
      this.createActionItem(sessionId, {
        title: `Implement: ${decision.decision}`,
        description: `Implementation of decision: ${decision.rationale}`,
        owner: decision.implementation.owner,
        assignedBy: session.moderator,
        dueDate: decision.implementation.deadline,
        priority: 'high',
        relatedDecisions: [newDecision.id]
      });
    }

    return newDecision;
  }

  createActionItem(
    sessionId: string,
    actionItem: Omit<CollaborativeActionItem, 'id' | 'assignedAt' | 'status' | 'updates'>
  ): CollaborativeActionItem | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const newActionItem: CollaborativeActionItem = {
      id: uuidv4(),
      assignedAt: new Date().toISOString(),
      status: 'assigned',
      ...actionItem
    };

    session.actionItems.push(newActionItem);
    return newActionItem;
  }

  updateActionItem(
    sessionId: string,
    actionItemId: string,
    update: {
      participantId: string;
      update: string;
      newStatus?: CollaborativeActionItem['status'];
    }
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const actionItem = session.actionItems.find(ai => ai.id === actionItemId);
    if (!actionItem) return false;

    if (!actionItem.updates) {
      actionItem.updates = [];
    }

    actionItem.updates.push({
      timestamp: new Date().toISOString(),
      ...update
    });

    if (update.newStatus) {
      actionItem.status = update.newStatus;
    }

    return true;
  }

  completeSession(
    sessionId: string,
    summary: {
      keyDecisions: string[];
      nextSteps: string[];
      followUp?: {
        nextSession?: string;
        reviewDate?: string;
        checkpoints?: string[];
      };
    }
  ): CollaborationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return null;

    session.status = 'completed';
    session.ended = new Date().toISOString();
    session.followUp = summary.followUp;

    // Mark all pending agenda items as deferred
    session.agenda.forEach(item => {
      if (item.status === 'pending') {
        item.status = 'deferred';
      }
    });

    return session;
  }

  getSession(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getSessions(filter?: {
    type?: CollaborationSession['type'];
    status?: CollaborationSession['status'];
    participantId?: string;
  }): CollaborationSession[] {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      if (filter.type) {
        sessions = sessions.filter(s => s.type === filter.type);
      }
      if (filter.status) {
        sessions = sessions.filter(s => s.status === filter.status);
      }
      if (filter.participantId) {
        sessions = sessions.filter(s => 
          s.participants.some(p => p.id === filter.participantId)
        );
      }
    }

    return sessions.sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  }

  generateSessionSummary(sessionId: string): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const summary: SessionSummary = {
      sessionId,
      title: session.title,
      type: session.type,
      duration: this.calculateDuration(session),
      
      participation: {
        total: session.participants.length,
        attended: session.participants.filter(p => p.attendance === 'attended').length,
        contributions: session.contributions.length,
        avgContributionsPerPerson: session.contributions.length / 
          Math.max(1, session.participants.filter(p => p.attendance === 'attended').length)
      },
      
      outcomes: {
        decisions: session.decisions.length,
        actionItems: session.actionItems.length,
        criticalInsights: session.contributions.filter(c => 
          c.metadata?.importance === 'critical'
        ).length
      },
      
      keyContributions: this.extractKeyContributions(session),
      decisionsTimeline: this.createDecisionsTimeline(session),
      nextSteps: this.extractNextSteps(session)
    };

    return summary;
  }

  private calculateDuration(session: CollaborationSession): number {
    if (!session.started || !session.ended) return 0;
    return (new Date(session.ended).getTime() - new Date(session.started).getTime()) / 60000; // minutes
  }

  private extractKeyContributions(session: CollaborationSession): any[] {
    return session.contributions
      .filter(c => c.metadata?.importance === 'high' || c.metadata?.importance === 'critical')
      .map(c => ({
        content: c.content,
        contributor: session.participants.find(p => p.id === c.participantId)?.name,
        type: c.type,
        importance: c.metadata?.importance
      }));
  }

  private createDecisionsTimeline(session: CollaborationSession): any[] {
    return session.decisions.map(d => ({
      decision: d.decision,
      timestamp: d.timestamp,
      implementation: d.implementation
    }));
  }

  private extractNextSteps(session: CollaborationSession): any[] {
    return session.actionItems
      .filter(ai => ai.status !== 'cancelled')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map(ai => ({
        action: ai.title,
        owner: ai.owner,
        dueDate: ai.dueDate,
        priority: ai.priority,
        status: ai.status
      }));
  }

  getTemplates(): CollaborationTemplate[] {
    return Array.from(this.templates.values());
  }
}

export interface CollaborationTemplate {
  id: string;
  name: string;
  type: CollaborationSession['type'];
  suggestedDuration: number;
  agendaTemplate: Omit<AgendaItem, 'id' | 'status' | 'notes'>[];
  requiredRoles: string[];
  recommendedPrep: string[];
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  type: string;
  duration: number;
  
  participation: {
    total: number;
    attended: number;
    contributions: number;
    avgContributionsPerPerson: number;
  };
  
  outcomes: {
    decisions: number;
    actionItems: number;
    criticalInsights: number;
  };
  
  keyContributions: any[];
  decisionsTimeline: any[];
  nextSteps: any[];
}