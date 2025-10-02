import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCertifications } from '@/hooks/useCertifications';
import { useCertificationTypes } from '@/hooks/useCertificationTypes';
import { useDuplicateExclusions } from '@/hooks/useDuplicateExclusions';
import { AlertCircle, CheckCircle2, FileWarning, Loader2, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MigrationDetailDialog } from './MigrationDetailDialog';
import { StandardizationApplyDialog } from './StandardizationApplyDialog';
import { DuplicateMergeDialog } from './DuplicateMergeDialog';
import { DuplicateExclusionDialog } from './DuplicateExclusionDialog';
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
    status?: string;
    created_at?: string;
    validity_date?: string;
  }>;
  types?: any[]; // For duplicate_type groups
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

// Stopwords for similarity detection - generic cloud provider terms
const STOPWORDS = new Set([
  'google', 'aws', 'amazon', 'microsoft', 'azure', 'ibm', 'oracle', 'cloud',
  'certification', 'certified', 'professional', 'associate', 'expert', 
  'specialty', 'exam', 'official', 'foundation', 'practitioner'
]);

// Tokenize and filter stopwords
function tokenizeName(text: string): Set<string> {
  const normalized = normalizeText(text);
  const tokens = normalized.split(/\s+/).filter(word => 
    word.length > 2 && !STOPWORDS.has(word)
  );
  return new Set(tokens);
}

// Jaccard similarity between two sets
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Keywords that indicate different certification types
const DIFFERENTIATING_KEYWORDS = [
  'architect', 'developer', 'administrator', 'engineer', 'specialist',
  'leader', 'associate', 'professional', 'expert', 'practitioner',
  'junior', 'senior', 'master', 'advanced', 'beginner', 'intermediate',
  'foundation', 'fundamentals', 'essentials', 'core', 'plus'
];

