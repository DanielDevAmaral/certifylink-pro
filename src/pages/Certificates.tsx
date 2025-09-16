import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  FileCheck, 
  Calendar,
  DollarSign,
  Building,
  Eye,
  Download
} from "lucide-react";

// Mock data - será substituído pela integração com Supabase
const mockCertificates = [
  {
    id: "1",
    client_issuer: "Petrobras S.A.",
    object: "Implementação de Sistema de Gestão Integrada",
    period_start: "2023-01-15",
    period_end: "2023-12-20",
    value: 2500000,
    responsible_issuer: "José Carlos Silva - Gerente de TI",
    validity_date: "2025-12-20",
    status: "valid" as const,
    user_name: "João Silva",
    related_certifications: ["AWS Solutions Architect", "PMP"],
    created_at: "2024-01-10"
  },
  {
    id: "2",
    client_issuer: "Banco do Brasil",
    object: "Consultoria em Transformação Digital",
    period_start: "2022-06-10",
    period_end: "2023-03-15",
    value: 1800000,
    responsible_issuer: "Maria Fernanda Costa - Diretora de Inovação",
    validity_date: "2024-03-15",
    status: "expiring" as const,
    user_name: "Maria Santos",
    related_certifications: ["CISSP", "ITIL"],
    created_at: "2023-11-20"
  },
  {
    id: "3",
    client_issuer: "Vale S.A.",
    object: "Desenvolvimento de Plataforma de Monitoramento",
    period_start: "2021-03-01",
    period_end: "2022-08-30",
    value: 3200000,
    responsible_issuer: "Roberto Almeida - Coordenador de Projetos",
    validity_date: "2023-08-30",
    status: "expired" as const,
    user_name: "Carlos Oliveira",
    related_certifications: ["AWS DevOps", "Scrum Master"],
    created_at: "2023-08-15"
  }
];

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCertificates = mockCertificates.filter(cert =>
    cert.client_issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Novo Atestado
        </Button>
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
                    {certificate.object}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{certificate.client_issuer}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Período: {certificate.period_start} a {certificate.period_end}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-success">
                        {formatCurrency(certificate.value)}
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
                    {certificate.responsible_issuer}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Responsável Interno:</p>
                  <p className="text-sm text-muted-foreground">{certificate.user_name}</p>
                </div>

                {certificate.related_certifications.length > 0 && (
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
                  <Button size="sm" variant="outline" className="gap-2">
                    <Eye className="h-3 w-3" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-3 w-3" />
                    Download PDF
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
            <Button className="btn-corporate gap-2">
              <Plus className="h-4 w-4" />
              Novo Atestado
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}