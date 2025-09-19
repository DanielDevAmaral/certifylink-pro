import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { TestConnectionModal } from "./TestConnectionModal";
import { 
  Bot, 
  Key, 
  TestTube2, 
  Settings as SettingsIcon,
  Zap,
  Brain,
  DollarSign,
  ExternalLink
} from "lucide-react";

interface AIProviderConfigProps {
  settings: {
    provider: string;
    model: string;
    api_key: string;
    prompt_template: string;
    auto_suggestions: boolean;
    temperature: number;
    max_tokens: number;
    timeout: number;
  };
  onUpdate: (key: string, value: any) => void;
}

const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    logo: "🤖",
    description: "GPT-4, GPT-5 e modelos de raciocínio avançados",
    models: {
      "gpt-5-2025-08-07": { name: "GPT-5", speed: "🧠", cost: "💰💰💰", desc: "Modelo flagship mais avançado" },
      "gpt-5-mini-2025-08-07": { name: "GPT-5 Mini", speed: "⚡", cost: "💰💰", desc: "Versão rápida e eficiente" },
      "gpt-5-nano-2025-08-07": { name: "GPT-5 Nano", speed: "⚡⚡", cost: "💰", desc: "Mais rápido e econômico" },
      "gpt-4.1-2025-04-14": { name: "GPT-4.1", speed: "🧠", cost: "💰💰", desc: "GPT-4 aprimorado e confiável" },
      "o3-2025-04-16": { name: "O3", speed: "🧠🧠", cost: "💰💰💰", desc: "Raciocínio avançado multi-etapas" },
      "o4-mini-2025-04-16": { name: "O4 Mini", speed: "⚡🧠", cost: "💰💰", desc: "Raciocínio rápido otimizado" },
      "gpt-4o": { name: "GPT-4o", speed: "🧠", cost: "💰💰", desc: "Modelo legacy com visão" },
      "gpt-4o-mini": { name: "GPT-4o Mini", speed: "⚡", cost: "💰", desc: "Rápido e barato com visão" }
    },
    docs: "https://platform.openai.com/docs"
  },
  anthropic: {
    name: "Anthropic Claude",
    logo: "🔮",
    description: "Claude 4 e modelos com raciocínio superior",
    models: {
      "claude-opus-4-1-20250805": { name: "Claude 4 Opus", speed: "🧠🧠", cost: "💰💰💰", desc: "Mais capaz e inteligente" },
      "claude-sonnet-4-20250514": { name: "Claude 4 Sonnet", speed: "⚡🧠", cost: "💰💰", desc: "Alto desempenho eficiente" },
      "claude-3-5-haiku-20241022": { name: "Claude 3.5 Haiku", speed: "⚡⚡", cost: "💰", desc: "Respostas rápidas" },
      "claude-3-5-sonnet-20241022": { name: "Claude 3.5 Sonnet", speed: "🧠", cost: "💰💰", desc: "Modelo anterior inteligente" }
    },
    docs: "https://docs.anthropic.com/claude/reference"
  },
  google: {
    name: "Google Gemini",
    logo: "💎",
    description: "Gemini 2.5 com capacidades multimodais",
    models: {
      "gemini-2.5-pro": { name: "Gemini 2.5 Pro", speed: "🧠", cost: "💰💰", desc: "Modelo mais avançado" },
      "gemini-2.5-flash": { name: "Gemini 2.5 Flash", speed: "⚡", cost: "💰", desc: "Rápido e eficiente" },
      "gemini-2.5-flash-image": { name: "Gemini 2.5 Flash Image", speed: "⚡", cost: "💰💰", desc: "Especializado em imagens" },
      "gemini-1.5-pro": { name: "Gemini 1.5 Pro", speed: "🧠", cost: "💰💰", desc: "Versão anterior pro" },
      "gemini-1.5-flash": { name: "Gemini 1.5 Flash", speed: "⚡", cost: "💰", desc: "Versão anterior flash" }
    },
    docs: "https://ai.google.dev/docs"
  },
  groq: {
    name: "Groq",
    logo: "⚡",
    description: "Processamento ultrarrápido com Llama",
    models: {
      "llama-3.3-70b-versatile": { name: "Llama 3.3 70B", speed: "⚡🧠", cost: "💰💰", desc: "Nova versão versátil" },
      "llama-3.1-70b-versatile": { name: "Llama 3.1 70B", speed: "⚡🧠", cost: "💰💰", desc: "Modelo versátil" },
      "llama-3.1-8b-instant": { name: "Llama 3.1 8B", speed: "⚡⚡", cost: "💰", desc: "Respostas instantâneas" },
      "llama-3-groq-70b-tool-use": { name: "Llama 3 Tools 70B", speed: "⚡🧠", cost: "💰💰", desc: "Especializado em ferramentas" },
      "llama-3-groq-8b-tool-use": { name: "Llama 3 Tools 8B", speed: "⚡⚡", cost: "💰", desc: "Tools rápido" }
    },
    docs: "https://console.groq.com/docs"
  },
  xai: {
    name: "xAI Grok",
    logo: "🚀",
    description: "Modelos Grok com conhecimento em tempo real",
    models: {
      "grok-3": { name: "Grok 3", speed: "🧠", cost: "💰💰💰", desc: "Modelo principal" },
      "grok-3-mini": { name: "Grok 3 Mini", speed: "⚡", cost: "💰💰", desc: "Versão compacta" },
      "grok-beta": { name: "Grok Beta", speed: "🧠", cost: "💰💰", desc: "Versão experimental" }
    },
    docs: "https://docs.x.ai"
  },
  mistral: {
    name: "Mistral AI",
    logo: "🌪️",
    description: "Modelos Mixtral eficientes e especializados",
    models: {
      "mixtral-8x7b-32768": { name: "Mixtral 8x7B", speed: "⚡🧠", cost: "💰💰", desc: "Modelo de mistura eficiente" },
      "mixtral-8x22b-32768": { name: "Mixtral 8x22B", speed: "🧠", cost: "💰💰💰", desc: "Versão mais poderosa" },
      "mistral-7b-instruct": { name: "Mistral 7B", speed: "⚡", cost: "💰", desc: "Modelo base instrutivo" },
      "mistral-medium": { name: "Mistral Medium", speed: "⚡🧠", cost: "💰💰", desc: "Equilibrio performance/custo" }
    },
    docs: "https://docs.mistral.ai"
  }
};

