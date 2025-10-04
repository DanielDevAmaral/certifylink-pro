import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCertbaseLogoDataUrl } from "@/lib/utils/qrcode";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
}

export function QRCodeDialog({ open, onOpenChange, url, title, description }: QRCodeDialogProps) {
  const { toast } = useToast();
  const logoDataUrl = getCertbaseLogoDataUrl();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link público foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg border">
            <QRCodeSVG 
              value={url} 
              size={256}
              includeMargin={true}
              level="H"
              imageSettings={{
                src: logoDataUrl,
                x: undefined,
                y: undefined,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground text-center">
              {description}
            </p>
          )}
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleCopyLink}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="flex-1"
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Link
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
