import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — catches runtime errors anywhere in the component tree.
 * Prevents white-screen crashes and shows a user-friendly recovery UI.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-4"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-10 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight mb-2">
              Something went wrong
            </h1>
            <p className="text-sm font-medium text-gray-600 mb-6">
              An unexpected error occurred. Your data is safe — this is a display issue only.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 border-2 border-black rounded-xl p-4 mb-6 text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Error Details
                </p>
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
