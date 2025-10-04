import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Save, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  selectedColumns: string[];
  filters: any;
  createdAt: string;
}

interface ReportTemplatesProps {
  reportType: string;
  currentConfig: {
    selectedColumns: string[];
    filters: any;
  };
  onLoadTemplate: (template: ReportTemplate) => void;
}

export function ReportTemplates({ reportType, currentConfig, onLoadTemplate }: ReportTemplatesProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => {
    const saved = localStorage.getItem(`report-templates-${reportType}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, informe um nome para o template.',
      });
      return;
    }

    const newTemplate: ReportTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      description: templateDescription.trim(),
      type: reportType,
      selectedColumns: currentConfig.selectedColumns,
      filters: currentConfig.filters,
      createdAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(`report-templates-${reportType}`, JSON.stringify(updatedTemplates));

    setTemplateName('');
    setTemplateDescription('');

    toast({
      title: 'Template salvo com sucesso!',
      description: `O template "${newTemplate.name}" foi salvo e pode ser reutilizado.`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem(`report-templates-${reportType}`, JSON.stringify(updatedTemplates));

    toast({
      title: 'Template excluído',
      description: 'O template foi removido com sucesso.',
    });

    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleDeleteClick = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const handleLoadTemplate = (template: ReportTemplate) => {
    onLoadTemplate(template);
    toast({
      title: 'Template carregado',
      description: `Configurações do template "${template.name}" foram aplicadas.`,
    });
  };

  return (
    <>
      <Card className="card-corporate">
        <CardHeader>
          <CardTitle className="text-base">Templates Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Save new template */}
            <div className="space-y-3 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  placeholder="Ex: Relatório Mensal de Certificações"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Descrição (opcional)</Label>
                <Input
                  id="template-description"
                  placeholder="Descrição do template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
              <Button onClick={saveTemplate} size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configuração Atual
              </Button>
            </div>

            {/* List templates */}
            <div className="space-y-2">
              <Label>Templates Disponíveis ({templates.length})</Label>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum template salvo ainda. Configure os filtros e colunas e salve como template.
                </p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <h4 className="font-medium text-sm">{template.name}</h4>
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {template.selectedColumns.length} colunas
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadTemplate(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(template.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && deleteTemplate(templateToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
