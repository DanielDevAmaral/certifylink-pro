import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface BlockedUserProps {
  reason?: string | null;
}

export function BlockedUser({ reason }: BlockedUserProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold">Acesso Restrito</CardTitle>
          <CardDescription>
            {reason || 'Sua conta não tem permissão para acessar o sistema no momento.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Entre em contato com o administrador do sistema para mais informações sobre o status da sua conta.
          </div>
          
          <Button 
            onClick={handleSignOut}
            className="w-full"
            variant="outline"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}