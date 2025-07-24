import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console for debugging
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI
      return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Alert variant="destructive" className="max-w-lg text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              <p className="mb-4">An unexpected error occurred. Please try refreshing the page or clicking the "Try again" button.</p>
              <details className="mt-4 text-xs bg-slate-800 p-2 rounded-md text-white">
                <summary className="cursor-pointer">Click to see error details</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
           <Button
              onClick={() => window.location.reload()}
              className="mt-4"
           >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
           </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;