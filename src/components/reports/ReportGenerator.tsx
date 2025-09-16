import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { generateReport } from '@/lib/utils/reports';
import { useToast } from '@/hooks/use-toast';

interface ReportGeneratorProps {
  data: any[];
  type: 'certifications' | 'documents' | 'attestations';
  title: string;
}

export function ReportGenerator({ data, type, title }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    status: 'all',
    includeExpired: false,
  });

  const getReportFields = () => {
    switch (type) {
      case 'certifications':
        return [
          { key: 'name', label: 'Nome da Certificação' },
          { key: 'function', label: 'Função' },
          { key: 'validity_date', label: 'Data de Validade', format: (date: string) => new Date(date).toLocaleDateString('pt-BR') },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Data de Criação', format: (date: string) => new Date(date).toLocaleDateString('pt-BR') },
        ];
      case 'documents':
        return [
          { key: 'document_name', label: 'Nome do Documento' },
          { key: 'document_type', label: 'Tipo' },
          { key: 'document_subtype', label: 'Subtipo' },
          { key: 'validity_date', label: 'Data de Validade', format: (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : 'N/A' },
          { key: 'status', label: 'Status' },
          { key: 'is_sensitive', label: 'Sensível', format: (value: boolean) => value ? 'Sim' : 'Não' },
        ];
      case 'attestations':
        return [
          { key: 'project_object', label: 'Objeto do Projeto' },
          { key: 'client_name', label: 'Cliente' },
          { key: 'issuer_name', label: 'Emissor' },
          { key: 'project_period_start', label: 'Início', format: (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : 'N/A' },
          { key: 'project_period_end', label: 'Fim', format: (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : 'N/A' },
          { key: 'project_value', label: 'Valor', format: (value: number) => value ? `R$ ${value.toLocaleString('pt-BR')}` : 'N/A' },
        ];
      default:
        return [];
    }
  };

  const generateSummary = (filteredData: any[]) => {
    const summary: Record<string, any> = {
      'Total de Registros': filteredData.length,
    };

    if (type === 'certifications' || type === 'documents') {
      const validCount = filteredData.filter(item => item.status === 'valid').length;
      const expiredCount = filteredData.filter(item => item.status === 'expired').length;
      const expiringSoonCount = filteredData.filter(item => item.status === 'expiring_soon').length;

      summary['Válidos'] = validCount;
      summary['Vencidos'] = expiredCount;
      summary['Vencendo em Breve'] = expiringSoonCount;
    }

    return summary;
  };

  const filterData = () => {
    return data.filter(item => {
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const itemDate = new Date(item.created_at);
        if (filters.dateFrom && itemDate < filters.dateFrom) return false;
        if (filters.dateTo && itemDate > filters.dateTo) return false;
      }

      // Expired filter
      if (!filters.includeExpired && item.status === 'expired') {
        return false;
      }

      return true;
    });
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const filteredData = filterData();
      const fields = getReportFields();
      const summary = generateSummary(filteredData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

      generateReport(filteredData, {
        title: `${title} - Relatório Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        fields,
        summary,
        filename,
        type: format,
      });

      toast({
        title: 'Relatório gerado com sucesso!',
        description: `O arquivo ${format.toUpperCase()} foi baixado.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = filterData();

  return (
    <Card className="card-corporate">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gerador de Relatórios</h3>
          <p className="text-sm text-muted-foreground">
            Configure os filtros e exporte os dados em diferentes formatos
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valid">Válido</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="expiring_soon">Vencendo em Breve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <DatePicker
              date={filters.dateFrom}
              onDateChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <DatePicker
              date={filters.dateTo}
              onDateChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="invisible">Opções</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExpired"
                checked={filters.includeExpired}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeExpired: !!checked }))}
              />
              <Label htmlFor="includeExpired" className="text-sm">
                Incluir vencidos
              </Label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Resumo dos Dados Filtrados</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de registros:</span>
              <div className="font-semibold text-primary">{filteredData.length}</div>
            </div>
            {type !== 'attestations' && (
              <>
                <div>
                  <span className="text-muted-foreground">Válidos:</span>
                  <div className="font-semibold text-success">
                    {filteredData.filter(item => item.status === 'valid').length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencidos:</span>
                  <div className="font-semibold text-danger">
                    {filteredData.filter(item => item.status === 'expired').length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencendo:</span>
                  <div className="font-semibold text-warning">
                    {filteredData.filter(item => item.status === 'expiring_soon').length}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={loading || filteredData.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>

          <Button
            onClick={() => handleExport('excel')}
            disabled={loading || filteredData.length === 0}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>

          <Button
            onClick={() => handleExport('csv')}
            disabled={loading || filteredData.length === 0}
            variant="outline"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <FileDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>
    </Card>
  );
}