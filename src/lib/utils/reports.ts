import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Types for report data
export interface ReportData {
  title: string;
  headers: string[];
  data: (string | number | Date)[][];
  summary?: Record<string, string | number>;
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

// Export to PDF
export function exportToPDF(reportData: ReportData, filename: string) {
  try {
    const doc = new jsPDF();
    
    // Validate data
    if (!reportData.headers || reportData.headers.length === 0) {
      throw new Error('Headers are required for PDF generation');
    }
    
    if (!reportData.data || reportData.data.length === 0) {
      throw new Error('Data is required for PDF generation');
    }

    // Sanitize data for PDF - handle null/undefined values
    const sanitizedData = reportData.data.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return 'N/A';
        if (typeof cell === 'string') return cell.replace(/[^\u0000-\u007F]/g, '?'); // Remove non-ASCII chars
        return String(cell);
      })
    );
    
    // Add title with UTF-8 support
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.text(reportData.title || 'Relatório', 20, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    
    // Add table with error handling
    (doc as any).autoTable({
      head: [reportData.headers],
      body: sanitizedData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [66, 139, 202], // Corporate blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didParseCell: function(data: any) {
        // Ensure all cell values are strings
        if (data.cell.text && Array.isArray(data.cell.text)) {
          data.cell.text = data.cell.text.map(String);
        }
      }
    });
    
    // Add summary if available
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('Resumo:', 20, finalY);
      
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => [
        key, 
        value === null || value === undefined ? 'N/A' : String(value)
      ]);
      
      (doc as any).autoTable({
        head: [['Métrica', 'Valor']],
        body: summaryData,
        startY: finalY + 10,
        styles: {
          fontSize: 10,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
        },
      });
    }
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Generic report generator
export function generateReport(
  data: any[], 
  config: {
    title: string;
    fields: { key: string; label: string; format?: (value: any) => string }[];
    summary?: Record<string, any>;
    filename: string;
    type: 'excel' | 'csv' | 'pdf';
  }
) {
  const headers = config.fields.map(field => field.label);
  const reportData: ReportData = {
    title: config.title,
    headers,
    data: data.map(item => 
      config.fields.map(field => {
        const value = item[field.key];
        return field.format ? field.format(value) : value;
      })
    ),
    summary: config.summary
  };
  
  switch (config.type) {
    case 'excel':
      exportToExcel(reportData, config.filename);
      break;
    case 'csv':
      exportToCSV(reportData, config.filename);
      break;
    case 'pdf':
      exportToPDF(reportData, config.filename);
      break;
  }
}