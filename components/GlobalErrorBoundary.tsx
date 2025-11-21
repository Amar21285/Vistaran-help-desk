import React, { useState, useEffect } from 'react';
import errorTracker from '../utils/errorTracking';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

// Add a mock state property to make it compatible with code that expects ErrorBoundary.state
const GlobalErrorBoundary: React.FC<GlobalErrorBoundaryProps> & { state?: any } = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

  // Add a mock state property to avoid TypeScript errors
  GlobalErrorBoundary.state = { hasError, error };

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      errorTracker.logError(event.error);
      setHasError(true);
      setError(event.error);
    };

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      errorTracker.logError(event.reason);
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

  // Add componentDidCatch equivalent for functional components
  useEffect(() => {
    // This is a workaround since we can't use componentDidCatch in functional components
    // We're already handling errors globally, but we can add additional logging here
    if (hasError) {
      console.log('Error boundary caught an error:', error);
    }
  }, [hasError, error]);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    setErrorInfo(null);
  };

  // Since we can't use componentDidCatch in a functional component,
  // we'll rely on the global error handlers above for catching errors

  if (hasError) {
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
          {error && (
            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded mb-4 text-left">
              <p className="text-sm font-mono text-red-600 dark:text-red-400">
                {error.message || 'An unknown error occurred'}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer text-slate-500">Error details</summary>
                  <pre className="text-xs mt-2 text-slate-500 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => { window.location.href = '/'; handleReset(); }}
              className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add safety wrapper for children
  if (!children) {
    console.error('GlobalErrorBoundary received no children');
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-circle fa-3x"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Application Error</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            No content to display. Please refresh the page.
          </p>
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

  try {
    return <>{children}</>;
  } catch (renderError) {
    console.error('Error rendering children in GlobalErrorBoundary:', renderError);
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-circle fa-3x"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Rendering Error</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Error while rendering application content. Please try refreshing the page.
          </p>
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
};

export default GlobalErrorBoundary;