function areSimilar(
  text1: string, 
  text2: string, 
  userId1: string, 
  userId2: string,
  types: any[] = []
): boolean {
  // Only flag as duplicate if same user
  if (userId1 !== userId2) return false;
  
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  if (norm1 === norm2) return true;
  
  // Check for differentiating keywords
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  for (const keyword of DIFFERENTIATING_KEYWORDS) {
    const hasKeyword1 = words1.some(w => w.includes(keyword));
    const hasKeyword2 = words2.some(w => w.includes(keyword));
    
    // If only one has a differentiating keyword, they're likely different types
    if (hasKeyword1 !== hasKeyword2) {
      return false;
    }
  }
  
  // Check if they match different certification types with different platforms
  const matchingTypes1 = types.filter(t => normalizeText(t.name).includes(norm1) || norm1.includes(normalizeText(t.name)));
  const matchingTypes2 = types.filter(t => normalizeText(t.name).includes(norm2) || norm2.includes(normalizeText(t.name)));
  
  if (matchingTypes1.length > 0 && matchingTypes2.length > 0) {
    const platforms1 = new Set(matchingTypes1.map(t => t.platform_id));
    const platforms2 = new Set(matchingTypes2.map(t => t.platform_id));
    
    // If they match types from different platforms, they're not similar
    const hasCommonPlatform = [...platforms1].some(p => platforms2.has(p));
    if (!hasCommonPlatform) {
      return false;
    }
  }
  
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

// Find the best matching certification type for a group of certifications
function findBestMatchingType(certs: any[], types: any[]): any | undefined {
  if (!types || types.length === 0) return undefined;
  
  const certNames = certs.map(c => normalizeText(c.name));
  const matchScores = new Map<string, number>();
  
  // Score each type based on how well it matches the certification names
  types.forEach(type => {
    const typeNameNorm = normalizeText(type.name);
    const typeFullNameNorm = normalizeText(type.full_name);
    
    let score = 0;
    certNames.forEach(certName => {
      // Exact match on name
      if (certName === typeNameNorm) score += 10;
      // Exact match on full name
      else if (certName === typeFullNameNorm) score += 8;
      // Contains type name
      else if (certName.includes(typeNameNorm)) score += 5;
      // Type name contains cert name
      else if (typeNameNorm.includes(certName)) score += 3;
      // Contains type full name
      else if (certName.includes(typeFullNameNorm)) score += 4;
      // Type full name contains cert name
      else if (typeFullNameNorm.includes(certName)) score += 2;
      
      // Word overlap bonus
      const certWords = certName.split(' ').filter(w => w.length > 3);
      const typeWords = typeNameNorm.split(' ').filter(w => w.length > 3);
      const commonWords = certWords.filter(w => typeWords.includes(w));
      score += commonWords.length;
    });
    
    if (score > 0) {
      matchScores.set(type.id, score);
    }
  });
  
  // Find the type with the highest score
  if (matchScores.size === 0) return undefined;
  
  const bestTypeId = Array.from(matchScores.entries())
    .sort((a, b) => b[1] - a[1])[0][0];
  
  const bestType = types.find(t => t.id === bestTypeId);
  if (!bestType) return undefined;
  
  return {
    id: bestType.id,
    name: bestType.name,
    fullName: bestType.full_name,
    platform: bestType.platform,
    function: bestType.function
  };
}

export function DataMigration() {
  const { data: certifications = [], isLoading: loadingCerts } = useCertifications();
  const { data: types = [], isLoading: loadingTypes } = useCertificationTypes();
  const { isExcluded, addExclusion, isAdding: isAddingExclusion, isLoading: isLoadingExclusions } = useDuplicateExclusions();
  const { applyStandardization, isApplying, mergeDuplicates, isMerging } = useMigrationOperations();

  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedGroupForMerge, setSelectedGroupForMerge] = useState<DuplicateGroup | null>(null);
  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
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
          // Skip if this pair is excluded
          if (isExcluded('certification', cert.id, other.id)) {
            return;
          }
          
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
        
        // Skip if this pair is excluded
        if (isExcluded('certification', cert1.id, cert2.id)) {
          continue;
        }
        
        // Only if same user
        if (cert1.user_id === cert2.user_id && 
            areSimilar(cert1.name, cert2.name, cert1.user_id, cert2.user_id, types) &&
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
      
      // Find the best matching certification type
      const suggestedType = findBestMatchingType(certs, types);
      
      groups.push({
        severity: 'similar',
        irregularityType: 'similar',
        names: uniqueNames,
        certifications: certs,
        suggestedType,
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
          // Skip if this pair is excluded
          if (isExcluded('certification', cert.id, other.id)) {
            return;
          }
          
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
        
        // Find the best matching certification type
        const suggestedType = findBestMatchingType(certs, types);
        
        groups.push({
          severity: 'function_variation',
          irregularityType: 'function_variation',
          names: uniqueNames,
          certifications: certs,
          suggestedType,
          reason: `Mesmo nome com ${functions.length} funções diferentes (mesmo usuário): ${functions.join(', ')}`
        });
      }
    });

    // FASE 4: Identificar tipos duplicados
    // Group types by platform + category + normalized name/full_name (exact matches)
    const typesByKey = new Map<string, typeof types>();
    
    types.forEach(type => {
      const categoryId = type.category_id || 'none';
      const nameKey = `${type.platform_id}-${categoryId}-${normalizeText(type.name)}`;
      const fullNameKey = `${type.platform_id}-${categoryId}-${normalizeText(type.full_name)}`;
      
      if (!typesByKey.has(nameKey)) {
        typesByKey.set(nameKey, []);
      }
      if (!typesByKey.has(fullNameKey)) {
        typesByKey.set(fullNameKey, []);
      }
      
      typesByKey.get(nameKey)!.push(type);
      typesByKey.get(fullNameKey)!.push(type);
    });

    // Find exact duplicate types (same platform, category, and name)
    const duplicateTypes: DuplicateGroup[] = [];
    const processedTypeIds = new Set<string>();

    typesByKey.forEach((typesGroup, key) => {
      if (typesGroup.length > 1) {
        // Get unique types (avoid duplicates from name and full_name matching)
        const uniqueTypes = Array.from(
          new Map(typesGroup.map(t => [t.id, t])).values()
        );
        
        if (uniqueTypes.length > 1) {
          // Filter out excluded pairs
          const filteredTypes = uniqueTypes.filter((type, i) => {
            return uniqueTypes.every((otherType, j) => {
              if (i >= j) return true;
              return !isExcluded('certification_type', type.id, otherType.id);
            });
          });
          
          if (filteredTypes.length > 1) {
            // Check if we haven't processed these types yet
            const typeIds = filteredTypes.map(t => t.id).sort().join('-');
            if (!processedTypeIds.has(typeIds)) {
              processedTypeIds.add(typeIds);
              
              duplicateTypes.push({
                names: filteredTypes.map(t => t.name),
                certifications: [],
                types: filteredTypes,
                severity: 'duplicate_type',
                irregularityType: 'duplicate_type',
                reason: 'Tipos com nomes idênticos na mesma plataforma e categoria'
              });
            }
          }
        }
      }
    });

    console.log(`✓ Encontrados ${duplicateTypes.length} grupos de tipos duplicados (exatos)`);

    // FASE 4b: Detectar tipos similares (não exatos) na mesma plataforma e categoria
    const similarTypeGroups: DuplicateGroup[] = [];
    const typesGroupedByPlatformCategory = new Map<string, typeof types>();

    // Group types by platform + category
    types.forEach(type => {
      const categoryId = type.category_id || 'none';
      const key = `${type.platform_id}-${categoryId}`;
      if (!typesGroupedByPlatformCategory.has(key)) {
        typesGroupedByPlatformCategory.set(key, []);
      }
      typesGroupedByPlatformCategory.get(key)!.push(type);
    });

    // Check for similar types within each platform-category group
    typesGroupedByPlatformCategory.forEach((groupTypes, key) => {
      if (groupTypes.length < 2) return;

      const checked = new Set<string>();

      for (let i = 0; i < groupTypes.length; i++) {
        const typeA = groupTypes[i];
        if (checked.has(typeA.id)) continue;

        const similarGroup: typeof types = [typeA];

        for (let j = i + 1; j < groupTypes.length; j++) {
          const typeB = groupTypes[j];
          if (checked.has(typeB.id)) continue;

          // Skip if this pair is excluded
          if (isExcluded('certification_type', typeA.id, typeB.id)) {
            continue;
          }

          // Check if already in an exact duplicate group
          const alreadyInExactGroup = processedTypeIds.has(
            [typeA.id, typeB.id].sort().join('-')
          );
          if (alreadyInExactGroup) continue;

          const nameA = normalizeText(typeA.full_name || typeA.name);
          const nameB = normalizeText(typeB.full_name || typeB.name);

          // Check if one name contains the other
          const containsMatch = nameA.includes(nameB) || nameB.includes(nameA);

          // Check Jaccard similarity
          const tokensA = tokenizeName(typeA.full_name || typeA.name);
          const tokensB = tokenizeName(typeB.full_name || typeB.name);
          const similarity = jaccardSimilarity(tokensA, tokensB);

          // Check alias overlap
          const aliasesA = new Set(typeA.aliases || []);
          const aliasesB = new Set(typeB.aliases || []);
          const aliasOverlap = [...aliasesA].some(a => aliasesB.has(a));

          if (containsMatch || similarity >= 0.8 || aliasOverlap) {
            similarGroup.push(typeB);
            checked.add(typeB.id);
          }
        }

        if (similarGroup.length > 1) {
          checked.add(typeA.id);
          similarTypeGroups.push({
            names: similarGroup.map(t => t.name),
            certifications: [],
            types: similarGroup,
            severity: 'duplicate_type',
            irregularityType: 'duplicate_type',
            reason: 'Tipos com nomes semelhantes na mesma plataforma e categoria'
          });
        }
      }
    });

    console.log(`✓ Encontrados ${similarTypeGroups.length} grupos de tipos similares`);

    // Combine exact and similar type duplicates
    const allTypeDuplicates = [...duplicateTypes, ...similarTypeGroups];

    setDuplicates([...groups, ...allTypeDuplicates]);
    setAnalysisComplete(true);
    console.log(`Análise completa: ${groups.length} grupos de certificações + ${allTypeDuplicates.length} grupos de tipos`);

    if (showProgress) {
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  }, [certifications, types, isExcluded]);

  // Stable auto-refresh with cooldown
  useEffect(() => {
    if (loadingCerts || loadingTypes || isLoadingExclusions) return;

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
  }, [certifications, types, loadingCerts, loadingTypes, isLoadingExclusions, isAnalyzing, analyzeDuplicates]);

  const handleAnalyze = () => {
    const certsSig = buildCertsSignature(certifications);
    const typesSig = buildTypesSignature(types);
    lastCertsSigRef.current = certsSig;
    lastTypesSigRef.current = typesSig;
    lastAnalysisAtRef.current = Date.now();
    analyzeDuplicates(true);
  };

  const handleViewDetails = (group: DuplicateGroup, index: number) => {
    setSelectedGroup(group);
    setSelectedGroupIndex(index);
    setDetailDialogOpen(true);
  };

  const handleApplyStandardization = (group: DuplicateGroup, index: number) => {
    setSelectedGroup(group);
    setSelectedGroupIndex(index);
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
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(group, idx)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGroup(group);
                              setExclusionDialogOpen(true);
                            }}
                            disabled={isAddingExclusion}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Não é Duplicata
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(group, idx)}
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
                              onClick={() => handleApplyStandardization(group, idx)}
                              disabled={!group.suggestedType || isApplying}
                            >
                              {isApplying ? 'Aplicando...' : 'Aplicar Padronização'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGroup(group);
                              setExclusionDialogOpen(true);
                            }}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Não é Duplicata
                          </Button>
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
            groupIndex={selectedGroupIndex}
          />
          <StandardizationApplyDialog
            open={applyDialogOpen}
            onOpenChange={setApplyDialogOpen}
            group={selectedGroup}
            groupIndex={selectedGroupIndex}
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

      <DuplicateExclusionDialog
        open={exclusionDialogOpen}
        onOpenChange={setExclusionDialogOpen}
        itemNames={selectedGroup?.names || []}
        onConfirm={(reason) => {
          if (!selectedGroup) return;
          
          const type = selectedGroup.severity === 'duplicate_type' 
            ? 'certification_type' 
            : 'certification';
          
          const ids = selectedGroup.severity === 'duplicate_type'
            ? (selectedGroup.types?.map(t => t.id) || [])
            : selectedGroup.certifications.map(c => c.id);
          
          if (ids.length >= 2) {
            addExclusion(
              { type, id1: ids[0], id2: ids[1], reason },
              {
                onSuccess: () => {
                  setExclusionDialogOpen(false);
                  setSelectedGroup(null);
                  analyzeDuplicates(true);
                },
              }
            );
          }
        }}
        isLoading={isAddingExclusion}
      />
    </div>
  );
}
