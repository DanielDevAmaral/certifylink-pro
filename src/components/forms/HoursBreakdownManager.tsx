import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface HoursBreakdownManagerProps {
  tags: string[];
  hoursBreakdown: Record<string, number>;
  onChange: (breakdown: Record<string, number>) => void;
}

export function HoursBreakdownManager({ tags, hoursBreakdown, onChange }: HoursBreakdownManagerProps) {
  const handleHoursChange = (tag: string, value: string) => {
    const hours = parseFloat(value) || 0;
    if (hours >= 0) {
      onChange({
        ...hoursBreakdown,
        [tag]: hours,
      });
    }
  };

  const totalHours = Object.values(hoursBreakdown).reduce((sum, hours) => sum + hours, 0);

  if (tags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
        Adicione tags primeiro para poder registrar as horas por categoria
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Controle de Horas por Tag</Label>
      <div className="grid gap-3">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-3">
            <Label className="min-w-[120px] text-sm font-medium">{tag}</Label>
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={hoursBreakdown[tag] || ''}
                onChange={(e) => handleHoursChange(tag, e.target.value)}
                placeholder="0"
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </div>
        ))}
      </div>
      
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Total de Horas</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {totalHours.toFixed(1)}h
          </span>
        </div>
      </Card>
    </div>
  );
}
