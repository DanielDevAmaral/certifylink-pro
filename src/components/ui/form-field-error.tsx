import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
  error?: string;
}

export function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) return null;
  
  return (
    <div className="flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 text-danger" />
      <span className="text-xs text-danger">{error}</span>
    </div>
  );
}