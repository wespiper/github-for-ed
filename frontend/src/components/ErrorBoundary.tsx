import React, { type ErrorInfo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDevOverlay: boolean;
  errorCount: number;
  lastErrorTime: number;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDevOverlay: import.meta.env.DEV, // Show dev overlay in development
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const now = Date.now();
    return {
      hasError: true,
      error,
      errorId: now.toString(36) + Math.random().toString(36).substr(2),
      errorCount: 1,
      lastErrorTime: now
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    // Circuit breaker: if too many errors in quick succession, disable dev overlay
    const isRapidFire = timeSinceLastError < 1000; // Less than 1 second
    const tooManyErrors = this.state.errorCount > 3;
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: isRapidFire ? prevState.errorCount + 1 : 1,
      lastErrorTime: now,
      showDevOverlay: import.meta.env.DEV && !tooManyErrors && !isRapidFire
    }));

    // Log to console for development
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('Error Count:', this.state.errorCount + 1);
    console.error('Time Since Last:', timeSinceLastError + 'ms');
    if (tooManyErrors || isRapidFire) {
      console.warn('🔥 Circuit breaker activated - disabling dev overlay to prevent infinite loop');
    }
    console.groupEnd();

    // In production, you could send this to an error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDevOverlay: import.meta.env.DEV,
      errorCount: 0,
      lastErrorTime: 0
    });
  };

  handleDismissDevOverlay = () => {
    this.setState({ showDevOverlay: false });
  };

  handleCopyError = () => {
    const errorDetails = this.getErrorDetails();
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard!');
    });
  };

  getErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    
    return `
Error ID: ${errorId}
Time: ${new Date().toISOString()}
Error: ${error?.name}: ${error?.message}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Props:
${JSON.stringify(this.props, null, 2)}
    `.trim();
  };

  render() {
    if (this.state.hasError) {
      // Show dev overlay in development

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const showDetails = this.props.showDetails !== false; // Default to true

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl border-red-200">
            <CardHeader className="bg-red-100 border-b border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <CardTitle className="text-red-900">Application Error</CardTitle>
                  <p className="text-sm text-red-700 mt-1">
                    Error ID: <code className="bg-red-200 px-2 py-1 rounded">{errorId}</code>
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Error Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Summary</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="font-medium text-red-800">
                      {error?.name}: {error?.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={this.handleReset} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={this.handleCopyError}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Error Details
                  </Button>
                </div>

                {/* Detailed Error Information */}
                {showDetails && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Debug Information</h3>
                    
                    {/* Stack Trace */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Stack Trace</h4>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        {error?.stack || 'No stack trace available'}
                      </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Component Stack</h4>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}

                    {/* Props Debug */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Props</h4>
                      <pre className="bg-blue-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(this.props, null, 2)}
                      </pre>
                    </div>

                    {/* Browser Info */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Environment</h4>
                      <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                        <p><strong>URL:</strong> {window.location.href}</p>
                        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                        <p><strong>React Version:</strong> {React.version}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Development Tips */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Development Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check the browser console for additional error details</li>
                    <li>• Look at the component stack to identify the failing component</li>
                    <li>• Check for infinite loops in useEffect hooks</li>
                    <li>• Verify all required props are being passed correctly</li>
                    <li>• Check for null/undefined references in the stack trace</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for programmatic error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo);
    
    // In production, send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
    
    // For development, you could also throw to trigger error boundary
    // throw error;
  }, []);
}