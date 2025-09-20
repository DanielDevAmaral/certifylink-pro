import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
}

export function LogoUpload({ currentLogo, onLogoChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('LogoUpload: No file selected or user not authenticated');
      return;
    }

    console.log('LogoUpload: Starting file upload process', { fileName: file.name, fileSize: file.size });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${user.id}_${Date.now()}.${fileExt}`;
      console.log('LogoUpload: Uploading file with name:', fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`logos/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('LogoUpload: Upload error:', error);
        throw error;
      }

      console.log('LogoUpload: File uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`logos/${fileName}`);

      console.log('LogoUpload: Generated public URL:', publicUrl);

      // Test if image can be loaded before setting preview
      const img = new Image();
      img.onload = () => {
        console.log('LogoUpload: Image loaded successfully');
        setPreviewUrl(publicUrl);
        onLogoChange(publicUrl);
        
        toast({
          title: "Sucesso",
          description: "Logotipo enviado com sucesso!",
        });
      };
      
      img.onerror = (err) => {
        console.error('LogoUpload: Failed to load image:', err);
        toast({
          title: "Aviso",
          description: "Logotipo salvo, mas pode demorar alguns segundos para aparecer.",
        });
        // Still set the URL even if image doesn't load immediately
        setPreviewUrl(publicUrl);
        onLogoChange(publicUrl);
      };
      
      img.src = publicUrl;

    } catch (error) {
      console.error('LogoUpload: Error uploading logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar o logotipo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onLogoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Logotipo removido",
      description: "O logotipo foi removido das configurações.",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="logo-upload" className="text-base font-medium">
            Logotipo da Empresa
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload do logotipo para aparecer nos relatórios PDF. Formatos aceitos: PNG, JPG, JPEG (máx. 2MB)
          </p>
        </div>

        {previewUrl ? (
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview do logotipo"
                className="h-20 w-20 object-contain border rounded-lg bg-white"
                onError={(e) => {
                  console.error('Error loading preview image');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Logotipo atual</p>
              <p className="text-xs text-muted-foreground">
                Clique no X para remover ou selecione um novo arquivo para substituir
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Nenhum logotipo selecionado
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : previewUrl ? 'Alterar Logotipo' : 'Selecionar Logotipo'}
          </Button>
        </div>
      </div>
    </Card>
  );
}