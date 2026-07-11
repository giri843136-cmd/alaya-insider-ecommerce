import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Top-level error boundary — graceful failure with a recovery path,
 * satisfying the "graceful failure / error recovery" requirement.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Unexpected error" };
  }

  componentDidCatch(error: unknown) {
    // Centralized client-side logging (would forward to a service in production).
    // eslint-disable-next-line no-console
    console.error("[ALAYA] render error:", error);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-8 w-8" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 max-w-md text-sm text-muted">
              We hit an unexpected snag. You can try again — your bag and saved items are safe.
            </p>
          </div>
          <button onClick={this.reset} className="btn-primary btn-md">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
