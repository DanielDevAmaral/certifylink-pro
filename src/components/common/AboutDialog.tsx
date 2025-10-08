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
                O Signet nasceu de uma necessidade genuína: organizar e valorizar o que há de mais importante em uma
                organização — o conhecimento e a evolução profissional das pessoas. Ele surge como uma resposta prática
                a um desafio interno, transformando um sonho antigo de gestão em uma solução real e acessível.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Da Ideia à Criação</h3>
              <p className="leading-relaxed">
                Inspirado em um sistema anterior e impulsionado pela vontade de simplificar processos, o Signet foi
                reconstruído com propósito: centralizar e modernizar a{" "}
                <b>gestão de certificados, documentos jurídicos, atestados técnicos, cases e badges</b> dentro de um
                ambiente seguro e intuitivo.
              </p>
              <p className="leading-relaxed mt-3">
                Mais do que tecnologia, o Signet representa uma filosofia de organização, onde cada conquista
                profissional é registrada, validada e preservada como parte da história de crescimento coletivo.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Construído de Dentro para Fora</h3>
              <p className="leading-relaxed">
                O sistema foi desenvolvido a partir das necessidades reais do dia a dia, com base em experiências
                práticas e desafios enfrentados internamente. Cada funcionalidade nasceu de uma dor legítima e foi
                pensada para otimizar a rotina, garantir confiabilidade e promover transparência no acompanhamento da
                evolução técnica e profissional.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">Signet: O Selo da Evolução</h3>
              <p className="leading-relaxed">
                Mais do que uma aplicação, o Signet é parte de uma visão maior — um passo concreto em direção à
                construção de uma cultura de reconhecimento, aprendizado e desenvolvimento contínuo. Seu nome simboliza
                o selo que autentica o progresso e o compromisso com a excelência.
              </p>
              <p className="leading-relaxed mt-3">
                O Signet é, acima de tudo, uma ferramenta feita por quem vive o desafio da evolução e acredita que cada
                certificação é uma conquista que merece ser registrada e celebrada.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
