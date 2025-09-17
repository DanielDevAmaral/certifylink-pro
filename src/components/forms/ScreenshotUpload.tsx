import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenshotUploadProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentUrl?: string;
  className?: string;
}

export function ScreenshotUpload({ 
  onUploadComplete, 
  onUploadError, 
  currentUrl, 
  className 
}: ScreenshotUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP.';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.';
    }

    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      onUploadError?.('Usuário não autenticado');
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      onUploadError?.(validation);
      toast({
        title: 'Erro no arquivo',
        description: validation,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('certification-screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certification-screenshots')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUploadComplete?.(publicUrl);

      toast({
        title: 'Sucesso',
        description: 'Screenshot enviado com sucesso!',
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.message || 'Erro ao enviar arquivo';
      onUploadError?.(errorMessage);
      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user, onUploadComplete, onUploadError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  }, [uploadFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  }, [uploadFile]);

  const removeImage = () => {
    setPreviewUrl('');
    onUploadComplete?.('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Enable paste functionality when component is focused
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'v') {
      // Let the paste event handler take care of this
      e.preventDefault();
    }
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Screenshot da Certificação
        </label>
        <p className="text-xs text-muted-foreground">
          Arraste e solte uma imagem, clique para selecionar ou use Ctrl+V para colar
        </p>
      </div>

      {previewUrl && !uploading ? (
        <Card className="relative p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Screenshot carregado</p>
              <p className="text-xs text-muted-foreground">
                Clique no X para remover ou carregue uma nova imagem
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                className="gap-2"
              >
                <Upload className="h-3 w-3" />
                Alterar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer",
            dragActive && "border-primary bg-primary/5",
            uploading && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!uploading ? openFileDialog : undefined}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium mb-2">Enviando...</p>
                <Progress value={progress} className="w-full max-w-xs" />
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Arraste uma imagem aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, JPEG ou WEBP (máx. 5MB)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Dica:</span> Use Ctrl+V para colar uma imagem
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}