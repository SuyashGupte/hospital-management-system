import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, InlineNotification } from '@carbon/react';
import { Renew } from '@carbon/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '2rem', maxWidth: '48rem', margin: '2rem auto' }}>
          <InlineNotification
            kind="error"
            title="An unexpected application error occurred"
            subtitle={this.state.error?.message || 'Please refresh the page or contact support if the issue persists.'}
            hideCloseButton
            style={{ marginBottom: '1.5rem', width: '100%' }}
          />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <Button renderIcon={Renew} onClick={this.handleReset}>
              Reload Application
            </Button>
          </div>

          {import.meta.env.DEV && this.state.errorInfo && (
            <details style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--cds-layer-01)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Stack Trace Details</summary>
              <pre style={{ overflowX: 'auto', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {this.state.error?.stack}
                {'\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
