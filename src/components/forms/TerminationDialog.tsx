import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserManagement } from "@/hooks/useUserManagement";
import { AlertTriangle } from "lucide-react";

const terminationSchema = z.object({
  reason: z.string().min(10, "O motivo deve ter pelo menos 10 caracteres"),
  terminationType: z.enum(["voluntary", "involuntary", "mutual"]).refine((val) => val, {
    message: "Selecione o tipo de desligamento",
  }),
});

type TerminationFormData = z.infer<typeof terminationSchema>;

interface TerminationDialogProps {
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

export function TerminationDialog({ user, open, onOpenChange }: TerminationDialogProps) {
  const { updateUserStatus, isLoading } = useUserManagement();
  const [confirmationText, setConfirmationText] = useState("");

  const form = useForm<TerminationFormData>({
    resolver: zodResolver(terminationSchema),
    defaultValues: {
      reason: "",
      terminationType: undefined,
    },
  });

  const onSubmit = async (data: TerminationFormData) => {
    const fullReason = `Tipo: ${data.terminationType === 'voluntary' ? 'Voluntário' : 
      data.terminationType === 'involuntary' ? 'Involuntário' : 'Acordo Mútuo'}. Motivo: ${data.reason}`;
    
    await updateUserStatus({
      userId: user.user_id,
      status: 'terminated',
      reason: fullReason,
    });
    
    form.reset();
    setConfirmationText("");
    onOpenChange(false);
  };

  const canConfirm = confirmationText.toLowerCase() === "desligar profissional";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Desligar Profissional</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Você está prestes a desligar permanentemente o profissional:
            <br />
            <strong>{user.full_name}</strong> ({user.email})
            <br />
            <br />
            Esta ação é <strong>irreversível</strong> e o profissional perderá acesso
            ao sistema imediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="terminationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Desligamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="voluntary">Voluntário</SelectItem>
                      <SelectItem value="involuntary">Involuntário</SelectItem>
                      <SelectItem value="mutual">Acordo Mútuo</SelectItem>
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
                  <FormLabel>Motivo do Desligamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo do desligamento..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Digite "DESLIGAR PROFISSIONAL" para confirmar:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                placeholder="DESLIGAR PROFISSIONAL"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                disabled={isLoading || !canConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Desligando..." : "Confirmar Desligamento"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}