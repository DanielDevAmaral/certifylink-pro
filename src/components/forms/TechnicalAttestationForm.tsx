import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CertificationSelectorCombobox } from "@/components/ui/certification-selector-combobox";
import { UserSelectorCombobox } from "@/components/ui/user-selector-combobox";
import { DocumentViewer } from '@/components/common/DocumentViewer';
import { TagManager } from '@/components/forms/TagManager';
import { HoursBreakdownManager } from '@/components/forms/HoursBreakdownManager';
import { useCreateTechnicalAttestation, useUpdateTechnicalAttestation } from '@/hooks/useTechnicalAttestations';
import { useUploadFile } from '@/hooks/useLegalDocuments';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useRelatedCertificationResolver } from '@/hooks/useRelatedCertificationResolver';
import { downloadDocument, formatDocumentName, isValidDocumentUrl, getFilenameFromUrl } from '@/lib/utils/documentUtils';
import type { TechnicalCertificate, RelatedCertification } from '@/types';
import { X, Upload, FileText, Download, Eye, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const attestationSchema = z.object({
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  project_object: z.string().min(1, "Objeto do projeto é obrigatório"),
  issuer_name: z.string().min(1, "Nome do emissor é obrigatório"),
  issuer_position: z.string().optional(),
  issuer_contact: z.string().optional(),
  validity_date: z.string().optional(),
  project_value: z.string().optional(),
  project_period_start: z.string().optional(),
  project_period_end: z.string().optional(),
  related_certifications: z.array(z.object({
    certification_id: z.string(),
    user_id: z.string()
  })).optional(),
  tags: z.array(z.string()).optional(),
  hours_breakdown: z.record(z.string(), z.number()).optional(),
});

type AttestationFormData = z.infer<typeof attestationSchema>;

interface TechnicalAttestationFormProps {
  attestation?: TechnicalCertificate;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TechnicalAttestationForm({ attestation, onSuccess, onCancel }: TechnicalAttestationFormProps) {
  const [selectedCertification, setSelectedCertification] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [removeCurrentDocument, setRemoveCurrentDocument] = useState(false);
  const [tags, setTags] = useState<string[]>(attestation?.tags || []);
  const [hoursBreakdown, setHoursBreakdown] = useState<Record<string, number>>(attestation?.hours_breakdown || {});

  const createMutation = useCreateTechnicalAttestation();
  const updateMutation = useUpdateTechnicalAttestation();
  const uploadMutation = useUploadFile();
  const { invalidateSpecificDocument } = useCacheInvalidation();
  const { toast } = useToast();

  const form = useForm<AttestationFormData>({
    resolver: zodResolver(attestationSchema),
    defaultValues: {
      client_name: attestation?.client_name || '',
      project_object: attestation?.project_object || '',
      project_period_start: attestation?.project_period_start || '',
      project_period_end: attestation?.project_period_end || '',
      project_value: attestation?.project_value?.toString() || '',
      issuer_name: attestation?.issuer_name || '',
      issuer_position: attestation?.issuer_position || '',
      issuer_contact: attestation?.issuer_contact || '',
      validity_date: attestation?.validity_date || '',
      related_certifications: attestation?.related_certifications || [],
      tags: attestation?.tags || [],
      hours_breakdown: attestation?.hours_breakdown || {},
    },
  });

  // Resolve related certifications to show names instead of IDs
  const relatedCerts = form.watch('related_certifications') || [];
  const { data: resolvedCerts, isLoading: isResolvingCerts } = useRelatedCertificationResolver(relatedCerts);

  const onSubmit = async (data: AttestationFormData) => {
    try {
      console.log('📝 [TechnicalAttestationForm] Submit form:', {
        isEdit: !!attestation,
        attestationId: attestation?.id,
        hasNewFile: !!uploadedFile,
        removeCurrentDoc: removeCurrentDocument,
        currentDocUrl: attestation?.document_url,
        clientName: data.client_name,
        tags,
        hoursBreakdown
      });

      let documentUrl = attestation?.document_url;

      // Handle document logic
      if (removeCurrentDocument) {
        console.log('🗑️ [TechnicalAttestationForm] Removing current document');
        documentUrl = undefined;
      } else if (uploadedFile) {
        console.log('📤 [TechnicalAttestationForm] Uploading new file:', uploadedFile.name);
        const uploadResult = await uploadMutation.mutateAsync({
          file: uploadedFile,
          bucket: 'documents',
          folder: 'attestations',
        });
        documentUrl = uploadResult.url;
        console.log('✅ [TechnicalAttestationForm] File uploaded:', documentUrl);
      }

      // Calculate total hours
      const totalHours = Object.values(hoursBreakdown).reduce((sum, hours) => sum + hours, 0);

      const submitData = {
        client_name: data.client_name,
        project_object: data.project_object,
        project_period_start: data.project_period_start || '',
        project_period_end: data.project_period_end || '',
        project_value: data.project_value ? parseFloat(data.project_value) : undefined,
        issuer_name: data.issuer_name,
        issuer_position: data.issuer_position || '',
        issuer_contact: data.issuer_contact || '',
        validity_date: data.validity_date || '',
        status: attestation?.status || 'valid',
        document_url: documentUrl || '',
        related_certifications: (data.related_certifications || []) as any,
        tags,
        hours_breakdown: hoursBreakdown,
        total_hours: totalHours,
      };

      if (attestation) {
        console.log('🔄 [TechnicalAttestationForm] Updating attestation:', attestation.id);
        await updateMutation.mutateAsync({
          id: attestation.id,
          data: submitData,
        });
      } else {
        console.log('➕ [TechnicalAttestationForm] Creating new attestation');
        await createMutation.mutateAsync(submitData);
      }

      // Invalidate cache to refresh data
      invalidateSpecificDocument('technical_attestation');

      console.log('✅ [TechnicalAttestationForm] Form submitted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting attestation:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os campos obrigatórios e tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const onInvalidSubmit = (errors: any) => {
    console.log('Form validation errors:', errors);
    const errorCount = Object.keys(errors).length;
    toast({
      title: 'Campos obrigatórios',
      description: `${errorCount} campo${errorCount > 1 ? 's' : ''} ${errorCount > 1 ? 'precisam' : 'precisa'} ser preenchido${errorCount > 1 ? 's' : ''}.`,
      variant: 'destructive'
    });
    
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const addCertification = () => {
    if (!selectedCertification || !selectedUser) return;
    
    const currentCerts = form.getValues('related_certifications') || [];
    const alreadyExists = currentCerts.some(
      cert => cert.certification_id === selectedCertification && cert.user_id === selectedUser
    );
    
    if (!alreadyExists) {
      form.setValue('related_certifications', [
        ...currentCerts, 
        { certification_id: selectedCertification, user_id: selectedUser }
      ]);
      setSelectedCertification("");
      setSelectedUser("");
    }
  };

  const removeCertification = (certificationId: string, userId: string) => {
    const currentCerts = form.getValues('related_certifications') || [];
    form.setValue(
      'related_certifications', 
      currentCerts.filter(c => !(c.certification_id === certificationId && c.user_id === userId))
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setRemoveCurrentDocument(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!attestation?.document_url) return;
    
    console.log('📄 [TechnicalAttestationForm] Download document:', {
      attestationId: attestation.id,
      documentUrl: attestation.document_url,
      clientName: attestation.client_name,
      location: 'edit_form'
    });
    
    await downloadDocument(attestation.document_url, `atestado-${attestation.client_name}.pdf`);
  };

  const handleRemoveCurrentDocument = () => {
    setRemoveCurrentDocument(true);
    setUploadedFile(null);
    toast({
      title: 'Documento marcado para remoção',
      description: 'O documento atual será removido ao salvar o formulário.'
    });
  };

  const hasCurrentDocument = attestation?.document_url && isValidDocumentUrl(attestation.document_url) && !removeCurrentDocument;
  const isLoading = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{attestation ? 'Editar Atestado Técnico' : 'Novo Atestado Técnico'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="project_object"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto do Projeto *</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="project_period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do Projeto</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim do Projeto</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Projeto (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="issuer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Emissor *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuer_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo do Emissor</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuer_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato do Emissor</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="related_certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificações Relacionadas</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <UserSelectorCombobox
                          value={selectedUser}
                          onValueChange={setSelectedUser}
                          placeholder="Selecione o usuário"
                        />
                      </div>
                      <div className="flex-1">
                        <CertificationSelectorCombobox
                          value={selectedCertification}
                          onValueChange={setSelectedCertification}
                          placeholder="Selecione a certificação"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addCertification}
                        disabled={!selectedCertification || !selectedUser}
                        variant="secondary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((cert, index) => {
                          const resolved = resolvedCerts?.find(
                            r => r.certification_id === cert.certification_id && r.user_id === cert.user_id
                          );
                          const displayText = isResolvingCerts 
                            ? 'Carregando...' 
                            : resolved 
                              ? `${resolved.user_name} - ${resolved.certification_name}`
                              : `${cert.user_id.slice(0, 8)}... - ${cert.certification_id.slice(0, 8)}...`;
                          
                          return (
                            <div key={`${cert.certification_id}-${cert.user_id}-${index}`} className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                              <span>{displayText}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 hover:bg-transparent"
                                onClick={() => removeCertification(cert.certification_id, cert.user_id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags and Hours Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-lg">Tags e Controle de Horas</h3>
              
              <TagManager
                tags={tags}
                onChange={setTags}
                label="Tags do Projeto"
                placeholder="Ex: LLM, Frontend, Backend..."
              />

              <HoursBreakdownManager
                tags={tags}
                hoursBreakdown={hoursBreakdown}
                onChange={setHoursBreakdown}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>Gerenciar Documento</FormLabel>
              
              {/* Current Document Section */}
              {hasCurrentDocument && (
                <div className="border border-muted rounded-lg p-4 bg-muted/25">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {formatDocumentName(getFilenameFromUrl(attestation?.document_url || '') || undefined)}
                        </p>
                        <p className="text-xs text-muted-foreground">Documento atual</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentViewerOpen(true)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadDocument}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveCurrentDocument}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {removeCurrentDocument && (
                <div className="border border-destructive/50 rounded-lg p-3 bg-destructive/10">
                  <p className="text-sm text-destructive">
                    ⚠️ O documento atual será removido ao salvar o formulário
                  </p>
                </div>
              )}

              {/* Upload New Document */}
              <div className="border-2 border-dashed rounded-lg p-6 bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        {uploadedFile ? 'Trocar arquivo' : 'Escolher arquivo'}
                      </span>
                      <input
                        id="document-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC ou DOCX (máx. 10MB)
                    </p>
                  </div>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-background rounded-md border">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">{uploadedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : attestation ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <DocumentViewer
        open={documentViewerOpen}
        onOpenChange={setDocumentViewerOpen}
        documentUrl={attestation?.document_url || ''}
        documentName={attestation?.client_name || 'Documento'}
      />
    </Card>
  );
}
