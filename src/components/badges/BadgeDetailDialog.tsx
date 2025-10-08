import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BadgeWithProfile } from "@/hooks/useBadges";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface BadgeDetailDialogProps {
  badge: BadgeWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BadgeDetailDialog({ badge, open, onOpenChange }: BadgeDetailDialogProps) {
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);

  if (!badge) return null;

  const handleCopyLink = async () => {
    if (badge.public_link) {
      try {
        await navigator.clipboard.writeText(badge.public_link);
        toast({
          title: "Link copiado!",
          description: "O link público do badge foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar link",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyVerificationCode = async () => {
    if (badge.verification_code) {
      try {
        await navigator.clipboard.writeText(badge.verification_code);
        toast({
          title: "Código copiado!",
          description: "O código de verificação foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar código",
          description: "Não foi possível copiar o código. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Cloud': 'bg-blue-100 text-blue-800',
      'Segurança': 'bg-red-100 text-red-800',
      'Dados': 'bg-green-100 text-green-800',
      'DevOps': 'bg-purple-100 text-purple-800',
      'Frontend': 'bg-orange-100 text-orange-800',
      'Backend': 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {badge.image_url ? (
              <img 
                src={badge.image_url} 
                alt={`${badge.name} icon`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-xl">
                  {badge.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {badge.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Category */}
          <div className="flex items-center gap-3">
            <StatusBadge status={badge.status} />
            <BadgeUI className={`${getCategoryColor(badge.category)}`}>
              {badge.category}
            </BadgeUI>
          </div>

          {/* Badge Image */}
          {badge.image_url && (
            <div className="flex justify-center">
              <img 
                src={badge.image_url} 
                alt={`${badge.name} badge`}
                className="max-w-xs max-h-48 object-contain rounded-lg border"
              />
            </div>
          )}

          {/* Description */}
          {badge.description && (
            <div>
              <h4 className="font-semibold mb-2">Descrição</h4>
              <p className="text-muted-foreground">{badge.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-3">Informações do Badge</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Emissão:</span>
                  <span className="font-medium">
                    {format(new Date(badge.issued_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                {badge.expiry_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Expiração:</span>
                    <span className="font-medium">
                      {format(new Date(badge.expiry_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}

                {badge.verification_code && (
                  <div>
                    <span className="text-muted-foreground">Código de Verificação:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {badge.verification_code}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCopyVerificationCode}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Emissor</h4>
              <div className="space-y-2 text-sm">
                {badge.issuer_logo_url && (
                  <img 
                    src={badge.issuer_logo_url} 
                    alt="Issuer logo"
                    className="w-16 h-16 object-contain rounded border"
                  />
                )}
                
                {badge.issuer_name && (
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{badge.issuer_name}</p>
                  </div>
                )}

                {badge.creator_name && (
                  <div>
                    <span className="text-muted-foreground">Responsável:</span>
                    <p className="font-medium">{badge.creator_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Section */}
          {badge.public_link && (
            <div>
              <h4 className="font-semibold mb-3">Validação Externa</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link Público
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a href={badge.public_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Link
                    </a>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                </div>

                {showQR && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <QRCodeSVG 
                      value={badge.public_link} 
                      size={200}
                      includeMargin={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {badge.metadata && Object.keys(badge.metadata).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Informações Adicionais</h4>
              <div className="bg-muted p-3 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(badge.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}