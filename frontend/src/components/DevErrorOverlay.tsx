import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X, ChevronDown, ChevronRight } from 'lucide-react';

interface DevErrorOverlayProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onDismiss: () => void;
}

export function DevErrorOverlay({ error, errorInfo, onDismiss }: DevErrorOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showComponentStack, setShowComponentStack] = useState(true);

  // Parse the error stack to find relevant files
  const parseStackTrace = (stack: string) => {
    const lines = stack.split('\n');
    return lines.map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, functionName, fileName, lineNumber, columnNumber] = match;
        const isUserCode = fileName.includes('/src/') && !fileName.includes('node_modules');
        return {
          functionName,
          fileName: fileName.split('/').pop() || fileName,
          fullPath: fileName,
          lineNumber: parseInt(lineNumber),
          columnNumber: parseInt(columnNumber),
          isUserCode,
          raw: line
        };
      }
      return { raw: line, isUserCode: false };
    }).filter(item => item.raw.trim());
  };

  const stackFrames = error.stack ? parseStackTrace(error.stack) : [];
  const userCodeFrames = stackFrames.filter(frame => frame.isUserCode);

  // Parse component stack to show component hierarchy
  const parseComponentStack = (componentStack: string) => {
    const lines = componentStack.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const match = line.trim().match(/^(in\s+)?(.+?)(\s+\(at\s+(.+?):(\d+):(\d+)\))?$/);
      if (match) {
        const [, , componentName, , fileName, lineNumber, columnNumber] = match;
        return {
          componentName: componentName.trim(),
          fileName: fileName?.split('/').pop(),
          lineNumber: lineNumber ? parseInt(lineNumber) : null,
          columnNumber: columnNumber ? parseInt(columnNumber) : null,
          raw: line
        };
      }
      return { raw: line, componentName: line.trim() };
    });
  };

  const componentFrames = errorInfo?.componentStack 
    ? parseComponentStack(errorInfo.componentStack)
    : [];

  // Detect common error patterns
  const getErrorSuggestions = (error: Error) => {
    const message = error.message.toLowerCase();
    const suggestions: string[] = [];

    if (message.includes('maximum update depth exceeded')) {
      suggestions.push('🔄 This is an infinite loop! Check useEffect dependencies and state updates');
      suggestions.push('🔍 Look for useEffect hooks that update state without proper dependencies');
      suggestions.push('🛡️ Consider using useCallback for event handlers passed to child components');
    }

    if (message.includes('cannot read prop')) {
      suggestions.push('🚫 Null/undefined reference error - check object existence before accessing properties');
      suggestions.push('🔍 Use optional chaining (?.) or provide default values');
    }

    if (message.includes('setstate')) {
      suggestions.push('⚠️ State update error - check if component is still mounted');
      suggestions.push('🧹 Consider using cleanup functions in useEffect');
    }

    return suggestions;
  };

  const suggestions = getErrorSuggestions(error);

  if (!isExpanded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700"
        >
          <AlertTriangle className="h-4 w-4" />
          Runtime Error
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden border-red-500 shadow-2xl">
        <CardHeader className="bg-red-100 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Runtime Error</CardTitle>
                <p className="text-sm text-red-700 mt-1">
                  {error.name}: {error.message}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-red-700 hover:bg-red-200 px-2 py-1 rounded"
              >
                Minimize
              </button>
              <button
                onClick={onDismiss}
                className="text-red-700 hover:bg-red-200 px-2 py-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">💡 Suggestions</h3>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-yellow-800">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* User Code Stack Frames */}
            {userCodeFrames.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Your Code (Most Relevant)</h3>
                <div className="space-y-2">
                  {userCodeFrames.slice(0, 5).map((frame, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="font-medium text-red-900">
                        {frame.functionName || 'Anonymous'}
                      </div>
                      <div className="text-sm text-red-700">
                        {frame.fileName}:{frame.lineNumber}:{frame.columnNumber}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 font-mono">
                        {frame.fullPath}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Component Stack */}
            {componentFrames.length > 0 && (
              <div>
                <button
                  onClick={() => setShowComponentStack(!showComponentStack)}
                  className="flex items-center gap-2 mb-3 hover:bg-gray-100 px-2 py-1 rounded"
                >
                  {showComponentStack ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  🏗️ Component Stack
                </button>
                
                {showComponentStack && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {componentFrames.map((frame, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-4 text-blue-600">
                            {index === 0 ? '💥' : '↳'}
                          </div>
                          <div className="font-medium text-blue-900">
                            {frame.componentName}
                          </div>
                          {frame.fileName && (
                            <div className="text-blue-600 text-xs">
                              ({frame.fileName}:{frame.lineNumber})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full Stack Trace */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Full Stack Trace</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                {error.stack}
              </pre>
            </div>

            {/* Environment Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔧 Environment</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>URL:</strong> {window.location.pathname}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
                </div>
                <div>
                  <strong>React Version:</strong> {React.version}
                </div>
                <div>
                  <strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}