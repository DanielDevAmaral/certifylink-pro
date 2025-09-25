import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { ReportData, ReportConfig, ReportField, ReportSummary } from '@/types/reports';

// Configure PDF.js worker with fallback for Vite compatibility
const configureWorker = () => {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    console.log('PDF.js worker configured successfully');
  } catch (error) {
    console.warn('Failed to configure PDF.js worker:', error);
    // Fallback to default worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
};

configureWorker();

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
export async function exportToPDF(reportData: ReportData, filename: string, config?: Partial<ReportConfig>) {
  try {
    console.log('Starting PDF export with data:', { 
      title: reportData.title, 
      headers: reportData.headers, 
      dataCount: reportData.data?.length,
      branding: config?.branding 
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

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 20;
    let hasLogo = false;

    // Add custom logo in top-left corner (fixed position)
    if (config?.branding?.logo) {
      try {
        console.log('Loading logo for PDF:', config.branding.logo);
        const logoResult = await loadImageForPDF(config.branding.logo);
        if (logoResult?.data) {
          console.log('Logo loaded successfully, format:', logoResult.format);
          // Fixed position in top-left, with proper aspect ratio
          const logoWidth = 25;
          const logoHeight = 15;
          doc.addImage(logoResult.data, logoResult.format, 20, 15, logoWidth, logoHeight);
          hasLogo = true;
        } else {
          console.warn('Logo data not available');
        }
      } catch (error) {
        console.error('Error loading logo for PDF:', error);
        // Continue without logo
      }
    }

    // Title - Always centered regardless of logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210); // Primary blue
    const title = reportData.title || 'Relatório Corporativo';
    doc.text(title, pageWidth / 2, currentY + 5, { align: 'center' });
    currentY += 15;

    // Company name - centered
    if (config?.branding?.company) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(config.branding.company, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }

    // Subtitle - centered
    if (config?.branding?.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(config.branding.subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }

    // Header separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 8;

    // Metadata section - left aligned but organized
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    const now = new Date();
    const metadataStartY = currentY;
    
    // Left column metadata
    doc.text(`Data de geração: ${now.toLocaleDateString('pt-BR')}`, 20, currentY);
    currentY += 5;
    doc.text(`Hora: ${now.toLocaleTimeString('pt-BR')}`, 20, currentY);
    currentY += 5;
    
    // Right column metadata if there's data
    let rightColumnY = metadataStartY;
    if (reportData.metadata?.totalRecords) {
      doc.text(`Total de registros: ${reportData.metadata.totalRecords}`, pageWidth / 2 + 10, rightColumnY);
      rightColumnY += 5;
    }
    
    if (reportData.metadata?.generatedBy) {
      doc.text(`Gerado por: ${reportData.metadata.generatedBy}`, pageWidth / 2 + 10, rightColumnY);
      rightColumnY += 5;
    }
    
    // Ensure consistent spacing regardless of metadata
    currentY = Math.max(currentY, rightColumnY) + 5;
    // Auto Table of Contents (TOC) if enabled
    if (config?.branding?.coverTemplate === 'auto_toc' || config?.branding?.auto_toc) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Índice', 20, currentY);
      currentY += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('1. Dados do Relatório ............................ Pág. 1', 25, currentY);
      currentY += 6;
      doc.text('2. Tabela de Dados ............................... Pág. 1', 25, currentY);
      currentY += 6;
      if (reportData.summary && Object.keys(reportData.summary).length > 0) {
        doc.text('3. Resumo Executivo .............................. Pág. 2+', 25, currentY);
        currentY += 6;
      }
      currentY += 10;
    }

    // Calculate column widths dynamically
    const availableWidth = pageWidth - 40; // 20mm margin on each side
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
        // Page numbers and footer
        const pageCount = doc.getNumberOfPages();
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        
        // Page numbers
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth - 30,
          pageHeight - 10,
          { align: 'right' }
        );
        
        // Custom footer text
        if (config?.branding?.footer) {
          doc.text(config.branding.footer, 20, pageHeight - 10);
        }
      }
    });

    // Add summary section if available
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      // Get the final Y position after the table with proper fallback
      let finalY = currentY;
      if ((doc as any).lastAutoTable?.finalY) {
        finalY = (doc as any).lastAutoTable.finalY + 15; // Add more margin
      }
      
      // Check if we need a new page for the summary
      const remainingSpace = doc.internal.pageSize.height - finalY - 20; // Leave margin for footer
      const summaryHeight = Object.keys(reportData.summary).length * 6 + 40; // Estimate summary height
      
      if (remainingSpace < summaryHeight) {
        doc.addPage();
        finalY = 20; // Start near top of new page
      }
      
      currentY = finalY;

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

