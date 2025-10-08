import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileCompletionIndicator } from "./ProfileCompletionIndicator";
import { useAcademicEducation } from "@/hooks/useAcademicEducation";
import { useProfessionalExperiences } from "@/hooks/useProfessionalExperiences";
import { useUserSkills } from "@/hooks/useUserSkills";
import { useCertificationsByUserId } from "@/hooks/useCertificationsByUserId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, ExternalLink, GraduationCap, Briefcase, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EDUCATION_LEVEL_LABELS, PROFICIENCY_LEVEL_LABELS, SKILL_CATEGORY_LABELS } from "@/types/knowledge";

interface FullProfileDialogProps {
  userId: string;
  fullName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullProfileDialog({
  userId,
  fullName,
  open,
  onOpenChange,
}: FullProfileDialogProps) {
  const { educations, isLoading: educationsLoading } = useAcademicEducation(userId);
  const { experiences, isLoading: experiencesLoading } = useProfessionalExperiences(userId);
  const { userSkills, isLoading: skillsLoading } = useUserSkills(userId);
  const { data: certifications, isLoading: certificationsLoading } = useCertificationsByUserId(userId);

  const statusColors = {
    valid: 'bg-green-500/10 text-green-500 border-green-500/20',
    expiring: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    expired: 'bg-red-500/10 text-red-500 border-red-500/20',
    deactivated: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl">{fullName}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1">
          <div className="px-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="education">Formação</TabsTrigger>
              <TabsTrigger value="experience">Experiência</TabsTrigger>
              <TabsTrigger value="skills">Competências</TabsTrigger>
              <TabsTrigger value="certifications">Certificações</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-180px)] px-6 pb-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <ProfileCompletionIndicator userId={userId} />
              
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Formações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{educations?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Experiências</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{experiences?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Competências</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{userSkills?.length || 0}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="mt-4">
              {educationsLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : educations && educations.length > 0 ? (
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <Card key={edu.id} className="p-4">
                      <div className="flex gap-3">
                        <GraduationCap className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{edu.course_name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {EDUCATION_LEVEL_LABELS[edu.education_level]} - {edu.field_of_study}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">{edu.institution_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(edu.start_date), "MMM/yyyy", { locale: ptBR })}
                              {" - "}
                              {edu.completion_date
                                ? format(new Date(edu.completion_date), "MMM/yyyy", { locale: ptBR })
                                : "Em andamento"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma formação cadastrada
                </p>
              )}
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="mt-4">
              {experiencesLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : experiences && experiences.length > 0 ? (
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <Card key={exp.id} className="p-4">
                      <div className="flex gap-3">
                        <Briefcase className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{exp.position}</h4>
                            {exp.is_current && (
                              <Badge variant="outline" className="text-xs">Atual</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{exp.company_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(exp.start_date), "MMM/yyyy", { locale: ptBR })}
                              {" - "}
                              {exp.end_date
                                ? format(new Date(exp.end_date), "MMM/yyyy", { locale: ptBR })
                                : "Presente"}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma experiência cadastrada
                </p>
              )}
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="mt-4">
              {skillsLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : userSkills && userSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userSkills.map((userSkill) => (
                    <Card key={userSkill.id} className="p-4">
                      <div className="flex gap-3">
                        <Lightbulb className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{userSkill.technical_skill?.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {SKILL_CATEGORY_LABELS[userSkill.technical_skill?.category || 'tool']}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Nível: <strong className="text-foreground">{PROFICIENCY_LEVEL_LABELS[userSkill.proficiency_level]}</strong>
                            </span>
                            <span className="text-muted-foreground">
                              <strong className="text-foreground">{userSkill.years_of_experience}</strong> ano(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma competência cadastrada
                </p>
              )}
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications" className="mt-4">
              {certificationsLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : certifications && certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <Card key={cert.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-semibold">{cert.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{cert.function}</p>
                            {cert.validity_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Válido até {format(new Date(cert.validity_date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={statusColors[cert.status as keyof typeof statusColors]}
                            >
                              {cert.status === 'valid' && 'Válida'}
                              {cert.status === 'expiring' && 'Expirando'}
                              {cert.status === 'expired' && 'Expirada'}
                              {cert.status === 'deactivated' && 'Desativada'}
                            </Badge>
                            {cert.public_link && (
                              <a 
                                href={cert.public_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma certificação cadastrada
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
