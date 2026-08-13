import { NextResponse } from 'next/server';
import { httpsAgent } from '@/lib/ssl';

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SITE_URL = 'http://brbrj2402krz:8080';

// Sessoes em memoria (substituir por Redis/DB em producao)
const sessoes = {};

/**
 * Busca dados completos do site para contexto da IA
 */
async function getDadosSite() {
  try {
    const [locaisRes, falhasRes] = await Promise.all([
      fetch(`${SITE_URL}/api/locais`, { signal: AbortSignal.timeout(30000) }),
      fetch(`${SITE_URL}/api/falhas`, { signal: AbortSignal.timeout(30000) }),
    ]);

    const locais = await locaisRes.json();
    const falhas = await falhasRes.json();

    const subcategoriasMap = {};
    await Promise.all(
      falhas.map(async (f) => {
        try {
          const res = await fetch(`${SITE_URL}/api/subcategorias/${f.id}`, {
            signal: AbortSignal.timeout(30000),
          });
          subcategoriasMap[f.id] = await res.json();
        } catch (e) {
          subcategoriasMap[f.id] = [];
        }
      })
    );

    return { locais, falhas, subcategoriasMap };
  } catch (error) {
    console.error('[Groq] Erro ao buscar dados do site:', error.message);
    return { locais: [], falhas: [], subcategoriasMap: {} };
  }
}

/**
 * Chama o Groq API
 */
async function chamarGroq(mensagens, { temperature = 0.3, maxTokens = 1024 } = {}) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: mensagens,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30000),
    agent: httpsAgent,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Erro na API do Groq (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chat para coleta de apontamento
 */
async function chatApontamento(sessaoId, mensagem) {
  if (!sessoes[sessaoId]) {
    sessoes[sessaoId] = {
      historico: [],
      campos: {},
      fase: 'inicial',
    };
  }

  const sessao = sessoes[sessaoId];
  sessao.historico.push({ role: 'user', content: mensagem });

  const { locais, falhas, subcategoriasMap } = await getDadosSite();

  const listaLocais = locais.map(l => `${l.id}:${l.nome}`).join(', ');
  const listaFalhas = falhas.map(f => `${f.id}:${f.descricao}`).join(', ');
  const listaSubcategorias = falhas.map(f =>
    `Falha ${f.id} (${f.descricao}): ${(subcategoriasMap[f.id] || []).map(s => `${s.id}:${s.descricao}`).join(', ')}`
  ).join('\n');

  let systemPrompt;

  if (sessao.fase === 'inicial') {
    systemPrompt = `Voce e um assistente de apontamentos. Sua tarefa e coletar dados e retornar um JSON.

=== DADOS DO SISTEMA (use APENAS essas opcoes) ===
Locais: ${listaLocais}
Falhas: ${listaFalhas}
Subcategorias:
${listaSubcategorias}

=== COMO RESPONDER ===

1. O usuario descreve um problema. Voce ANALISA e SELECIONA as opcoes do sistema.

2. EQUIPAMENTO - PADRAO e "Mini PC". So mude se o usuario explicitamente disse outro equipamento:
   - Se o usuario NAO disse qual equipamento → use "Mini PC"
   - Se o usuario disse "monitor" → "Monitor comum"
   - Se o usuario disse "monitor touch" / "tela touch" → "Monitor touch"
   - Se o usuario disse "tv" / "televisao" → "TV"
   - Se o usuario disse "raspberry" → "Raspberry"
   - Se o usuario disse nome proprio (ex: "PC-CH32-001") → use esse nome
   - NAO use o nome do device (ex: "Posto QSTOP") como equipamento. O device e o LOCAL, nao o equipamento.

3. LOCAL - CORRESPONDA O NUMERO DO CANAL COM O NOME DO LOCAL:
   - O usuario diz "canal 9" / "CH9" → Busque o local que CONTENHA "9" no nome
   - IMPORTANTE: O numero do canal NO DEVICE (ex: CH9) deve ser usado para buscar o local correto
   - NAO confunda o ID do local com o numero do canal! O local_id 9 pode NAO ser o canal 9
   - Verifique SEMPRE: se o device diz "CH9", o local escolhido DEVE ter "9" no nome
   - Se o usuario diz "CH09", busque local com "09" ou "9" no nome

4. HORAS - extraia da mensagem:
   - "8h" / "8 horas" → 8
   - "2h30" / "2 horas e meia" → 2.5
   - "30 min" / "meia hora" → 0.5
   - Se nao tem horas, PERGUNTE: "Por quantas horas ficou parado?"

5. RECURSOS - extraia da mensagem:
   - "2 equipamentos" → 2
   - Se nao disse → assuma 1

6. FALHA - escolha a categoria da lista que mais se encaixa na descricao

7. SUBCATEGORIA - escolha a opcao da lista que mais se encaixa

8. COMENTARIO - reescreva em tom profissional. Use o NOME DO CANAL (ex: "Canal CH9"), NAO o ID do local.

=== O QUE PERGUNTAR ===
- Se faltam horas OU recursos → pergunte APENAS o que falta, de forma DIRETA
- Se faltam AMBOS → pergunte os dois de uma vez
- Se TEM TUDO → NAO pergunte nada, retorne o JSON

=== RETORNO ===
Se faltam dados, responda SOMENTE com o que falta. Ex: "Por quantas horas o equipamento ficou parado?"

Se tem tudo, retorne ESTE JSON dentro de blocos de codigo:
\`\`\`json
{
  "status": "completo",
  "campos": {
    "local_id": <numero>,
    "local_nome": "<nome EXATO da lista de locais>",
    "equipamento_nome": "<nome EXATO da lista ou 'Mini PC'>",
    "falha_id": <numero>,
    "falha_nome": "<nome>",
    "subcategoria_id": <numero>,
    "subcategoria_nome": "<nome>",
    "horas_paradas": <numero>,
    "recursos_parados": <numero>,
    "comentario": "<texto profissional com nome do canal>"
  },
  "resumo": "<resumo curto>"
}
\`\`\`

NAO faca textos longos. Seja DIRETO.`;
  } else {
    systemPrompt = `Voce e um assistente de apontamentos. O usuario esta respondendo suas perguntas.

Campos ja coletados: ${JSON.stringify(sessao.campos)}

Locais: ${listaLocais}
Falhas: ${listaFalhas}
Subcategorias:
${listaSubcategorias}

REGRAS:
- Extraia a informacao que o usuario acabou de enviar
- Adicione aos campos que ja tem
- So pergunte o que ainda falta (horas_paradas ou recursos_parados)
- Quando tuder tudo, retorne o JSON com status "completo"
- Seja DIRETO, nao faca textos longos`;
  }

  const mensagensGroq = [
    { role: 'system', content: systemPrompt },
    ...sessao.historico,
  ];

  const resposta = await chamarGroq(mensagensGroq);
  sessao.historico.push({ role: 'assistant', content: resposta });
  sessao.fase = 'coletando';

  const jsonMatch = resposta.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const dados = JSON.parse(jsonMatch[1]);
      if (dados.status === 'completo') {
        sessao.campos = dados.campos;
        sessao.fase = 'completo';
        return {
          tipo: 'confirmacao',
          mensagem: dados.resumo,
          campos: dados.campos,
        };
      }
    } catch (e) {
      // JSON invalido
    }
  }

  return { tipo: 'chat', mensagem: resposta };
}

