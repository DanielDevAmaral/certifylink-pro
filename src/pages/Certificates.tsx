import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TechnicalAttestationForm } from "@/components/forms/TechnicalAttestationForm";
import { useTechnicalAttestations, useDeleteTechnicalAttestation } from "@/hooks/useTechnicalAttestations";
import type { TechnicalCertificate } from "@/types";
import { 
  Plus, 
  Search, 
  Filter, 
  FileCheck, 
  Calendar,
  DollarSign,
  Building,
  Eye,
  Download,
  Edit,
  Trash2
} from "lucide-react";

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAttestation, setSelectedAttestation] = useState<TechnicalCertificate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { attestations = [], isLoading } = useTechnicalAttestations();
  const deleteMutation = useDeleteTechnicalAttestation();

  const filteredCertificates = attestations.filter(cert =>
    cert.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.project_object?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (attestation: TechnicalCertificate) => {
    setSelectedAttestation(attestation);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este atestado?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAttestation(null);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Atestados de Capacidade Técnica"
        description="Gestão de atestados para comprovação de experiência em editais"
      >
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="btn-corporate gap-2">
              <Plus className="h-4 w-4" />
              Novo Atestado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TechnicalAttestationForm
              attestation={selectedAttestation || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search Bar */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, objeto ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="valid" />
            <span className="text-sm text-muted-foreground">
              {filteredCertificates.filter(c => c.status === 'valid').length} válidos
            </span>
          </div>
        </div>
      </Card>

      {/* Certificates Grid */}
      <div className="space-y-4">
        {filteredCertificates.map((certificate) => (
          <Card key={certificate.id} className="card-corporate">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <StatusBadge status={certificate.status} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    {certificate.project_object}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{certificate.client_name}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Período: {certificate.project_period_start} a {certificate.project_period_end}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-success">
                        {formatCurrency(certificate.project_value)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsible & Certifications */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Emissor Responsável:</p>
                  <p className="text-sm text-muted-foreground">
                    {certificate.issuer_name} - {certificate.issuer_position}
                  </p>
                </div>

                {certificate.related_certifications && certificate.related_certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Certificações Relacionadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {certificate.related_certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Válido até</p>
                  <p className="text-sm font-semibold text-foreground">
                    {certificate.validity_date}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleEdit(certificate)}
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Eye className="h-3 w-3" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-3 w-3" />
                    Download PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(certificate.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCertificates.length === 0 && (
        <Card className="card-corporate">
          <div className="text-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum atestado encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Cadastre o primeiro atestado de capacidade técnica para comprovar experiência.
            </p>
            <Button className="btn-corporate gap-2" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Novo Atestado
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}