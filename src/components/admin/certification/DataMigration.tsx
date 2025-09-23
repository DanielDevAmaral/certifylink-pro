import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useCertifications } from "@/hooks/useCertifications";
import { useCertificationTypes } from "@/hooks/useCertificationTypes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

interface DuplicateGroup {
  names: string[];
  certifications: any[];
  suggestedType?: any;
}

export function DataMigration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

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
                      <Badge key={nameIndex} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {group.suggestedType && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Tipo Padronizado Sugerido:</span>
                    </div>
                    <p className="text-green-700">
                      <strong>{group.suggestedType.full_name}</strong>
                    </p>
                    <p className="text-sm text-green-600">
                      Plataforma: {group.suggestedType.platform?.name} | 
                      Função: {group.suggestedType.function}
                    </p>
                  </div>
                )}
                
                {!group.suggestedType && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Ação Necessária:</span>
                    </div>
                    <p className="text-yellow-700">
                      Nenhum tipo padronizado encontrado. Considere criar um novo tipo ou 
                      adicionar aliases aos tipos existentes.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                  {group.suggestedType && (
                    <Button size="sm">
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
    </div>
  );
}