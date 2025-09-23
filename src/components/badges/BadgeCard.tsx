import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Copy, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BadgeWithProfile } from "@/hooks/useBadges";
import { useToast } from "@/hooks/use-toast";

interface BadgeCardProps {
  badge: BadgeWithProfile;
  onViewDetails: (badge: BadgeWithProfile) => void;
  onEdit?: (badge: BadgeWithProfile) => void;
  onDelete?: (id: string) => void;
  userRole?: string;
}

export function BadgeCard({ badge, onViewDetails, onEdit, onDelete, userRole }: BadgeCardProps) {
  const { toast } = useToast();

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
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {badge.icon_url ? (
              <img 
                src={badge.icon_url} 
                alt={`${badge.name} icon`}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {badge.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {badge.name}
              </CardTitle>
              <Badge className={`text-xs mt-1 ${getCategoryColor(badge.category)}`}>
                {badge.category}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={badge.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border">
                <DropdownMenuItem onClick={() => onViewDetails(badge)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                {badge.public_link && (
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link público
                  </DropdownMenuItem>
                )}
                {onEdit && (userRole === 'admin' || badge.user_id === badge.user_id) && (
                  <DropdownMenuItem onClick={() => onEdit(badge)}>
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && userRole === 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(badge.id)}
                    className="text-destructive"
                  >
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {badge.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {badge.description}
          </p>
        )}
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Emitido em:</span>
            <span className="font-medium">
              {format(new Date(badge.issued_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          
          {badge.expiry_date && (
            <div className="flex justify-between">
              <span>Expira em:</span>
              <span className="font-medium">
                {format(new Date(badge.expiry_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          
          {badge.issuer_name && (
            <div className="flex justify-between">
              <span>Emissor:</span>
              <span className="font-medium truncate ml-2">
                {badge.issuer_name}
              </span>
            </div>
          )}
          
          {badge.creator_name && (
            <div className="flex justify-between">
              <span>Responsável:</span>
              <span className="font-medium truncate ml-2">
                {badge.creator_name}
              </span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onViewDetails(badge)}
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}