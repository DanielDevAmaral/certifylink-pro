import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  return (
    <Layout>
      <PageHeader
        title="Configurações do Sistema"
        description="Personalize as configurações da plataforma de gestão documental"
      >
        <Button className="btn-corporate gap-2">
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
                  <Input id="ai-provider" placeholder="OpenAI, Anthropic, etc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-key">Chave da API</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="ai-key" type="password" placeholder="sk-..." className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Prompt para Equivalências</Label>
                <Textarea
                  id="ai-prompt"
                  rows={4}
                  placeholder="Baseado na certificação fornecida, sugira serviços equivalentes que podem ser executados..."
                  defaultValue="Baseado na certificação fornecida, sugira até 5 serviços técnicos específicos que o profissional certificado pode executar em projetos governamentais e corporativos. Foque em atividades práticas e mensuráveis relacionadas à área de conhecimento da certificação."
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                <div>
                  <p className="font-medium text-foreground">Ativar Sugestões Automáticas</p>
                  <p className="text-sm text-muted-foreground">
                    Gerar equivalências automaticamente ao cadastrar certificações
                  </p>
                </div>
                <Switch defaultChecked />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warning-60">Primeiro Alerta (dias)</Label>
                  <Input id="warning-60" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warning-30">Segundo Alerta (dias)</Label>
                  <Input id="warning-30" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warning-7">Alerta Final (dias)</Label>
                  <Input id="warning-7" type="number" defaultValue="7" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Email de Certificações</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações por email para certificações vencendo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Email de Documentos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações por email para documentos vencendo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Notificações para Líderes</p>
                    <p className="text-sm text-muted-foreground">
                      Líderes recebem alertas da equipe
                    </p>
                  </div>
                  <Switch defaultChecked />
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
                <Input id="company-name" placeholder="Nome da empresa para cabeçalho" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-logo">Logo da Empresa (URL)</Label>
                <Input id="company-logo" placeholder="https://exemplo.com/logo.png" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                  <Textarea
                    id="footer-text"
                    rows={3}
                    placeholder="Texto personalizado para o rodapé dos documentos..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover-template">Template de Capa</Label>
                  <Textarea
                    id="cover-template"
                    rows={3}
                    placeholder="Template HTML/CSS para capa dos relatórios..."
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
                <Switch defaultChecked />
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
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Log de Auditoria</p>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações dos usuários
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium text-foreground">Acesso a Dados Sensíveis</p>
                    <p className="text-sm text-muted-foreground">
                      Apenas Admins podem ver documentos sensíveis
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
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