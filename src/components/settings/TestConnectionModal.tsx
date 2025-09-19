import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { 
  TestTube2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  Info,
  Zap,
  DollarSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TestConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

interface TestResult {
  success: boolean;
  message: string;
  model?: string;
  latency?: number;
  tokensUsed?: number;
  estimatedCost?: number;
  error?: string;
  statusCode?: number;
  fullError?: any;
}

const ERROR_SOLUTIONS = {
  401: "Chave da API inválida ou expirada. Verifique se a chave está correta.",
  403: "Acesso negado. Verifique suas permissões ou limite da conta.",
  429: "Limite de taxa excedido. Aguarde alguns minutos antes de tentar novamente.",
  500: "Erro interno do servidor. Tente novamente mais tarde ou entre em contato com o suporte.",
  timeout: "Requisição expirou. Tente aumentar o timeout ou verifique sua conexão.",
  network: "Erro de rede. Verifique sua conexão com a internet."
};

export function TestConnectionModal({ 
  open, 
  onOpenChange, 
  provider, 
  model, 
  apiKey,
  temperature,
  maxTokens,
  timeout
}: TestConnectionModalProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testModel, setTestModel] = useState(model);
  const [testHistory, setTestHistory] = useState<Array<{
    timestamp: Date;
    provider: string;
    model: string;
    success: boolean;
    latency?: number;
  }>>([]);

  // Sync testModel with the model prop when modal opens or model changes
  useEffect(() => {
    if (open && model) {
      setTestModel(model);
    }
  }, [open, model]);

  const runTest = async (manualModel?: string) => {
    setTesting(true);
    const targetModel = manualModel || testModel || model;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: {
          provider,
          model: targetModel,
          apiKey,
          temperature,
          maxTokens,
          timeout
        }
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (error) throw error;

      const result: TestResult = {
        success: data.success,
        message: data.message,
        model: targetModel,
        latency,
        tokensUsed: data.tokensUsed,
        estimatedCost: data.estimatedCost,
        error: data.error,
        statusCode: data.statusCode,
        fullError: data.fullError
      };

      setResults(prev => [result, ...prev]);
      
      // Update test history
      setTestHistory(prev => [{
        timestamp: new Date(),
        provider,
        model: targetModel,
        success: data.success,
        latency
      }, ...prev.slice(0, 9)]); // Keep last 10 tests

      if (data.success) {
        toast({
          title: "✅ Conexão Bem-sucedida!",
          description: `${data.message} (${latency}ms)`,
        });
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      const result: TestResult = {
        success: false,
        message: "Erro ao testar conexão",
        error: error.message,
        fullError: error
      };
      setResults(prev => [result, ...prev]);
      
      toast({
        title: "❌ Falha na Conexão",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyError = (result: TestResult) => {
    const errorText = JSON.stringify({
      provider,
      model: result.model,
      error: result.error,
      statusCode: result.statusCode,
      fullError: result.fullError,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    navigator.clipboard.writeText(errorText);
    toast({
      title: "Erro copiado!",
      description: "Detalhes do erro copiados para área de transferência.",
    });
  };

  const getSolution = (result: TestResult) => {
    // Check for deprecation messages
    if (result.error?.includes('decommissioned') || result.error?.includes('deprecated')) {
      const match = result.error.match(/https:\/\/[^\s"]+/);
      const docLink = match ? match[0] : null;
      return `⚠️ Modelo descontinuado! ${docLink ? `Consulte: ${docLink}` : 'Verifique a documentação do provedor para modelos alternativos.'}`;
    }
    
    if (result.statusCode) {
      return ERROR_SOLUTIONS[result.statusCode as keyof typeof ERROR_SOLUTIONS];
    }
    if (result.error?.includes('timeout')) {
      return ERROR_SOLUTIONS.timeout;
    }
    if (result.error?.includes('network') || result.error?.includes('fetch')) {
      return ERROR_SOLUTIONS.network;
    }
    return "Erro desconhecido. Verifique os logs para mais detalhes.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Teste de Conexão IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Test Configuration */}
          <div className="p-4 rounded-lg bg-accent/20">
            <h4 className="font-medium mb-3">Configuração de Teste</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-model">Modelo para Teste</Label>
                <Input
                  id="test-model"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="Digite o nome do modelo"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Provedor:</strong> {provider}</div>
                <div><strong>Temperature:</strong> {temperature}</div>
                <div><strong>Max Tokens:</strong> {maxTokens}</div>
                <div><strong>Timeout:</strong> {timeout}s</div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => runTest()}
              disabled={testing || !provider || !apiKey || !testModel}
              className="gap-2"
            >
              <TestTube2 className="h-4 w-4" />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            <Button 
              onClick={() => setTestModel(model)}
              disabled={testing}
              variant="outline" 
              size="sm"
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
              Usar Modelo Padrão
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {results.length === 0 && !testing && (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Execute um teste para ver os resultados</p>
                </div>
              )}

              {testing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Testando conexão...</span>
                </div>
              )}

              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'border-success/20 bg-success/5' 
                    : 'border-danger/20 bg-danger/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-danger" />
                      )}
                      <span className="font-medium">
                        {result.success ? 'Sucesso' : 'Falhou'}
                      </span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.model}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {result.latency && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.latency}ms
                        </div>
                      )}
                      {result.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${result.estimatedCost.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm mb-2">{result.message}</p>

                  {result.tokensUsed && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Tokens utilizados: {result.tokensUsed}
                    </div>
                  )}

                  {!result.success && result.error && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">Solução Sugerida:</span>
                      </div>
                      <p className="text-sm bg-warning/10 p-2 rounded">
                        {getSolution(result)}
                      </p>
                      
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver detalhes técnicos
                        </summary>
                        <div className="mt-2 p-2 bg-muted/50 rounded font-mono text-xs">
                          <pre className="whitespace-pre-wrap select-all">
                            {JSON.stringify({
                              error: result.error,
                              statusCode: result.statusCode,
                              fullError: result.fullError
                            }, null, 2)}
                          </pre>
                        </div>
                      </details>
                      
                      <Button
                        onClick={() => copyError(result)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar Erro
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Test History */}
          {testHistory.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h4 className="font-medium mb-2">Histórico de Testes</h4>
              <div className="space-y-1">
                {testHistory.slice(0, 5).map((test, index) => (
                  <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {test.timestamp.toLocaleTimeString()} - {test.provider}/{test.model}
                    </span>
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <XCircle className="h-3 w-3 text-danger" />
                      )}
                      {test.latency && <span>{test.latency}ms</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}