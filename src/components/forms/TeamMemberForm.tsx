import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTeams, useAddTeamMember } from '@/hooks/useTeams';
import { Plus } from 'lucide-react';

const teamMemberSchema = z.object({
  team_id: z.string().min(1, 'Selecione uma equipe'),
  user_email: z.string().email('Email inválido'),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamMemberForm({ onSuccess, onCancel }: TeamMemberFormProps) {
  const [open, setOpen] = useState(false);
  const { data: teams = [] } = useTeams();
  const addMemberMutation = useAddTeamMember();

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      team_id: '',
      user_email: '',
    },
  });

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      // Primeiro, buscar o user_id pelo email
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.user_email)
        .single();

      if (error || !profile) {
        form.setError('user_email', { message: 'Usuário não encontrado' });
        return;
      }

      await addMemberMutation.mutateAsync({
        team_id: data.team_id,
        user_id: profile.user_id,
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
        </DialogHeader>

        <Card className="card-corporate">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma equipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Usuário</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="usuario@empresa.com"
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
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}