import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCertificationSearch } from '@/hooks/useCertificationSearch';
import { useCertificationTypes } from '@/hooks/useCertificationTypes';
import { AlertCircle, CheckCircle2, FileWarning, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MigrationDetailDialog } from './MigrationDetailDialog';
import { StandardizationApplyDialog } from './StandardizationApplyDialog';
import { DuplicateMergeDialog } from './DuplicateMergeDialog';
import { useMigrationOperations } from '@/hooks/useMigrationOperations';

type SeverityType = 'exact' | 'similar' | 'function_variation' | 'duplicate_type';

interface DuplicateGroup {
  severity: SeverityType;
  irregularityType: SeverityType; // Alias for compatibility
  names: string[];
  certifications: Array<{
    id: string;
    name: string;
    function: string;
    user_id: string;
    creator_name?: string;
  }>;
  suggestedType?: {
    id: string;
    name: string;
    fullName: string;
  };
  reason: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function areSimilar(text1: string, text2: string, userId1: string, userId2: string): boolean {
  // Only flag as duplicate if same user
  if (userId1 !== userId2) return false;
  
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  if (norm1 === norm2) return true;
  
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
  
  return commonWords.length >= Math.min(words1.length, words2.length) * 0.7;
}

function areExactDuplicates(cert1: any, cert2: any): boolean {
  // Must be same user AND same name/function
  return cert1.user_id === cert2.user_id &&
         normalizeText(cert1.name) === normalizeText(cert2.name) &&
         normalizeText(cert1.function) === normalizeText(cert2.function);
}

// Stable signature builders
function buildCertsSignature(certs: any[]): string {
  if (!certs || certs.length === 0) return 'empty-certs';
  
  const sorted = [...certs].sort((a, b) => a.id.localeCompare(b.id));
  return sorted
    .map(c => `${c.id}|${c.user_id}|${normalizeText(c.name)}|${normalizeText(c.function)}|${c.updated_at}`)
    .join('::');
}

function buildTypesSignature(types: any[]): string {
  if (!types || types.length === 0) return 'empty-types';
  
  const sorted = [...types].sort((a, b) => a.id.localeCompare(b.id));
  return sorted
    .map(t => `${t.id}|${t.platform_id}|${normalizeText(t.name)}|${normalizeText(t.full_name)}|${t.updated_at}`)
    .join('::');
}

export function DataMigration() {
  const { data: certifications = [], isLoading: loadingCerts } = useCertificationSearch();
  const { data: types = [], isLoading: loadingTypes } = useCertificationTypes();
  const { applyStandardization, isApplying, mergeDuplicates, isMerging } = useMigrationOperations();

  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedGroupForMerge, setSelectedGroupForMerge] = useState<DuplicateGroup | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityType | 'all'>('all');