/**
 * Analisa incidente para bypass
 */
async function analisarIncidente(deviceInfo, reason) {
  const prompt = `Analise o incidente e retorne um JSON:

Computador: ${deviceInfo.pcName} (IP: ${deviceInfo.ip})
Canal: ${deviceInfo.canal}
Tempo Inativo: ${deviceInfo.durationMinutes} minutos.
Motivo: "${reason}"

Retorne APENAS este JSON (sem markdown):
{
  "isBypass": boolean,
  "bypassReason": "string",
  "comentario": "string",
  "falhaSugerida": "string",
  "subcategoriaSugerida": "string",
  "horasParadas": number,
  "confianca": "alta|media|baixa"
}

BYPASS = Wi-Fi, conectividade temporaria, manutencao programada
NAO BYPASS = hardware defeituoso, software com erro, falha de config`

  const content = await chamarGroq(
    [
      { role: 'system', content: 'Retorne apenas JSON valido.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, maxTokens: 512 }
  );

  const cleanJSON = content.trim()
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/^[\s\S]*?(\{)/, '$1')
    .replace(/(\})[\s\S]*$/, '$1');

  try {
    return JSON.parse(cleanJSON);
  } catch (e) {
    return {
      isBypass: false,
      bypassReason: null,
      comentario: reason || 'Incidente registrado',
      falhaSugerida: 'Mal funcionamento',
      subcategoriaSugerida: 'Mini PC',
      horasParadas: Math.max(0.1, (deviceInfo.durationMinutes / 60).toFixed(2)),
      confianca: 'baixa',
    };
  }
}

/**
 * Analisa texto livre para bypass
 */
async function analisarTexto(texto) {
  const prompt = `Analise o texto e retorne APENAS JSON indicando se e bypass (problema de Wi-Fi/conectividade):

Texto: "${texto}"

Retorne APENAS:
{
  "isBypass": true/false,
  "motivo": "breve explicacao"
}`;

  const content = await chamarGroq(
    [
      { role: 'system', content: 'Retorne apenas JSON valido.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, maxTokens: 256 }
  );

  const cleanJSON = content.trim()
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/^[\s\S]*?(\{)/, '$1')
    .replace(/(\})[\s\S]*$/, '$1');

  try {
    return JSON.parse(cleanJSON);
  } catch (e) {
    return { isBypass: false, motivo: 'Nao foi possivel analisar' };
  }
}

/**
 * Melhora texto para registro no Notion
 */
async function melhorarTextoNotion(campos) {
  const prompt = `Voce e um assistente que transforma dados de apontamento de desvio em textos profissionais para registro no Notion.

Dados do apontamento:
- Local: ${campos.local_nome || 'N/A'}
- Equipamento: ${campos.equipamento_nome || 'N/A'}
- Canal: ${campos.canal || 'N/A'}
- IP: ${campos.ip || 'N/A'}
- Falha: ${campos.falha_nome || 'N/A'}
- Subcategoria: ${campos.subcategoria_nome || 'N/A'}
- Horas paradas: ${campos.horas_paradas || 'N/A'}h
- Recursos parados: ${campos.recursos_parados || 1}
- Comentario original: ${campos.comentario || 'N/A'}

Gere:
1. Um titulo curto e descritivo (max 50 chars) para a pagina Notion
2. Um corpo detalhado em formato profissional (3-5 linhas) incluindo:
   - Data e horario
   - Dispositivo afetado
   - Problema identificado
   - Acao tomada (baseada no comentario)
   - Impacto (horas e recursos)

Retorne JSON:
{
  "titulo": "...",
  "detalhes": "..."
}`;

  const content = await chamarGroq(
    [
      { role: 'system', content: 'Retorne apenas JSON valido com titulo e detalhes.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3, maxTokens: 512 }
  );

  const cleanJSON = content.trim()
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/^[\s\S]*?(\{)/, '$1')
    .replace(/(\})[\s\S]*$/, '$1');

  try {
    return JSON.parse(cleanJSON);
  } catch (e) {
    // Fallback: retorna titulo e detalhes basicos
    return {
      titulo: `Desvio: ${campos.equipamento_nome || 'N/A'} - ${campos.local_nome || 'N/A'}`,
      detalhes: [
        `Canal: ${campos.canal || 'N/A'}`,
        `Equipamento: ${campos.equipamento_nome || 'N/A'}`,
        `IP: ${campos.ip || 'N/A'}`,
        `Falha: ${campos.falha_nome || 'N/A'}`,
        `Horas Paradas: ${campos.horas_paradas || 'N/A'}h`,
        `Acao: ${campos.comentario || 'N/A'}`,
      ].join('\n'),
    };
  }
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, sessaoId, mensagem, deviceInfo, reason, texto } = body;

    if (action === 'chat') {
      if (!sessaoId || !mensagem) {
        return NextResponse.json(
          { error: 'sessaoId e mensagem sao obrigatorios' },
          { status: 400 }
        );
      }
      const result = await chatApontamento(sessaoId, mensagem);
      return NextResponse.json(result);
    }

    if (action === 'analisar-incidente') {
      if (!deviceInfo || !reason) {
        return NextResponse.json(
          { error: 'deviceInfo e reason sao obrigatorios' },
          { status: 400 }
        );
      }
      const analysis = await analisarIncidente(deviceInfo, reason);
      return NextResponse.json({ analysis });
    }

    if (action === 'analisar-texto') {
      if (!texto) {
        return NextResponse.json(
          { error: 'texto e obrigatorio' },
          { status: 400 }
        );
      }
      const analysis = await analisarTexto(texto);
      return NextResponse.json({ analysis });
    }

    if (action === 'reset') {
      if (sessaoId && sessoes[sessaoId]) {
        delete sessoes[sessaoId];
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'melhorar-texto-notion') {
      const { campos } = body;
      if (!campos) {
        return NextResponse.json(
          { error: 'campos sao obrigatorios' },
          { status: 400 }
        );
      }
      const result = await melhorarTextoNotion(campos);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Acao invalida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Groq API] Erro:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
