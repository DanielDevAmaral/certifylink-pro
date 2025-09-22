import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";

interface AdvancedSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  showClearButton?: boolean;
  debounceMs?: number;
  onAdvancedSearch?: () => void;
  showAdvancedButton?: boolean;
}

export function AdvancedSearchBar({
  placeholder = "Buscar...",
  value = "",
  onChange,
  onSearch,
  className = "",
  showClearButton = true,
  debounceMs = 300,
  onAdvancedSearch,
  showAdvancedButton = false
}: AdvancedSearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoized callbacks to prevent unnecessary re-renders
  const handleInputChange = useCallback((newValue: string) => {
    setInternalValue(newValue);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        onChange?.(newValue);
        onSearch?.(newValue);
      }, debounceMs);
    } else {
      onChange?.(newValue);
      onSearch?.(newValue);
    }
  }, [onChange, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange?.("");
    onSearch?.("");
    // Keep focus on input after clearing
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(internalValue);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [internalValue, onSearch, handleClear]);

  // Sync external value changes without losing focus
  useEffect(() => {
    if (value !== internalValue && document.activeElement !== inputRef.current) {
      setInternalValue(value);
    }
  }, [value, internalValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={internalValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          autoComplete="off"
          spellCheck="false"
        />
        {showClearButton && internalValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            onClick={handleClear}
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {showAdvancedButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAdvancedSearch}
          className="flex-shrink-0 gap-2"
        >
          <Filter className="h-4 w-4" />
          Avançado
        </Button>
      )}
    </div>
  );
}
