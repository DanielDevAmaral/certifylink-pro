import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCertificationTypes, useCreateCertificationType, useUpdateCertificationType, useDeleteCertificationType, CertificationType } from "@/hooks/useCertificationTypes";
import { useCertificationPlatforms } from "@/hooks/useCertificationPlatforms";
import { useCertificationCategories } from "@/hooks/useCertificationCategories";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AdvancedSearchBar } from "@/components/common/AdvancedSearchBar";
import { useTypeFilters } from "@/hooks/useTypeFilters";

export function TypeManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CertificationType | null>(null);
  const [formData, setFormData] = useState({
    platform_id: "",
    category_id: "",
    name: "",
    full_name: "",
    function: "",
    aliases: [] as string[],
    is_active: true
  });
  const [aliasInput, setAliasInput] = useState("");

  const { data: types = [], isLoading } = useCertificationTypes();
  const { data: platforms = [] } = useCertificationPlatforms();
  const { data: categories = [] } = useCertificationCategories();
  const createType = useCreateCertificationType();
  const updateType = useUpdateCertificationType();
  const deleteType = useDeleteCertificationType();
  
  const { filters, filteredTypes, updateFilters, resetFilters } = useTypeFilters(types);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingType) {
        await updateType.mutateAsync({
          id: editingType.id,
          ...formData
        });
        // Fechar modal e resetar após edição
        setIsDialogOpen(false);
        resetForm();
      } else {
        await createType.mutateAsync(formData);
        // Manter modal aberto e apenas limpar os campos para nova criação
        resetForm();
        // Focar no primeiro campo após reset
        setTimeout(() => {
          const firstInput = document.getElementById('name');
          firstInput?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error saving certification type:', error);
    }
  };

  const handleEdit = (type: CertificationType) => {
    setEditingType(type);
    setFormData({
      platform_id: type.platform_id,
      category_id: type.category_id || "",
      name: type.name,
      full_name: type.full_name,
      function: type.function || "",
      aliases: type.aliases || [],
      is_active: type.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteType.mutateAsync(id);
  };

  const resetForm = () => {
    setFormData({
      platform_id: "",
      category_id: "",
      name: "",
      full_name: "",
      function: "",
      aliases: [],
      is_active: true
    });
    setAliasInput("");
    setEditingType(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const addAlias = () => {
    if (aliasInput.trim() && !formData.aliases.includes(aliasInput.trim())) {
      setFormData(prev => ({
        ...prev,
        aliases: [...prev.aliases, aliasInput.trim()]
      }));
      setAliasInput("");
    }
  };

  const removeAlias = (alias: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter(a => a !== alias)
    }));
  };

  if (isLoading) return <LoadingSpinner />;

  const hasActiveFilters = !!filters.platformId || !!filters.categoryId || filters.isActive !== undefined || !!filters.dateRange;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Tipos de Certificação ({filteredTypes.length}{types.length !== filteredTypes.length && ` de ${types.length}`})
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os tipos específicos de certificação por plataforma
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
                {[!!filters.platformId, !!filters.categoryId, filters.isActive !== undefined, !!filters.dateRange].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo' : 'Novo Tipo'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Modifique as informações do tipo de certificação.' 
                  : 'Adicione um novo tipo de certificação ao sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform_id">Plataforma</Label>
                  <Select
                    value={formData.platform_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category_id">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome Curto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Cloud Architect"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="ex: Google Cloud Professional Cloud Architect"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="function">Função</Label>
                <Input
                  id="function"
                  value={formData.function}
                  onChange={(e) => setFormData(prev => ({ ...prev, function: e.target.value }))}
                  placeholder="ex: Arquitetura de Soluções em Nuvem"
                />
              </div>
              
              <div>
                <Label>Aliases (Nomes Alternativos)</Label>
                <div className="flex space-x-2">
                  <Input
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="ex: GCP Architect"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAlias();
                      }
                    }}
                  />
                  <Button type="button" onClick={addAlias}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.aliases.map((alias, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeAlias(alias)}>
                      {alias} ×
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createType.isPending || updateType.isPending}
                >
                  {editingType ? 'Salvar' : 'Criar'}
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
        placeholder="Buscar por nome, função ou alias..."
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Plataforma</Label>
              <Select
                value={filters.platformId || "all"}
                onValueChange={(value) => 
                  updateFilters({ platformId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {platforms.map(platform => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) => 
                  updateFilters({ categoryId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
                onValueChange={(value) => 
                  updateFilters({ 
                    isActive: value === "all" ? undefined : value === "active" 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
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
                  <SelectItem value="platform_asc">Plataforma (A-Z)</SelectItem>
                  <SelectItem value="platform_desc">Plataforma (Z-A)</SelectItem>
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
            <TableHead>Plataforma</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum tipo de certificação encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredTypes.map((type) => (
              <TableRow key={type.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-muted-foreground">{type.full_name}</div>
                </div>
              </TableCell>
              <TableCell>{type.platform?.name}</TableCell>
              <TableCell>{type.category?.name}</TableCell>
              <TableCell>{type.function}</TableCell>
              <TableCell>
                <Badge variant={type.is_active ? "default" : "secondary"}>
                  {type.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
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
                          Tem certeza que deseja excluir o tipo "{type.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(type.id)}
                          disabled={deleteType.isPending}
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