  // Refs for stable analysis
  const lastCertsSigRef = useRef<string>('');
  const lastTypesSigRef = useRef<string>('');
  const lastAnalysisAtRef = useRef<number>(0);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const analyzeDuplicates = useCallback((showProgress = false) => {
    if (showProgress) {
      setIsAnalyzing(true);
    }

    const groups: DuplicateGroup[] = [];

    // FASE 1: Duplicatas exatas (mesmo user_id + nome + função)
    const exactDuplicates = new Map<string, typeof certifications>();
    certifications.forEach(cert => {
      certifications.forEach(other => {
        if (cert.id !== other.id && areExactDuplicates(cert, other)) {
          const key = `${cert.user_id}-${normalizeText(cert.name)}-${normalizeText(cert.function)}`;
          if (!exactDuplicates.has(key)) {
            exactDuplicates.set(key, []);
          }
          const existing = exactDuplicates.get(key)!;
          if (!existing.find(c => c.id === cert.id)) {
            existing.push(cert);
          }
          if (!existing.find(c => c.id === other.id)) {
            existing.push(other);
          }
        }
      });
    });

    exactDuplicates.forEach(certs => {
      if (certs.length > 1) {
        const uniqueNames = [...new Set(certs.map(c => c.name))];
        groups.push({
          severity: 'exact',
          irregularityType: 'exact',
          names: uniqueNames,
          certifications: certs,
          reason: `${certs.length} certificações idênticas do mesmo usuário`
        });
      }
    });

    // FASE 2: Nomes similares (mesmo user_id)
    const similarGroups = new Map<string, typeof certifications>();
    for (let i = 0; i < certifications.length; i++) {
      for (let j = i + 1; j < certifications.length; j++) {
        const cert1 = certifications[i];
        const cert2 = certifications[j];
        
        // Only if same user
        if (cert1.user_id === cert2.user_id && 
            areSimilar(cert1.name, cert2.name, cert1.user_id, cert2.user_id) &&
            !areExactDuplicates(cert1, cert2)) {
          const key = `${cert1.user_id}-similar-${Math.min(i, j)}`;
          if (!similarGroups.has(key)) {
            similarGroups.set(key, [cert1, cert2]);
          } else {
            const group = similarGroups.get(key)!;
            if (!group.find(c => c.id === cert1.id)) group.push(cert1);
            if (!group.find(c => c.id === cert2.id)) group.push(cert2);
          }
        }
      }
    }

    similarGroups.forEach(certs => {
      const uniqueNames = [...new Set(certs.map(c => c.name))];
      groups.push({
        severity: 'similar',
        irregularityType: 'similar',
        names: uniqueNames,
        certifications: certs,
        reason: `Nomes similares que podem ser o mesmo tipo (mesmo usuário)`
      });
    });

    // FASE 3: Variações de função (mesmo user_id + mesmo nome normalizado)
    const functionVariations = new Map<string, typeof certifications>();
    certifications.forEach(cert => {
      const normName = normalizeText(cert.name);
      certifications.forEach(other => {
        if (cert.id !== other.id && 
            cert.user_id === other.user_id &&
            normalizeText(other.name) === normName && 
            normalizeText(cert.function) !== normalizeText(other.function)) {
          const key = `${cert.user_id}-${normName}`;
          if (!functionVariations.has(key)) {
            functionVariations.set(key, []);
          }
          const existing = functionVariations.get(key)!;
          if (!existing.find(c => c.id === cert.id)) existing.push(cert);
          if (!existing.find(c => c.id === other.id)) existing.push(other);
        }
      });
    });

    functionVariations.forEach(certs => {
      if (certs.length > 1) {
        const uniqueNames = [...new Set(certs.map(c => c.name))];
        const functions = [...new Set(certs.map(c => c.function))];
        groups.push({
          severity: 'function_variation',
          irregularityType: 'function_variation',
          names: uniqueNames,
          certifications: certs,
          reason: `Mesmo nome com ${functions.length} funções diferentes (mesmo usuário): ${functions.join(', ')}`
        });
      }
    });

    // FASE 4: Tipos duplicados - simplificada
    const typesByPlatformAndName = new Map<string, typeof types>();
    const typesByPlatformAndFullName = new Map<string, typeof types>();

    types.forEach(type => {
      // Group by platform + normalized name
      const keyByName = `${type.platform_id}-${normalizeText(type.name)}`;
      if (!typesByPlatformAndName.has(keyByName)) {
        typesByPlatformAndName.set(keyByName, []);
      }
      typesByPlatformAndName.get(keyByName)!.push(type);

      // Group by platform + normalized full_name
      const keyByFullName = `${type.platform_id}-${normalizeText(type.full_name)}`;
      if (!typesByPlatformAndFullName.has(keyByFullName)) {
        typesByPlatformAndFullName.set(keyByFullName, []);
      }
      typesByPlatformAndFullName.get(keyByFullName)!.push(type);
    });

    // Detect duplicates: any group with 2+ types
    const typeDuplicateKeys = new Set<string>();
    
    typesByPlatformAndName.forEach((typeGroup, key) => {
      if (typeGroup.length > 1) {
        typeDuplicateKeys.add(key);
        const typeNames = typeGroup.map(t => `${t.name} (${t.full_name})`);
        groups.push({
          severity: 'duplicate_type',
          irregularityType: 'duplicate_type',
          names: typeNames,
          certifications: [],
          reason: `${typeGroup.length} tipos com mesmo nome na mesma plataforma`
        });
      }
    });

    typesByPlatformAndFullName.forEach((typeGroup, key) => {
      if (typeGroup.length > 1 && !typeDuplicateKeys.has(key)) {
        const typeNames = typeGroup.map(t => `${t.name} (${t.full_name})`);
        groups.push({
          severity: 'duplicate_type',
          irregularityType: 'duplicate_type',
          names: typeNames,
          certifications: [],
          reason: `${typeGroup.length} tipos com mesmo nome completo na mesma plataforma`
        });
      }
    });

    setDuplicates(groups);
    setAnalysisComplete(true);

    if (showProgress) {
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  }, [certifications, types]);

  // Stable auto-refresh with cooldown
  useEffect(() => {
    if (loadingCerts || loadingTypes) return;

    const certsSig = buildCertsSignature(certifications);
    const typesSig = buildTypesSignature(types);
    const now = Date.now();
    const COOLDOWN_MS = 10000; // 10 seconds cooldown

    const sigChanged = certsSig !== lastCertsSigRef.current || typesSig !== lastTypesSigRef.current;
    const cooldownPassed = (now - lastAnalysisAtRef.current) > COOLDOWN_MS;

    if (sigChanged && cooldownPassed && !isAnalyzing) {
      console.log('[DataMigration] Auto-refreshing analysis due to data changes...');
      
      // Clear any pending timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // Debounce the analysis
      analysisTimeoutRef.current = setTimeout(() => {
        lastCertsSigRef.current = certsSig;
        lastTypesSigRef.current = typesSig;
        lastAnalysisAtRef.current = Date.now();
        analyzeDuplicates(false);
      }, 500);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [certifications, types, loadingCerts, loadingTypes, isAnalyzing, analyzeDuplicates]);

  const handleAnalyze = () => {
    const certsSig = buildCertsSignature(certifications);
    const typesSig = buildTypesSignature(types);
    lastCertsSigRef.current = certsSig;
    lastTypesSigRef.current = typesSig;
    lastAnalysisAtRef.current = Date.now();
    analyzeDuplicates(true);
  };

  const handleViewDetails = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setDetailDialogOpen(true);
  };

  const handleApplyStandardization = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setApplyDialogOpen(true);
  };

  const handleMerge = (group: DuplicateGroup) => {
    setSelectedGroupForMerge(group);
    setMergeDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    if (!selectedGroupForMerge) return;
    
    await mergeDuplicates.mutateAsync({
      certificationIds: selectedGroupForMerge.certifications.map(c => c.id),
      keepStrategy: 'newest'
    });

    // Remove group from list immediately
    setDuplicates(prev => prev.filter(g => g !== selectedGroupForMerge));
    setSelectedGroupForMerge(null);
  };

  const filteredDuplicates = useMemo(() => {
    if (severityFilter === 'all') return duplicates;
    return duplicates.filter(d => d.severity === severityFilter);
  }, [duplicates, severityFilter]);

  const getSeverityBadge = (severity: SeverityType) => {
    const config = {
      exact: { label: 'Duplicata Exata', variant: 'destructive' as const },
      similar: { label: 'Similar', variant: 'default' as const },
      function_variation: { label: 'Variação de Função', variant: 'secondary' as const },
      duplicate_type: { label: 'Tipo Duplicado', variant: 'outline' as const }
    };
    
    const { label, variant } = config[severity];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const stats = {
    exact: duplicates.filter(d => d.severity === 'exact').length,
    similar: duplicates.filter(d => d.severity === 'similar').length,
    function_variation: duplicates.filter(d => d.severity === 'function_variation').length,
    duplicate_type: duplicates.filter(d => d.severity === 'duplicate_type').length,
    total: duplicates.length
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Análise de Inconsistências
          </CardTitle>
          <CardDescription>
            Detecta certificações duplicadas, nomes similares, variações de função e tipos duplicados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || loadingCerts || loadingTypes}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Analisar Duplicações'
              )}
            </Button>

