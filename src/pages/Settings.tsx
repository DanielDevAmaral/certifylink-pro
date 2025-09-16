import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings, useUpdateSettings, useBackupSettings, useRestoreSettings } from "@/hooks/useSettings";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Bot,
  Bell,
  Download,
  Shield,
  Key,
  Save
} from "lucide-react";

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const backupSettings = useBackupSettings();
  const restoreSettings = useRestoreSettings();

  const [localSettings, setLocalSettings] = useState({
    ai: {
      provider: settings?.ai?.provider || '',
      api_key: settings?.ai?.api_key || '',
      prompt_template: settings?.ai?.prompt_template || '',
      auto_suggestions: settings?.ai?.auto_suggestions ?? false
    },
    notifications: {
      expiration_alert_days: settings?.notifications?.expiration_alert_days ?? 30,
      email_notifications: settings?.notifications?.email_notifications ?? true,
      leader_notifications: settings?.notifications?.leader_notifications ?? true
    },
    export: {
      company_name: settings?.export?.company_name || '',
      logo_url: settings?.export?.logo_url || '',
      footer_text: settings?.export?.footer_text || '',
      cover_template: settings?.export?.cover_template || '',
      auto_toc: settings?.export?.auto_toc ?? true
    },
    security: {
      data_encryption: settings?.security?.data_encryption ?? true,
      audit_logging: settings?.security?.audit_logging ?? true,
      sensitive_access: settings?.security?.sensitive_access ?? false,
      session_timeout: settings?.security?.session_timeout ?? 60
    }
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ai: settings.ai,
        notifications: settings.notifications,
        export: settings.export,
        security: settings.security
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(localSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleBackup = async () => {
    try {
      await backupSettings.mutateAsync();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await restoreSettings.mutateAsync(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error restoring settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao restaurar configurações. Verifique o arquivo.',
        variant: 'destructive'
      });
    }
  };

  const updateLocalSetting = (category: keyof typeof localSettings, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Configurações do Sistema"
        description="Personalize as configurações da plataforma de gestão documental"
      >
        <Button 
          onClick={handleBackup}
          variant="outline" 
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Backup
        </Button>
        <Button 
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="btn-corporate gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </PageHeader>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="ai" className="flex flex-col gap-2 h-auto py-4">
            <Bot className="h-5 w-5" />
            <span className="text-xs">IA & Equivalências</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex flex-col gap-2 h-auto py-4">
            <Bell className="h-5 w-5" />
            <span className="text-xs">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex flex-col gap-2 h-auto py-4">
            <Download className="h-5 w-5" />
            <span className="text-xs">Exportação</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex flex-col gap-2 h-auto py-4">
            <Shield className="h-5 w-5" />
            <span className="text-xs">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card className="card-corporate">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Configuração de IA</h3>
                <p className="text-sm text-muted-foreground">
                  Configure a inteligência artificial para sugestão de equivalências
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">Provedor de IA</Label>
                  <Input id="ai-provider" placeholder="OpenAI, Anthropic, etc." value={localSettings.ai.provider} onChange={(e) => updateLocalSetting('ai', 'provider', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-key">Chave da API</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="ai-key" type="password" placeholder="sk-..." className="pl-10" value={localSettings.ai.api_key} onChange={(e) => updateLocalSetting('ai', 'api_key', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Prompt para Equivalências</Label>
                <Textarea
                  id="ai-prompt"
                  rows={4}
                  placeholder="Baseado na certificação fornecida, sugira serviços equivalentes que podem ser executados..."
                  value={localSettings.ai.prompt_template}
                  onChange={(e) => updateLocalSetting('ai', 'prompt_template', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                <div>
                  <p className="font-medium text-foreground">Ativar Sugestões Automáticas</p>
                  <p className="text-sm text-muted-foreground">
                    Gerar equivalências automaticamente ao cadastrar certificações
                  </p>
                </div>
                <Switch checked={localSettings.ai.auto_suggestions} onCheckedChange={(val) => updateLocalSetting('ai', 'auto_suggestions', val)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-corporate">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Alertas de Validade</h3>
                <p className="text-sm text-muted-foreground">
                  Configure quando receber notificações de vencimento
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="expiration-days">Dias antes do vencimento</Label>
                <Input
                  id="expiration-days"
                  type="number"
                  value={localSettings.notifications.expiration_alert_days}
                  onChange={(e) => updateLocalSetting('notifications', 'expiration_alert_days', Number(e.target.value))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por email para vencimentos
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.email_notifications}
                    onCheckedChange={(val) => updateLocalSetting('notifications', 'email_notifications', val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Notificações para Líderes</p>
                    <p className="text-sm text-muted-foreground">
                      Líderes recebem alertas da equipe
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.leader_notifications}
                    onCheckedChange={(val) => updateLocalSetting('notifications', 'leader_notifications', val)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="card-corporate">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Configurações de Exportação</h3>
                <p className="text-sm text-muted-foreground">
                  Personalize os relatórios e documentos exportados
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input id="company-name" placeholder="Nome da empresa para cabeçalho" value={localSettings.export.company_name} onChange={(e) => updateLocalSetting('export', 'company_name', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-logo">Logo da Empresa (URL)</Label>
                <Input id="company-logo" placeholder="https://exemplo.com/logo.png" value={localSettings.export.logo_url} onChange={(e) => updateLocalSetting('export', 'logo_url', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                <Textarea
                  id="footer-text"
                  rows={3}
                  placeholder="Texto personalizado para o rodapé dos documentos..."
                  value={localSettings.export.footer_text}
                  onChange={(e) => updateLocalSetting('export', 'footer_text', e.target.value)}
                />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover-template">Template de Capa</Label>
                <Textarea
                  id="cover-template"
                  rows={3}
                  placeholder="Template HTML/CSS para capa dos relatórios..."
                  value={localSettings.export.cover_template}
                  onChange={(e) => updateLocalSetting('export', 'cover_template', e.target.value)}
                />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                <div>
                  <p className="font-medium text-foreground">Incluir Sumário Automático</p>
                  <p className="text-sm text-muted-foreground">
                    Gerar índice automático nos relatórios PDF
                  </p>
                </div>
                <Switch checked={localSettings.export.auto_toc} onCheckedChange={(val) => updateLocalSetting('export', 'auto_toc', val)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="card-corporate">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                <Shield className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Configurações de Segurança</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie criptografia e controle de acesso
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Criptografia de Dados Sensíveis</p>
                    <p className="text-sm text-muted-foreground">
                      Criptografar RG, CPF e documentos marcados como sensíveis
                    </p>
                  </div>
                  <Switch checked={localSettings.security.data_encryption} onCheckedChange={(val) => updateLocalSetting('security', 'data_encryption', val)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Log de Auditoria</p>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações dos usuários
                    </p>
                  </div>
                  <Switch checked={localSettings.security.audit_logging} onCheckedChange={(val) => updateLocalSetting('security', 'audit_logging', val)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Acesso a Dados Sensíveis</p>
                    <p className="text-sm text-muted-foreground">
                      Apenas Admins podem ver documentos sensíveis
                    </p>
                  </div>
                  <Switch checked={localSettings.security.sensitive_access} onCheckedChange={(val) => updateLocalSetting('security', 'sensitive_access', val)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input id="session-timeout" type="number" value={localSettings.security.session_timeout} onChange={(e) => updateLocalSetting('security', 'session_timeout', Number(e.target.value))} />
              </div>

              <div className="p-4 rounded-lg border border-warning/50 bg-warning-light">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-warning" />
                  <p className="font-medium text-warning">Configuração Avançada</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para configurações avançadas de segurança e integração com Supabase RLS,
                  consulte a documentação técnica ou entre em contato com o suporte.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}