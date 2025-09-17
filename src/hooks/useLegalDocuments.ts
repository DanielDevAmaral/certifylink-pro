import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { LegalDocument } from '@/types';

export function useLegalDocuments() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['legal-documents', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('legal_documents')
        .select('*')
        .order('created_at', { ascending: false });

      // All authenticated users can see documents (RLS handles access control)

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    documents,
    isLoading,
  };
}

export function useCreateLegalDocument() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('legal_documents')
        .insert([{ ...data, user_id: user.id }] as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      toast({
        title: 'Sucesso',
        description: 'Documento jurídico criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar documento jurídico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLegalDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LegalDocument> }) => {
      const { data: result, error } = await supabase
        .from('legal_documents')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Sucesso',
        description: 'Documento jurídico atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar documento jurídico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteLegalDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Sucesso',
        description: 'Documento jurídico excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir documento jurídico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUploadFile() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, bucket, folder = '' }: { file: File; bucket: string; folder?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}${folder ? '/' : ''}${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        url: publicUrl,
      };
    },
    onError: (error) => {
      toast({
        title: 'Erro no upload',
        description: 'Erro ao fazer upload do arquivo: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}