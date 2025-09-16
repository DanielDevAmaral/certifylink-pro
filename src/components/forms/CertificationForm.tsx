import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateCertification, useUpdateCertification } from '@/hooks/useCertifications';
import type { Tables } from '@/integrations/supabase/types';
import { Plus, X, Calendar, Award } from 'lucide-react';

const certificationSchema = z.object({
  name: z.string().min(1, 'Nome da certificação é obrigatório'),
  function: z.string().min(1, 'Função é obrigatória'),
  validity_date: z.string().optional(),
  status: z.enum(['valid', 'expired', 'expiring', 'pending']).default('valid'),
  equivalence_services: z.array(z.string()).default([]),
  approved_equivalence: z.boolean().default(false),
  public_link: z.string().url().optional().or(z.literal('')),
  screenshot_url: z.string().url().optional().or(z.literal('')),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  certification?: Tables<'certifications'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CertificationForm({ certification, onSuccess, onCancel }: CertificationFormProps) {
  const [newService, setNewService] = useState('');
  const createMutation = useCreateCertification();
  const updateMutation = useUpdateCertification();

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: certification?.name || '',
      function: certification?.function || '',
      validity_date: certification?.validity_date || '',
      status: certification?.status || 'valid',
      equivalence_services: certification?.equivalence_services || [],
      approved_equivalence: certification?.approved_equivalence || false,
      public_link: certification?.public_link || '',
      screenshot_url: certification?.screenshot_url || '',
    },
  });

  const watchedServices = form.watch('equivalence_services');

  const onSubmit = async (data: CertificationFormData) => {
    try {
      if (certification) {
        await updateMutation.mutateAsync({
          id: certification.id,
          updates: {
            ...data,
            validity_date: data.validity_date || null,
            public_link: data.public_link || null,
            screenshot_url: data.screenshot_url || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          function: data.function,
          ...data,
          validity_date: data.validity_date || null,
          public_link: data.public_link || null,
          screenshot_url: data.screenshot_url || null,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting certification:', error);
    }
  };

  const addService = () => {
    if (newService.trim() && !watchedServices.includes(newService.trim())) {
      const currentServices = form.getValues('equivalence_services');
      form.setValue('equivalence_services', [...currentServices, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    const currentServices = form.getValues('equivalence_services');
    form.setValue('equivalence_services', currentServices.filter((_, i) => i !== index));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="card-corporate">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {certification ? 'Editar Certificação' : 'Nova Certificação'}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Certificação</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: AWS Solutions Architect" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="function"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Arquiteto de Soluções" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Data e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="validity_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Validade</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="date" 
                        {...field} 
                      />
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
                      <SelectItem value="valid">Válida</SelectItem>
                      <SelectItem value="expiring">Vencendo</SelectItem>
                      <SelectItem value="expired">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="public_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Público (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="screenshot_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Screenshot (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Serviços de Equivalência */}
          <div className="space-y-4">
            <FormLabel>Serviços de Equivalência</FormLabel>
            
            {/* Lista de serviços */}
            {watchedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {watchedServices.map((service, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Adicionar novo serviço */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do serviço"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addService();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addService}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
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
              {isLoading ? 'Salvando...' : certification ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}