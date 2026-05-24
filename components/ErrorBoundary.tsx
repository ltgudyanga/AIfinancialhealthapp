'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="glass-panel p-8 rounded-[2rem] text-center space-y-4">
            <p className="text-rose-400 font-mono text-sm">Something went wrong in this section.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
