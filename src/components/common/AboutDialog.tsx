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
          <DialogDescription>
            A Autenticidade em uma Nova Era Digital
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <section>
              <p className="leading-relaxed">
                O Signet nasce como uma plataforma que simboliza confiança, autenticidade e excelência.
                Mais do que uma ferramenta de gestão de documentos, ele representa um novo capítulo na forma como a IPNET by Vivo organiza, valida e reconhece o conhecimento e as conquistas de seus talentos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Nossa Jornada: Da Ideia à Inovação
              </h3>
              <p className="leading-relaxed">
                A essência do Signet é resultado da nossa busca constante por eficiência e credibilidade.
                Idealizado por Roger Lovato, o projeto nasceu da necessidade de centralizar e modernizar a gestão de certificados, documentos jurídicos, atestados técnicos, cases e badges dentro de um ecossistema seguro e inteligente.
              </p>
              <p className="leading-relaxed mt-3">
                Com o apoio técnico de Rodrigo Bonfim, que traduziu a visão em arquitetura e desenvolvimento, o Signet tomou forma rapidamente — unindo design limpo, usabilidade e integração total com o DNA inovador da IPNET.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                A Construção Colaborativa: Testes, Validação e Excelência
              </h3>
              <p className="leading-relaxed">
                Nenhuma grande solução nasce sozinha.
                O time de Tech Sales foi peça-chave na validação e homologação do Signet, garantindo que cada funcionalidade refletisse a realidade operacional da empresa.
                Destaque para a contribuição especial de Denis Rosa, Mairton Melo e Rodrigo Oliveira, que participaram ativamente dos testes, feedbacks e ajustes, assegurando que a plataforma atingisse o mais alto padrão de qualidade e experiência.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Signet: O Selo da Confiança Digital
              </h3>
              <p className="leading-relaxed">
                O nome Signet não foi escolhido por acaso.
                Historicamente, "signet" representa o selo usado para autenticar documentos oficiais — e é exatamente isso que a plataforma entrega: uma fonte única de verdade, que dá segurança, transparência e credibilidade a cada certificado e documento corporativo.
              </p>
              <p className="leading-relaxed mt-3">
                Mais do que uma aplicação, o Signet é um marco na nossa jornada de digitalização e governança.
                Ele reforça o compromisso da IPNET com a inovação contínua e com a valorização das pessoas que constroem o nosso sucesso todos os dias.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
