import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  componentStack: string | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, componentStack }) => {
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
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;