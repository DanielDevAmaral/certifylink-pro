import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { QRCodeDialog } from "@/components/common/QRCodeDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { 
  ArrowLeft,
  Award,
  FileText,
  Scale,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  QrCode
} from "lucide-react";

interface UserDocument {
  id: string;
  name: string;
  type: 'certification' | 'technical_attestation' | 'legal_document';
  status: 'valid' | 'expired' | 'expiring' | 'pending' | 'deactivated';
  validity_date: string | null;
  created_at: string;
  updated_at: string;
  details: any;
  document_url?: string;
}

const statusConfig = {
  valid: {
    label: "Válido",
    icon: CheckCircle,
    color: "bg-gradient-success text-success-foreground",
  },
  expired: {
    label: "Vencido", 
    icon: AlertTriangle,
    color: "bg-gradient-destructive text-destructive-foreground",
  },
  expiring: {
    label: "Vencendo",
    icon: Clock,
    color: "bg-gradient-warning text-warning-foreground",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "bg-secondary text-secondary-foreground",
  }
};

const typeConfig = {
  certification: {
    label: "Certificação",
    icon: Award,
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  technical_attestation: {
    label: "Atestado Técnico",
    icon: FileText,
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  legal_document: {
    label: "Documento Jurídico",
    icon: Scale,
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
  }
};

export default function UserDocuments() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name') || 'Usuário';
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  
  const handleDocumentClick = (doc: UserDocument) => {
    switch (doc.type) {
      case 'certification':
        navigate(`/certifications?highlight=${doc.id}`);
        break;
      case 'technical_attestation':
        navigate(`/certificates?highlight=${doc.id}`);
        break;
      case 'legal_document':
        navigate(`/documents?highlight=${doc.id}`);
        break;
    }
  };

  const handleQRCodeClick = (e: React.MouseEvent, doc: UserDocument) => {
    e.stopPropagation();
    setSelectedDocument(doc);
    setQrDialogOpen(true);
  };

  const getQRCodeUrl = (doc: UserDocument) => {
    if (doc.type === 'certification') {
      return doc.details.public_link || '';
    }
    return doc.document_url || '';
  };

  const getQRCodeDescription = (doc: UserDocument) => {
    if (doc.type === 'certification') {
      return 'Compartilhe este link para validação';
    }
    return 'Link para download do documento';
  };

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: async (): Promise<UserDocument[]> => {
      if (!userId) throw new Error('User ID is required');

      const allDocuments: UserDocument[] = [];

      // Buscar certificações
      const { data: certifications, error: certError } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId);

      if (certError) throw certError;

      if (certifications) {
        certifications.forEach(cert => {
          allDocuments.push({
            id: cert.id,
            name: cert.name,
            type: 'certification',
            status: cert.status,
            validity_date: cert.validity_date,
            created_at: cert.created_at,
            updated_at: cert.updated_at,
            details: {
              function: cert.function,
              public_link: cert.public_link
            },
            document_url: cert.public_link
          });
        });
      }

      // Buscar atestados técnicos
      const { data: technicalAttestations, error: techError } = await supabase
        .from('technical_attestations')
        .select('*')
        .eq('user_id', userId);

      if (techError) throw techError;

      if (technicalAttestations) {
        technicalAttestations.forEach(tech => {
          allDocuments.push({
            id: tech.id,
            name: tech.project_object,
            type: 'technical_attestation',
            status: tech.status,
            validity_date: tech.validity_date,
            created_at: tech.created_at,
            updated_at: tech.updated_at,
            details: {
              client_name: tech.client_name,
              issuer_name: tech.issuer_name,
              project_value: tech.project_value
            },
            document_url: tech.document_url
          });
        });
      }

      // Buscar documentos jurídicos
      const { data: legalDocuments, error: legalError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('user_id', userId);

      if (legalError) throw legalError;

      if (legalDocuments) {
        legalDocuments.forEach(legal => {
          allDocuments.push({
            id: legal.id,
            name: legal.document_name,
            type: 'legal_document',
            status: legal.status,
            validity_date: legal.validity_date,
            created_at: legal.created_at,
            updated_at: legal.updated_at,
            details: {
              document_type: legal.document_type,
              document_subtype: legal.document_subtype,
              is_sensitive: legal.is_sensitive
            },
            document_url: legal.document_url
          });
        });
      }

      // Ordenar por data de criação (mais recente primeiro)
      return allDocuments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error || !documents) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Documentos não encontrados</h2>
          <p className="text-muted-foreground">Não foi possível carregar os documentos do usuário.</p>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  const groupedDocuments = {
    certification: documents.filter(doc => doc.type === 'certification'),
    technical_attestation: documents.filter(doc => doc.type === 'technical_attestation'),
    legal_document: documents.filter(doc => doc.type === 'legal_document')
  };

  return (
    <ErrorBoundary>
      <Layout>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(-1)} className="cursor-pointer">
                  Voltar
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Documentos de {userName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <PageHeader
            title={`Documentos de ${userName}`}
            description={`Total de ${documents.length} documentos cadastrados`}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(typeConfig).map(([type, config]) => {
              const count = groupedDocuments[type as keyof typeof groupedDocuments].length;
              const TypeIcon = config.icon;
              
              return (
                <Card key={type} className="card-corporate">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Documents List */}
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([type, docs]) => {
              if (docs.length === 0) return null;
              
              const config = typeConfig[type as keyof typeof typeConfig];
              const TypeIcon = config.icon;

              return (
                <div key={type} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TypeIcon className="h-5 w-5" />
                    {config.label} ({docs.length})
                  </h3>

                  <div className="grid gap-4">
                    {docs.map(doc => {
                      const statusInfo = statusConfig[doc.status];
                      const StatusIcon = statusInfo.icon;
                      const canShowQRCode = doc.document_url && !(doc.type === 'legal_document' && doc.details.is_sensitive);

                      return (
                        <Card 
                          key={doc.id} 
                          className="card-corporate cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>

                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-foreground">{doc.name}</h4>
                                  <Badge className={statusInfo.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Criado {formatDistanceToNow(new Date(doc.created_at), {
                                        addSuffix: true,
                                        locale: ptBR
                                      })}
                                    </span>
                                  </div>
                                  {doc.validity_date && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        Válido até {new Date(doc.validity_date).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Detalhes específicos por tipo */}
                                {doc.type === 'certification' && doc.details.function && (
                                  <p className="text-xs text-muted-foreground">
                                    Função: {doc.details.function}
                                  </p>
                                )}
                                {doc.type === 'technical_attestation' && doc.details.client_name && (
                                  <p className="text-xs text-muted-foreground">
                                    Cliente: {doc.details.client_name}
                                  </p>
                                )}
                                {doc.type === 'legal_document' && doc.details.document_type && (
                                  <p className="text-xs text-muted-foreground">
                                    Tipo: {doc.details.document_type}
                                  </p>
                                )}
                              </div>
                            </div>

                            {canShowQRCode && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleQRCodeClick(e, doc)}
                                className="ml-4"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {documents.length === 0 && (
            <Card className="card-corporate">
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-muted-foreground">
                  {userName} ainda não cadastrou nenhum documento no sistema.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* QR Code Dialog */}
        {selectedDocument && (
          <QRCodeDialog
            open={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            url={getQRCodeUrl(selectedDocument)}
            title={selectedDocument.name}
            description={getQRCodeDescription(selectedDocument)}
          />
        )}
      </Layout>
    </ErrorBoundary>
  );
}