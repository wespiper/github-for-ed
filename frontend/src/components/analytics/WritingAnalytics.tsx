import { useState } from 'react';
import { useDocumentVersions } from '@/hooks/useDocuments';

interface AnalyticsProps {
  documentId: string;
  currentWordCount: number;
  totalVersions: number;
}

interface WritingPattern {
  date: string;
  wordsAdded: number;
  wordsDeleted: number;
  netChange: number;
  sessionDuration: number;
}

export const WritingAnalytics = ({ documentId, currentWordCount, totalVersions }: AnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const { data: versions, isLoading } = useDocumentVersions(documentId, 50);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-600">No analytics data available yet.</p>
        <p className="text-sm text-gray-500">Start writing to see your progress!</p>
      </div>
    );
  }

  // Calculate writing patterns
  const calculateWritingPatterns = (): WritingPattern[] => {
    const patterns: WritingPattern[] = [];
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0); // All time
    }

    const filteredVersions = versions.filter(v => new Date(v.createdAt) >= cutoffDate);

    // Group by date
    const dateGroups = new Map<string, typeof filteredVersions>();
    
    filteredVersions.forEach(version => {
      const date = new Date(version.createdAt).toDateString();
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(version);
    });

    // Calculate daily patterns
    dateGroups.forEach((dayVersions, date) => {
      const totalAdded = dayVersions.reduce((sum, v) => sum + v.changes.addedWords, 0);
      const totalDeleted = dayVersions.reduce((sum, v) => sum + v.changes.deletedWords, 0);
      const netChange = totalAdded - totalDeleted;
      
      // Estimate session duration (time between first and last version of the day)
      const times = dayVersions.map(v => new Date(v.createdAt).getTime()).sort();
      const sessionDuration = times.length > 1 ? (times[times.length - 1] - times[0]) / 1000 / 60 : 0;

      patterns.push({
        date,
        wordsAdded: totalAdded,
        wordsDeleted: totalDeleted,
        netChange,
        sessionDuration
      });
    });

    return patterns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const writingPatterns = calculateWritingPatterns();

  // Calculate summary statistics
  const totalWordsAdded = writingPatterns.reduce((sum, p) => sum + p.wordsAdded, 0);
  const totalWordsDeleted = writingPatterns.reduce((sum, p) => sum + p.wordsDeleted, 0);
  const totalNetChange = writingPatterns.reduce((sum, p) => sum + p.netChange, 0);
  const averageSessionDuration = writingPatterns.length > 0 
    ? writingPatterns.reduce((sum, p) => sum + p.sessionDuration, 0) / writingPatterns.length
    : 0;

  const mostProductiveDay = writingPatterns.reduce((max, current) => 
    current.wordsAdded > max.wordsAdded ? current : max, 
    writingPatterns[0] || { date: '', wordsAdded: 0, wordsDeleted: 0, netChange: 0, sessionDuration: 0 }
  );

  // Calculate writing consistency
  const activeDays = writingPatterns.filter(p => p.wordsAdded > 0).length;
  const totalDays = Math.max(1, Math.ceil((new Date().getTime() - new Date(versions[versions.length - 1]?.createdAt || 0).getTime()) / (24 * 60 * 60 * 1000)));
  const consistencyScore = Math.round((activeDays / totalDays) * 100);

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Writing Analytics</h3>
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === 'all' ? 'All Time' : `Past ${range}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600">Words Added</div>
          <div className="text-2xl font-bold text-green-900">{totalWordsAdded}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600">Words Deleted</div>
          <div className="text-2xl font-bold text-red-900">{totalWordsDeleted}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600">Net Change</div>
          <div className={`text-2xl font-bold ${totalNetChange >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            {totalNetChange >= 0 ? '+' : ''}{totalNetChange}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-600">Avg Session</div>
          <div className="text-2xl font-bold text-purple-900">
            {Math.round(averageSessionDuration)}m
          </div>
        </div>
      </div>

      {/* Writing Patterns Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Daily Writing Activity</h4>
        
        {writingPatterns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No writing activity in the selected time range.
          </div>
        ) : (
          <div className="space-y-3">
            {writingPatterns.map((pattern, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(pattern.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                
                {/* Words added bar */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 text-xs text-green-600">+{pattern.wordsAdded}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (pattern.wordsAdded / Math.max(...writingPatterns.map(p => p.wordsAdded))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Words deleted bar */}
                  {pattern.wordsDeleted > 0 && (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-20 text-xs text-red-600">-{pattern.wordsDeleted}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (pattern.wordsDeleted / Math.max(...writingPatterns.map(p => p.wordsDeleted))) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-16 text-xs text-gray-500 text-right">
                  {pattern.sessionDuration > 0 ? `${Math.round(pattern.sessionDuration)}m` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Writing Insights</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Writing Consistency</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    consistencyScore >= 70 ? 'bg-green-500' : 
                    consistencyScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${consistencyScore}%` }}
                />
              </div>
              <span className="text-sm font-medium">{consistencyScore}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Versions</span>
            <span className="text-sm font-medium">{totalVersions}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Word Count</span>
            <span className="text-sm font-medium">{currentWordCount}</span>
          </div>

          {mostProductiveDay.wordsAdded > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Day</span>
              <span className="text-sm font-medium">
                {new Date(mostProductiveDay.date).toLocaleDateString()} 
                <span className="text-green-600 ml-1">({mostProductiveDay.wordsAdded} words)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Writing Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Writing Tips</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {consistencyScore < 40 && (
            <p>• Try to write a little bit every day to build a consistent habit.</p>
          )}
          {averageSessionDuration < 15 && (
            <p>• Consider longer writing sessions (15+ minutes) for better flow.</p>
          )}
          {totalWordsDeleted > totalWordsAdded * 0.3 && (
            <p>• You're doing a lot of editing! That's great for refining your work.</p>
          )}
          {totalWordsAdded === 0 && (
            <p>• Start writing to see your progress and analytics!</p>
          )}
        </div>
      </div>
    </div>
  );
};