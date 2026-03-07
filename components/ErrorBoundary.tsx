
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 text-3xl mb-6 shadow-xl shadow-red-500/10">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Something went wrong</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8 max-w-md">
            The application encountered an unexpected error. Our technical team has been notified.
          </p>
          
          <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 max-w-lg w-full mb-8 text-left overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Details</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-xs text-red-500 break-words">
              {this.state.error?.toString()}
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-[#1a3a8a] text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-blue-800 transition-all uppercase tracking-widest text-xs flex items-center gap-3"
          >
            <i className="fas fa-sync-alt"></i>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
