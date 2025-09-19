import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData, ReportConfig, ReportField, ReportSummary } from '@/types/reports';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Enhanced report data validation
function validateReportData(data: any[]): string[] {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return errors;
  }
  
  if (data.length === 0) {
    errors.push('Data array cannot be empty');
  }
  
  return errors;
}

// Safe data sanitization that preserves international characters
function sanitizeForPDF(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  if (Array.isArray(value)) return value.join(', ');
  
  return String(value)
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
    .trim();
}

// Format field values based on field type
function formatFieldValue(value: any, field: ReportField): string {
  if (field.format) {
    try {
      return field.format(value);
    } catch (error) {
      console.warn(`Error formatting field ${field.key}:`, error);
      return sanitizeForPDF(value);
    }
  }
  
  switch (field.type) {
    case 'date':
      return value ? new Date(value).toLocaleDateString('pt-BR') : 'N/A';
    case 'currency':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A';
    case 'number':
      return value !== null && value !== undefined ? Number(value).toLocaleString('pt-BR') : 'N/A';
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'array':
      return Array.isArray(value) ? value.join(', ') : (value || 'N/A');
    default:
      return sanitizeForPDF(value);
  }
}

// Export to Excel/CSV
export function exportToExcel(reportData: ReportData, filename: string) {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet with data
  const ws = XLSX.utils.aoa_to_sheet([
    reportData.headers,
    ...reportData.data
  ]);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  
  // Add summary sheet if available
  if (reportData.summary) {
    const summaryData = Object.entries(reportData.summary).map(([key, value]) => [key, value]);
    const summaryWs = XLSX.utils.aoa_to_sheet([
      ['Métrica', 'Valor'],
      ...summaryData
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
  }
  
  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export to CSV
export function exportToCSV(reportData: ReportData, filename: string) {
  const csvContent = [
    reportData.headers.join(','),
    ...reportData.data.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Enhanced PDF export with proper formatting and branding
export function exportToPDF(reportData: ReportData, filename: string, config?: Partial<ReportConfig>) {
  try {
    console.log('Starting PDF export with data:', { 
      title: reportData.title, 
      headers: reportData.headers, 
      dataCount: reportData.data?.length 
    });

    // Validate data
    const errors = validateReportData(reportData.data);
    if (errors.length > 0) {
      throw new Error(`Data validation failed: ${errors.join(', ')}`);
    }

    if (!reportData.headers || reportData.headers.length === 0) {
      throw new Error('Headers are required for PDF generation');
    }

    const doc = new jsPDF({
      orientation: reportData.headers.length > 6 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentY = 20;

    // Corporate header with branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210); // Primary blue
    doc.text(reportData.title || 'Relatório Corporativo', 20, currentY);
    currentY += 10;

    // Subtitle and metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    if (config?.branding?.subtitle) {
      doc.text(config.branding.subtitle, 20, currentY);
      currentY += 7;
    }

    // Generation info
    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 20, currentY);
    currentY += 5;
    
    if (reportData.metadata?.totalRecords) {
      doc.text(`Total de registros: ${reportData.metadata.totalRecords}`, 20, currentY);
      currentY += 8;
    } else {
      currentY += 3;
    }

    // Calculate column widths dynamically
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40; // 20mm on each side
    const availableWidth = pageWidth - margin;
    const columnWidth = availableWidth / reportData.headers.length;
    const minColumnWidth = 25; // Minimum column width
    const maxColumnWidth = 50; // Maximum column width

    const adjustedColumnWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, columnWidth));

    // Sanitize data properly without removing international characters
    const sanitizedData = reportData.data.map(row => 
      row.map(cell => sanitizeForPDF(cell))
    );

    // Add main data table
    autoTable(doc, {
      head: [reportData.headers],
      body: sanitizedData,
      startY: currentY,
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: reportData.headers.length > 6 ? 7 : 9,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        font: 'helvetica',
        textColor: [50, 50, 50],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [25, 118, 210], // Primary blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: reportData.headers.length > 6 ? 8 : 10,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: reportData.headers.reduce((acc, _, index) => {
        acc[index] = { cellWidth: adjustedColumnWidth };
        return acc;
      }, {} as Record<number, any>),
      didParseCell: function(data: any) {
        // Ensure proper text wrapping for long content
        if (data.cell.text && Array.isArray(data.cell.text)) {
          data.cell.text = data.cell.text.map((text: any) => String(text));
        }
      },
      didDrawPage: function(data: any) {
        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth - 30,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
    });

    // Add summary section if available
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
      
      // Check if we need a new page for summary
      if (finalY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY = finalY;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Resumo Executivo', 20, currentY);
      currentY += 10;

      const summaryEntries = Object.entries(reportData.summary);
      const summaryData = summaryEntries.map(([key, value]) => [
        key,
        sanitizeForPDF(value)
      ]);

      autoTable(doc, {
        head: [['Métrica', 'Valor']],
        body: summaryData,
        startY: currentY,
        margin: { left: 20, right: 20 },
        styles: {
          fontSize: 10,
          font: 'helvetica',
          cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 40 }
        }
      });
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);
    console.log('PDF export completed successfully');
    
  } catch (error) {
    console.error('PDF Export Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao gerar PDF: ${errorMessage}`);
  }
}

// Enhanced generic report generator with better error handling
export function generateReport(data: any[], config: ReportConfig) {
  try {
    console.log('Generating report with config:', { 
      title: config.title, 
      type: config.type, 
      dataCount: data.length,
      fields: config.fields.map(f => f.key)
    });

    // Validate input data
    const validationErrors = validateReportData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const headers = config.fields.map(field => field.label);
    
    // Enhanced data processing with better error handling
    const processedData = data.map((item, rowIndex) => {
      return config.fields.map((field, colIndex) => {
        try {
          const value = item[field.key];
          return formatFieldValue(value, field);
        } catch (error) {
          console.warn(`Error processing row ${rowIndex}, column ${colIndex} (${field.key}):`, error);
          return 'N/A';
        }
      });
    });

    const reportData: ReportData = {
      title: config.title,
      headers,
      data: processedData,
      summary: config.summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: data.length,
        filters: {} // Could be enhanced to include active filters
      }
    };

    console.log('Report data prepared:', {
      headers: reportData.headers,
      dataRows: reportData.data.length,
      hasSummary: !!reportData.summary
    });

    switch (config.type) {
      case 'excel':
        exportToExcel(reportData, config.filename);
        break;
      case 'csv':
        exportToCSV(reportData, config.filename);  
        break;
      case 'pdf':
        exportToPDF(reportData, config.filename, config);
        break;
      default:
        throw new Error(`Unsupported export type: ${config.type}`);
    }

  } catch (error) {
    console.error('Report generation error:', error);
    throw error; // Re-throw for component error handling
  }
}

// Enhanced field mapping functions for different data types
export const getFieldMappings = {
  certifications: (): ReportField[] => [
    { key: 'name', label: 'Nome da Certificação', type: 'text' },
    { key: 'function', label: 'Função', type: 'text' },
    { key: 'full_name', label: 'Responsável', type: 'text' },
    { key: 'validity_date', label: 'Data de Validade', type: 'date' },
    { key: 'status', label: 'Status', type: 'text', format: (status: string) => {
      const statusMap = {
        'valid': 'Válida',
        'expiring': 'Expirando',
        'expired': 'Expirada',
        'pending': 'Pendente'
      };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'approved_equivalence', label: 'Equivalência Aprovada', type: 'boolean' },
    { key: 'equivalence_services', label: 'Serviços de Equivalência', type: 'array' },
    { key: 'created_at', label: 'Data de Criação', type: 'date' }
  ],

  attestations: (): ReportField[] => [
    { key: 'client_name', label: 'Cliente', type: 'text' },
    { key: 'project_object', label: 'Objeto do Projeto', type: 'text' },
    { key: 'full_name', label: 'Responsável', type: 'text' },
    { key: 'issuer_name', label: 'Emissor', type: 'text' },
    { key: 'issuer_position', label: 'Cargo do Emissor', type: 'text' },
    { key: 'project_period_start', label: 'Início do Projeto', type: 'date' },
    { key: 'project_period_end', label: 'Fim do Projeto', type: 'date' },
    { key: 'project_value', label: 'Valor do Projeto', type: 'currency' },
    { key: 'validity_date', label: 'Data de Validade', type: 'date' },
    { key: 'status', label: 'Status', type: 'text', format: (status: string) => {
      const statusMap = {
        'valid': 'Válido',
        'expiring': 'Expirando', 
        'expired': 'Expirado',
        'pending': 'Pendente'
      };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'created_at', label: 'Data de Criação', type: 'date' }
  ],

  documents: (): ReportField[] => [
    { key: 'document_name', label: 'Nome do Documento', type: 'text' },
    { key: 'document_type', label: 'Tipo', type: 'text', format: (type: string) => {
      const typeMap = {
        'legal_qualification': 'Qualificação Jurídica',
        'fiscal_regularity': 'Regularidade Fiscal',
        'economic_financial': 'Econômico-Financeira', 
        'common_declarations': 'Declarações Comuns'
      };
      return typeMap[type as keyof typeof typeMap] || type;
    }},
    { key: 'document_subtype', label: 'Subtipo', type: 'text' },
    { key: 'full_name', label: 'Responsável', type: 'text' },
    { key: 'validity_date', label: 'Data de Validade', type: 'date' },
    { key: 'status', label: 'Status', type: 'text', format: (status: string) => {
      const statusMap = {
        'valid': 'Válido',
        'expiring': 'Expirando',
        'expired': 'Expirado', 
        'pending': 'Pendente'
      };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'is_sensitive', label: 'Documento Sensível', type: 'boolean' },
    { key: 'created_at', label: 'Data de Criação', type: 'date' }
  ]
};