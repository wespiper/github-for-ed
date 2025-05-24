import React, { type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

class SimpleErrorBoundary extends React.Component<Props, State> {
  private errorTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const now = Date.now();
    return {
      hasError: true,
      error,
      lastErrorTime: now
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    const isRapidFire = timeSinceLastError < 500; // Less than 500ms

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: isRapidFire ? prevState.errorCount + 1 : 1,
      lastErrorTime: now
    }));

    // Clear any existing timeout
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    // Only log once per burst to avoid console spam
    if (!isRapidFire) {
      this.logError(error, errorInfo);
    }

    // Set a timeout to reset if no more errors occur
    this.errorTimeout = setTimeout(() => {
      if (this.state.errorCount > 1) {
        console.warn(`🔥 Error burst ended. Total errors: ${this.state.errorCount}`);
      }
    }, 1000);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    console.group('🚨 Runtime Error Detected');
    console.error('Error:', error.message);
    console.error('Type:', error.name);
    
    // Enhanced error analysis
    if (error.message.includes('Maximum update depth exceeded')) {
      console.error('🔄 INFINITE LOOP DETECTED!');
      console.error('📍 Look for:');
      console.error('  - useEffect with missing dependencies');
      console.error('  - setState calls in render methods');
      console.error('  - Event handlers causing state loops');
    }

    // Component stack with highlights
    const componentStack = errorInfo.componentStack;
    if (componentStack) {
      console.error('📍 Component Stack:');
      const lines = componentStack.split('\n').filter(line => line.trim());
      lines.forEach((line, index) => {
        const isUserCode = line.includes('/src/') && !line.includes('node_modules');
        if (isUserCode) {
          console.error(`🎯 ${line.trim()}`);
        } else if (index < 5) { // Only show first few framework components
          console.error(`   ${line.trim()}`);
        }
      });
    }

    // Stack trace with user code highlighted
    if (error.stack) {
      console.error('📋 Stack Trace:');
      const stackLines = error.stack.split('\n');
      stackLines.forEach((line, index) => {
        if (index === 0) return; // Skip the error message line
        const isUserCode = line.includes('/src/') && !line.includes('node_modules');
        if (isUserCode) {
          console.error(`🎯 ${line.trim()}`);
        } else if (index < 8) { // Show some framework context
          console.error(`   ${line.trim()}`);
        }
      });
    }

    console.error('🔧 Environment:');
    console.error('  URL:', window.location.pathname);
    console.error('  Time:', new Date().toLocaleTimeString());
    console.error('  React:', React.version);

    console.groupEnd();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    });
  };

  componentWillUnmount() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // In development, show a minimal safe fallback
      if (import.meta.env.DEV) {
        return (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#fee2e2',
            border: '2px solid #fca5a5',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '400px',
            zIndex: 9999,
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '8px' }}>
              ⚠️ Runtime Error
            </div>
            <div style={{ color: '#7f1d1d', marginBottom: '8px' }}>
              {this.state.error?.name}: {this.state.error?.message}
            </div>
            {this.state.errorCount > 1 && (
              <div style={{ color: '#b91c1c', marginBottom: '8px' }}>
                🔥 {this.state.errorCount} errors detected (check console)
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>
              Check browser console for detailed info
            </div>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Reset Component
            </button>
          </div>
        );
      }

      // Custom fallback in production
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default production fallback
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SimpleErrorBoundary;