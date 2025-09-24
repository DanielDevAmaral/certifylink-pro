import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CertificationSelectorCombobox } from '@/components/ui/certification-selector-combobox';
import { DocumentViewer } from '@/components/common/DocumentViewer';
import { useCreateTechnicalAttestation, useUpdateTechnicalAttestation } from '@/hooks/useTechnicalAttestations';
import { useUploadFile } from '@/hooks/useLegalDocuments';
import { useCertifications } from '@/hooks/useCertifications';
import { downloadDocument, formatDocumentName, isValidDocumentUrl, getFilenameFromUrl } from '@/lib/utils/documentUtils';
import type { TechnicalCertificate } from '@/types';
import { X, Upload, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const attestationSchema = z.object({
  client_name: z.string().min(1, 'Nome do cliente é obrigatório'),
  project_object: z.string().min(1, 'Objeto do projeto é obrigatório'),
  project_period_start: z.string().optional(),
  project_period_end: z.string().optional(),
  project_value: z.string().optional(),
  issuer_name: z.string().min(1, 'Nome do emissor é obrigatório'),
  issuer_position: z.string().optional(),
  issuer_contact: z.string().optional(),
  validity_date: z.string().optional(),
  status: z.enum(['valid', 'expiring', 'expired', 'pending']),
  document_url: z.string().optional(),
  related_certifications: z.array(z.string()).default([]),
});

type AttestationFormData = z.infer<typeof attestationSchema>;

interface TechnicalAttestationFormProps {
  attestation?: TechnicalCertificate;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TechnicalAttestationForm({ attestation, onSuccess, onCancel }: TechnicalAttestationFormProps) {
  const [selectedCertificationId, setSelectedCertificationId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [removeCurrentDocument, setRemoveCurrentDocument] = useState(false);

  const createMutation = useCreateTechnicalAttestation();
  const updateMutation = useUpdateTechnicalAttestation();
  const uploadMutation = useUploadFile();
  const { data: allCertifications = [] } = useCertifications();
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
      status: attestation?.status || 'valid',
      document_url: attestation?.document_url || '',
      related_certifications: attestation?.related_certifications || [],
    },
  });

  const onSubmit = async (data: AttestationFormData) => {
    try {
      let documentUrl = data.document_url;

      // Handle document logic
      if (removeCurrentDocument) {
        documentUrl = null;
      } else if (uploadedFile) {
        // Upload new file (replaces existing if any)
        const uploadResult = await uploadMutation.mutateAsync({
          file: uploadedFile,
          bucket: 'documents',
          folder: 'attestations',
        });
        documentUrl = uploadResult.url;
      }
      // If no changes to document, keep existing documentUrl

      const submitData = {
        client_name: data.client_name,
        project_object: data.project_object,
        project_period_start: data.project_period_start,
        project_period_end: data.project_period_end,
        project_value: data.project_value ? parseFloat(data.project_value) : null,
        issuer_name: data.issuer_name,
        issuer_position: data.issuer_position,
        issuer_contact: data.issuer_contact,
        validity_date: data.validity_date,
        status: data.status,
        document_url: documentUrl,
        related_certifications: data.related_certifications || [],
      };

      if (attestation) {
        await updateMutation.mutateAsync({
          id: attestation.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }

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
    
    // Scroll to first error
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const addCertification = () => {
    if (selectedCertificationId) {
      const currentCertifications = form.getValues('related_certifications');
      if (!currentCertifications.includes(selectedCertificationId)) {
        form.setValue('related_certifications', [...currentCertifications, selectedCertificationId]);
      }
      setSelectedCertificationId('');
    }
  };

  const removeCertification = (certificationId: string) => {
    const currentCertifications = form.getValues('related_certifications');
    form.setValue('related_certifications', currentCertifications.filter(id => id !== certificationId));
  };

  const getCertificationDisplay = (certificationId: string) => {
    const certification = allCertifications.find(cert => cert.id === certificationId);
    return certification ? `${certification.name} - ${certification.function}` : certificationId;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setRemoveCurrentDocument(false); // Reset remove flag if new file is selected
    }
  };

  const handleDownloadDocument = async () => {
    if (attestation?.document_url) {
      await downloadDocument(attestation.document_url, `atestado-${attestation.client_name}.pdf`);
    }
  };

  const handleRemoveCurrentDocument = () => {
    setRemoveCurrentDocument(true);
    setUploadedFile(null); // Clear any new file selection
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="valid">Válido</SelectItem>
                        <SelectItem value="expiring">Expirando</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
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

            <div className="space-y-4">
              <FormLabel>Certificações Relacionadas</FormLabel>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CertificationSelectorCombobox
                    value={selectedCertificationId}
                    onValueChange={(value) => setSelectedCertificationId(value || '')}
                    placeholder="Selecione uma certificação existente..."
                    excludeIds={form.watch('related_certifications')}
                  />
                </div>
                <Button type="button" onClick={addCertification} variant="outline" disabled={!selectedCertificationId}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.watch('related_certifications').map((certId) => (
                  <Badge key={certId} variant="secondary" className="flex items-center gap-1">
                    {getCertificationDisplay(certId)}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => removeCertification(certId)}
                    />
                  </Badge>
                ))}
              </div>
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

              {/* Document was marked for removal */}
              {removeCurrentDocument && attestation?.document_url && (
                <div className="border border-destructive/50 rounded-lg p-3 bg-destructive/5">
                  <p className="text-sm text-destructive">
                    ⚠️ Documento atual será removido ao salvar
                  </p>
                </div>
              )}

              {/* New Document Upload Section */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:text-primary/80">
                        {hasCurrentDocument ? 'Substituir documento atual' : 'Clique para fazer upload'}
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX até 10MB</p>
                  </div>
                  {uploadedFile && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">Novo arquivo selecionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Viewer Modal */}
            {hasCurrentDocument && (
              <DocumentViewer
                open={documentViewerOpen}
                onOpenChange={setDocumentViewerOpen}
                documentUrl={attestation?.document_url || ''}
                documentName={formatDocumentName(attestation?.document_url)}
              />
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : attestation ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}