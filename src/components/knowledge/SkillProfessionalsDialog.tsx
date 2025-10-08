import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUsersBySkill } from "@/hooks/useUsersBySkill";
import { FullProfileDialog } from "./FullProfileDialog";
import { User, Briefcase, Award } from "lucide-react";
import { PROFICIENCY_LEVEL_LABELS } from "@/types/knowledge";

interface SkillProfessionalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillId: string | null;
  skillName: string;
}

export function SkillProfessionalsDialog({
  open,
  onOpenChange,
  skillId,
  skillName,
}: SkillProfessionalsDialogProps) {
  const { data: professionals, isLoading, error } = useUsersBySkill(skillId);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Debug logging
  console.log('🎯 [SkillProfessionalsDialog] Render:', {
    skillId,
    skillName,
    professionalsCount: professionals?.length,
    isLoading,
    hasError: !!error,
  });

  const handleViewProfile = (userId: string, fullName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(fullName);
    setProfileDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Profissionais com competência em <span className="text-primary">{skillName}</span>
            </DialogTitle>
          </DialogHeader>

          {error ? (
            <Card className="p-8 text-center border-destructive">
              <User className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-semibold mb-2">Erro ao carregar profissionais</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </Card>
              ))}
            </div>
          ) : professionals && professionals.length > 0 ? (
            <div className="space-y-4">
              {professionals.map((prof) => (
                <Card key={prof.user_id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{prof.full_name}</h3>
                      </div>

                      {(prof.position || prof.department) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>
                            {prof.position}
                            {prof.position && prof.department && " • "}
                            {prof.department}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary">
                            {PROFICIENCY_LEVEL_LABELS[prof.proficiency_level as keyof typeof PROFICIENCY_LEVEL_LABELS]}
                          </Badge>
                        </div>
                        
                        {prof.years_of_experience > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {prof.years_of_experience} {prof.years_of_experience === 1 ? 'ano' : 'anos'} de experiência
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(prof.user_id, prof.full_name)}
                    >
                      Ver Perfil Completo
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium mb-2">
                Nenhum profissional ativo encontrado com esta competência
              </p>
              <p className="text-sm text-muted-foreground">
                Pode haver profissionais com status inativo ou sem perfil completo
              </p>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {selectedUserId && (
        <FullProfileDialog
          userId={selectedUserId}
          fullName={selectedUserName}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </>
  );
}
