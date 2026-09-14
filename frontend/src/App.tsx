import { ErrorInfo, ReactNode } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Component } from "react";
import { HomePage } from './pages/mainpage';
import YangonWeatherPage from './pages/YangonWeatherPage';
import CardAdminPage from './pages/CardAdminPage';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Something went wrong
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p>Please refresh the page or contact support if the problem persists.</p>
                  {this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Error details</summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
function AdminRoute() {
  const navigate = useNavigate();
  return <CardAdminPage onBack={() => navigate('/')} />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/yangon-weather" element={<YangonWeatherPage onBack={function (): void {
            throw new Error('Function not implemented.');
          } } />} />
          <Route path="/admin" element={<AdminRoute />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App
