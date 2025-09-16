import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Scale, 
  Calendar,
  Shield,
  DollarSign,
  FileText,
  Eye,
  Download,
  Lock
} from "lucide-react";

// Mock data - será substituído pela integração com Supabase
const mockDocuments = {
  legal_qualification: [
    {
      id: "1",
      name: "Contrato Social Atualizado",
      subtype: "social_contract",
      validity_date: "2025-06-15",
      status: "valid" as const,
      is_sensitive: false,
      created_at: "2024-01-10"
    },
    {
      id: "2", 
      name: "Documentos dos Sócios",
      subtype: "partner_documents",
      validity_date: null,
      status: "valid" as const,
      is_sensitive: true,
      created_at: "2024-01-10"
    }
  ],
  tax_regularity: [
    {
      id: "3",
      name: "Certidão Negativa Federal",
      subtype: "federal_cnd", 
      validity_date: "2024-03-15",
      status: "expiring" as const,
      is_sensitive: false,
      created_at: "2023-12-15"
    },
    {
      id: "4",
      name: "Certificado de Regularidade FGTS",
      subtype: "fgts",
      validity_date: "2024-12-20",
      status: "valid" as const,
      is_sensitive: false,
      created_at: "2024-01-05"
    },
    {
      id: "5",
      name: "Certidão Negativa Estadual",
      subtype: "state_clearance",
      validity_date: "2024-02-28",
      status: "expiring" as const,
      is_sensitive: false,
      created_at: "2023-11-20"
    }
  ],
  economic_financial: [
    {
      id: "6",
      name: "Balanço Patrimonial 2023",
      subtype: "balance_sheet",
      validity_date: "2024-12-31", 
      status: "valid" as const,
      is_sensitive: true,
      created_at: "2024-01-15"
    },
    {
      id: "7",
      name: "Certidão de Falência e Recuperação Judicial",
      subtype: "bankruptcy_certificate",
      validity_date: "2024-06-30",
      status: "valid" as const,
      is_sensitive: false,
      created_at: "2024-01-20"
    }
  ],
  common_declarations: [
    {
      id: "8",
      name: "Declaração de Cumprimento de Requisitos",
      subtype: "requirements_compliance",
      validity_date: null,
      status: "valid" as const,
      is_sensitive: false,
      created_at: "2024-01-25"
    },
    {
      id: "9",
      name: "Declaração de Não Emprego de Menor",
      subtype: "minor_employment",
      validity_date: null,
      status: "valid" as const,
      is_sensitive: false,
      created_at: "2024-01-25"
    }
  ]
};

const categories = [
  {
    key: 'legal_qualification',
    title: 'Habilitação Jurídica',
    icon: Scale,
    description: 'Documentos societários e jurídicos'
  },
  {
    key: 'tax_regularity', 
    title: 'Regularidade Fiscal',
    icon: FileText,
    description: 'Certidões e comprovantes fiscais'
  },
  {
    key: 'economic_financial',
    title: 'Econômico-Financeira', 
    icon: DollarSign,
    description: 'Balanços e demonstrativos financeiros'
  },
  {
    key: 'common_declarations',
    title: 'Declarações Comuns',
    icon: Shield,
    description: 'Declarações padronizadas'
  }
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("legal_qualification");

  const currentDocuments = mockDocuments[activeTab as keyof typeof mockDocuments] || [];
  const filteredDocuments = currentDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        title="Documentos Jurídicos e Fiscais"
        description="Gestão centralizada da documentação para editais governamentais"
      >
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </PageHeader>

      {/* Search Bar */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Document Categories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="flex flex-col gap-2 h-auto py-4 px-3"
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-xs">{category.title}</p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {category.description}
                  </p>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="card-corporate">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <StatusBadge status={document.status} />
                    </div>
                    {document.is_sensitive && (
                      <div className="flex items-center gap-1 text-xs text-warning">
                        <Lock className="h-3 w-3" />
                        Sensível
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {document.name}
                      </h3>
                    </div>

                    {document.validity_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Válido até: {document.validity_date}</span>
                      </div>
                    )}

                    {!document.validity_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Validade: Não se aplica</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1 gap-2">
                        <Eye className="h-3 w-3" />
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <Card className="card-corporate">
                <div className="text-center py-12">
                  <category.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum documento encontrado
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Adicione documentos da categoria "{category.title}" para iniciar a gestão.
                  </p>
                  <Button className="btn-corporate gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Documento
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
}