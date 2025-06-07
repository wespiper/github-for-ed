// Strategic conversation templates for common scenarios
import { StrategyConversationType } from '../types/index.js';

export interface ConversationTemplate {
  id: string;
  name: string;
  type: StrategyConversationType;
  description: string;
  context: {
    purpose: string;
    typicalTriggers: string[];
    expectedOutcomes: string[];
  };
  defaultQuestions: string[];
  suggestedInsightCategories: string[];
  templateStructure: {
    sections: TemplateSection[];
  };
}

export interface TemplateSection {
  title: string;
  description: string;
  guidingQuestions: string[];
  expectedOutputs: string[];
}

export const CONVERSATION_TEMPLATES: Record<string, ConversationTemplate> = {
  'technical-milestone-strategic-review': {
    id: 'technical-milestone-strategic-review',
    name: 'Technical Milestone → Strategic Review',
    type: 'technical-milestone-review',
    description: 'Assess the strategic business impact of completed technical milestones',
    context: {
      purpose: 'Convert technical achievements into strategic business intelligence and identify next opportunities',
      typicalTriggers: [
        'Major feature completion',
        'Architecture migration complete',
        'Performance milestone achieved',
        'Security/privacy enhancement deployed',
        'API/integration milestone reached'
      ],
      expectedOutcomes: [
        'Clear business value articulation',
        'Competitive advantage assessment',
        'Revenue opportunity identification',
        'Next strategic priorities',
        'Customer communication plan'
      ]
    },
    defaultQuestions: [
      'How does this technical achievement change our competitive position?',
      'What revenue opportunities does this unlock?',
      'How does this improve customer outcomes and satisfaction?',
      'What market positioning opportunities does this create?',
      'What should we build/focus on next for maximum business impact?',
      'How do we communicate this value to customers and stakeholders?'
    ],
    suggestedInsightCategories: [
      'competitive-advantage',
      'technical-capability',
      'market-opportunity',
      'resource-optimization'
    ],
    templateStructure: {
      sections: [
        {
          title: 'Technical Achievement Summary',
          description: 'Document what was completed and its technical impact',
          guidingQuestions: [
            'What specific technical capability was delivered?',
            'How does this improve system performance/capability/security?',
            'What technical risks or limitations were addressed?',
            'How does this enable future technical work?'
          ],
          expectedOutputs: [
            'Clear technical achievement description',
            'Performance/capability improvements quantified',
            'Technical enablers for future work identified'
          ]
        },
        {
          title: 'Business Strategy Implications',
          description: 'Analyze how this technical work drives business outcomes',
          guidingQuestions: [
            'How does this change our market position vs competitors?',
            'What new revenue streams or pricing opportunities does this enable?',
            'How does this improve customer value and satisfaction?',
            'What operational efficiencies or cost savings result?'
          ],
          expectedOutputs: [
            'Competitive advantage analysis',
            'Revenue impact assessment',
            'Customer value proposition updates',
            'Operational impact evaluation'
          ]
        },
        {
          title: 'Strategic Decision Points',
          description: 'Identify decisions and next actions based on this achievement',
          guidingQuestions: [
            'Should we adjust our pricing strategy based on new capabilities?',
            'What marketing messages should we update?',
            'How should we communicate this to existing customers?',
            'What technical work should we prioritize next?',
            'Are there partnerships this enables?'
          ],
          expectedOutputs: [
            'Pricing strategy adjustments',
            'Marketing/positioning updates',
            'Customer communication plan',
            'Next development priorities',
            'Partnership opportunities'
          ]
        }
      ]
    }
  },

  'market-opportunity-analysis': {
    id: 'market-opportunity-analysis',
    name: 'Market Opportunity Analysis',
    type: 'market-analysis',
    description: 'Systematic evaluation of new market opportunities and strategic response',
    context: {
      purpose: 'Evaluate market opportunities and determine strategic response with clear go/no-go criteria',
      typicalTriggers: [
        'Competitor announcement or move',
        'Customer feedback indicating new need',
        'Industry trend or regulation change',
        'Partnership opportunity emergence',
        'Technology advancement enabling new possibilities'
      ],
      expectedOutcomes: [
        'Clear opportunity assessment',
        'Go/no-go decision with criteria',
        'Resource requirement analysis',
        'Risk mitigation strategy',
        'Implementation timeline if pursuing'
      ]
    },
    defaultQuestions: [
      'What is the real size and value of this market opportunity?',
      'Are we early, on-time, or late to this opportunity?',
      'What unique advantages do we have in pursuing this?',
      'What would it take to capture this opportunity successfully?',
      'What are the risks and how can we mitigate them?',
      'How does this align with our core mission and strategy?'
    ],
    suggestedInsightCategories: [
      'market-opportunity',
      'competitive-advantage',
      'risk-mitigation',
      'resource-optimization'
    ],
    templateStructure: {
      sections: [
        {
          title: 'Opportunity Context',
          description: 'Define the opportunity and what triggered this analysis',
          guidingQuestions: [
            'What specific opportunity are we evaluating?',
            'What triggered our awareness of this opportunity?',
            'How urgent is the decision timeline?',
            'Who are the key stakeholders affected?'
          ],
          expectedOutputs: [
            'Clear opportunity definition',
            'Trigger event documentation',
            'Decision timeline established',
            'Stakeholder map created'
          ]
        },
        {
          title: 'Market Validation',
          description: 'Assess the reality and size of the market opportunity',
          guidingQuestions: [
            'What evidence exists for customer demand?',
            'Who else is competing for this opportunity?',
            'What is the addressable market size?',
            'What revenue potential exists and over what timeframe?'
          ],
          expectedOutputs: [
            'Demand evidence documented',
            'Competitive landscape mapped',
            'Market size estimated',
            'Revenue model projected'
          ]
        },
        {
          title: 'Strategic Fit Assessment',
          description: 'Evaluate alignment with mission, capabilities, and strategy',
          guidingQuestions: [
            'How does this serve our core educational mission?',
            'Does this align with our bounded enhancement philosophy?',
            'What technical capabilities do we have vs need?',
            'How does this fit our platform vs product strategy?'
          ],
          expectedOutputs: [
            'Mission alignment analysis',
            'Philosophy consistency check',
            'Capability gap assessment',
            'Strategic coherence evaluation'
          ]
        },
        {
          title: 'Implementation Analysis',
          description: 'Assess resource requirements and execution feasibility',
          guidingQuestions: [
            'What technical development would be required?',
            'What business capabilities need to be built?',
            'What timeline and resources are realistic?',
            'How would this impact our current roadmap?'
          ],
          expectedOutputs: [
            'Technical requirements defined',
            'Business capability gaps identified',
            'Resource timeline estimated',
            'Roadmap impact assessed'
          ]
        },
        {
          title: 'Decision Framework',
          description: 'Apply systematic criteria to reach go/no-go decision',
          guidingQuestions: [
            'Does this meet our minimum criteria for market size/revenue?',
            'Can we execute this within acceptable resource constraints?',
            'Do we have sustainable competitive advantages?',
            'How do we mitigate the key risks identified?'
          ],
          expectedOutputs: [
            'Go/no-go recommendation',
            'Decision criteria evaluation',
            'Risk mitigation plan',
            'Next steps defined'
          ]
        }
      ]
    }
  },

  'product-market-fit-assessment': {
    id: 'product-market-fit-assessment',
    name: 'Product-Market Fit Assessment',
    type: 'product-roadmap',
    description: 'Regular evaluation of product-market fit and strategic adjustments needed',
    context: {
      purpose: 'Systematically assess how well our product serves the market and identify strategic adjustments',
      typicalTriggers: [
        'Quarterly business review',
        'Customer retention/churn analysis',
        'Competitor product launch',
        'User feedback trends',
        'Revenue/growth plateau'
      ],
      expectedOutcomes: [
        'Product-market fit scoring',
        'Strategic adjustment recommendations',
        'Product roadmap priorities',
        'Market positioning refinements',
        'Resource allocation decisions'
      ]
    },
    defaultQuestions: [
      'Are we solving the right problem for the right market?',
      'Is our product the right solution for the problem we\'re solving?',
      'Are we reaching and engaging the right customers?',
      'Is our business model aligned with customer value?',
      'What adjustments would improve product-market fit?'
    ],
    suggestedInsightCategories: [
      'market-opportunity',
      'business-model',
      'competitive-advantage',
      'resource-optimization'
    ],
    templateStructure: {
      sections: [
        {
          title: 'Current State Assessment',
          description: 'Evaluate current product-market dynamics and performance',
          guidingQuestions: [
            'What are our current user engagement and retention metrics?',
            'How has customer feedback evolved recently?',
            'What do our conversion and churn rates tell us?',
            'How are we performing vs competitors?'
          ],
          expectedOutputs: [
            'Engagement metrics analysis',
            'Customer feedback synthesis',
            'Conversion/churn evaluation',
            'Competitive performance comparison'
          ]
        },
        {
          title: 'Problem-Solution Fit',
          description: 'Assess whether we\'re solving the right problem effectively',
          guidingQuestions: [
            'What problems are customers actually trying to solve?',
            'How well does our solution address these problems?',
            'What gaps exist between customer needs and our offering?',
            'Are there problems we should be solving but aren\'t?'
          ],
          expectedOutputs: [
            'Customer problem analysis',
            'Solution effectiveness evaluation',
            'Gap identification',
            'Opportunity mapping'
          ]
        },
        {
          title: 'Market Alignment Check',
          description: 'Evaluate our market focus and customer targeting',
          guidingQuestions: [
            'Are we targeting the right customer segments?',
            'How well do we understand our ideal customer profile?',
            'Are there market segments we should enter or exit?',
            'How should our value proposition evolve?'
          ],
          expectedOutputs: [
            'Customer segment analysis',
            'Ideal customer profile refinement',
            'Market strategy adjustments',
            'Value proposition updates'
          ]
        },
        {
          title: 'Business Model Evaluation',
          description: 'Assess business model alignment with customer value',
          guidingQuestions: [
            'Is our pricing model aligned with customer value perception?',
            'How sustainable is our revenue model?',
            'What monetization opportunities are we missing?',
            'How should our business model evolve?'
          ],
          expectedOutputs: [
            'Pricing strategy assessment',
            'Revenue model sustainability analysis',
            'Monetization opportunity identification',
            'Business model evolution plan'
          ]
        },
        {
          title: 'Strategic Adjustments',
          description: 'Define specific changes to improve product-market fit',
          guidingQuestions: [
            'What product changes would most improve customer satisfaction?',
            'How should we adjust our market positioning?',
            'What pricing or packaging changes are needed?',
            'What should we stop/start/continue doing?'
          ],
          expectedOutputs: [
            'Product improvement priorities',
            'Positioning adjustments',
            'Pricing/packaging updates',
            'Strategic action plan'
          ]
        }
      ]
    }
  },

  'competitive-strategy-response': {
    id: 'competitive-strategy-response',
    name: 'Competitive Strategy Response',
    type: 'competitive-strategy',
    description: 'Strategic response planning to competitive moves or market changes',
    context: {
      purpose: 'Develop strategic response to competitive threats or opportunities',
      typicalTriggers: [
        'Major competitor product launch',
        'Competitor funding/acquisition',
        'New market entrant',
        'Competitor pricing changes',
        'Technology disruption threat'
      ],
      expectedOutcomes: [
        'Competitive threat assessment',
        'Strategic response plan',
        'Differentiation strategy',
        'Resource allocation decisions',
        'Timeline for execution'
      ]
    },
    defaultQuestions: [
      'How significant is this competitive threat to our position?',
      'What are our sustainable competitive advantages?',
      'Should we respond directly or focus on our differentiation?',
      'What resources would be required for an effective response?',
      'How do we turn this competitive pressure into opportunity?'
    ],
    suggestedInsightCategories: [
      'competitive-advantage',
      'risk-mitigation',
      'market-opportunity',
      'technical-capability'
    ],
    templateStructure: {
      sections: [
        {
          title: 'Competitive Threat Analysis',
          description: 'Assess the nature and significance of the competitive change',
          guidingQuestions: [
            'What exactly has the competitor done or announced?',
            'How does this threaten our current market position?',
            'What customer segments might be affected?',
            'How urgent is our need to respond?'
          ],
          expectedOutputs: [
            'Competitor move documentation',
            'Threat level assessment',
            'Customer impact analysis',
            'Response urgency evaluation'
          ]
        },
        {
          title: 'Competitive Advantage Assessment',
          description: 'Evaluate our sustainable advantages and vulnerabilities',
          guidingQuestions: [
            'What competitive advantages do we have that are hard to replicate?',
            'Where are we vulnerable to competitive pressure?',
            'What moats protect our market position?',
            'How can we strengthen our differentiation?'
          ],
          expectedOutputs: [
            'Sustainable advantage inventory',
            'Vulnerability analysis',
            'Moat strength evaluation',
            'Differentiation opportunities'
          ]
        },
        {
          title: 'Response Options Analysis',
          description: 'Evaluate different strategic response approaches',
          guidingQuestions: [
            'Should we compete directly on the same features/pricing?',
            'Can we differentiate by doubling down on our unique strengths?',
            'Are there adjacent opportunities this opens up?',
            'What would a non-obvious strategic response look like?'
          ],
          expectedOutputs: [
            'Direct response options',
            'Differentiation strategies',
            'Adjacent opportunity identification',
            'Creative response alternatives'
          ]
        },
        {
          title: 'Resource and Timeline Planning',
          description: 'Assess execution feasibility and resource requirements',
          guidingQuestions: [
            'What resources would each response option require?',
            'What timeline is realistic for implementation?',
            'How would this impact our current roadmap and priorities?',
            'What are the opportunity costs of different responses?'
          ],
          expectedOutputs: [
            'Resource requirement analysis',
            'Implementation timeline',
            'Roadmap impact assessment',
            'Opportunity cost evaluation'
          ]
        },
        {
          title: 'Strategic Response Decision',
          description: 'Choose response strategy and define execution plan',
          guidingQuestions: [
            'Which response strategy best leverages our advantages?',
            'How do we execute this response effectively?',
            'What metrics will indicate success?',
            'How do we communicate this strategy internally and externally?'
          ],
          expectedOutputs: [
            'Response strategy selection',
            'Execution plan',
            'Success metrics definition',
            'Communication strategy'
          ]
        }
      ]
    }
  }
};

