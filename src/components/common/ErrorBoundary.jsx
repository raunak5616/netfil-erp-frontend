import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Enterprise-grade React Error Boundary.
 * Catches JavaScript errors anywhere in their child component tree,
 * logs the errors, and displays a resilient fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Structured error logging
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Check if custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isModuleLevel = this.props.level === 'module';

      return (
        <div
          className={`flex items-center justify-center p-6 ${
            isModuleLevel ? 'min-h-[300px] w-full' : 'min-h-screen bg-slate-50 w-full'
          }`}
        >
          <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-lg">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {this.props.title || 'An unexpected error occurred'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isModuleLevel
                    ? 'This section encountered an issue and could not load.'
                    : 'The application encountered an unrecoverable rendering error.'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-medium text-red-600">
                {this.state.error?.message || 'Unknown error'}
              </p>
              {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
                <details className="mt-2 text-[10px] text-slate-500">
                  <summary className="cursor-pointer hover:underline">
                    View Component Stack Trace
                  </summary>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-2 font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Retry Component
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reload Page
              </button>

              {!isModuleLevel && (
                <button
                  type="button"
                  onClick={this.handleGoDashboard}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Home className="mr-1.5 h-3.5 w-3.5" />
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
