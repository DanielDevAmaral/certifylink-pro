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
    const { provider, apiKey, model } = await req.json();

    if (!provider || !apiKey || !model) {
      return new Response(
        JSON.stringify({ success: false, error: 'Provider, API key e modelo são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let testResult;

    if (provider.toLowerCase().includes('groq')) {
      testResult = await testGroqConnection(apiKey, model);
    } else if (provider.toLowerCase().includes('openai')) {
      testResult = await testOpenAIConnection(apiKey, model);
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

async function testGroqConnection(apiKey: string, model: string) {
  try {
    // Check if this is an audio model (Whisper)
    if (model.toLowerCase().includes('whisper')) {
      return await testGroqAudioModel(apiKey, model);
    } else {
      return await testGroqChatModel(apiKey, model);
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão com Groq: ${error.message}`
    };
  }
}

async function testGroqChatModel(apiKey: string, model: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
      model: model,
      response: data.choices?.[0]?.message?.content || 'Teste concluído'
    };
  } else {
    const error = await response.text();
    return {
      success: false,
      error: `Erro na API Groq: ${response.status} - ${error}`,
      statusCode: response.status,
      fullError: error
    };
  }
}

async function testGroqAudioModel(apiKey: string, model: string) {
  // Create a simple WAV file for testing (1 second of silence)
  const sampleRate = 16000;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Fill with silence (zeros)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, 0, true);
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'audio/wav' });
  formData.append('file', blob, 'test.wav');
  formData.append('model', model);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      message: 'Conexão com modelo de áudio Groq estabelecida com sucesso!',
      model: model,
      response: data.text || 'Teste de áudio concluído'
    };
  } else {
    const error = await response.text();
    return {
      success: false,
      error: `Erro na API Groq (áudio): ${response.status} - ${error}`,
      statusCode: response.status,
      fullError: error
    };
  }
}

async function testOpenAIConnection(apiKey: string, model: string) {
  try {
    // Check if this is an audio model (Whisper)
    if (model.toLowerCase().includes('whisper')) {
      return await testOpenAIAudioModel(apiKey, model);
    } else {
      return await testOpenAIChatModel(apiKey, model);
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão com OpenAI: ${error.message}`
    };
  }
}

async function testOpenAIChatModel(apiKey: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
      model: model,
      response: data.choices?.[0]?.message?.content || 'Teste concluído'
    };
  } else {
    const error = await response.text();
    return {
      success: false,
      error: `Erro na API OpenAI: ${response.status} - ${error}`,
      statusCode: response.status,
      fullError: error
    };
  }
}

async function testOpenAIAudioModel(apiKey: string, model: string) {
  // Create a simple WAV file for testing (1 second of silence)
  const sampleRate = 16000;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Fill with silence (zeros)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, 0, true);
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'audio/wav' });
  formData.append('file', blob, 'test.wav');
  formData.append('model', model);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      message: 'Conexão com modelo de áudio OpenAI estabelecida com sucesso!',
      model: model,
      response: data.text || 'Teste de áudio concluído'
    };
  } else {
    const error = await response.text();
    return {
      success: false,
      error: `Erro na API OpenAI (áudio): ${response.status} - ${error}`,
      statusCode: response.status,
      fullError: error
    };
  }
}