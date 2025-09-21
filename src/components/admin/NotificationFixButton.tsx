import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wrench, Loader2 } from 'lucide-react';

export function NotificationFixButton() {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixNotifications = async () => {
    setIsFixing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-notification-links');
      
      if (error) {
        throw error;
      }
      
      console.log('🔧 Fix result:', data);
      
      toast({
        title: 'Sucesso',
        description: `Correção concluída! ${data.fixed_notifications} notificações corrigidas de ${data.total_broken} encontradas.`,
      });
      
      // Reload the page after a short delay to see the changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error fixing notifications:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao corrigir notificações: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFixNotifications}
      disabled={isFixing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isFixing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wrench className="h-4 w-4" />
      )}
      {isFixing ? 'Corrigindo...' : 'Corrigir Links das Notificações'}
    </Button>
  );
}