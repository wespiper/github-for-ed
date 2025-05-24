import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StudentInsight {
  studentId: string;
  studentName: string;
  assignmentId: string;
  writingDevelopment: {
    currentLevel: 'novice' | 'developing' | 'proficient' | 'advanced';
    progressTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    challenges: string[];
    nextSteps: string[];
  };
  engagementMetrics: {
    timeOnTask: number;
    revisionFrequency: number;
    feedbackResponsiveness: number;
    collaborationScore: number;
  };
  interventionNeeds: Array<{
    type: 'immediate' | 'soon' | 'watch';
    category: 'writing_skill' | 'engagement' | 'process' | 'motivation';
    description: string;
    suggestedAction: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recentBreakthroughs: Array<{
    date: string;
    skill: string;
    description: string;
    evidence: string;
  }>;
}

interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  assignmentId: string;
  assignmentTitle: string;
  overallProgress: {
    averageCompletion: number;
    onTrack: number;
    needsSupport: number;
    excelling: number;
  };
  learningObjectivesMastery: Array<{
    objectiveId: string;
    objectiveTitle: string;
    averageMastery: number;
    studentsStrugglingCount: number;
    studentsExcellingCount: number;
  }>;
  commonChallenges: Array<{
    challenge: string;
    affectedStudents: number;
    suggestedIntervention: string;
  }>;
  teachingOpportunities: Array<{
    opportunity: string;
    description: string;
    suggestedTiming: string;
    affectedStudents: string[];
  }>;
}

interface EducatorInsightsDashboardProps {
  educatorId: string;
  classId?: string;
  assignmentId?: string;
}

