import { Card } from "@/components/ui/card";
import { GraduationCap, Briefcase, Lightbulb, Award, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MatchingScoringExplanation() {
  const criteria = [
    {
      icon: GraduationCap,
      label: "Formação Acadêmica",
      points: 25,
      description: "Verifica se o profissional possui o nível de formação e área de estudo requeridos",
      color: "text-blue-500",
    },
    {
      icon: Briefcase,
      label: "Anos de Experiência",
      points: 30,
      description: "Compara os anos de experiência do profissional com o requisito mínimo",
      color: "text-green-500",
    },
    {
      icon: Lightbulb,
      label: "Competências Técnicas",
      points: 30,
      description: "Analisa quantas das skills requeridas o profissional possui",
      color: "text-purple-500",
    },
    {
      icon: Award,
      label: "Certificações",
      points: 15,
      description: "Verifica se o profissional possui as certificações exigidas",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-4">

      <Alert className="mb-4">
        <AlertDescription>
          O sistema calcula um <strong>score de 0 a 100 pontos</strong> comparando o perfil do profissional
          com os requisitos do edital. Quanto maior o score, mais adequado o profissional está ao requisito.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criteria.map((criterion) => {
          const Icon = criterion.icon;
          return (
            <div key={criterion.label} className="flex gap-3 p-4 border rounded-lg">
              <div className={cn("mt-1", criterion.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{criterion.label}</h4>
                  <span className="text-sm font-semibold text-primary">
                    {criterion.points} pts
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {criterion.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Exemplo de Cálculo:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Formação: Mestrado em TI → <strong>25/25 pontos</strong> ✓</li>
          <li>• Experiência: 6 anos (requerido: 10) → <strong>18/30 pontos</strong> (6/10 × 30)</li>
          <li>• Skills: 4 de 5 requeridas → <strong>24/30 pontos</strong> (4/5 × 30)</li>
          <li>• Certificações: 1 de 2 requeridas → <strong>7.5/15 pontos</strong> (1/2 × 15)</li>
          <li className="font-semibold text-foreground pt-2 border-t mt-2">
            Score Total: <strong className="text-primary">74.5/100</strong> (Adequação Média)
          </li>
        </ul>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
