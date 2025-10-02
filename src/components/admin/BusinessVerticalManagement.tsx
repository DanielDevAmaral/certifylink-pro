import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBusinessVerticals, useCreateBusinessVertical, useUpdateBusinessVertical, useDeleteBusinessVertical } from '@/hooks/useBusinessVerticals';
import { BusinessVertical } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function BusinessVerticalManagement() {
  const { data: verticals = [], isLoading } = useBusinessVerticals();
  const createMutation = useCreateBusinessVertical();
  const updateMutation = useUpdateBusinessVertical();
  const deleteMutation = useDeleteBusinessVertical();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVertical, setEditingVertical] = useState<BusinessVertical | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVertical) {
        await updateMutation.mutateAsync({ id: editingVertical.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      setDialogOpen(false);
      setEditingVertical(null);
      setFormData({ name: '', description: '', is_active: true });
    } catch (error) {
      console.error('Error saving vertical:', error);
    }
  };

  const handleEdit = (vertical: BusinessVertical) => {
    setEditingVertical(vertical);
    setFormData({
      name: vertical.name,
      description: vertical.description || '',
      is_active: vertical.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta vertical de negócio?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verticais de Negócio</CardTitle>
            <CardDescription>Gerencie as verticais de mercado disponíveis</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVertical(null);
                setFormData({ name: '', description: '', is_active: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Vertical
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingVertical ? 'Editar Vertical' : 'Nova Vertical de Negócio'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Agronegócio"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da vertical de negócio"
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
              {verticals.map((vertical) => (
                <TableRow key={vertical.id}>
                  <TableCell className="font-medium">{vertical.name}</TableCell>
                  <TableCell>{vertical.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={vertical.is_active ? 'default' : 'secondary'}>
                      {vertical.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vertical)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vertical.id)}
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
