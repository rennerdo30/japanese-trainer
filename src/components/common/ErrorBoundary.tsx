'use client';

import { Component, ReactNode } from 'react';
import { IoRefresh, IoWarning } from 'react-icons/io5';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors and display a fallback UI.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * Usage:
 * <ErrorBoundary>
 *   <SomeComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <IoWarning style={styles.icon} />
            </div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={styles.errorDetails}>
                {this.state.error.message}
              </pre>
            )}
            <button onClick={this.handleReset} style={styles.button}>
              <IoRefresh style={styles.buttonIcon} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '2rem',
  },
  card: {
    background: 'var(--bg-card, #16162a)',
    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center' as const,
    maxWidth: '400px',
    width: '100%',
  },
  iconWrapper: {
    marginBottom: '1rem',
  },
  icon: {
    fontSize: '3rem',
    color: 'var(--accent-red, #c41e3a)',
  },
  title: {
    color: 'var(--text-primary, #f5f0e8)',
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    fontWeight: 700,
  },
  message: {
    color: 'var(--text-secondary, #a8a4b8)',
    fontSize: '0.95rem',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  errorDetails: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.8rem',
    color: 'var(--accent-red-light, #ff99aa)',
    textAlign: 'left' as const,
    overflow: 'auto',
    maxHeight: '150px',
    marginBottom: '1.5rem',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, var(--accent-red, #c41e3a), #8e152a)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '44px',
    transition: 'all 0.2s',
  },
  buttonIcon: {
    fontSize: '1.2rem',
  },
};
