import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTechPlatforms, useCreateTechPlatform, useUpdateTechPlatform, useDeleteTechPlatform } from '@/hooks/useTechPlatforms';
import { TechPlatform } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function TechPlatformManagement() {
  const { data: platforms = [], isLoading } = useTechPlatforms();
  const createMutation = useCreateTechPlatform();
  const updateMutation = useUpdateTechPlatform();
  const deleteMutation = useDeleteTechPlatform();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<TechPlatform | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', logo_url: '', is_active: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlatform) {
        await updateMutation.mutateAsync({ id: editingPlatform.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      setDialogOpen(false);
      setEditingPlatform(null);
      setFormData({ name: '', description: '', logo_url: '', is_active: true });
    } catch (error) {
      console.error('Error saving platform:', error);
    }
  };

  const handleEdit = (platform: TechPlatform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || '',
      logo_url: platform.logo_url || '',
      is_active: platform.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta plataforma?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plataformas Tecnológicas</CardTitle>
            <CardDescription>Gerencie as plataformas cloud e tecnológicas disponíveis</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPlatform(null);
                setFormData({ name: '', description: '', logo_url: '', is_active: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Plataforma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlatform ? 'Editar Plataforma' : 'Nova Plataforma Tecnológica'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Amazon Web Services"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da plataforma"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL do Logo</label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label className="text-sm font-medium">Ativo</label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell>{platform.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                      {platform.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(platform)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(platform.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
