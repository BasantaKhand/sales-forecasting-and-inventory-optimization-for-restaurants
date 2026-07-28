import { Component } from "react";

// Catches rendering errors in the tree below it and shows a friendly fallback
// with a way to recover, instead of a blank white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Uncaught UI error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500">
            An unexpected error occurred while rendering this view.
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-md bg-accent px-4 py-2 text-white hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
