import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUserManagement } from "@/hooks/useUserManagement";

const roleChangeSchema = z.object({
  role: z.enum(['user', 'leader', 'admin']).refine((val) => val, {
    message: "Selecione um papel",
  }),
});

type RoleChangeFormData = z.infer<typeof roleChangeSchema>;

interface RoleChangeDialogProps {
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

export function RoleChangeDialog({ user, open, onOpenChange }: RoleChangeDialogProps) {
  const { updateUserRole, isLoading } = useUserManagement();

  const form = useForm<RoleChangeFormData>({
    resolver: zodResolver(roleChangeSchema),
    defaultValues: {
      role: user.role,
    },
  });

  const onSubmit = async (data: RoleChangeFormData) => {
    await updateUserRole({
      userId: user.user_id,
      role: data.role,
    });
    
    onOpenChange(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'leader': return 'Líder';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Acesso total ao sistema, pode gerenciar usuários e configurações';
      case 'leader': return 'Pode visualizar e gerenciar membros da sua equipe';
      case 'user': return 'Acesso básico ao sistema, pode gerenciar apenas seus próprios dados';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Papel do Usuário</DialogTitle>
          <DialogDescription>
            Alterando o papel de <strong>{user.full_name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Papel atual:</span>
            <Badge variant="outline">
              {getRoleLabel(user.role)}
            </Badge>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Papel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um papel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user" className="cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">Usuário</span>
                            <span className="text-xs text-muted-foreground">
                              Acesso básico ao sistema
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="leader" className="cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">Líder</span>
                            <span className="text-xs text-muted-foreground">
                              Pode gerenciar membros da equipe
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin" className="cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">Administrador</span>
                            <span className="text-xs text-muted-foreground">
                              Acesso total ao sistema
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("role") && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">
                    {getRoleLabel(form.watch("role"))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleDescription(form.watch("role"))}
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || form.watch("role") === user.role}
                >
                  {isLoading ? "Alterando..." : "Alterar Papel"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}