export const EducatorInsightsDashboard = ({
  educatorId,
  classId,
  assignmentId
}: EducatorInsightsDashboardProps) => {
  const [selectedClass, setSelectedClass] = useState<string>(classId || '');
  const [selectedAssignment, setSelectedAssignment] = useState<string>(assignmentId || '');
  const [activeView, setActiveView] = useState<'overview' | 'students' | 'interventions'>('overview');

  // Fetch educator's classes
  const { data: classes } = useQuery({
    queryKey: ['educatorClasses', educatorId],
    queryFn: async () => {
      const response = await api.get(`/courses/educator/${educatorId}`);
      return response.data;
    },
  });

  // Fetch assignments for selected class
  const { data: assignments } = useQuery({
    queryKey: ['classAssignments', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await api.get(`/assignments/class/${selectedClass}`);
      return response.data;
    },
    enabled: !!selectedClass,
  });

  // Fetch class analytics
  const { data: classAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['classAnalytics', selectedClass, selectedAssignment],
    queryFn: async () => {
      if (!selectedClass || !selectedAssignment) return null;
      const response = await api.get<ClassAnalytics>(
        `/analytics/class-insights/${selectedClass}/${selectedAssignment}`
      );
      return response.data;
    },
    enabled: !!selectedClass && !!selectedAssignment,
  });

  // Fetch individual student insights
  const { data: studentInsights } = useQuery({
    queryKey: ['studentInsights', selectedClass, selectedAssignment],
    queryFn: async () => {
      if (!selectedClass || !selectedAssignment) return [];
      const response = await api.get<StudentInsight[]>(
        `/analytics/student-insights/${selectedClass}/${selectedAssignment}`
      );
      return response.data;
    },
    enabled: !!selectedClass && !!selectedAssignment,
  });

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-ink-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-ink-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-ember-100 text-ember-800';
      case 'medium': return 'bg-highlight-100 text-highlight-800';
      default: return 'bg-ink-100 text-ink-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Class and Assignment Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Class Insights Dashboard</h2>
          <p className="text-ink-600">Monitor student progress and identify teaching opportunities</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {classes && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls: { id: string; title: string }) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title}
                </option>
              ))}
            </select>
          )}
          
          {assignments && (
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500"
            >
              <option value="">Select Assignment</option>
              {assignments.map((assignment: { id: string; title: string }) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!classAnalytics ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-ink-600">Select a class and assignment to view insights.</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-ink-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Class Overview', icon: '📊' },
                { id: 'students', label: 'Student Profiles', icon: '👥' },
                { id: 'interventions', label: 'Action Items', icon: '🎯' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as 'overview' | 'students' | 'interventions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeView === tab.id
                      ? 'border-scribe-500 text-scribe-600'
                      : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Class Progress Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">
                  📈 Class Progress Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-branch-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-branch-900">
                      {classAnalytics.overallProgress.excelling}
                    </div>
                    <div className="text-sm text-branch-600">Excelling</div>
                  </div>
                  <div className="bg-scribe-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-scribe-900">
                      {classAnalytics.overallProgress.onTrack}
                    </div>
                    <div className="text-sm text-scribe-600">On Track</div>
                  </div>
                  <div className="bg-highlight-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-highlight-900">
                      {classAnalytics.overallProgress.needsSupport}
                    </div>
                    <div className="text-sm text-highlight-600">Needs Support</div>
                  </div>
                  <div className="bg-ink-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-ink-900">
                      {Math.round(classAnalytics.overallProgress.averageCompletion)}%
                    </div>
                    <div className="text-sm text-ink-600">Avg Completion</div>
                  </div>
                </div>
              </Card>

              {/* Learning Objectives Mastery */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">
                  🎯 Learning Objectives Mastery
                </h3>
                <div className="space-y-4">
                  {classAnalytics.learningObjectivesMastery.map((objective) => (
                    <div key={objective.objectiveId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-ink-900">{objective.objectiveTitle}</h4>
                        <span className="text-sm font-medium text-ink-600">
                          {Math.round(objective.averageMastery)}% avg
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-ink-200 rounded-full h-3">
                          <div
                            className="bg-scribe-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${objective.averageMastery}%` }}
                          />
                        </div>
                        <div className="flex space-x-4 text-xs">
                          <span className="text-ember-600">
                            {objective.studentsStrugglingCount} struggling
                          </span>
                          <span className="text-branch-600">
                            {objective.studentsExcellingCount} excelling
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Common Challenges */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">
                  ⚠️ Common Challenges
                </h3>
                <div className="space-y-3">
                  {classAnalytics.commonChallenges.map((challenge, index) => (
                    <div key={index} className="border border-highlight-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-ink-900">{challenge.challenge}</h4>
                        <Badge className="bg-highlight-100 text-highlight-800">
                          {challenge.affectedStudents} students
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-600">
                        <strong>Suggested intervention:</strong> {challenge.suggestedIntervention}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Teaching Opportunities */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">
                  💡 Teaching Opportunities
                </h3>
                <div className="space-y-3">
                  {classAnalytics.teachingOpportunities.map((opportunity, index) => (
                    <div key={index} className="border border-branch-200 rounded-lg p-4">
                      <h4 className="font-medium text-ink-900 mb-2">{opportunity.opportunity}</h4>
                      <p className="text-sm text-ink-600 mb-2">{opportunity.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-branch-600">
                          <strong>Best timing:</strong> {opportunity.suggestedTiming}
                        </span>
                        <span className="text-ink-500">
                          {opportunity.affectedStudents.length} students would benefit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Students Tab */}
          {activeView === 'students' && studentInsights && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {studentInsights.map((student) => (
                  <Card key={student.studentId} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-ink-900">
                        {student.studentName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getTrendIcon(student.writingDevelopment.progressTrend)}</span>
                        <Badge className={
                          student.writingDevelopment.currentLevel === 'advanced' ? 'bg-branch-100 text-branch-800' :
                          student.writingDevelopment.currentLevel === 'proficient' ? 'bg-scribe-100 text-scribe-800' :
                          student.writingDevelopment.currentLevel === 'developing' ? 'bg-highlight-100 text-highlight-800' :
                          'bg-ink-100 text-ink-600'
                        }>
                          {student.writingDevelopment.currentLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-scribe-50 rounded">
                        <div className="text-lg font-bold text-scribe-900">
                          {Math.round(student.engagementMetrics.timeOnTask)}m
                        </div>
                        <div className="text-xs text-scribe-600">Time on Task</div>
                      </div>
                      <div className="text-center p-3 bg-branch-50 rounded">
                        <div className="text-lg font-bold text-branch-900">
                          {student.engagementMetrics.revisionFrequency}
                        </div>
                        <div className="text-xs text-branch-600">Revisions</div>
                      </div>
                    </div>

                    {/* Strengths and Challenges */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-branch-800 mb-1">Strengths</h4>
                        <div className="flex flex-wrap gap-1">
                          {student.writingDevelopment.strengths.map((strength, index) => (
                            <Badge key={index} className="bg-branch-100 text-branch-700 text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-highlight-800 mb-1">Challenges</h4>
                        <div className="flex flex-wrap gap-1">
                          {student.writingDevelopment.challenges.map((challenge, index) => (
                            <Badge key={index} className="bg-highlight-100 text-highlight-700 text-xs">
                              {challenge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Breakthroughs */}
                    {student.recentBreakthroughs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-ink-200">
                        <h4 className="text-sm font-medium text-ink-900 mb-2">Recent Breakthrough</h4>
                        <div className="text-sm">
                          <div className="font-medium text-branch-700">
                            {student.recentBreakthroughs[0].skill}
                          </div>
                          <div className="text-ink-600">
                            {student.recentBreakthroughs[0].description}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Interventions Tab */}
          {activeView === 'interventions' && studentInsights && (
            <div className="space-y-6">
              {['immediate', 'soon', 'watch'].map((urgency) => {
                const interventions = studentInsights.flatMap(student => 
                  student.interventionNeeds
                    .filter(intervention => intervention.type === urgency)
                    .map(intervention => ({ ...intervention, studentName: student.studentName }))
                );

                if (interventions.length === 0) return null;

                return (
                  <Card key={urgency} className="p-6">
                    <h3 className="text-lg font-semibold text-ink-900 mb-4 capitalize">
                      {urgency === 'immediate' ? '🚨' : urgency === 'soon' ? '⏰' : '👀'} {urgency} Attention Needed
                    </h3>
                    <div className="space-y-3">
                      {interventions.map((intervention, index) => (
                        <div key={index} className="border border-ink-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-ink-900">
                                {intervention.studentName}
                              </span>
                              <Badge className={getPriorityColor(intervention.priority)}>
                                {intervention.priority}
                              </Badge>
                              <Badge variant="outline">
                                {intervention.category.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-ink-700 mb-2">{intervention.description}</p>
                          <div className="bg-scribe-50 rounded p-3">
                            <p className="text-sm text-scribe-800">
                              <strong>Suggested action:</strong> {intervention.suggestedAction}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};