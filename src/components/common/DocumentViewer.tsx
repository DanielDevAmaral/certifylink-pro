import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Eye, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadDocument } from '@/lib/utils/documentUtils';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl?: string;
  documentName?: string;
  documentId?: string;
}

export function DocumentViewer({ 
  open, 
  onOpenChange, 
  documentUrl, 
  documentName = 'Documento',
  documentId
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!documentUrl) {
      toast({
        title: 'Erro',
        description: 'URL do documento não encontrada',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await downloadDocument(documentUrl, documentName);
    } catch (error) {
      console.error('Error in DocumentViewer download:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const isPDF = documentUrl?.toLowerCase().includes('.pdf');
  const isImage = documentUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {documentName}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Nova Aba
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isLoading ? 'Baixando...' : 'Download'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!documentUrl ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Documento não disponível para visualização</p>
              </div>
            </div>
          ) : isPDF ? (
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              <iframe
                src={documentUrl}
                className="w-full h-full"
                title={documentName}
              />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={documentUrl}
                alt={documentName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Prévia não disponível para este tipo de arquivo</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleOpenInNewTab} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Abrir em Nova Aba
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}