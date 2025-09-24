import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ExternalLink, Download } from "lucide-react";
import { useCanEditDocument } from "@/hooks/useTeamRelations";
import { downloadDocument, openDocumentInNewTab, isValidDocumentUrl } from "@/lib/utils/documentUtils";

interface DocumentActionButtonsProps {
  documentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  externalLink?: string;
  documentUrl?: string;
  documentName?: string;
  showDownload?: boolean;
  className?: string;
}

export function DocumentActionButtons({
  documentUserId,
  onEdit,
  onDelete,
  onView,
  externalLink,
  documentUrl,
  documentName,
  showDownload = true,
  className = ""
}: DocumentActionButtonsProps) {
  const canEdit = useCanEditDocument(documentUserId);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {canEdit ? (
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 flex-1"
              onClick={onEdit}
            >
              <Edit className="h-3 w-3" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 text-destructive hover:text-destructive flex-1"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>
          )}
        </div>
      ) : (
        onView && (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2 w-full"
            onClick={onView}
          >
            <Eye className="h-3 w-3" />
            Visualizar
          </Button>
        )
      )}
      
      {/* Download button - always show if document URL is available */}
      {showDownload && isValidDocumentUrl(documentUrl) && (
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-2 w-full"
          onClick={() => downloadDocument(documentUrl!, documentName)}
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      )}
      
      {externalLink && (
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-2 w-full"
          onClick={() => openDocumentInNewTab(externalLink)}
        >
          <ExternalLink className="h-3 w-3" />
          Ver Certificação
        </Button>
      )}
    </div>
  );
}