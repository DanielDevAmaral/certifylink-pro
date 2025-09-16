import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="card-corporate max-w-md mx-auto mt-8">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ops! Algo deu errado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte.
              </p>
            </div>
            
            <Alert className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs font-mono">
                {this.state.error?.message || 'Erro desconhecido'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="btn-corporate w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Página
              </Button>
              <Button 
                variant="outline" 
                onClick={() => this.setState({ hasError: false })}
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Aqui você poderia enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  };

  return handleError;
}