export function AIProviderConfig({ settings, onUpdate }: AIProviderConfigProps) {
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const currentProvider = AI_PROVIDERS[settings.provider as keyof typeof AI_PROVIDERS];
  const currentModel = currentProvider?.models?.[settings.model] as any;

  return (
    <Card className="card-corporate">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configuração de IA</h3>
          <p className="text-sm text-muted-foreground">
            Configure a inteligência artificial para sugestão de equivalências
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="ai-provider">Provedor de IA</Label>
          <Select value={settings.provider} onValueChange={(value) => onUpdate('provider', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um provedor" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{provider.logo}</span>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">{provider.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo</Label>
            <Input
              id="ai-model"
              type="text"
              placeholder={`Ex: ${Object.keys(currentProvider.models)[0] || 'llama-3.1-8b-instant'}`}
              value={settings.model}
              onChange={(e) => onUpdate('model', e.target.value)}
            />
            <div className="p-3 rounded-lg bg-accent/30 text-sm">
              <p className="font-medium text-foreground mb-2">Modelos Sugeridos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                {Object.entries(currentProvider.models).slice(0, 6).map(([key, model]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-1 hover:bg-accent/20 rounded cursor-pointer"
                       onClick={() => onUpdate('model', key)}>
                    <span className="font-mono">{key}</span>
                    <div className="flex items-center gap-1">
                      <span title="Velocidade">{model.speed}</span>
                      <span title="Custo">{model.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Clique em um modelo sugerido ou digite manualmente o nome do modelo
              </p>
            </div>
          </div>
        )}

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="ai-key">Chave da API</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="ai-key" 
              type="password" 
              placeholder="sk-... ou gsk-... ou key-..." 
              className="pl-10" 
              value={settings.api_key} 
              onChange={(e) => onUpdate('api_key', e.target.value)} 
            />
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setShowTestModal(true)}
            disabled={!settings.provider || !settings.api_key}
            variant="outline"
            className="gap-2"
          >
            <TestTube2 className="h-4 w-4" />
            Testar Conexão
          </Button>
          
          {currentProvider && (
            <Button variant="ghost" size="sm" asChild>
              <a href={currentProvider.docs} target="_blank" rel="noopener noreferrer" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                Documentação
              </a>
            </Button>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
          <div>
            <p className="font-medium text-foreground">Configurações Avançadas</p>
            <p className="text-sm text-muted-foreground">
              Temperature, tokens e timeout
            </p>
          </div>
          <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-4 rounded-lg border bg-accent/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature: {settings.temperature}</Label>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([value]) => onUpdate('temperature', value)}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Controla a criatividade das respostas</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Máximo de Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={settings.max_tokens}
                  onChange={(e) => onUpdate('max_tokens', Number(e.target.value))}
                  min={1}
                  max={4000}
                />
                <p className="text-xs text-muted-foreground">Limite de tokens na resposta</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input
                id="timeout"
                type="number"
                value={settings.timeout}
                onChange={(e) => onUpdate('timeout', Number(e.target.value))}
                min={5}
                max={120}
              />
              <p className="text-xs text-muted-foreground">Tempo limite para requisições</p>
            </div>
          </div>
        )}

        {/* Prompt Template */}
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Prompt para Equivalências</Label>
          <Textarea
            id="ai-prompt"
            rows={4}
            placeholder="Baseado na certificação fornecida, sugira serviços equivalentes que podem ser executados..."
            value={settings.prompt_template}
            onChange={(e) => onUpdate('prompt_template', e.target.value)}
          />
        </div>

        {/* Auto Suggestions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
          <div>
            <p className="font-medium text-foreground">Ativar Sugestões Automáticas</p>
            <p className="text-sm text-muted-foreground">
              Gerar equivalências automaticamente ao cadastrar certificações
            </p>
          </div>
          <Switch 
            checked={settings.auto_suggestions} 
            onCheckedChange={(val) => onUpdate('auto_suggestions', val)} 
          />
        </div>
      </div>

      <TestConnectionModal
        open={showTestModal}
        onOpenChange={setShowTestModal}
        provider={settings.provider}
        model={settings.model}
        apiKey={settings.api_key}
        temperature={settings.temperature}
        maxTokens={settings.max_tokens}
        timeout={settings.timeout}
      />
    </Card>
  );
}