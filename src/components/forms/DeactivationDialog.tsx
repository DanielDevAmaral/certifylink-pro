import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserManagement } from '@/hooks/useUserManagement';
import { AlertTriangle } from 'lucide-react';

const deactivationSchema = z.object({
  status: z.enum(['inactive', 'suspended']),
  reason: z.string().min(10, 'O motivo deve ter pelo menos 10 caracteres'),
});

type DeactivationFormData = z.infer<typeof deactivationSchema>;

interface DeactivationDialogProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    status: 'active' | 'inactive' | 'suspended' | 'terminated';
    role: 'user' | 'leader' | 'admin';
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivationDialog({ user, open, onOpenChange }: DeactivationDialogProps) {
  const { updateUserStatus, isLoading } = useUserManagement();

  const form = useForm<DeactivationFormData>({
    resolver: zodResolver(deactivationSchema),
    defaultValues: {
      status: 'inactive',
      reason: '',
    },
  });

  const onSubmit = async (data: DeactivationFormData) => {
    try {
      await updateUserStatus({
        userId: user.user_id,
        status: data.status,
        reason: data.reason,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Desativar Usuário
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a desativar o usuário <strong>{user.full_name}</strong> ({user.email}).
            Esta ação pode ser revertida posteriormente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Desativação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inactive">
                        <div className="flex flex-col">
                          <span>Inativo</span>
                          <span className="text-xs text-muted-foreground">
                            Usuário temporariamente desabilitado
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex flex-col">
                          <span>Suspenso</span>
                          <span className="text-xs text-muted-foreground">
                            Usuário suspenso por violação de política
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva o motivo da desativação..."
                      rows={4}
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
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Desativando...' : 'Confirmar Desativação'}
              </Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}