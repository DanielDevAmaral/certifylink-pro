import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCertificationPlatforms, useCreateCertificationPlatform, useUpdateCertificationPlatform, useDeleteCertificationPlatform, CertificationPlatform } from "@/hooks/useCertificationPlatforms";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AdvancedSearchBar } from "@/components/common/AdvancedSearchBar";
import { usePlatformFilters } from "@/hooks/usePlatformFilters";

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
  
  const { filters, filteredPlatforms, updateFilters, resetFilters } = usePlatformFilters(platforms);
  const [showFilters, setShowFilters] = useState(false);

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

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const hasActiveFilters = filters.hasLogo !== undefined || !!filters.dateRange;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Plataformas ({filteredPlatforms.length}{platforms.length !== filteredPlatforms.length && ` de ${platforms.length}`})
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as plataformas de certificação disponíveis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[filters.hasLogo !== undefined, !!filters.dateRange].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
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
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
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
      </div>

      {/* Barra de Busca */}
      <AdvancedSearchBar
        value={filters.searchTerm}
        onChange={(value) => updateFilters({ searchTerm: value })}
        onSearch={(value) => updateFilters({ searchTerm: value })}
        placeholder="Buscar por nome ou descrição..."
        showClearButton
      />

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Filtros Avançados</h4>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Logo</Label>
              <Select
                value={filters.hasLogo === undefined ? "all" : filters.hasLogo ? "yes" : "no"}
                onValueChange={(value) => 
                  updateFilters({ 
                    hasLogo: value === "all" ? undefined : value === "yes" 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="yes">Com Logo</SelectItem>
                  <SelectItem value="no">Sem Logo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ordenar Por</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="created_desc">Mais Recentes</SelectItem>
                  <SelectItem value="created_asc">Mais Antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPlatforms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                Nenhuma plataforma encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredPlatforms.map((platform) => (
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}