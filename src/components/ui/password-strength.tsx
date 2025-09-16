import { getPasswordStrength } from '@/lib/validations/auth';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, feedback } = getPasswordStrength(password);
  
  if (!password) return null;
  
  const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];
  const strengthColors = [
    'text-danger', 
    'text-warning', 
    'text-warning', 
    'text-success', 
    'text-success'
  ];
  
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Força da senha:
        </span>
        <span className={`text-xs font-medium ${strengthColors[score]}`}>
          {strengthLabels[score]}
        </span>
      </div>
      
      <Progress 
        value={(score / 5) * 100} 
        className="h-2"
      />
      
      {feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {feedback.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-warning">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}