import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { TeamDocuments as TeamDocumentsType } from "@/hooks/useTeamDetail";
import { navigateToRelatedDocument } from "@/lib/utils/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Award, 
  Shield, 
  Search,
  Calendar,
  User,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface TeamDocumentsProps {
  documents: TeamDocumentsType;
  isLoading?: boolean;
}

const statusConfig = {
  valid: {
    label: "Válido",
    icon: CheckCircle,
    color: "bg-success text-success-foreground",
  },
  expiring: {
    label: "Vencendo",
    icon: Clock,
    color: "bg-warning text-warning-foreground",
  },
  expired: {
    label: "Vencido",
    icon: AlertTriangle,
    color: "bg-destructive text-destructive-foreground",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "bg-muted text-muted-foreground",
  }
};

export function TeamDocuments({ documents, isLoading }: TeamDocumentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filterDocuments = (docs: any[]) => {
    return docs.filter(doc => {
      const matchesSearch = searchQuery === "" || 
        doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.project_object?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.user_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const renderDocumentCard = (doc: any, type: 'certification' | 'technical_attestation' | 'legal_document') => {
    const statusInfo = statusConfig[doc.status as keyof typeof statusConfig];
    const StatusIcon = statusInfo?.icon || FileText;

    const getDocumentTitle = () => {
      switch (type) {
        case 'certification':
          return doc.name;
        case 'technical_attestation':
          return doc.project_object;
        case 'legal_document':
          return doc.document_name;
        default:
          return 'Documento';
      }
    };

    const getDocumentSubtitle = () => {
      switch (type) {
        case 'certification':
          return doc.function;
        case 'technical_attestation':
          return doc.client_name;
        case 'legal_document':
          return doc.document_type;
        default:
          return '';
      }
    };

    const handleViewDocument = () => {
      navigateToRelatedDocument(type, doc.id);
    };

    return (
      <Card key={doc.id} className="card-corporate">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              {type === 'certification' && <Award className="h-6 w-6 text-primary" />}
              {type === 'technical_attestation' && <FileText className="h-6 w-6 text-primary" />}
              {type === 'legal_document' && <Shield className="h-6 w-6 text-primary" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">{getDocumentTitle()}</h3>
                <Badge className={statusInfo?.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo?.label}
                </Badge>
                {type === 'legal_document' && doc.is_sensitive && (
                  <Badge variant="outline" className="text-warning border-warning">
                    <Shield className="h-3 w-3 mr-1" />
                    Sensível
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{doc.user_name}</span>
                </div>
                {getDocumentSubtitle() && (
                  <span>{getDocumentSubtitle()}</span>
                )}
                {doc.validity_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Válido até {format(new Date(doc.validity_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleViewDocument}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver Documento
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const totalDocuments = documents.certifications.length + 
                         documents.technical_attestations.length + 
                         documents.legal_documents.length;

  if (isLoading) {
    return (
      <Card className="card-corporate">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="card-corporate">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos por nome, cliente ou usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="valid">Válidos</SelectItem>
              <SelectItem value="expiring">Vencendo</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Documents Tabs */}
      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="certifications" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificações ({documents.certifications.length})
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Atestados ({documents.technical_attestations.length})
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Jurídicos ({documents.legal_documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-4">
          {(() => {
            const filteredCerts = filterDocuments(documents.certifications);
            return filteredCerts.length === 0 ? (
              <EmptyState
                icon={Award}
                title={searchQuery || statusFilter !== "all" 
                  ? "Nenhuma certificação encontrada" 
                  : "Nenhuma certificação"
                }
                description={searchQuery || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Esta equipe ainda não possui certificações cadastradas."
                }
              />
            ) : (
              filteredCerts.map(cert => renderDocumentCard(cert, 'certification'))
            );
          })()}
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          {(() => {
            const filteredTech = filterDocuments(documents.technical_attestations);
            return filteredTech.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={searchQuery || statusFilter !== "all" 
                  ? "Nenhum atestado encontrado" 
                  : "Nenhum atestado técnico"
                }
                description={searchQuery || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Esta equipe ainda não possui atestados técnicos cadastrados."
                }
              />
            ) : (
              filteredTech.map(tech => renderDocumentCard(tech, 'technical_attestation'))
            );
          })()}
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          {(() => {
            const filteredLegal = filterDocuments(documents.legal_documents);
            return filteredLegal.length === 0 ? (
              <EmptyState
                icon={Shield}
                title={searchQuery || statusFilter !== "all" 
                  ? "Nenhum documento encontrado" 
                  : "Nenhum documento jurídico"
                }
                description={searchQuery || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Esta equipe ainda não possui documentos jurídicos cadastrados."
                }
              />
            ) : (
              filteredLegal.map(legal => renderDocumentCard(legal, 'legal_document'))
            );
          })()}
        </TabsContent>
      </Tabs>

      {totalDocuments > 0 && (
        <Card className="card-corporate">
          <div className="text-center text-sm text-muted-foreground">
            Total de {totalDocuments} documento{totalDocuments !== 1 ? 's' : ''} na equipe
          </div>
        </Card>
      )}
    </div>
  );
}