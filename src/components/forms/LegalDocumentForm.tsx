import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateLegalDocument, useUpdateLegalDocument, useUploadFile } from '@/hooks/useLegalDocuments';
import type { LegalDocument, LegalDocumentType, DocumentSubtype } from '@/types';
import { Upload } from 'lucide-react';

const legalDocumentSchema = z.object({
  document_name: z.string().min(1, 'Nome do documento é obrigatório'),
  document_type: z.enum(['FISCAL', 'TRABALHISTA', 'AMBIENTAL', 'PREVIDENCIARIO']),
  document_subtype: z.string().optional(),
  validity_date: z.string().optional(),
  status: z.enum(['valid', 'expiring', 'expired', 'pending']),
  document_url: z.string().min(1, 'URL do documento é obrigatória'),
  is_sensitive: z.boolean().default(false),
});

type LegalDocumentFormData = z.infer<typeof legalDocumentSchema>;

interface LegalDocumentFormProps {
  document?: LegalDocument;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const documentSubtypes: Record<LegalDocumentType, DocumentSubtype[]> = {
  FISCAL: ['CND_FEDERAL', 'CND_ESTADUAL', 'CND_MUNICIPAL', 'CERTIDAO_FGTS', 'SIMPLES_NACIONAL'],
  TRABALHISTA: ['RAIS', 'CAGED', 'DIRF', 'GFIP', 'SEFIP'],
  AMBIENTAL: ['LICENCA_AMBIENTAL', 'CERTIFICADO_REGULARIDADE', 'CADRI', 'MTR'],
  PREVIDENCIARIO: ['CND_INSS', 'GFIP_PREVIDENCIARIA', 'DIRF_PREVIDENCIARIA', 'CAGED_PREVIDENCIARIO'],
};

export function LegalDocumentForm({ document, onSuccess, onCancel }: LegalDocumentFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const createMutation = useCreateLegalDocument();
  const updateMutation = useUpdateLegalDocument();
  const uploadMutation = useUploadFile();

  const form = useForm<LegalDocumentFormData>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: {
      document_name: document?.document_name || '',
      document_type: document?.document_type || 'FISCAL',
      document_subtype: document?.document_subtype || '',
      validity_date: document?.validity_date || '',
      status: document?.status || 'valid',
      document_url: document?.document_url || '',
      is_sensitive: document?.is_sensitive || false,
    },
  });

  const watchedDocumentType = form.watch('document_type');

  const onSubmit = async (data: LegalDocumentFormData) => {
    try {
      let documentUrl = data.document_url;

      // Upload file if selected
      if (uploadedFile) {
        const uploadResult = await uploadMutation.mutateAsync({
          file: uploadedFile,
          bucket: 'documents',
          folder: 'legal',
        });
        documentUrl = uploadResult.url;
      }

      const submitData = {
        document_name: data.document_name,
        document_type: data.document_type,
        document_subtype: data.document_subtype,
        document_url: documentUrl,
        validity_date: data.validity_date,
        status: data.status,
        is_sensitive: data.is_sensitive || false,
      };

      if (document) {
        await updateMutation.mutateAsync({
          id: document.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting legal document:', error);
    }
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
        <CardTitle>{document ? 'Editar Documento Jurídico' : 'Novo Documento Jurídico'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Documento</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FISCAL">Fiscal</SelectItem>
                        <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                        <SelectItem value="AMBIENTAL">Ambiental</SelectItem>
                        <SelectItem value="PREVIDENCIARIO">Previdenciário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document_subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o subtipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentSubtypes[watchedDocumentType]?.map((subtype) => (
                          <SelectItem key={subtype} value={subtype}>
                            {subtype.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            <FormField
              control={form.control}
              name="is_sensitive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Documento Sensível
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marque se este documento contém informações confidenciais
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Arquivo do Documento</FormLabel>
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG até 10MB</p>
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
                {isLoading ? 'Salvando...' : document ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}