import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ImageZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  description?: string;
}

export function ImageZoomDialog({
  open,
  onOpenChange,
  imageUrl,
  title,
  description
}: ImageZoomDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleOpenOriginal = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <div className="relative bg-background">
          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/95 to-background/0 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image container */}
          <div className="flex items-center justify-center min-h-[50vh] max-h-[90vh] p-12 pt-20">
            {!imageLoaded && !imageError && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Carregando imagem...</p>
              </div>
            )}
            
            {imageError && (
              <div className="text-center">
                <p className="text-sm text-destructive">Erro ao carregar a imagem</p>
              </div>
            )}

            <img
              src={imageUrl}
              alt={title}
              className={`w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>

          {/* Action buttons */}
          {imageLoaded && (
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                onClick={handleOpenOriginal}
                variant="secondary"
                size="sm"
                className="gap-2 shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir original
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
