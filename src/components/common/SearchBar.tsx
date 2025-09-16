import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  showClearButton?: boolean;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = "Buscar...",
  value = "",
  onChange,
  onSearch,
  className = "",
  showClearButton = true,
  debounceMs = 300
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        onChange?.(internalValue);
        onSearch?.(internalValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      onChange?.(internalValue);
      onSearch?.(internalValue);
    }
  }, [internalValue, onChange, onSearch, debounceMs]);

  const handleClear = () => {
    setInternalValue("");
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {showClearButton && internalValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}