            {isAnalyzing && (
              <div className="flex-1">
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            {analysisComplete && !isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Análise concluída
              </div>
            )}
          </div>

          {analysisComplete && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-destructive">{stats.exact}</div>
                  <div className="text-xs text-muted-foreground">Duplicatas Exatas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.similar}</div>
                  <div className="text-xs text-muted-foreground">Similares</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-secondary">{stats.function_variation}</div>
                  <div className="text-xs text-muted-foreground">Variações de Função</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.duplicate_type}</div>
                  <div className="text-xs text-muted-foreground">Tipos Duplicados</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisComplete && duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Grupos de Duplicação Encontrados</CardTitle>
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({stats.total})</SelectItem>
                  <SelectItem value="exact">Duplicatas Exatas ({stats.exact})</SelectItem>
                  <SelectItem value="similar">Similares ({stats.similar})</SelectItem>
                  <SelectItem value="function_variation">Variações de Função ({stats.function_variation})</SelectItem>
                  <SelectItem value="duplicate_type">Tipos Duplicados ({stats.duplicate_type})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredDuplicates.map((group, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(group.severity)}
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {group.names.slice(0, 3).join(' / ')}
                          {group.names.length > 3 && ` (+${group.names.length - 3})`}
                        </p>
                        <p className="text-sm text-muted-foreground">{group.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.severity === 'duplicate_type' ? (
                        <Button variant="outline" size="sm" disabled>
                          Corrigir na aba Tipos
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(group)}
                          >
                            Ver Detalhes
                          </Button>
                          {group.severity === 'exact' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleMerge(group)}
                              disabled={isMerging}
                            >
                              {isMerging ? 'Mesclando...' : 'Mesclar Duplicatas'}
                            </Button>
                          )}
                          {(group.severity === 'similar' || group.severity === 'function_variation') && (
                            <Button 
                              size="sm"
                              onClick={() => handleApplyStandardization(group)}
                              disabled={isApplying}
                            >
                              {isApplying ? 'Aplicando...' : 'Aplicar Padronização'}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedGroup && (
        <>
          <MigrationDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            group={selectedGroup}
          />
          <StandardizationApplyDialog
            open={applyDialogOpen}
            onOpenChange={setApplyDialogOpen}
            group={selectedGroup}
            onSuccess={() => {
              setApplyDialogOpen(false);
              // Trigger re-analysis after a short delay
              setTimeout(() => {
                const certsSig = buildCertsSignature(certifications);
                const typesSig = buildTypesSignature(types);
                lastCertsSigRef.current = certsSig;
                lastTypesSigRef.current = typesSig;
                lastAnalysisAtRef.current = Date.now();
                analyzeDuplicates(false);
              }, 1000);
            }}
          />
        </>
      )}

      {selectedGroupForMerge && (
        <DuplicateMergeDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          certificationIds={selectedGroupForMerge.certifications.map(c => c.id)}
          certificationNames={selectedGroupForMerge.names}
          onConfirm={handleConfirmMerge}
        />
      )}
    </div>
  );
}
