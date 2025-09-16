import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LegalDocumentForm } from "@/components/forms/LegalDocumentForm";
import { useLegalDocuments, useDeleteLegalDocument } from "@/hooks/useLegalDocuments";
import type { LegalDocument, LegalDocumentType } from "@/types";
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
  Lock,
  Edit,
  Trash2
} from "lucide-react";

const categories: Array<{
  key: LegalDocumentType;
  title: string;
  icon: any;
  description: string;
}> = [
  {
    key: 'FISCAL',
    title: 'Fiscal',
    icon: FileText,
    description: 'Certidões e comprovantes fiscais'
  },
  {
    key: 'TRABALHISTA', 
    title: 'Trabalhista',
    icon: Shield,
    description: 'Documentos trabalhistas'
  },
  {
    key: 'AMBIENTAL',
    title: 'Ambiental', 
    icon: Scale,
    description: 'Licenças e certificados ambientais'
  },
  {
    key: 'PREVIDENCIARIO',
    title: 'Previdenciário',
    icon: DollarSign,
    description: 'Documentos previdenciários'
  }
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<LegalDocumentType>("FISCAL");
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { documents = [], isLoading } = useLegalDocuments();
  const deleteMutation = useDeleteLegalDocument();

  const currentDocuments = documents.filter(doc => doc.document_type === activeTab);
  const filteredDocuments = currentDocuments.filter(doc =>
    doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (document: LegalDocument) => {
    setSelectedDocument(document);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedDocument(null);
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
        title="Documentos Jurídicos e Fiscais"
        description="Gestão centralizada da documentação para editais governamentais"
      >
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="btn-corporate gap-2">
              <Plus className="h-4 w-4" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <LegalDocumentForm
              document={selectedDocument || undefined}
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
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Document Categories Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LegalDocumentType)} className="space-y-6">
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
                        {document.document_name}
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