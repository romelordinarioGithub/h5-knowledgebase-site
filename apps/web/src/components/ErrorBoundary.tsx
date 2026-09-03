import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Short label for the failed region (used in UI + logging). */
  label?: string;
  fallback?: ReactNode;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Class error boundary — wraps DocumentViewer and main layout so a render
 * crash shows a recoverable panel instead of a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label || 'app'}]`, error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const label = this.props.label || 'This section';

    return (
      <div
        className="rounded-[18px] border border-dashed border-line bg-[#f7f6fa] px-6 py-10 text-center"
        role="alert"
      >
        <h3 className="m-0 text-[1.1rem] font-semibold text-ink">{label} hit an error</h3>
        <p className="mt-2 mb-4 text-[0.92rem] text-muted">
          Something went wrong while rendering. You can retry or continue browsing.
        </p>
        <Button type="button" variant="secondary" onClick={this.handleReset}>
          Try again
        </Button>
      </div>
    );
  }
}
