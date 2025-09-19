import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Provider e API key são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let testResult;

    if (provider.toLowerCase().includes('groq')) {
      testResult = await testGroqConnection(apiKey);
    } else if (provider.toLowerCase().includes('openai')) {
      testResult = await testOpenAIConnection(apiKey);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Provedor ${provider} não suportado para teste` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error testing AI provider:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function testGroqConnection(apiKey: string) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'user',
            content: 'Teste de conexão. Responda apenas "OK".'
          }
        ],
        max_tokens: 10,
        temperature: 0
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexão com Groq estabelecida com sucesso!',
        model: 'llama3-8b-8192',
        response: data.choices?.[0]?.message?.content || 'Teste concluído'
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `Erro na API Groq: ${response.status} - ${error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão com Groq: ${error.message}`
    };
  }
}

async function testOpenAIConnection(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Teste de conexão. Responda apenas "OK".'
          }
        ],
        max_tokens: 10,
        temperature: 0
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexão com OpenAI estabelecida com sucesso!',
        model: 'gpt-3.5-turbo',
        response: data.choices?.[0]?.message?.content || 'Teste concluído'
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `Erro na API OpenAI: ${response.status} - ${error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão com OpenAI: ${error.message}`
    };
  }
}