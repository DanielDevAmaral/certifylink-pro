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
import { useCreateTechnicalAttestation, useUpdateTechnicalAttestation } from '@/hooks/useTechnicalAttestations';
import { useUploadFile } from '@/hooks/useLegalDocuments';
import type { TechnicalCertificate } from '@/types';
import { X, Upload } from 'lucide-react';

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
  const [newCertification, setNewCertification] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const createMutation = useCreateTechnicalAttestation();
  const updateMutation = useUpdateTechnicalAttestation();
  const uploadMutation = useUploadFile();

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

      // Upload file if selected
      if (uploadedFile) {
        const uploadResult = await uploadMutation.mutateAsync({
          file: uploadedFile,
          bucket: 'documents',
          folder: 'attestations',
        });
        documentUrl = uploadResult.url;
      }

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
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      const currentCertifications = form.getValues('related_certifications');
      form.setValue('related_certifications', [...currentCertifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues('related_certifications');
    form.setValue('related_certifications', currentCertifications.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{attestation ? 'Editar Atestado Técnico' : 'Novo Atestado Técnico'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
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
                  <FormLabel>Objeto do Projeto</FormLabel>
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
                    <FormLabel>Nome do Emissor</FormLabel>
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
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="Digite o nome da certificação"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.watch('related_certifications').map((cert, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {cert}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => removeCertification(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <FormLabel>Documento PDF</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:text-primary/80">
                        Clique para fazer upload
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
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                  )}
                </div>
              </div>
            </div>

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