import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="card-corporate p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Algo deu errado
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mt-4 p-4 bg-accent/30 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium">
                    Detalhes do erro (modo desenvolvimento)
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="btn-corporate"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}