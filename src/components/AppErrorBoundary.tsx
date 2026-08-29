import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Shopitt render error", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6 text-center">
          <h1 className="text-xl font-extrabold">Shopitt needs to reload</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">A loading problem prevented this page from opening.</p>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
            Reload Shopitt
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
