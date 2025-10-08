import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  description: string;
  currentUrl?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  bucketName?: string;
  folder?: string;
  className?: string;
}

export function ImageUpload({ 
  label,
  description,
  currentUrl,
  onUploadComplete, 
  onUploadError, 
  bucketName = "documents",
  folder = "badge-images",
  className 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Update preview when currentUrl changes
  useEffect(() => {
    if (currentUrl !== previewUrl) {
      setPreviewUrl(currentUrl || "");
    }
  }, [currentUrl]);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return "Tipo de arquivo não suportado. Use PNG, JPG, JPEG, WEBP ou SVG.";
    }

    if (file.size > maxSize) {
      return "Arquivo muito grande. Tamanho máximo: 5MB.";
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) {
        onUploadError?.("Usuário não autenticado");
        return;
      }

      const validation = validateFile(file);
      if (validation) {
        onUploadError?.(validation);
        toast({
          title: "Erro no arquivo",
          description: validation,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        // Create unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${user.id}_${timestamp}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;
        setPreviewUrl(publicUrl);
        onUploadComplete?.(publicUrl);

        toast({
          title: "Sucesso",
          description: "Imagem enviada com sucesso!",
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage = error?.message || "Erro ao enviar arquivo";
        onUploadError?.(errorMessage);
        toast({
          title: "Erro no upload",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [user, onUploadComplete, onUploadError, bucketName, folder],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
      }
    },
    [uploadFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        uploadFile(e.target.files[0]);
      }
    },
    [uploadFile],
  );

  // Global paste listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            toast({
              title: "Imagem detectada",
              description: "Fazendo upload da imagem colada...",
            });
            uploadFile(file);
          }
          break;
        }
      }
    };

    // Only add listener when no preview and not uploading
    if (!previewUrl && !uploading) {
      document.addEventListener('paste', handleGlobalPaste);
    }

    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [previewUrl, uploading, uploadFile]);

  const removeImage = () => {
    setPreviewUrl("");
    onUploadComplete?.("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">{label}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {previewUrl && !uploading ? (
        <Card className="relative p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
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
              <p className="text-sm font-medium">Imagem carregada</p>
              <p className="text-xs text-muted-foreground">Clique no X para remover ou carregue uma nova</p>
              <Button type="button" variant="outline" size="sm" onClick={openFileDialog} className="gap-2">
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
            uploading && "opacity-50 cursor-not-allowed",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!uploading ? openFileDialog : undefined}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
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
                  <p className="text-sm font-medium">Arraste uma imagem ou clique</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG (máx. 5MB)</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Dica:</span> Use Ctrl+V para colar
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
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
