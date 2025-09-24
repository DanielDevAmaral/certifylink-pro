import { toast } from '@/hooks/use-toast';

/**
 * Download a document from a URL using fetch + blob for better cross-origin support
 */
export async function downloadDocument(url: string, filename?: string) {
  try {
    if (!url) {
      throw new Error('URL do documento não encontrada');
    }

    // Show loading toast
    const loadingToast = toast({
      title: 'Iniciando download...',
      description: 'Preparando o arquivo para download'
    });

    // Try to download using fetch + blob approach
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // Get the blob data
    const blob = await response.blob();
    
    // Generate filename if not provided
    const finalFilename = filename || getFilenameFromUrl(url) || 'documento.pdf';
    
    // Create blob URL and download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);

    // Dismiss loading toast and show success
    loadingToast.dismiss();
    toast({
      title: 'Download concluído',
      description: `Arquivo ${finalFilename} baixado com sucesso`
    });

  } catch (error) {
    console.error('Download error:', error);
    
    // Fallback to simple link method if fetch fails
    try {
      const link = document.createElement('a');
      link.href = url;
      if (filename) {
        link.download = filename;
      }
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download via navegador',
        description: 'Arquivo aberto em nova aba - use Ctrl+S para salvar'
      });
    } catch (fallbackError) {
      toast({
        title: 'Erro no download',
        description: error instanceof Error ? error.message : 'Não foi possível baixar o arquivo',
        variant: 'destructive'
      });
    }
  }
}

/**
 * Open document in new tab
 */
export function openDocumentInNewTab(url: string) {
  if (!url) {
    toast({
      title: 'Erro',
      description: 'URL do documento não encontrada',
      variant: 'destructive'
    });
    return;
  }
  
  window.open(url, '_blank');
}

/**
 * Check if URL is a valid document URL
 */
export function isValidDocumentUrl(url?: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url?: string): string | null {
  if (!url) return null;
  
  const match = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return match ? match[1] : null;
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(url?: string): boolean {
  return getFileExtension(url) === 'pdf';
}

/**
 * Check if file is an image
 */
export function isImageFile(url?: string): boolean {
  const extension = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
}

/**
 * Get filename from URL path
 */
export function getFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename && filename.includes('.') ? filename : null;
  } catch {
    return null;
  }
}

/**
 * Format document name for display
 */
export function formatDocumentName(name?: string, fallback = 'Documento'): string {
  if (!name) return fallback;
  
  // Remove file extension for display
  return name.replace(/\.[^/.]+$/, '');
}