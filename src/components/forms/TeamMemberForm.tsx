import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserSelectorCombobox } from '@/components/ui/user-selector-combobox';
import { useTeams, useAddTeamMember } from '@/hooks/useTeams';
import { Plus } from 'lucide-react';

const teamMemberSchema = z.object({
  team_id: z.string().min(1, 'Selecione uma equipe'),
  user_id: z.string().min(1, 'Selecione um usuário'),
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
      user_id: '',
    },
  });

  // Get existing team member IDs to exclude from user selector
  const existingMemberIds = teams.flatMap(team => 
    team.team_members.map(member => member.user_id)
  );

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      await addMemberMutation.mutateAsync({
        team_id: data.team_id,
        user_id: data.user_id,
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
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <UserSelectorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecione um usuário..."
                        excludeUserIds={existingMemberIds}
                        statusFilter={['active']}
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