import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Settings, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

export function DocumentStatusManager() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { data: settings } = useSettings();

  const handleRecalculateStatus = async () => {
    setIsRecalculating(true);
    try {
      console.log('Iniciando recálculo de status dos documentos...');
      
      const { error } = await supabase.rpc('update_document_status');
      
      if (error) {
        throw error;
      }

      toast.success("Status dos documentos recalculados com sucesso!");
      console.log('Recálculo concluído com sucesso');
      
    } catch (error: any) {
      console.error('Erro ao recalcular status:', error);
      toast.error("Erro ao recalcular status: " + error.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const currentSettings = {
    certifications: settings?.notifications?.certification_alert_days || 60,
    technicalAttestations: settings?.notifications?.technical_attestation_alert_days || 45,
    legalDocuments: settings?.notifications?.legal_document_alert_days || 30
  };

  return (
    <Card className="card-corporate">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <Settings className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gestão de Status dos Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Recalcular status baseado nas configurações atuais de alerta
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-accent/20 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Certificações</span>
              <Badge variant="secondary">{currentSettings.certifications} dias</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status "Vencendo" quando faltam {currentSettings.certifications} dias ou menos
            </p>
          </div>

          <div className="p-4 rounded-lg bg-accent/20 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Atestados Técnicos</span>
              <Badge variant="secondary">{currentSettings.technicalAttestations} dias</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status "Vencendo" quando faltam {currentSettings.technicalAttestations} dias ou menos
            </p>
          </div>

          <div className="p-4 rounded-lg bg-accent/20 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Documentos Legais</span>
              <Badge variant="secondary">{currentSettings.legalDocuments} dias</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status "Vencendo" quando faltam {currentSettings.legalDocuments} dias ou menos
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-info/50 bg-info/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-info mt-0.5" />
            <div>
              <p className="font-medium text-info">Como funciona o recálculo</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Válido:</strong> Data de validade é nula ou superior ao período de alerta</li>
                <li>• <strong>Vencendo:</strong> Data de validade está dentro do período de alerta configurado</li>
                <li>• <strong>Expirado:</strong> Data de validade já passou</li>
                <li>• O recálculo aplica as configurações atuais a todos os documentos</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleRecalculateStatus}
            disabled={isRecalculating}
            className="btn-corporate gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculando...' : 'Recalcular Status dos Documentos'}
          </Button>
        </div>
      </div>
    </Card>
  );
}