import { toast } from '@/hooks/use-toast';

/**
 * Download a document from a URL
 */
export async function downloadDocument(url: string, filename?: string) {
  try {
    if (!url) {
      throw new Error('URL do documento não encontrada');
    }

    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = url;
    if (filename) {
      link.download = filename;
    }
    link.target = '_blank';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download iniciado',
      description: 'O arquivo está sendo baixado'
    });
  } catch (error) {
    toast({
      title: 'Erro no download',
      description: error instanceof Error ? error.message : 'Não foi possível baixar o arquivo',
      variant: 'destructive'
    });
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
 * Format document name for display
 */
export function formatDocumentName(name?: string, fallback = 'Documento'): string {
  if (!name) return fallback;
  
  // Remove file extension for display
  return name.replace(/\.[^/.]+$/, '');
}