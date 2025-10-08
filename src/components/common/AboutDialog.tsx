import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AboutDialogProps {
  variant?: "default" | "ghost" | "outline";
}

export function AboutDialog({ variant = "ghost" }: AboutDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Sobre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sobre o Signet</DialogTitle>
          <DialogDescription>A Autenticidade em uma Nova Era Digital</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <section>
              <p className="leading-relaxed">
                O Signet nasce como uma plataforma que simboliza confiança, autenticidade e excelência. Mais do que uma
                ferramenta de gestão de documentos, ele representa um novo capítulo na forma como as organizações
                validam e reconhecem o conhecimento e as conquistas de seus profissionais.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Nossa Jornada: Da Ideia à Inovação</h3>
              <p className="leading-relaxed">
                A essência do Signet é resultado da busca constante por eficiência, transparência e credibilidade. O
                projeto nasceu da necessidade de centralizar e modernizar a
                <b> gestão de certificados, documentos jurídicos, atestados técnicos, competências, cases e badges </b>
                dentro de um ecossistema seguro, acessível e inteligente.
              </p>
              <p className="leading-relaxed mt-3">
                Desenvolvido com foco em usabilidade e confiabilidade, o Signet traduz tecnologia em simplicidade,
                reunindo design limpo, desempenho e integração com as principais práticas de governança digital.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">A Construção Colaborativa</h3>
              <p className="leading-relaxed">
                Nenhuma grande solução nasce sozinha. O Signet foi desenvolvido de forma colaborativa, com testes e
                validações contínuas para garantir que cada funcionalidade refletisse as necessidades reais de uso,
                mantendo o foco em qualidade, segurança e experiência do usuário.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Signet: O Selo da Confiança Digital</h3>
              <p className="leading-relaxed">
                O nome Signet não foi escolhido por acaso. Historicamente, "signet" representa o selo usado para
                autenticar documentos oficiais — e é exatamente isso que a plataforma entrega: uma fonte única de
                verdade, que garante autenticidade, transparência e confiabilidade a cada registro digital.
              </p>
              <p className="leading-relaxed mt-3">
                Mais do que uma aplicação, o Signet é um marco na transformação digital e na valorização da integridade
                da informação, consolidando-se como um símbolo de evolução e confiança.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
