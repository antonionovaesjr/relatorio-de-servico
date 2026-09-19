import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-900/50 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="text-lg font-bold text-slate-100">
              Ops! Algo inesperado aconteceu
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ocorreu uma falha ao renderizar a aplicação. Seus dados no IndexedDB permanecem seguros.
            </p>

            {this.state.error && (
              <pre className="text-[11px] p-3 rounded-xl bg-slate-950 border border-slate-800 text-rose-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
