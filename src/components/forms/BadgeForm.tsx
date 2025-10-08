import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateBadge, useUpdateBadge } from '@/hooks/useBadges';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import type { Badge } from '@/hooks/useBadges';
import { Calendar, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';

const badgeSchema = z.object({
  name: z.string().min(1, 'Nome do badge é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  issued_date: z.string().min(1, 'Data de emissão é obrigatória'),
  expiry_date: z.string().optional(),
  public_link: z.string().optional().or(z.literal('')),
  verification_code: z.string().optional(),
  issuer_name: z.string().optional(),
  issuer_logo_url: z.string().optional(),
  icon_url: z.string().optional(),
  image_url: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

type BadgeFormData = z.infer<typeof badgeSchema>;

interface BadgeFormProps {
  badge?: Badge;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BADGE_CATEGORIES = [
  'Cloud Computing',
  'Segurança',
  'Dados & Analytics',
  'DevOps',
  'Frontend',
  'Backend',
  'Mobile',
  'Certificação Técnica',
  'Gestão de Projetos',
  'Arquitetura',
  'Outros'
];

export function BadgeForm({
  badge,
  onSuccess,
  onCancel
}: BadgeFormProps) {
  const createMutation = useCreateBadge();
  const updateMutation = useUpdateBadge();
  const { invalidateSpecificDocument } = useCacheInvalidation();
  const { toast } = useToast();

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: badge?.name || '',
      description: badge?.description || '',
      category: badge?.category || '',
      issued_date: badge?.issued_date || '',
      expiry_date: badge?.expiry_date || '',
      public_link: badge?.public_link || '',
      verification_code: badge?.verification_code || '',
      issuer_name: badge?.issuer_name || '',
      issuer_logo_url: badge?.issuer_logo_url || '',
      icon_url: badge?.icon_url || '',
      image_url: badge?.image_url || '',
      metadata: badge?.metadata || {}
    }
  });

  const onSubmit = async (data: BadgeFormData) => {
    try {
      if (badge) {
        // Filter only valid Badge properties, exclude extra properties like creator_name
        const validBadgeData = {
          id: badge.id,
          user_id: badge.user_id,
          name: data.name,
          description: data.description,
          category: data.category,
          icon_url: data.icon_url,
          image_url: data.image_url,
          issued_date: data.issued_date,
          expiry_date: data.expiry_date,
          status: 'valid' as const, // Trigger will calculate the correct status based on expiry_date
          public_link: data.public_link,
          verification_code: data.verification_code,
          issuer_name: data.issuer_name,
          issuer_logo_url: data.issuer_logo_url,
          metadata: data.metadata,
          created_at: badge.created_at,
          updated_at: new Date().toISOString()
        };
        
        await updateMutation.mutateAsync(validBadgeData);
      } else {
        await createMutation.mutateAsync({
          ...data,
          status: 'valid' as const, // Trigger will calculate the correct status based on expiry_date
          user_id: '', // Will be filled by the hook
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      // Invalidate cache to refresh data
      invalidateSpecificDocument('badge');
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting badge:', error);
      
      let errorMessage = 'Verifique os campos obrigatórios e tente novamente.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="card-corporate">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {badge ? 'Editar Badge' : 'Novo Badge'}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Badge *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: AWS Solutions Architect" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BADGE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva as competências e conquistas relacionadas a este badge..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issued_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Emissão *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="date" {...field} />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Expiração</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="date" {...field} />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    O status será calculado automaticamente baseado nesta data
                  </p>
                </FormItem>
              )}
            />
          </div>

          {/* Informações do Emissor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issuer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Emissor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Amazon Web Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verification_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input placeholder="Código único de verificação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Link Público */}
          <FormField
            control={form.control}
            name="public_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Público</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplo.com/badge" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload de Imagens */}
          <div className="space-y-6">
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Imagens do Badge
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="icon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          label="Ícone do Badge"
                          description="Ícone pequeno representando o badge (recomendado: 64x64px)"
                          currentUrl={field.value}
                          onUploadComplete={(url) => field.onChange(url)}
                          bucketName="documents"
                          folder="badge-icons"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          label="Imagem do Badge"
                          description="Imagem principal do badge (recomendado: 512x512px)"
                          currentUrl={field.value}
                          onUploadComplete={(url) => field.onChange(url)}
                          bucketName="documents"
                          folder="badge-images"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issuer_logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          label="Logo do Emissor"
                          description="Logo da organização que emitiu o badge"
                          currentUrl={field.value}
                          onUploadComplete={(url) => field.onChange(url)}
                          bucketName="documents"
                          folder="badge-issuer-logos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Ações do Formulário */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              className="btn-corporate" 
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : badge ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}