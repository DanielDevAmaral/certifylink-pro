import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

interface SettingsGroup {
  ai: {
    provider: string;
    api_key: string;
    prompt_template: string;
    auto_suggestions: boolean;
  };
  notifications: {
    expiration_alert_days: number;
    email_notifications: boolean;
    leader_notifications: boolean;
  };
  export: {
    company_name: string;
    logo_url: string;
    footer_text: string;
    cover_template: string;
    auto_toc: boolean;
  };
  security: {
    data_encryption: boolean;
    audit_logging: boolean;
    sensitive_access: boolean;
    session_timeout: number;
  };
}

const defaultSettings: SettingsGroup = {
  ai: {
    provider: "openai",
    api_key: "",
    prompt_template: "Analise a certificação e sugira serviços equivalentes baseado na experiência e competências demonstradas.",
    auto_suggestions: true
  },
  notifications: {
    expiration_alert_days: 30,
    email_notifications: true,
    leader_notifications: true
  },
  export: {
    company_name: "Minha Empresa",
    logo_url: "",
    footer_text: "Documento gerado automaticamente pelo sistema de gestão documental",
    cover_template: "standard",
    auto_toc: true
  },
  security: {
    data_encryption: true,
    audit_logging: true,
    sensitive_access: false,
    session_timeout: 8
  }
};

export function useSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      // Organizar as configurações por grupo
      const settings: SettingsGroup = { ...defaultSettings };
      
      data.forEach((setting: SystemSetting) => {
        const [group, key] = setting.setting_key.split('.');
        if (settings[group as keyof SettingsGroup] && key) {
          (settings[group as keyof SettingsGroup] as any)[key] = setting.setting_value;
        }
      });

      return settings;
    },
    enabled: !!user
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<SettingsGroup>) => {
      const settingsToUpdate: Array<{
        setting_key: string;
        setting_value: any;
        updated_by: string;
      }> = [];

      // Converter objeto aninhado em array de configurações
      Object.entries(settings).forEach(([group, groupSettings]) => {
        Object.entries(groupSettings).forEach(([key, value]) => {
          settingsToUpdate.push({
            setting_key: `${group}.${key}`,
            setting_value: value,
            updated_by: user?.id || ''
          });
        });
      });

      // Upsert cada configuração
      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            updated_by: setting.updated_by
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      return settingsToUpdate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      console.error('Error updating settings:', error);
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });
}

export function useBackupSettings() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      // Criar backup em formato JSON
      const backup = {
        timestamp: new Date().toISOString(),
        settings: data,
        version: '1.0'
      };

      // Criar blob e baixar
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return backup;
    },
    onSuccess: () => {
      toast.success("Backup das configurações criado com sucesso!");
    },
    onError: (error: any) => {
      console.error('Error creating backup:', error);
      toast.error("Erro ao criar backup: " + error.message);
    }
  });
}

export function useRestoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const backup = JSON.parse(e.target?.result as string);
            
            if (!backup.settings || !Array.isArray(backup.settings)) {
              throw new Error("Formato de backup inválido");
            }

            // Restaurar configurações
            for (const setting of backup.settings) {
              const { error } = await supabase
                .from('system_settings')
                .upsert({
                  setting_key: setting.setting_key,
                  setting_value: setting.setting_value,
                  description: setting.description
                }, {
                  onConflict: 'setting_key'
                });

              if (error) throw error;
            }

            resolve(backup);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
        reader.readAsText(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success("Configurações restauradas com sucesso!");
    },
    onError: (error: any) => {
      console.error('Error restoring settings:', error);
      toast.error("Erro ao restaurar configurações: " + error.message);
    }
  });
}