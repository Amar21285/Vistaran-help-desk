import React, { useState, useEffect } from 'react';

// Error tracking service for the help desk application

// In a production environment, you would integrate with a service like Sentry, LogRocket, or DataDog
// For now, we'll implement a simple console-based error tracking system

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
}

class ErrorTracker {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100; // Limit stored errors to prevent memory issues

  // Log an error
  logError(error: Error | string, componentStack?: string, userId?: string) {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId
    };

    // Add to our local error collection
    this.errors.push(errorInfo);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console
    console.error('Application Error:', errorInfo);

    // In a real implementation, you would send this to your error tracking service
    // Example with Sentry:
    // Sentry.captureException(error, { contexts: { react: { componentStack } } });
    
    // Example with a custom backend endpoint:
    // this.sendToBackend(errorInfo);
  }

  // Log a warning
  logWarning(message: string, userId?: string) {
    const warningInfo: ErrorInfo = {
      message,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId
    };

    console.warn('Application Warning:', warningInfo);
    
    // In a real implementation, you might send this to your analytics service
    // this.sendToAnalytics(warningInfo);
  }

  // Get all errors (useful for debugging)
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  // Clear errors
  clearErrors() {
    this.errors = [];
  }

  // Send error to backend (example implementation)
  private async sendToBackend(errorInfo: ErrorInfo) {
    try {
      // In a real implementation, you would send this to your backend
      // const response = await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(errorInfo),
      // });
      
      // For now, we'll just log that we would send it
      console.log('Would send error to backend:', errorInfo);
    } catch (error) {
      console.error('Failed to send error to backend:', error);
    }
  }
}

// Create a singleton instance
const errorTracker = new ErrorTracker();

// Global error handler
window.addEventListener('error', (event) => {
  errorTracker.logError(event.error, undefined, undefined);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorTracker.logError(event.reason, undefined, undefined);
});

export default errorTracker;

// React error boundary component

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; componentStack: string | null }>;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> & { state?: any } = ({ children, fallback: FallbackComponent }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [componentStack, setComponentStack] = useState<string | undefined>(undefined);

  // Add a mock state property to avoid TypeScript errors for compatibility
  ErrorBoundary.state = { hasError, error, componentStack };

  useEffect(() => {
    // Set up global error handlers
    const handleError = (event: ErrorEvent) => {
      errorTracker.logError(event.error, undefined);
      setHasError(true);
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorTracker.logError(event.reason, undefined);
      setHasError(true);
      setError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const resetError = () => {
    setHasError(false);
    setError(null);
    setComponentStack(undefined);
  };

  if (hasError && error) {
    // Render fallback UI if provided
    if (FallbackComponent) {
      return <FallbackComponent error={error} componentStack={componentStack || null} />;
    }
    
    // Default fallback UI
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-circle fa-3x"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            We're sorry, but something went wrong. Please try refreshing the page.
          </p>
          <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded mb-4 text-left">
            <p className="text-sm font-mono text-red-600 dark:text-red-400">
              {error.message}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};