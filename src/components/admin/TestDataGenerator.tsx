import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, TestTube, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleGenerateTestData = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('create_test_data');
      
      if (error) throw error;
      
      toast({
        title: 'Dados de Teste Criados',
        description: 'Dados de teste foram criados com sucesso. Recarregue a página para ver os dados.',
        variant: 'default',
      });

      console.log('Test data result:', data);
    } catch (error: any) {
      console.error('Error creating test data:', error);
      toast({
        title: 'Erro ao Criar Dados de Teste',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestNotificationSystem = async () => {
    setIsTesting(true);
    try {
      // Manually trigger the daily notifications function
      const { data, error } = await supabase.functions.invoke('daily-notifications', {
        body: { manual_test: true, timestamp: new Date().toISOString() }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Sistema de Notificações Testado',
        description: 'Função executada com sucesso. Verifique os logs no Supabase.',
        variant: 'default',
      });

      console.log('Notification system test result:', data);
    } catch (error: any) {
      console.error('Error testing notification system:', error);
      toast({
        title: 'Erro no Teste do Sistema',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerador de Dados de Teste
          </CardTitle>
          <CardDescription>
            Cria dados de teste para certificações, atestados técnicos e documentos jurídicos com diferentes status de validade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">4 Certificações</Badge>
            <Badge variant="outline">2 Atestados Técnicos</Badge>
            <Badge variant="outline">3 Documentos Jurídicos</Badge>
            <Badge variant="secondary">Status Variados</Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Dados que serão criados:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Certificações com status: expiring (2), expired (1), valid (1)</li>
              <li>• Atestados técnicos: expiring (1), expired (1)</li>
              <li>• Documentos jurídicos: expiring (1), expired (1), valid (1)</li>
              <li>• Notificação de teste do sistema</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerateTestData} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Dados de Teste
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste do Sistema de Notificações
          </CardTitle>
          <CardDescription>
            Executa manualmente a função de notificações diárias para testar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              O que este teste faz:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Executa update_document_status() para atualizar status</li>
              <li>• Cria notificações para documentos vencendo</li>
              <li>• Remove notificações antigas (30+ dias)</li>
              <li>• Gera estatísticas do sistema</li>
              <li>• Cria notificação de teste</li>
            </ul>
          </div>

          <Button 
            onClick={handleTestNotificationSystem} 
            disabled={isTesting}
            variant="outline"
            className="w-full"
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Testar Sistema de Notificações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}