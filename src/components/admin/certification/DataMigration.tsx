import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, RefreshCw, Eye, X, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  severity: 'exact' | 'similar' | 'function_mismatch';
  irregularityType: 'exact_duplicate' | 'similar_names' | 'function_variation';
}

export function DataMigration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedDetailGroup, setSelectedDetailGroup] = useState<{ group: DuplicateGroup; index: number } | null>(null);
  const [selectedApplyGroup, setSelectedApplyGroup] = useState<{ group: DuplicateGroup; index: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'exact' | 'similar' | 'function_mismatch'>('all');

  const { data: certifications = [] } = useCertifications();
  const { data: types = [] } = useCertificationTypes();

  // Função para calcular similaridade usando Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Função para normalizar nomes para comparação
  const normalizeForComparison = (name: string): string => {
    return name.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  };

  // Função para verificar se são duplicatas exatas
  const areExactDuplicates = (cert1: any, cert2: any): boolean => {
    const normalized1 = normalizeForComparison(cert1.name);
    const normalized2 = normalizeForComparison(cert2.name);
    const func1 = normalizeForComparison(cert1.function || '');
    const func2 = normalizeForComparison(cert2.function || '');
    
    return normalized1 === normalized2 && func1 === func2;
  };

  // Função para verificar se dois nomes são similares
  const areSimilar = (name1: string, name2: string): boolean => {
    const normalized1 = normalizeForComparison(name1);
    const normalized2 = normalizeForComparison(name2);
    
    if (normalized1 === normalized2) return false;
    
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const distance = levenshteinDistance(normalized1, normalized2);
    const similarity = (maxLength - distance) / maxLength;
    
    return similarity > 0.8 && similarity < 1.0;
  };

  const analyzeDuplicates = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const potentialGroups: DuplicateGroup[] = [];
      const processedCerts = new Set<string>();
      
      // FASE 1: Detectar duplicatas EXATAS (máxima prioridade)
      certifications.forEach((cert, index) => {
        if (processedCerts.has(cert.id)) return;
        
        const exactDuplicates = [cert];
        processedCerts.add(cert.id);
        
        certifications.slice(index + 1).forEach(otherCert => {
          if (processedCerts.has(otherCert.id)) return;
          
          if (areExactDuplicates(cert, otherCert)) {
            exactDuplicates.push(otherCert);
            processedCerts.add(otherCert.id);
          }
        });
        
        if (exactDuplicates.length > 1) {
          const names = [...new Set(exactDuplicates.map(c => c.name))];
          
          // Encontrar tipo correspondente
          const suggestedType = types.find(type => 
            normalizeForComparison(type.full_name).includes(normalizeForComparison(names[0])) ||
            normalizeForComparison(names[0]).includes(normalizeForComparison(type.full_name))
          );
          
          potentialGroups.push({
            names,
            certifications: exactDuplicates,
            suggestedType,
            severity: 'exact',
            irregularityType: 'exact_duplicate'
          });
        }
      });
      
      // FASE 2: Detectar certificações SIMILARES
      const remainingCerts = certifications.filter(cert => !processedCerts.has(cert.id));
      
      remainingCerts.forEach((cert, index) => {
        if (processedCerts.has(cert.id)) return;
        
        const similarCerts = [cert];
        processedCerts.add(cert.id);
        
        remainingCerts.slice(index + 1).forEach(otherCert => {
          if (processedCerts.has(otherCert.id)) return;
          
          const namesSimilar = areSimilar(cert.name, otherCert.name);
          const functionsMatch = normalizeForComparison(cert.function || '') === 
                                normalizeForComparison(otherCert.function || '');
          
          if (namesSimilar && functionsMatch) {
            similarCerts.push(otherCert);
            processedCerts.add(otherCert.id);
          }
        });
        
        if (similarCerts.length > 1) {
          const names = [...new Set(similarCerts.map(c => c.name))];
          
          if (names.length > 1) {
            const functionCounts = similarCerts.reduce((acc, cert) => {
              acc[cert.function] = (acc[cert.function] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const mostCommonFunction = Object.entries(functionCounts)
              .sort(([,a], [,b]) => b - a)[0]?.[0];
            
            const suggestedType = types.find(type => {
              const typeFullName = `${type.name} - ${type.function}`;
              const certFullName = `${names[0]} - ${mostCommonFunction}`;
              
              return type.aliases?.some(alias => 
                normalizeForComparison(alias).includes(normalizeForComparison(names[0])) ||
                normalizeForComparison(names[0]).includes(normalizeForComparison(alias))
              ) ||
              normalizeForComparison(typeFullName).includes(normalizeForComparison(certFullName)) ||
              normalizeForComparison(certFullName).includes(normalizeForComparison(typeFullName));
            });
            
            potentialGroups.push({
              names,
              certifications: similarCerts,
              suggestedType,
              severity: 'similar',
              irregularityType: 'similar_names'
            });
          }
        }
      });
      
      // FASE 3: Detectar mesma certificação com funções diferentes
      const certsByName = certifications.reduce((acc, cert) => {
        const normalized = normalizeForComparison(cert.name);
        if (!acc[normalized]) acc[normalized] = [];
        acc[normalized].push(cert);
        return acc;
      }, {} as Record<string, any[]>);
      
      Object.entries(certsByName).forEach(([normalizedName, certs]) => {
        if (certs.length < 2) return;
        
        // Verificar se já foi processado
        if (certs.every(cert => processedCerts.has(cert.id))) return;
        
        const functions = [...new Set(certs.map(c => normalizeForComparison(c.function || '')))];
        
        if (functions.length > 1) {
          certs.forEach(cert => processedCerts.add(cert.id));
          
          potentialGroups.push({
            names: [certs[0].name],
            certifications: certs,
            suggestedType: undefined,
            severity: 'function_mismatch',
            irregularityType: 'function_variation'
          });
        }
      });

      // Ordenar: Exatas primeiro, depois similares, depois variações de função
      const sortedGroups = potentialGroups.sort((a, b) => {
        const severityOrder = { exact: 0, similar: 1, function_mismatch: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      setDuplicates(sortedGroups);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
      
      const exactCount = sortedGroups.filter(g => g.severity === 'exact').length;
      const similarCount = sortedGroups.filter(g => g.severity === 'similar').length;
      const functionCount = sortedGroups.filter(g => g.severity === 'function_mismatch').length;
      
      toast.success(
        `Análise concluída! ${exactCount} duplicatas exatas, ${similarCount} similares, ${functionCount} variações de função.`
      );
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
    const exactDuplicates = duplicates.filter(g => g.severity === 'exact').length;
    const similarDuplicates = duplicates.filter(g => g.severity === 'similar').length;
    const functionMismatches = duplicates.filter(g => g.severity === 'function_mismatch').length;
    
    return {
      totalCertifications,
      duplicatedCertifications,
      uniqueNames,
      duplicateGroups: duplicates.length,
      exactDuplicates,
      similarDuplicates,
      functionMismatches
    };
  };

  const filteredDuplicates = severityFilter === 'all' 
    ? duplicates 
    : duplicates.filter(g => g.severity === severityFilter);

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertifications}</div>
            <p className="text-xs text-muted-foreground">Certificações</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Problemas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.duplicatedCertifications}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.duplicatedCertifications / stats.totalCertifications) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Duplicatas Exatas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.exactDuplicates}</div>
            <p className="text-xs text-red-600">Prioridade ALTA</p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Similares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.similarDuplicates}</div>
            <p className="text-xs text-orange-600">Prioridade MÉDIA</p>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.functionMismatches}</div>
            <p className="text-xs text-yellow-600">Função diferente</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.duplicateGroups}</div>
            <p className="text-xs text-muted-foreground">Para corrigir</p>
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Irregularidades Detectadas</h3>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas ({duplicates.length})
                  </SelectItem>
                  <SelectItem value="exact">
                    Duplicatas Exatas ({stats.exactDuplicates})
                  </SelectItem>
                  <SelectItem value="similar">
                    Similares ({stats.similarDuplicates})
                  </SelectItem>
                  <SelectItem value="function_mismatch">
                    Variações de Função ({stats.functionMismatches})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredDuplicates.map((group, index) => (
            <Card key={index} className={
              group.severity === 'exact' ? 'border-red-300' :
              group.severity === 'similar' ? 'border-orange-300' :
              'border-yellow-300'
            }>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Grupo {duplicates.indexOf(group) + 1}</span>
                    <Badge 
                      variant={group.severity === 'exact' ? 'destructive' : 'secondary'}
                      className={
                        group.severity === 'exact' ? 'bg-red-600' :
                        group.severity === 'similar' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-white'
                      }
                    >
                      {group.severity === 'exact' ? 'DUPLICATA EXATA' :
                       group.severity === 'similar' ? 'SIMILAR' :
                       'VARIAÇÃO DE FUNÇÃO'}
                    </Badge>
                  </div>
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