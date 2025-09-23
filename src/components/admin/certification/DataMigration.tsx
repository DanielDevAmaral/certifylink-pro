import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, RefreshCw, Eye, X } from "lucide-react";
import { useCertifications } from "@/hooks/useCertifications";
import { useCertificationTypes } from "@/hooks/useCertificationTypes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { MigrationDetailDialog } from "./MigrationDetailDialog";
import { StandardizationApplyDialog } from "./StandardizationApplyDialog";
import { EditableTypeSelector } from "./EditableTypeSelector";

interface DuplicateGroup {
  names: string[];
  certifications: any[];
  suggestedType?: any;
}

export function DataMigration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedDetailGroup, setSelectedDetailGroup] = useState<{ group: DuplicateGroup; index: number } | null>(null);
  const [selectedApplyGroup, setSelectedApplyGroup] = useState<{ group: DuplicateGroup; index: number } | null>(null);

  const { data: certifications = [] } = useCertifications();
  const { data: types = [] } = useCertificationTypes();

  const analyzeDuplicates = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      // Group certifications by similar names
      const nameGroups: { [key: string]: any[] } = {};
      
      certifications.forEach(cert => {
        const normalizedName = cert.name.toLowerCase()
          .replace(/certificação|certification|certified|professional/gi, '')
          .trim();
        
        const existingKey = Object.keys(nameGroups).find(key => 
          key.includes(normalizedName) || normalizedName.includes(key)
        );
        
        if (existingKey) {
          nameGroups[existingKey].push(cert);
        } else {
          nameGroups[normalizedName] = [cert];
        }
      });

      // Filter only groups with duplicates
      const duplicateGroups: DuplicateGroup[] = Object.entries(nameGroups)
        .filter(([_, certs]) => certs.length > 1)
        .map(([_, certs]) => {
          const names = [...new Set(certs.map(c => c.name))];
          
          // Try to find a matching standardized type
          const suggestedType = types.find(type => 
            names.some(name => 
              type.aliases?.some(alias => 
                name.toLowerCase().includes(alias.toLowerCase()) ||
                alias.toLowerCase().includes(name.toLowerCase())
              ) ||
              name.toLowerCase().includes(type.name.toLowerCase()) ||
              type.name.toLowerCase().includes(name.toLowerCase())
            )
          );

          return {
            names,
            certifications: certs,
            suggestedType
          };
        });

      setDuplicates(duplicateGroups);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
      
      toast.success(`Análise concluída! Encontrados ${duplicateGroups.length} grupos com duplicações.`);
    }, 2000);
  };

  const handleRemoveName = (groupIndex: number, nameToRemove: string) => {
    setDuplicates(prev => prev.map((group, index) => {
      if (index === groupIndex) {
        const updatedNames = group.names.filter(name => name !== nameToRemove);
        
        // Remove certifications with this name
        const updatedCertifications = group.certifications.filter(cert => cert.name !== nameToRemove);
        
        // If less than 2 names remain, mark for removal by returning null
        if (updatedNames.length < 2) {
          toast.success(`Grupo ${index + 1} removido (menos de 2 nomes restantes)`);
          return null;
        }
        
        toast.success(`Nome "${nameToRemove}" removido do grupo ${index + 1}`);
        return {
          ...group,
          names: updatedNames,
          certifications: updatedCertifications
        };
      }
      return group;
    }).filter(Boolean) as DuplicateGroup[]);
  };

  const handleTypeChange = (groupIndex: number, newType: any) => {
    setDuplicates(prev => prev.map((group, index) => {
      if (index === groupIndex) {
        return {
          ...group,
          suggestedType: newType
        };
      }
      return group;
    }));
    toast.success(`Tipo padronizado atualizado para o grupo ${groupIndex + 1}`);
  };

  const handleViewDetails = (group: DuplicateGroup, index: number) => {
    setSelectedDetailGroup({ group, index });
  };

  const handleApplyStandardization = (group: DuplicateGroup, index: number) => {
    setSelectedApplyGroup({ group, index });
  };

  const handleStandardizationSuccess = () => {
    // Re-run analysis to update the data
    setTimeout(() => {
      analyzeDuplicates();
    }, 1000);
  };

  const getStats = () => {
    const totalCertifications = certifications.length;
    const duplicatedCertifications = duplicates.reduce((acc, group) => acc + group.certifications.length, 0);
    const uniqueNames = duplicates.reduce((acc, group) => acc + group.names.length, 0);
    
    return {
      totalCertifications,
      duplicatedCertifications,
      uniqueNames,
      duplicateGroups: duplicates.length
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Certificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertifications}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certificações Duplicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.duplicatedCertifications}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grupos de Duplicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.duplicateGroups}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nomes Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.uniqueNames}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Duplicações</CardTitle>
          <CardDescription>
            Identifique certificações com nomes similares que podem ser padronizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysisComplete && (
            <Button 
              onClick={analyzeDuplicates} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                "Iniciar Análise de Duplicações"
              )}
            </Button>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={75} />
              <p className="text-sm text-muted-foreground text-center">
                Analisando certificações e identificando padrões...
              </p>
            </div>
          )}

          {analysisComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Análise concluída! Encontrados {duplicates.length} grupos com possíveis duplicações.
                Revise os resultados abaixo e padronize conforme necessário.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysisComplete && duplicates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Grupos de Certificações Similares</h3>
          
          {duplicates.map((group, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Grupo {index + 1}</span>
                  <Badge variant="outline">
                    {group.certifications.length} certificações
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Nomes encontrados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.names.map((name, nameIndex) => (
                      <Badge key={nameIndex} variant="secondary" className="relative group">
                        {name}
                        <button
                          onClick={() => handleRemoveName(index, name)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover este nome"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <EditableTypeSelector
                  suggestedType={group.suggestedType}
                  onTypeChange={(newType) => handleTypeChange(index, newType)}
                  groupNames={group.names}
                />
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(group, index)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {group.suggestedType && (
                    <Button 
                      size="sm"
                      onClick={() => handleApplyStandardization(group, index)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aplicar Padronização
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {analysisComplete && duplicates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma Duplicação Encontrada</h3>
            <p className="text-muted-foreground">
              Todas as certificações parecem ter nomes únicos e padronizados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <MigrationDetailDialog
        open={!!selectedDetailGroup}
        onOpenChange={(open) => !open && setSelectedDetailGroup(null)}
        group={selectedDetailGroup?.group || null}
        groupIndex={selectedDetailGroup?.index || 0}
      />

      <StandardizationApplyDialog
        open={!!selectedApplyGroup}
        onOpenChange={(open) => !open && setSelectedApplyGroup(null)}
        group={selectedApplyGroup?.group || null}
        groupIndex={selectedApplyGroup?.index || 0}
        onSuccess={handleStandardizationSuccess}
      />
    </div>
  );
}