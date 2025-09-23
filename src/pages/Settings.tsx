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
import { AIProviderConfig } from "@/components/settings/AIProviderConfig";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { toast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Bot,
  Bell,
  Download,
  Shield,
  Save
} from "lucide-react";

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const backupSettings = useBackupSettings();
  const restoreSettings = useRestoreSettings();
  const [testingConnection, setTestingConnection] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    ai: {
      provider: settings?.ai?.provider || '',
      model: settings?.ai?.model || '',
      api_key: settings?.ai?.api_key || '',
      prompt_template: settings?.ai?.prompt_template || '',
      auto_suggestions: settings?.ai?.auto_suggestions ?? false,
      temperature: settings?.ai?.temperature ?? 0.7,
      max_tokens: settings?.ai?.max_tokens ?? 1000,
      timeout: settings?.ai?.timeout ?? 30
    },
    notifications: {
      expiration_alert_days: settings?.notifications?.expiration_alert_days ?? 30,
      certification_alert_days: settings?.notifications?.certification_alert_days ?? 60,
      technical_attestation_alert_days: settings?.notifications?.technical_attestation_alert_days ?? 45,
      legal_document_alert_days: settings?.notifications?.legal_document_alert_days ?? 30,
      badge_alert_days: settings?.notifications?.badge_alert_days ?? 30
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

  const updateAISetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
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
          <AIProviderConfig 
            settings={localSettings.ai}
            onUpdate={updateAISetting}
          />
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
                  Configure quando receber notificações de vencimento por tipo de documento
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="certification-days">Certificações (dias antes)</Label>
                  <Input
                    id="certification-days"
                    type="number"
                    min="1"
                    max="365"
                    value={localSettings.notifications.certification_alert_days}
                    onChange={(e) => updateLocalSetting('notifications', 'certification_alert_days', Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Alerta sobre certificações que vencerão em X dias
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technical-days">Atestados Técnicos (dias antes)</Label>
                  <Input
                    id="technical-days"
                    type="number"
                    min="1"
                    max="365"
                    value={localSettings.notifications.technical_attestation_alert_days}
                    onChange={(e) => updateLocalSetting('notifications', 'technical_attestation_alert_days', Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Alerta sobre atestados técnicos que vencerão em X dias
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal-days">Documentos Legais (dias antes)</Label>
                  <Input
                    id="legal-days"
                    type="number"
                    min="1"
                    max="365"
                    value={localSettings.notifications.legal_document_alert_days}
                    onChange={(e) => updateLocalSetting('notifications', 'legal_document_alert_days', Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Alerta sobre documentos legais que vencerão em X dias
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration-days">Padrão Geral (dias antes)</Label>
                  <Input
                    id="expiration-days"
                    type="number"
                    min="1"
                    max="365"
                    value={localSettings.notifications.expiration_alert_days}
                    onChange={(e) => updateLocalSetting('notifications', 'expiration_alert_days', Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Configuração padrão para outros tipos de documentos
                  </p>
                </div>
              </div>


              <div className="p-4 rounded-lg border border-info/50 bg-info/10">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-info" />
                  <p className="font-medium text-info">Sistema de Notificações Internas</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Certificações:</strong> Notificação interna criada quando faltam {localSettings.notifications.certification_alert_days} dias ou menos</li>
                  <li>• <strong>Atestados Técnicos:</strong> Notificação interna criada quando faltam {localSettings.notifications.technical_attestation_alert_days} dias ou menos</li>
                  <li>• <strong>Documentos Legais:</strong> Notificação interna criada quando faltam {localSettings.notifications.legal_document_alert_days} dias ou menos</li>
                  <li>• <strong>Todas as notificações são enviadas apenas dentro da plataforma</strong> - sem emails externos</li>
                </ul>
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
                <Label htmlFor="company-logo">Logo da Empresa</Label>
                <LogoUpload 
                  currentLogo={localSettings.export.logo_url}
                  onLogoChange={(logoUrl) => updateLocalSetting('export', 'logo_url', logoUrl)}
                />
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