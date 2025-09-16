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
  Award, 
  Calendar,
  ExternalLink,
  Eye
} from "lucide-react";

// Mock data - será substituído pela integração com Supabase
const mockCertifications = [
  {
    id: "1",
    name: "AWS Solutions Architect Professional",
    function: "Cloud Architecture",
    public_link: "https://aws.amazon.com/certification/",
    validity_date: "2024-12-15",
    equivalence_services: ["Cloud Computing", "Infrastructure Design", "DevOps"],
    approved_equivalence: true,
    status: "valid" as const,
    user_name: "João Silva",
    created_at: "2024-01-10"
  },
  {
    id: "2", 
    name: "PMP - Project Management Professional",
    function: "Project Management",
    public_link: "https://pmi.org/certifications/pmp",
    validity_date: "2024-02-20",
    equivalence_services: ["Project Management", "Team Leadership", "Process Improvement"],
    approved_equivalence: false,
    status: "expiring" as const,
    user_name: "Maria Santos",
    created_at: "2023-12-05"
  },
  {
    id: "3",
    name: "CISSP - Certified Information Systems Security Professional",
    function: "Cybersecurity",
    public_link: "https://isc2.org/certifications/cissp",
    validity_date: "2023-11-30",
    equivalence_services: ["Information Security", "Risk Management", "Compliance"],
    approved_equivalence: true,
    status: "expired" as const,
    user_name: "Carlos Oliveira",
    created_at: "2023-10-15"
  }
];

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredCertifications = mockCertifications.filter(cert =>
    cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        title="Gestão de Certificações"
        description="Controle de certificações profissionais e equivalências de serviços"
      >
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Button 
          className="btn-corporate gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Certificação
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, função ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="valid" />
            <span className="text-sm text-muted-foreground">
              {filteredCertifications.filter(c => c.status === 'valid').length} válidas
            </span>
          </div>
        </div>
      </Card>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCertifications.map((certification) => (
          <Card key={certification.id} className="card-corporate">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <StatusBadge status={certification.status} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {certification.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {certification.function}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Válido até: {certification.validity_date}</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Responsável:</p>
                <p className="text-sm text-muted-foreground">{certification.user_name}</p>
              </div>

              {certification.equivalence_services && certification.equivalence_services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Equivalências:</p>
                  <div className="flex flex-wrap gap-1">
                    {certification.equivalence_services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                  {!certification.approved_equivalence && (
                    <p className="text-xs text-warning">⚠️ Aguardando aprovação das equivalências</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1 gap-2">
                  <Eye className="h-3 w-3" />
                  Visualizar
                </Button>
                {certification.public_link && (
                  <Button size="sm" variant="outline" className="gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCertifications.length === 0 && (
        <Card className="card-corporate">
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma certificação encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Cadastre a primeira certificação para começar a gestão documental.
            </p>
            <Button 
              className="btn-corporate gap-2"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Certificação
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}