import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Eye, X, Lock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadDocument } from '@/lib/utils/documentUtils';
import { useSignedDocumentUrl } from '@/hooks/useLegalDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl?: string;
  documentName?: string;
  documentId?: string;
  isSensitive?: boolean;
  documentType?: 'legal_document' | 'certification' | 'badge' | 'technical_attestation';
}

export function DocumentViewer({ 
  open, 
  onOpenChange, 
  documentUrl, 
  documentName = 'Documento',
  documentId,
  isSensitive = false,
  documentType = 'legal_document'
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use signed URL for sensitive documents
  const { data: signedUrlData, isLoading: isLoadingSignedUrl } = useSignedDocumentUrl(
    isSensitive && documentId ? documentId : undefined,
    documentType
  );

  // Use signed URL if available, otherwise fall back to regular URL
  const effectiveUrl = (isSensitive && signedUrlData?.signedUrl) ? signedUrlData.signedUrl : documentUrl;

  const handleDownload = async () => {
    if (!effectiveUrl) {
      toast({
        title: 'Erro',
        description: 'URL do documento não encontrada',
        variant: 'destructive'
      });
      return;
    }
    
    if (isSensitive && !signedUrlData) {
      toast({
        title: 'Aguarde',
        description: 'Gerando URL segura para download...',
      });
      return; // Don't allow download until signed URL is ready
    }

    try {
      setIsLoading(true);
      await downloadDocument(effectiveUrl, documentName);
    } catch (error) {
      console.error('Error in DocumentViewer download:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (effectiveUrl) {
      if (isSensitive && !signedUrlData) {
        toast({
          title: 'Aguarde',
          description: 'Gerando URL segura...',
        });
        return; // Don't allow opening until signed URL is ready
      }
      window.open(effectiveUrl, '_blank');
    }
  };

  const isPDF = effectiveUrl?.toLowerCase().includes('.pdf');
  const isImage = effectiveUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  const isLoadingUrl = isSensitive && isLoadingSignedUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isSensitive && <Lock className="h-4 w-4 text-destructive" />}
              <Eye className="h-5 w-5" />
              {documentName}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!effectiveUrl || isLoadingUrl}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Nova Aba
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!effectiveUrl || isLoading || isLoadingUrl}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isLoading ? 'Baixando...' : 'Download'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {isSensitive && (
          <Alert variant="default" className="bg-destructive/10 border-destructive/20">
            <Lock className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              Documento sensível - acesso monitorado e registrado nos logs de auditoria
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden">
          {isLoadingUrl ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Gerando URL segura para documento sensível...</p>
              </div>
            </div>
          ) : !effectiveUrl ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Documento não disponível para visualização</p>
              </div>
            </div>
          ) : isPDF ? (
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              <iframe
                src={effectiveUrl}
                className="w-full h-full"
                title={documentName}
              />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={effectiveUrl}
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
                  <Button onClick={handleOpenInNewTab} className="gap-2" disabled={isLoadingUrl}>
                    <ExternalLink className="h-4 w-4" />
                    Abrir em Nova Aba
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="gap-2" disabled={isLoadingUrl}>
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