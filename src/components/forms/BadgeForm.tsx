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
import type { Badge } from '@/hooks/useBadges';
import { Calendar, Award, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const badgeSchema = z.object({
  name: z.string().min(1, 'Nome do badge é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  issued_date: z.string().min(1, 'Data de emissão é obrigatória'),
  expiry_date: z.string().optional(),
  status: z.enum(['valid', 'expired', 'expiring', 'pending']).default('valid'),
  public_link: z.string().optional().or(z.literal('')),
  verification_code: z.string().optional(),
  issuer_name: z.string().optional(),
  issuer_logo_url: z.string().optional(),
  icon_url: z.string().optional(),
  image_url: z.string().optional(),
  metadata: z.record(z.any()).optional()
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
  const { toast } = useToast();
  const { toast } = useToast();

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: badge?.name || '',
      description: badge?.description || '',
      category: badge?.category || '',
      issued_date: badge?.issued_date || '',
      expiry_date: badge?.expiry_date || '',
      status: badge?.status || 'valid',
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
        await updateMutation.mutateAsync({
          ...badge,
          ...data,
          updated_at: new Date().toISOString()
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          user_id: '', // Will be filled by the hook
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting badge:', error);
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          {/* Datas e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Links e Imagens */}
          <div className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Ícone</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/icon.png" {...field} />
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
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/badge-image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="issuer_logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo do Emissor</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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