// Detect file type from URL
function getFileTypeFromUrl(url: string): 'pdf' | 'docx' | 'image' | 'unknown' {
  const extension = url.toLowerCase().split('.').pop() || '';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['docx', 'doc'].includes(extension)) return 'docx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
  return 'unknown';
}

// Convert PDF to images for embedding in report
async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  try {
    console.log('Converting PDF to images:', pdfUrl);
    
    // Verify worker is loaded
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      console.warn('PDF.js worker not configured, attempting to reconfigure...');
      configureWorker();
    }
    
    const response = await fetch(pdfUrl, { mode: 'cors' });
    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      throw new Error(`Falha ao carregar PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('PDF ArrayBuffer size:', arrayBuffer.byteLength);
    
    let pdf;
    try {
      pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    } catch (workerError) {
      console.error('PDF.js worker error:', workerError);
      throw new Error('Erro no processamento do PDF. Verifique se o arquivo está válido.');
    }
    
    const images: string[] = [];
    const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages for performance
    
    console.log(`Processing ${maxPages} of ${pdf.numPages} PDF pages`);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          console.warn(`Failed to get canvas context for page ${pageNum}`);
          continue;
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        // Convert to JPEG for smaller file size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        images.push(dataUrl);
        console.log(`Successfully converted page ${pageNum}`);
      } catch (pageError) {
        console.warn(`Failed to convert PDF page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (images.length === 0) {
      throw new Error('Nenhuma página do PDF pôde ser convertida');
    }
    
    console.log(`Successfully converted ${images.length} PDF pages`);
    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Convert DOCX to HTML for embedding
async function convertDocxToHtml(docxUrl: string): Promise<string | null> {
  try {
    console.log('Converting DOCX to HTML:', docxUrl);
    const response = await fetch(docxUrl, { mode: 'cors' });
    if (!response.ok) {
      console.error('Failed to fetch DOCX:', response.status);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    console.log('DOCX converted successfully');
    return result.value;
    
  } catch (error) {
    console.error('Error converting DOCX:', error);
    return null;
  }
}

// Process attachment based on file type
async function processAttachment(documentUrl: string): Promise<{
  type: 'pdf' | 'docx' | 'image' | 'unknown';
  content?: string | string[];
  error?: string;
}> {
  const fileType = getFileTypeFromUrl(documentUrl);
  
  console.log(`Processing attachment: ${documentUrl} (type: ${fileType})`);
  
  try {
    switch (fileType) {
      case 'pdf':
        try {
          const pdfPages = await convertPdfToImages(documentUrl);
          if (pdfPages.length === 0) {
            return { type: 'pdf', error: 'PDF não contém páginas válidas' };
          }
          return { type: 'pdf', content: pdfPages };
        } catch (pdfError) {
          console.error('PDF processing error:', pdfError);
          return { type: 'pdf', error: `Erro no PDF: ${pdfError instanceof Error ? pdfError.message : 'Erro desconhecido'}` };
        }
        
      case 'docx':
        try {
          const htmlContent = await convertDocxToHtml(documentUrl);
          return { type: 'docx', content: htmlContent || undefined };
        } catch (docxError) {
          console.error('DOCX processing error:', docxError);
          return { type: 'docx', error: 'Erro ao processar documento Word' };
        }
        
      case 'image':
        // For images, we'll return the URL to be processed by existing image loading
        return { type: 'image', content: documentUrl };
        
      default:
        return { type: 'unknown', error: 'Tipo de arquivo não suportado' };
    }
  } catch (error) {
    console.error('Error processing attachment:', error);
    return { 
      type: fileType, 
      error: `Erro ao processar anexo: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}

// Load image from URL for PDF with format detection
async function loadImageForPDF(url: string): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> {
  try {
    console.log('Fetching image from URL:', url);
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Image content type:', contentType);
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        
        // Detect format from content type or data URL
        let format: 'JPEG' | 'PNG' = 'JPEG';
        if (contentType.includes('png') || result.includes('data:image/png')) {
          format = 'PNG';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg') || result.includes('data:image/jpeg')) {
          format = 'JPEG';
        }
        
        console.log('Image loaded successfully, detected format:', format);
        resolve({ data: result, format });
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}

// Generate detailed PDF with individual certification sections
export async function generateDetailedPDF(reportData: ReportData, filename: string, rawData: any[], config?: Partial<ReportConfig>) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let currentY = margin;

  // Add custom logo if available
  if (config?.branding?.logo) {
    try {
      console.log('Loading logo for detailed PDF:', config.branding.logo);
      const logoResult = await loadImageForPDF(config.branding.logo);
      if (logoResult?.data) {
        console.log('Logo loaded successfully for detailed PDF, format:', logoResult.format);
        doc.addImage(logoResult.data, logoResult.format, margin, currentY, 30, 15);
        currentY += 20;
      } else {
        console.warn('Logo data not available for detailed PDF');
      }
    } catch (error) {
      console.warn('Error loading logo for detailed PDF:', error);
      // Continue without logo
    }
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 118, 210);
  doc.text(reportData.title || 'Relatório Detalhado', margin, currentY);
  currentY += 12;

  // Company name from branding
  if (config?.branding?.company) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(config.branding.company, margin, currentY);
    currentY += 8;
  }

  // Generation info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const now = new Date();
  doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, margin, currentY);
  currentY += 6;
  if (reportData.metadata?.totalRecords) {
    doc.text(`Total de registros: ${reportData.metadata.totalRecords}`, margin, currentY);
  }
  currentY += 15;

  // Auto Table of Contents if enabled
  if (config?.branding?.coverTemplate === 'auto_toc' || config?.branding?.auto_toc) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('Índice', margin, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('1. Informações Gerais ............................ Pág. 1', margin + 5, currentY);
    currentY += 6;
    doc.text('2. Detalhes dos Documentos ....................... Pág. 2+', margin + 5, currentY);
    currentY += 6;
    doc.text('3. Screenshots e Evidências ..................... Pág. 2+', margin + 5, currentY);
    currentY += 6;
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      doc.text('4. Resumo Estatístico ........................... Pág. Final', margin + 5, currentY);
      currentY += 6;
    }
    currentY += 15;
  }
  doc.setTextColor(25, 118, 210); // Primary blue
  doc.text(reportData.title || 'Relatório Detalhado', margin, currentY + 10);
  
  // Company name from settings
  if (config?.branding?.company) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(config.branding.company, margin, currentY + 22);
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, currentY + 30);

  currentY += 45;

  // Process each record (certification or technical attestation)
  for (let i = 0; i < rawData.length; i++) {
    const record = rawData[i];
    const isAttestation = 'client_name' in record; // Technical attestations have client_name
    
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = margin;
    }

    // Record header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    const title = isAttestation 
      ? `${i + 1}. Atestado: ${record.client_name || 'N/A'} - ${record.project_object || 'N/A'}`
      : `${i + 1}. ${record.name || 'Certificação'}`;
    doc.text(title, margin, currentY);
    currentY += 10;

    // Status badge
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const statusColor = record.status === 'valid' ? [16, 185, 129] : record.status === 'expired' ? [239, 68, 68] : [245, 158, 11];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`Status: ${record.status?.toUpperCase() || 'N/A'}`, margin, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 8;

    // Basic information based on record type
    let info = [];
    if (isAttestation) {
      info = [
        ['Responsável:', record.full_name || 'N/A'],
        ['Cliente:', record.client_name || 'N/A'],
        ['Objeto do Projeto:', record.project_object || 'N/A'],
        ['Emissor:', record.issuer_name || 'N/A'],
        ['Cargo do Emissor:', record.issuer_position || 'N/A'],
        ['Período:', `${record.project_period_start ? new Date(record.project_period_start).toLocaleDateString('pt-BR') : 'N/A'} - ${record.project_period_end ? new Date(record.project_period_end).toLocaleDateString('pt-BR') : 'N/A'}`],
        ['Valor do Projeto:', record.project_value ? `R$ ${record.project_value.toLocaleString('pt-BR')}` : 'N/A'],
        ['Validade:', record.validity_date ? new Date(record.validity_date).toLocaleDateString('pt-BR') : 'N/A'],
        ['Criado em:', record.created_at ? new Date(record.created_at).toLocaleDateString('pt-BR') : 'N/A'],
      ];
    } else {
      info = [
        ['Responsável:', record.full_name || 'N/A'],
        ['Função:', record.function || 'N/A'],
        ['Validade:', record.validity_date ? new Date(record.validity_date).toLocaleDateString('pt-BR') : 'N/A'],
        ['Criado em:', record.created_at ? new Date(record.created_at).toLocaleDateString('pt-BR') : 'N/A'],
      ];
    }

    info.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, currentY);
      doc.setFont('helvetica', 'normal');
      // Handle long text by splitting into multiple lines
      const maxWidth = contentWidth - 35;
      const splitText = doc.splitTextToSize(value, maxWidth);
      doc.text(splitText, margin + 35, currentY);
      currentY += splitText.length * 4 + 2;
    });

    // Additional information for certifications
    if (!isAttestation) {
      if (record.approved_equivalence !== undefined) {
        currentY += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Equivalência Aprovada:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(record.approved_equivalence ? 'Sim' : 'Não', margin + 45, currentY);
        currentY += 6;
      }

      if (record.equivalence_services && record.equivalence_services.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Serviços de Equivalência:', margin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        const services = Array.isArray(record.equivalence_services) 
          ? record.equivalence_services.join(', ')
          : record.equivalence_services;
        const lines = doc.splitTextToSize(services, contentWidth - 10);
        doc.text(lines, margin + 5, currentY);
        currentY += lines.length * 4 + 3;
      }

      if (record.public_link) {
        doc.setFont('helvetica', 'bold');
        doc.text('Link Público:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(37, 99, 235);
        doc.text(record.public_link, margin + 25, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 8;
      }
    }

    // Additional information for technical attestations
    if (isAttestation) {
      if (record.issuer_contact) {
        doc.setFont('helvetica', 'bold');
        doc.text('Contato do Emissor:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(record.issuer_contact, margin + 35, currentY);
        currentY += 6;
      }

      if (record.related_certifications && record.related_certifications.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Certificações Relacionadas:', margin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        const certs = Array.isArray(record.related_certifications) 
          ? record.related_certifications.join(', ')
          : record.related_certifications;
        const lines = doc.splitTextToSize(certs, contentWidth - 10);
        doc.text(lines, margin + 5, currentY);
        currentY += lines.length * 4 + 3;
      }
    }

    // Process attachments/images
    const documentUrl = isAttestation ? record.document_url : record.screenshot_url;
    if (documentUrl) {
      currentY += 5;
      doc.setFont('helvetica', 'bold');
      const attachmentLabel = isAttestation ? 'Documento Anexo:' : 'Imagem da Certificação:';
      doc.text(attachmentLabel, margin, currentY);
      currentY += 8;

      try {
        if (isAttestation) {
          // Process technical attestation attachments
          const attachment = await processAttachment(documentUrl);
          
          if (attachment.error) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(239, 68, 68);
            doc.text(`(${attachment.error})`, margin + 10, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 8;
          } else if (attachment.type === 'image' && attachment.content) {
            // Handle image attachments
            const imageResult = await loadImageForPDF(attachment.content as string);
            if (imageResult?.data) {
              const maxImageWidth = contentWidth * 0.8;
              const maxImageHeight = 60;
              
              if (currentY + maxImageHeight > pageHeight - margin) {
                doc.addPage();
                currentY = margin;
                doc.setFont('helvetica', 'bold');
                doc.text('Documento Anexo (continuação):', margin, currentY);
                currentY += 8;
              }

              doc.addImage(imageResult.data, imageResult.format, margin + 10, currentY, maxImageWidth, maxImageHeight);
              currentY += maxImageHeight + 10;
            }
          } else if (attachment.type === 'pdf' && attachment.content) {
            // Handle PDF attachments - content is already converted images from processAttachment
            try {
              const pdfImages = attachment.content as string[];
              if (pdfImages && pdfImages.length > 0) {
                doc.setFont('helvetica', 'normal');
                doc.text('📄 Documento PDF anexado:', margin + 10, currentY);
                currentY += 8;
                
                for (let i = 0; i < pdfImages.length; i++) {
                  const imageData = pdfImages[i];
                  
                  if (currentY > pageHeight - 100) {
                    doc.addPage();
                    currentY = 40;
                  }
                  
                  try {
                    // Calculate image dimensions to fit properly
                    const maxImageWidth = contentWidth - 20;
                    const maxImageHeight = Math.min(pageHeight - currentY - 30, 120);
                    
                    // Add page number
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(8);
                    doc.text(`Página ${i + 1}:`, margin + 10, currentY);
                    currentY += 8;
                    doc.setFontSize(10);
                    
                    doc.addImage(imageData, 'JPEG', margin + 10, currentY, maxImageWidth, maxImageHeight);
                    currentY += maxImageHeight + 10;
                  } catch (err) {
                    console.error('Error adding PDF page image:', err);
                    doc.setFont('helvetica', 'italic');
                    doc.text(`(Erro ao processar página ${i + 1} do PDF)`, margin + 10, currentY);
                    currentY += 8;
                  }
                }
              } else {
                doc.setFont('helvetica', 'italic');
                doc.text('📄 Documento PDF (não foi possível renderizar)', margin + 10, currentY);
                currentY += 8;
              }
            } catch (err) {
              console.error('Error processing PDF:', err);
              doc.setFont('helvetica', 'italic');
              doc.text('📄 Documento PDF (erro no processamento)', margin + 10, currentY);
              currentY += 8;
            }
          } else if (attachment.type === 'docx' && attachment.content) {
            // Handle DOCX attachments - render content in PDF
            try {
              doc.setFont('helvetica', 'normal');
              doc.text('📄 Conteúdo do Documento Word:', margin + 10, currentY);
              currentY += 8;
              
              const htmlContent = attachment.content as string;
              // Convert HTML to plain text for PDF preserving paragraph structure
              let textContent = htmlContent
                .replace(/<\/p>/gi, '\n\n')  // Convert paragraph endings to double newlines
                .replace(/<\/div>/gi, '\n')   // Convert div endings to single newlines
                .replace(/<br\s*\/?>/gi, '\n') // Convert br tags to newlines
                .replace(/<li>/gi, '• ')      // Convert list items to bullets
                .replace(/<\/li>/gi, '\n')    // End list items with newlines
                .replace(/<h[1-6][^>]*>/gi, '\n\n**') // Convert headers
                .replace(/<\/h[1-6]>/gi, '**\n\n')   // Close headers
                .replace(/<[^>]*>/g, '')      // Remove all remaining HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/[ \t]+/g, ' ')      // Remove excessive spaces/tabs but preserve newlines
                .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Normalize multiple newlines to max 2
                .trim();
              
              if (textContent) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                
                // Split content into paragraphs and render with proper spacing - NO TRUNCATION
                const paragraphs = textContent.split('\n\n').filter(p => p.trim());
                
                for (let i = 0; i < paragraphs.length; i++) {
                  const paragraph = paragraphs[i];
                  
                  // Handle headers (marked with **)
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    const headerText = paragraph.slice(2, -2);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    
                    const headerLines = doc.splitTextToSize(headerText, contentWidth - 20);
                    
                    if (currentY + headerLines.length * 4 + 12 > pageHeight - 30) {
                      doc.addPage();
                      currentY = 40;
                    }
                    
                    doc.text(headerLines, margin + 10, currentY);
                    currentY += headerLines.length * 4 + 6;
                    
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                  } else {
                    // Regular paragraph
                    const lines = doc.splitTextToSize(paragraph, contentWidth - 20);
                    
                    // Check if we need a new page
                    if (currentY + lines.length * 3 + 8 > pageHeight - 30) {
                      doc.addPage();
                      currentY = 40;
                    }
                    
                    doc.text(lines, margin + 10, currentY);
                    currentY += lines.length * 3;
                    
                    // Add space between paragraphs
                    if (i < paragraphs.length - 1) {
                      currentY += 6;
                    }
                  }
                }
                
                doc.setFontSize(10);
              }
            } catch (err) {
              console.error('Error processing DOCX:', err);
              doc.setFont('helvetica', 'italic');
              doc.text('📄 Documento Word (erro no processamento)', margin + 10, currentY);
              currentY += 8;
            }
          } else {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('(Tipo de anexo não suportado para visualização)', margin + 10, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 8;
          }
        } else {
          // Handle certification screenshots (existing logic)
          const imageResult = await loadImageForPDF(documentUrl);
          if (imageResult?.data) {
            const maxImageWidth = contentWidth * 0.8;
            const maxImageHeight = 60;
            
            if (currentY + maxImageHeight > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
              doc.setFont('helvetica', 'bold');
              doc.text('Imagem da Certificação (continuação):', margin, currentY);
              currentY += 8;
            }

            doc.addImage(imageResult.data, imageResult.format, margin + 10, currentY, maxImageWidth, maxImageHeight);
            currentY += maxImageHeight + 10;
          } else {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('(Imagem não disponível)', margin + 10, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 8;
          }
        }
      } catch (error) {
        console.error('Error processing attachment/image:', error);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('(Erro ao processar anexo)', margin + 10, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 8;
      }
    }

    // Separator line
    currentY += 10;
    if (i < rawData.length - 1) {
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;
    }
  }

  // Add summary on new page
  if (reportData.summary && Object.keys(reportData.summary).length > 0) {
    doc.addPage();
    currentY = margin;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Resumo do Relatório', margin, currentY);
    currentY += 15;

    const summaryData = Object.entries(reportData.summary).map(([key, value]) => [
      sanitizeForPDF(key),
      sanitizeForPDF(value)
    ]);

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: summaryData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
      didDrawPage: function(data: any) {
        // Add custom footer to summary pages too
        if (config?.branding?.footer) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(config.branding.footer, margin, pageHeight - 10);
        }
      }
    });
  }

  doc.save(`${filename}.pdf`);
}

// Enhanced generic report generator with better error handling
export async function generateReport(data: any[], config: ReportConfig) {
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
        if (config.pdfStyle === 'detailed') {
          await generateDetailedPDF(reportData, config.filename, data, config);
        } else {
          exportToPDF(reportData, config.filename, config);
        }
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
  ],

  dashboard: (): ReportField[] => [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'user_name', label: 'Responsável', type: 'text' },
    { key: 'type', label: 'Tipo', type: 'text', format: (value: string) => {
      const labels = {
        certification: 'Certificação',
        certificate: 'Atestado',
        document: 'Documento'
      };
      return labels[value as keyof typeof labels] || value;
    }},
    { key: 'status', label: 'Status', type: 'text', format: (value: string) => {
      const labels = {
        valid: 'Válido',
        expiring: 'Vencendo',
        expired: 'Vencido'
      };
      return labels[value as keyof typeof labels] || value;
    }},
    { key: 'validity_date', label: 'Data de Validade', type: 'date' },
    { key: 'expires_in_days', label: 'Vence em (dias)', type: 'number', format: (value: number) => {
      if (value === undefined || value === null) return 'N/A';
      if (value <= 0) return 'Vencido';
      return `${value} dias`;
    }}
  ],

  badges: (): ReportField[] => [
    { key: 'name', label: 'Nome do Badge', type: 'text' },
    { key: 'description', label: 'Descrição', type: 'text' },
    { key: 'category', label: 'Categoria', type: 'text' },
    { key: 'full_name', label: 'Responsável', type: 'text' },
    { key: 'issuer_name', label: 'Emissor', type: 'text' },
    { key: 'issued_date', label: 'Data de Emissão', type: 'date' },
    { key: 'expiry_date', label: 'Data de Expiração', type: 'date' },
    { key: 'status', label: 'Status', type: 'text', format: (status: string) => {
      const statusMap = {
        'valid': 'Válido',
        'expiring': 'Expirando',
        'expired': 'Expirado',
        'pending': 'Pendente'
      };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'verification_code', label: 'Código de Verificação', type: 'text' },
    { key: 'public_link', label: 'Link Público', type: 'text' },
    { key: 'created_at', label: 'Data de Criação', type: 'date' }
  ]
};