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
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LegalDocument> }) => {
      let query = supabase
        .from('legal_documents')
        .update(data as any)
        .eq('id', id);

      // Only filter by user_id if not admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      }

      const { data: result, error } = await query
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!result) throw new Error('Documento jurídico não encontrado ou você não tem permissão para atualizá-lo');
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
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      let query = supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      // Only filter by user_id if not admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      }

      const { error } = await query;

      if (error) throw new Error('Erro ao excluir documento jurídico: você não tem permissão ou o item não foi encontrado');
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

// Hook para obter URL assinada para documentos sensíveis
export function useSignedDocumentUrl(
  documentId?: string, 
  documentType: 'legal_document' | 'certification' | 'badge' | 'technical_attestation' = 'legal_document'
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['signed-document-url', documentId, documentType],
    queryFn: async () => {
      if (!documentId) throw new Error('Document ID required');

      const { data, error } = await supabase.functions.invoke('get-signed-document-url', {
        body: { documentId, documentType }
      });

      if (error) throw error;
      
      return {
        signedUrl: data.signedUrl,
        expiresAt: data.expiresAt,
        isSensitive: data.isSensitive
      };
    },
    enabled: !!documentId && !!user,
    // Cache por 45 minutos (URLs expiram em 1 hora)
    staleTime: 45 * 60 * 1000,
    gcTime: 45 * 60 * 1000,
  });
}