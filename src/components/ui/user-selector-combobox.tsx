import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserStatusBadge } from "@/components/ui/user-status-badge";
import { useUserSearch } from "@/hooks/useUserSearch";

interface User {
  user_id: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'leader' | 'admin';
  position?: string;
  department?: string;
}

interface UserSelectorComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  excludeUserIds?: string[];
  statusFilter?: ('active' | 'inactive' | 'suspended')[];
  roleFilter?: ('user' | 'leader' | 'admin')[];
}

export function UserSelectorCombobox({
  value,
  onValueChange,
  placeholder = "Selecionar usuário...",
  className,
  excludeUserIds = [],
  statusFilter = ['active'],
  roleFilter,
}: UserSelectorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const { data: users = [], isLoading } = useUserSearch({
    search: searchQuery,
    statusFilter,
    roleFilter,
    excludeUserIds,
  });

  const selectedUser = users.find(user => user.user_id === value);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(selectedUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {selectedUser.full_name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {selectedUser.email}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar usuários..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Carregando..." : "Nenhum usuário encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.user_id}
                  value={user.user_id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 p-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {user.full_name}
                      </p>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === user.user_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <UserStatusBadge status={user.status} />
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'leader' ? 'Líder' : 'Usuário'}
                      </Badge>
                      {user.position && (
                        <Badge variant="secondary" className="text-xs">
                          {user.position}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}