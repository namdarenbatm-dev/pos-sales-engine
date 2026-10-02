import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // In a real deployment, send this to a logging service instead of the console.
    // Never log financial values here — only the error itself.
    // eslint-disable-next-line no-console
    console.error("Render error caught by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:bg-rose-950/40 dark:border-rose-800">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">مشکلی در نمایش این بخش رخ داده است.</p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">لطفاً دوباره تلاش کنید.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-300 underline"
          >
            تلاش مجدد
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
