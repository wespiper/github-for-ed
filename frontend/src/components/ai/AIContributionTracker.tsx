import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, FileText, Eye, Download, AlertTriangle } from 'lucide-react';

export interface AIContribution {
  id: string;
  timestamp: Date;
  writingStage: 'brainstorming' | 'drafting' | 'revising' | 'editing';
  contributionType: 'question' | 'prompt' | 'perspective' | 'challenge' | 'clarification';
  aiContent: string[];
  studentRequest: string;
  studentReflection: string;
  reflectionQuality: 'surface' | 'developing' | 'deep' | 'transformative';
  educationalRationale: string;
  documentSection?: string;
  wordCountBefore: number;
  wordCountAfter: number;
  isIncorporated: boolean;
  incorporationNote?: string;
}

export interface AIContributionSummary {
  totalContributions: number;
  contributionsByStage: Record<string, number>;
  contributionsByType: Record<string, number>;
  averageReflectionQuality: number;
  incorporationRate: number;
  wordCountInfluence: number;
  educationalValue: 'high' | 'medium' | 'low';
}

interface AIContributionTrackerProps {
  contributions: AIContribution[];
  onExportContributions: () => void;
  onViewContribution: (contributionId: string) => void;
  className?: string;
}

export const AIContributionTracker: React.FC<AIContributionTrackerProps> = ({
  contributions,
  onExportContributions,
  onViewContribution,
  className = ""
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [summary, setSummary] = useState<AIContributionSummary | null>(null);

  useEffect(() => {
    calculateSummary();
  }, [contributions]);

  const calculateSummary = () => {
    if (contributions.length === 0) {
      setSummary(null);
      return;
    }

    const contributionsByStage = contributions.reduce((acc, contrib) => {
      acc[contrib.writingStage] = (acc[contrib.writingStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contributionsByType = contributions.reduce((acc, contrib) => {
      acc[contrib.contributionType] = (acc[contrib.contributionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reflectionQualityScores = {
      'surface': 1,
      'developing': 2,
      'deep': 3,
      'transformative': 4
    };

    const averageReflectionQuality = contributions.reduce((sum, contrib) => 
      sum + reflectionQualityScores[contrib.reflectionQuality], 0) / contributions.length;

    const incorporationRate = (contributions.filter(c => c.isIncorporated).length / contributions.length) * 100;

    const totalWordChange = contributions.reduce((sum, contrib) => 
      sum + (contrib.wordCountAfter - contrib.wordCountBefore), 0);
    const wordCountInfluence = totalWordChange / contributions.length;

    let educationalValue: 'high' | 'medium' | 'low';
    if (averageReflectionQuality >= 3 && incorporationRate >= 70) {
      educationalValue = 'high';
    } else if (averageReflectionQuality >= 2 && incorporationRate >= 50) {
      educationalValue = 'medium';
    } else {
      educationalValue = 'low';
    }

    setSummary({
      totalContributions: contributions.length,
      contributionsByStage,
      contributionsByType,
      averageReflectionQuality,
      incorporationRate,
      wordCountInfluence,
      educationalValue
    });
  };

  const getFilteredContributions = () => {
    if (selectedStage === 'all') return contributions;
    return contributions.filter(c => c.writingStage === selectedStage);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getContributionTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'prompt': return 'bg-green-100 text-green-800';
      case 'perspective': return 'bg-purple-100 text-purple-800';
      case 'challenge': return 'bg-orange-100 text-orange-800';
      case 'clarification': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReflectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'surface': return 'bg-red-100 text-red-800';
      case 'developing': return 'bg-yellow-100 text-yellow-800';
      case 'deep': return 'bg-blue-100 text-blue-800';
      case 'transformative': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEducationalValueColor = (value: string) => {
    switch (value) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!contributions.length) {
    return (
      <Card className={`${className} border-l-4 border-l-gray-300`}>
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No AI Contributions Yet</p>
          <p className="text-sm text-gray-400 mt-2">
            AI assistance will be tracked here with complete transparency
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Card */}
      {summary && (
        <Card className={`border-l-4 ${summary.educationalValue === 'high' ? 'border-l-green-500' : 
          summary.educationalValue === 'medium' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                AI Contribution Summary
              </span>
              <div className="flex items-center gap-2">
                <Badge className={getEducationalValueColor(summary.educationalValue)}>
                  {summary.educationalValue} educational value
                </Badge>
                <Button variant="outline" size="sm" onClick={onExportContributions}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalContributions}</p>
                <p className="text-sm text-gray-600">Total Contributions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary.incorporationRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Incorporation Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{summary.averageReflectionQuality.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Reflection Quality</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.wordCountInfluence > 0 ? '+' : ''}{summary.wordCountInfluence.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Words per Contribution</p>
              </div>
            </div>

            {showDetails && (
              <div className="mt-6 space-y-4">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Contributions by Writing Stage:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.contributionsByStage).map(([stage, count]) => (
                      <Badge key={stage} variant="outline" className="capitalize">
                        {stage}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">Contributions by Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.contributionsByType).map(([type, count]) => (
                      <Badge key={type} className={getContributionTypeColor(type)}>
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter and List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              AI Contribution History
            </CardTitle>
            <div className="flex gap-2">
              <select 
                value={selectedStage} 
                onChange={(e) => setSelectedStage(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Stages</option>
                <option value="brainstorming">Brainstorming</option>
                <option value="drafting">Drafting</option>
                <option value="revising">Revising</option>
                <option value="editing">Editing</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Complete transparency: Every AI interaction is logged with educational context and student reflection.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getFilteredContributions().map((contribution) => (
              <div 
                key={contribution.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onViewContribution(contribution.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getContributionTypeColor(contribution.contributionType)}>
                      {contribution.contributionType}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {contribution.writingStage}
                    </Badge>
                    <Badge className={getReflectionQualityColor(contribution.reflectionQuality)}>
                      {contribution.reflectionQuality}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(contribution.timestamp)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Student Request:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{contribution.studentRequest}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">AI Response Preview:</p>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {contribution.aiContent.length} {contribution.contributionType}s provided
                    </p>
                  </div>

                  {contribution.documentSection && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Document Section:</p>
                      <p className="text-sm text-gray-600">{contribution.documentSection}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Words: {contribution.wordCountBefore} → {contribution.wordCountAfter}</span>
                      <span className={contribution.isIncorporated ? 'text-green-600' : 'text-gray-500'}>
                        {contribution.isIncorporated ? '✓ Incorporated' : '○ Not incorporated'}
                      </span>
                    </div>
                    
                    {!contribution.isIncorporated && contribution.contributionType !== 'question' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Consider incorporating AI suggestions</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Educational Transparency Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Educational Transparency Commitment</p>
              <p className="text-xs text-blue-700">
                This complete record ensures academic integrity and helps educators understand how AI assistance supports your learning process. 
                All contributions include educational rationale and require quality reflection to build critical thinking skills.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIContributionTracker;