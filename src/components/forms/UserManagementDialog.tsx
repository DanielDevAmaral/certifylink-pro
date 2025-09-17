import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserStatusBadge } from '@/components/ui/user-status-badge';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const userManagementSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'terminated']),
  role: z.enum(['user', 'leader', 'admin']),
  full_name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  position: z.string().optional(),
  department: z.string().optional(),
  deactivation_reason: z.string().optional(),
});

type UserManagementFormData = z.infer<typeof userManagementSchema>;

interface UserManagementDialogProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    status: 'active' | 'inactive' | 'suspended' | 'terminated';
    role: 'user' | 'leader' | 'admin';
    position?: string;
    department?: string;
    deactivation_reason?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManagementDialog({ user, open, onOpenChange }: UserManagementDialogProps) {
  const { updateUserStatus, updateUserRole, updateUserProfile, isLoading } = useUserManagement();
  const [requiresReason, setRequiresReason] = useState(false);

  const form = useForm<UserManagementFormData>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: {
      status: user.status,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      position: user.position || '',
      department: user.department || '',
      deactivation_reason: user.deactivation_reason || '',
    },
  });

  const watchedStatus = form.watch('status');

  // Update requiresReason based on status change
  React.useEffect(() => {
    const newStatus = watchedStatus;
    const oldStatus = user.status;
    setRequiresReason(
      oldStatus === 'active' && (newStatus === 'inactive' || newStatus === 'suspended')
    );
  }, [watchedStatus, user.status]);

  const onSubmit = async (data: UserManagementFormData) => {
    try {
      // Update status if changed
      if (data.status !== user.status) {
        await updateUserStatus({
          userId: user.user_id,
          status: data.status,
          reason: data.deactivation_reason,
        });
      }

      // Update role if changed
      if (data.role !== user.role) {
        await updateUserRole({
          userId: user.user_id,
          role: data.role,
        });
      }

      // Update profile if changed
      const profileChanged = 
        data.full_name !== user.full_name ||
        data.position !== (user.position || '') ||
        data.department !== (user.department || '');

      if (profileChanged) {
        await updateUserProfile({
          userId: user.user_id,
          full_name: data.full_name,
          position: data.position,
          department: data.department,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Gerenciar Usuário
          </DialogTitle>
        </DialogHeader>

        <Card className="card-corporate">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserStatusBadge status={user.status} />
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {user.role === 'admin' ? 'Administrador' : 
                   user.role === 'leader' ? 'Líder' : 'Usuário'}
                </Badge>
              </div>
            </div>

            <Separator />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o papel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="leader">Líder</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Desenvolvedor Sênior" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Tecnologia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {requiresReason && (
                  <FormField
                    control={form.control}
                    name="deactivation_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da Desativação/Suspensão *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descreva o motivo da desativação ou suspensão..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                    className="btn-corporate flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}