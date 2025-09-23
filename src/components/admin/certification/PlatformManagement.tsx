import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCertificationPlatforms, useCreateCertificationPlatform, useUpdateCertificationPlatform, useDeleteCertificationPlatform, CertificationPlatform } from "@/hooks/useCertificationPlatforms";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function PlatformManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<CertificationPlatform | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: ""
  });

  const { data: platforms = [], isLoading } = useCertificationPlatforms();
  const createPlatform = useCreateCertificationPlatform();
  const updatePlatform = useUpdateCertificationPlatform();
  const deletePlatform = useDeleteCertificationPlatform();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlatform) {
        await updatePlatform.mutateAsync({
          id: editingPlatform.id,
          ...formData
        });
      } else {
        await createPlatform.mutateAsync(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving platform:', error);
    }
  };

  const handleEdit = (platform: CertificationPlatform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || "",
      logo_url: platform.logo_url || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePlatform.mutateAsync(id);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", logo_url: "" });
    setEditingPlatform(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Plataformas ({platforms.length})</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as plataformas de certificação disponíveis
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Plataforma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlatform ? 'Editar Plataforma' : 'Nova Plataforma'}
              </DialogTitle>
              <DialogDescription>
                {editingPlatform 
                  ? 'Modifique as informações da plataforma de certificação.' 
                  : 'Adicione uma nova plataforma de certificação ao sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlatform.isPending || updatePlatform.isPending}
                >
                  {editingPlatform ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {platforms.map((platform) => (
            <TableRow key={platform.id}>
              <TableCell className="font-medium">{platform.name}</TableCell>
              <TableCell>{platform.description}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(platform)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a plataforma "{platform.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(platform.id)}
                          disabled={deletePlatform.isPending}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}