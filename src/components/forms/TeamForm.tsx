import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateTeam } from '@/hooks/useTeams';
import { Plus } from 'lucide-react';

const teamSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  leader_email: z.string().email('Email inválido'),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamForm({ onSuccess, onCancel }: TeamFormProps) {
  const [open, setOpen] = useState(false);
  const createTeamMutation = useCreateTeam();

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      leader_email: '',
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    try {
      // Primeiro, buscar o user_id do líder pelo email
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.leader_email)
        .single();

      if (error || !profile) {
        form.setError('leader_email', { message: 'Usuário não encontrado' });
        return;
      }

      await createTeamMutation.mutateAsync({
        name: data.name,
        description: data.description,
        leader_id: profile.user_id,
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipe</DialogTitle>
        </DialogHeader>

        <Card className="card-corporate">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Equipe</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: TI & Infraestrutura"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva o propósito da equipe..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leader_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Líder</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="lider@empresa.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    onCancel?.();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="btn-corporate flex-1"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? 'Criando...' : 'Criar Equipe'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}