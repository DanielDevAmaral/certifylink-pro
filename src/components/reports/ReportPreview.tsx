import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReportPreviewProps {
  data: any[];
  availableColumns: Array<{ key: string; label: string }>;
  onExport: (selectedColumns: string[]) => void;
  isExporting?: boolean;
}

export function ReportPreview({ data, availableColumns, onExport, isExporting = false }: ReportPreviewProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.map(col => col.key)
  );
  const [showPreview, setShowPreview] = useState(false);

  const handleToggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(col => col.key));
    }
  };

  const previewData = data.slice(0, 10);
  const selectedColumnsData = availableColumns.filter(col => selectedColumns.includes(col.key));

  return (
    <div className="space-y-4">
      <Card className="card-corporate">
        <CardHeader>
          <CardTitle className="text-base">Personalizar Colunas do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedColumns.length === availableColumns.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Selecionar Todas ({selectedColumns.length}/{availableColumns.length})
              </Label>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableColumns.map((column) => (
                  <div key={column.key} className="flex items-center gap-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => handleToggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Ocultar' : 'Visualizar'} Preview
              </Button>
              <Button
                size="sm"
                onClick={() => onExport(selectedColumns)}
                disabled={selectedColumns.length === 0 || isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="text-base">Preview do Relatório</CardTitle>
            <p className="text-sm text-muted-foreground">
              Exibindo primeiras 10 linhas de {data.length} registros
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedColumnsData.map((column) => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={selectedColumnsData.length}
                          className="text-center text-muted-foreground"
                        >
                          Nenhum dado disponível
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewData.map((row, index) => (
                        <TableRow key={index}>
                          {selectedColumnsData.map((column) => (
                            <TableCell key={column.key}>
                              {formatCellValue(row[column.key], column.key)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCellValue(value: any, columnKey: string): string {
  if (value === null || value === undefined) return '-';
  
  // Format dates
  if (columnKey.includes('date') || columnKey.includes('_at')) {
    try {
      return new Date(value).toLocaleDateString('pt-BR');
    } catch {
      return String(value);
    }
  }

  // Format arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  // Format objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
