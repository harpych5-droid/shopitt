import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Keeps a Shorts-specific render/chunk failure from blanking the PWA. */
export class ShortsErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Shorts route failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center text-white">
          <h1 className="text-xl font-extrabold">Shorts couldn&apos;t open</h1>
          <p className="mt-2 text-sm text-white/70">Please try loading Shorts again.</p>
          <button type="button" onClick={() => this.setState({ failed: false })} className="mt-5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white">
            Try again
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
