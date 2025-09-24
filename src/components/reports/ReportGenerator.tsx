import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { generateReport, getFieldMappings } from '@/lib/utils/reports';
import { ReportConfig, ReportDataType, ReportSummary } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';

interface ReportGeneratorProps {
  data: any[];
  type: ReportDataType;
  title: string;
  userNames?: Record<string, string>; // For including user names in reports
}

export function ReportGenerator({ data, type, title, userNames = {} }: ReportGeneratorProps) {
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    status: 'all',
    includeExpired: false,
    pdfStyle: 'synthetic' as 'synthetic' | 'detailed', // New PDF style option
  });

  // Enhanced data processing with user names
  const enrichedData = data.map(item => ({
    ...item,
    full_name: userNames[item.user_id] || 'N/A'
  }));

  const generateSummary = (filteredData: any[]): ReportSummary => {
    const summary: ReportSummary = {
      totalRecords: filteredData.length,
      byStatus: {},
    };

    // Count by status for all document types
    const statusCounts = filteredData.reduce((acc, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    summary.byStatus = {
      'Válidos': statusCounts.valid || 0,
      'Expirando': statusCounts.expiring || 0,
      'Expirados': statusCounts.expired || 0,
      'Pendentes': statusCounts.pending || 0,
    };

    // Type-specific metrics
    if (type === 'certifications') {
      const approvedEquivalences = filteredData.filter(item => item.approved_equivalence).length;
      summary.additionalMetrics = {
        'Equivalências Aprovadas': approvedEquivalences,
        'Equivalências Pendentes': filteredData.length - approvedEquivalences,
      };
    }

    if (type === 'attestations') {
      const withValue = filteredData.filter(item => item.project_value && item.project_value > 0);
      const totalValue = withValue.reduce((sum, item) => sum + (item.project_value || 0), 0);
      summary.additionalMetrics = {
        'Projetos com Valor': withValue.length,
        'Valor Total dos Projetos': `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      };
    }

    if (type === 'documents') {
      const sensitiveCount = filteredData.filter(item => item.is_sensitive).length;
      summary.additionalMetrics = {
        'Documentos Sensíveis': sensitiveCount,
        'Documentos Públicos': filteredData.length - sensitiveCount,
      };
    }

    return summary;
  };

  const filterData = () => {
    return enrichedData.filter(item => {
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
      
      if (filteredData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum dado para exportar',
          description: 'Aplique filtros diferentes para incluir dados no relatório.',
        });
        return;
      }

      // Get field mappings based on type
      const fields = getFieldMappings[type as keyof typeof getFieldMappings]?.() || [];

      const summary = generateSummary(filteredData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

      const config: ReportConfig = {
        title: title,
        fields,
        summary: {
          ...summary.byStatus,
          ...summary.additionalMetrics,
          'Total de Registros': summary.totalRecords,
        },
        filename,
        type: format,
        pdfStyle: format === 'pdf' ? filters.pdfStyle : undefined, // Include PDF style for PDF exports
        branding: {
          subtitle: `Relatório de ${title}`,
          company: settings?.export.company_name || 'Sistema de Gestão Documental',
          logo: settings?.export.logo_url,
          footer: settings?.export.footer_text || 'Documento gerado automaticamente pelo sistema de gestão documental',
          coverTemplate: settings?.export.cover_template || 'standard',
          auto_toc: settings?.export.auto_toc || false
        }
      };

      console.log('Starting export with config:', config);
      console.log('Filtered data sample:', filteredData.slice(0, 2)); // Log sample data
      await generateReport(filteredData, config);

      toast({
        title: 'Relatório gerado com sucesso!',
        description: `O arquivo ${format.toUpperCase()} foi baixado.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar relatório',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o relatório. Tente novamente.',
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
            <Label>Tipo de Relatório PDF</Label>
            <Select value={filters.pdfStyle} onValueChange={(value: 'synthetic' | 'detailed') => setFilters(prev => ({ ...prev, pdfStyle: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="synthetic">Sintético (Tabela)</SelectItem>
                <SelectItem value="detailed">
                  Detalhado (Com imagens{type === 'attestations' ? ' e anexos' : ''})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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

        {/* Summary */}
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Resumo dos Dados Filtrados</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de registros:</span>
              <div className="font-semibold text-primary">{filteredData.length}</div>
            </div>
            {type !== 'attestations' && type !== 'dashboard' && (
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
            {type === 'dashboard' && (
              <>
                <div>
                  <span className="text-muted-foreground">Certificações:</span>
                  <div className="font-semibold text-primary">
                    {filteredData.filter(item => item.type === 'certification').length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Atestados:</span>
                  <div className="font-semibold text-secondary">
                    {filteredData.filter(item => item.type === 'certificate').length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Documentos:</span>
                  <div className="font-semibold text-accent">
                    {filteredData.filter(item => item.type === 'document').length}
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
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">Nenhum dado encontrado</p>
            <p className="text-sm">Ajuste os filtros para incluir mais dados no relatório</p>
          </div>
        )}
      </div>
    </Card>
  );
}