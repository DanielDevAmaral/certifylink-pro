-- Políticas RLS para upload de imagens de badges no bucket documents

-- Permitir que usuários autenticados façam upload de imagens na pasta badge-images
CREATE POLICY "Users can upload badge images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'badge-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Permitir que usuários atualizem suas próprias imagens de badges
CREATE POLICY "Users can update own badge images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'badge-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Permitir que usuários deletem suas próprias imagens de badges
CREATE POLICY "Users can delete own badge images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'badge-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Permitir leitura pública das imagens (o bucket já é público)
CREATE POLICY "Public can view badge images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'badge-images'
);