export class TemplateEngine {
  getTemplate(templateId: string): ConversationTemplate | null {
    return CONVERSATION_TEMPLATES[templateId] || null;
  }

  listTemplates(): ConversationTemplate[] {
    return Object.values(CONVERSATION_TEMPLATES);
  }

  getTemplatesByType(type: StrategyConversationType): ConversationTemplate[] {
    return Object.values(CONVERSATION_TEMPLATES).filter(template => template.type === type);
  }

  generateTemplateStructure(templateId: string, context: any): {
    title: string;
    keyQuestions: string[];
    suggestedInsights: { category: string; example: string }[];
    sections: TemplateSection[];
  } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      title: `${template.name}: ${context.title || 'Strategic Analysis'}`,
      keyQuestions: template.defaultQuestions,
      suggestedInsights: template.suggestedInsightCategories.map(category => ({
        category,
        example: this.getInsightExample(category, context)
      })),
      sections: template.templateStructure.sections
    };
  }

  private getInsightExample(category: string, context: any): string {
    const examples: Record<string, string> = {
      'competitive-advantage': `Our ${context.technicalMilestone || 'technical capability'} provides sustainable differentiation because...`,
      'market-opportunity': `This creates opportunity to expand into ${context.marketSegment || 'new market segments'} by...`,
      'technical-capability': `The ${context.technicalMilestone || 'technical advancement'} enables us to...`,
      'business-model': `This change allows us to adjust our business model by...`,
      'risk-mitigation': `Key risks from ${context.competitorMove || 'this situation'} can be mitigated by...`,
      'resource-optimization': `We can optimize resources by leveraging ${context.technicalMilestone || 'this capability'} to...`
    };
    
    return examples[category] || `Strategic insight related to ${category}`;
  }
}