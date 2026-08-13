import { NextResponse } from 'next/server';
import { httpsAgent } from '@/lib/ssl';

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Notion Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_HISTORICO_PAGE_ID = process.env.NOTION_HISTORICO_PAGE_ID;

// Sessoes em memoria (substituir por Redis/DB em producao)
const sessoes = {};

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

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
 * Lista páginas do Notion para contexto
 */
async function listarPaginasNotion() {
  try {
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
    if (!NOTION_DATABASE_ID) return [];

    const response = await fetch(`${NOTION_API_URL}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 20,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.results.map(page => ({
      id: page.id,
      title: page.properties.Registro?.title?.[0]?.text?.content || 'Sem título',
      status: page.properties.Status?.select?.name || 'Pendente',
      createdTime: page.created_time,
    }));
  } catch (error) {
    console.error('[Notion AI] Erro ao listar páginas:', error.message);
    return [];
  }
}

/**
 * Buscar ID da página de histórico (usa o banco de dados existente)
 */
async function buscarPaginaHistorico() {
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!NOTION_DATABASE_ID) {
    console.error('[Notion AI] NOTION_DATABASE_ID não configurado');
    return null;
  }
  return NOTION_DATABASE_ID;
}

/**
 * Chat com IA para Notion
 */
async function chatNotion(sessaoId, mensagem) {
  if (!sessoes[sessaoId]) {
    sessoes[sessaoId] = {
      historico: [],
      contexto: {},
      fase: 'inicial',
    };
  }

  const sessao = sessoes[sessaoId];
  sessao.historico.push({ role: 'user', content: mensagem });

  const paginas = await listarPaginasNotion();
  const listaPaginas = paginas.map(p => `- ${p.title} (Status: ${p.status}, ID: ${p.id})`).join('\n');

  const systemPrompt = `Você é um assistente inteligente para o Notion. Sua tarefa é ajudar o usuário a gerenciar suas tarefas e apontamentos no Notion.

=== CONTEXTO DO NOTION ===
Páginas existentes no banco de dados:
${listaPaginas || 'Nenhuma página encontrada'}

=== SUAS CAPACIDADES ===
1. Criar novas páginas/apontamentos no banco de dados
2. Listar páginas existentes
3. Atualizar status de páginas
4. Adicionar apontamentos na página de Histórico & Compras
5. Adicionar MÚLTIPLOS apontamentos de uma vez
6. Responder perguntas sobre os dados
7. Ajudar a organizar tarefas diárias

=== TIPOS DE APONTAMENTO NO HISTÓRICO ===
Quando o usuário pedir para registrar algo no histórico:
- **registro**: Texto livre com data e hora automáticos
- **checklist**: Lista de itens para verificar (cria checkboxes)
- **lista**: Lista com marcadores

=== MÚLTIPLOS APONTAMENTOS ===
Quando o usuário pedir para criar VÁRIAS tarefas de uma vez, use esta estrutura JSON:

\`\`\`json
{
  "acao": "multiplos",
  "tarefas": [
    {"titulo": "Tarefa 1", "conteudo": "Descrição", "tipo": "registro"},
    {"titulo": "Tarefa 2", "conteudo": "Item 1\\nItem 2", "tipo": "checklist"}
  ]
}
\`\`\`

Para UMA ÚNICA tarefa, use:
\`\`\`json
{
  "acao": "criar",
  "tarefa": {
    "titulo": "Título da tarefa",
    "descricao": "Descrição detalhada",
    "status": "Pendente"
  }
}
\`\`\`

Exemplos de quando usar múltiplos:
- "Registrar: comprei material A, material B e material C"
- "Criar 3 tarefas: verificar estoque, limpar área, organizar caixas"
- "Checklist: verificar item1, item2, item3 e item4"

IMPORTANTE: SEMPRE retorne o JSON quando o usuário pedir para criar ou registrar algo!

=== COMO RESPONDER ===
- Seja direto e profissional
- Use linguagem clara e objetiva
- Quando o usuário pedir para criar algo, confirme os dados antes
- Quando listing, formate de forma clara
- Seja proativo em sugerir melhorias
- Quando detectar múltiplas tarefas, retorne o JSON com ação "multiplos"

=== AÇÕES DISPONÍVEIS ===
O usuário pode pedir para:
- "Criar tarefa [descrição]" → Coleta dados e cria no banco de dados
- "Listar tarefas" → Lista páginas existentes
- "Status da tarefa [nome]" → Informa o status
- "Atualizar status [nome] para [status]" → Atualiza
- "Registrar no histórico: [conteúdo]" → Adiciona na página de Histórico
- "Criar checklist no histórico: [itens]" → Adiciona checkboxes no histórico
- "Criar lista no histórico: [itens]" → Adiciona lista com marcadores
- "Criar várias tarefas: [lista]" → Cria múltiplas tarefas de uma vez
- Qualquer outra pergunta sobre Notion/tarefas

=== RETORNO ===
Responda de forma clara e objetiva. Se precisa de mais informações, peça diretamente.
Quando retornar múltiplas tarefas, use o formato JSON especificado acima.`;

  const mensagensGroq = [
    { role: 'system', content: systemPrompt },
    ...sessao.historico,
  ];

  const resposta = await chamarGroq(mensagensGroq);
  sessao.historico.push({ role: 'assistant', content: resposta });
  
  console.log('[Notion AI] Resposta da IA:', resposta.substring(0, 200) + '...');

  // Verificar se há tarefas pendentes para executar (quando usuário confirma)
  console.log('[Notion AI] Tarefas pendentes:', sessao.tarefasPendentes?.length || 0);
  
  if (sessao.tarefasPendentes && sessao.tarefasPendentes.length > 0) {
    // Verificar se o usuário confirmou
    const ultimaMensagem = mensagem.toLowerCase();
    const confirmacoes = ['sim', 'confirmar', 'pode registrar', 'pode criar', 'confirmado', 'ok', 'pode ser', 'pode'];
    const confirmou = confirmacoes.some(c => ultimaMensagem.includes(c));
    console.log('[Notion AI] Mensagem do usuário:', ultimaMensagem, 'Confirmou:', confirmou);

    if (confirmou) {
      // Executar tarefas pendentes
      const historicoPageId = await buscarPaginaHistorico();
      if (historicoPageId) {
        const resultados = [];
        for (const tarefa of sessao.tarefasPendentes) {
          try {
            const result = await adicionarHistorico(
              historicoPageId,
              tarefa.titulo,
              tarefa.conteudo,
              tarefa.tipo || 'registro'
            );
            resultados.push({ sucesso: true, titulo: tarefa.titulo });
          } catch (error) {
            resultados.push({ sucesso: false, titulo: tarefa.titulo, erro: error.message });
          }
        }

        // Limpar tarefas pendentes
        sessao.tarefasPendentes = null;

        const sucessos = resultados.filter(r => r.sucesso).length;
        const falhas = resultados.filter(r => !r.sucesso).length;

        return {
          tipo: 'multiplos',
          mensagem: `✅ ${sucessos} tarefa(s) criada(s) com sucesso!${falhas > 0 ? ` ⚠️ ${falhas} falha(s).` : ''}`,
          resultados,
          paginas: paginas.length,
        };
      }
    }
  }

  // Verificar se a resposta contém tarefas para salvar pendentes
  const jsonMatch = resposta.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const dados = JSON.parse(jsonMatch[1]);
      
      // Converter formato "criar" para "multiplos"
      let tarefas = [];
      if (dados.acao === 'multiplos' && Array.isArray(dados.tarefas)) {
        tarefas = dados.tarefas;
      } else if (dados.acao === 'criar' && dados.tarefa) {
        // Converter única tarefa para array
        tarefas = [{
          titulo: dados.tarefa.titulo,
          conteudo: dados.tarefa.descricao || dados.tarefa.titulo,
          tipo: 'registro'
        }];
      }
      
      if (tarefas.length > 0) {
        // Salvar tarefas pendentes na sessão (não executar ainda)
        sessao.tarefasPendentes = tarefas;

        // Retornar confirmação para o usuário
        const listaTarefas = tarefas.map((t, i) => `${i + 1}. ${t.titulo}`).join('\n');
        return {
          tipo: 'confirmacao',
          mensagem: `Encontrei ${tarefas.length} tarefa(s) para registrar:\n\n${listaTarefas}\n\nDeseja que eu registre essas tarefas no histórico?`,
          tarefas: tarefas,
          paginas: paginas.length,
        };
      }
    } catch (e) {
      // JSON inválido, continuar com resposta normal
    }
  }

  return {
    tipo: 'chat',
    mensagem: resposta,
    paginas: paginas.length,
  };
}

/**
 * Criar página no Notion
 */
async function criarPaginaNotion(titulo, detalhes, status = 'Pendente') {
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID não configurado');
  }

  const response = await fetch(`${NOTION_API_URL}/pages`, {
    method: 'POST',
    headers: notionHeaders,
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Registro": {
          title: [{ text: { content: titulo } }]
        },
        "Detalhes": {
          rich_text: [{ text: { content: detalhes } }]
        },
        "Status": {
          select: { name: status }
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar página no Notion');
  }

  return await response.json();
}

/**
 * Adicionar apontamento no banco de dados de histórico do Notion
 */
async function adicionarHistorico(pageId, titulo, conteudo, tipo = 'registro') {
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID não configurado');
  }

  // Data e hora atual
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Criar conteúdo detalhado
  let detalhesFormatados = conteudo;
  if (tipo === 'checklist') {
    const itens = conteudo.split('\n').filter(item => item.trim());
    detalhesFormatados = itens.map(item => `☐ ${item.trim()}`).join('\n');
  } else if (tipo === 'lista') {
    const itens = conteudo.split('\n').filter(item => item.trim());
    detalhesFormatados = itens.map(item => `• ${item.trim()}`).join('\n');
  }

  // Criar página no banco de dados existente
  const response = await fetch(`${NOTION_API_URL}/pages`, {
    method: 'POST',
    headers: notionHeaders,
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Registro": {
          title: [{ text: { content: `📅 ${dataFormatada} ${horaFormatada} - ${titulo}` } }]
        },
        "Detalhes": {
          rich_text: [{ text: { content: detalhesFormatados } }]
        },
        "Status": {
          select: { name: 'Concluído' }
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar apontamento no histórico');
  }

  return await response.json();
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, sessaoId, mensagem, titulo, detalhes, status, pageId, conteudo, tipo, tarefas } = body;

    if (action === 'chat') {
      if (!sessaoId || !mensagem) {
        return NextResponse.json(
          { error: 'sessaoId e mensagem são obrigatórios' },
          { status: 400 }
        );
      }
      const result = await chatNotion(sessaoId, mensagem);
      return NextResponse.json(result);
    }

    if (action === 'criar-pagina') {
      if (!titulo) {
        return NextResponse.json(
          { error: 'Título é obrigatório' },
          { status: 400 }
        );
      }
      const result = await criarPaginaNotion(titulo, detalhes, status);
      return NextResponse.json({ page: result });
    }

    if (action === 'adicionar-historico') {
      if (!titulo || !conteudo) {
        return NextResponse.json(
          { error: 'Título e conteúdo são obrigatórios' },
          { status: 400 }
        );
      }
      const result = await adicionarHistorico(pageId, titulo, conteudo, tipo);
      return NextResponse.json({ result });
    }

    // Nova ação para múltiplas tarefas
    if (action === 'adicionar-historico-multiplos') {
      if (!tarefas || !Array.isArray(tarefas) || tarefas.length === 0) {
        return NextResponse.json(
          { error: 'Array de tarefas é obrigatório' },
          { status: 400 }
        );
      }

      const historicoPageId = pageId || await buscarPaginaHistorico();
      if (!historicoPageId) {
        return NextResponse.json(
          { error: 'Página de histórico não encontrada' },
          { status: 404 }
        );
      }

      const resultados = [];
      for (const tarefa of tarefas) {
        try {
          const result = await adicionarHistorico(
            historicoPageId,
            tarefa.titulo,
            tarefa.conteudo,
            tarefa.tipo || 'registro'
          );
          resultados.push({ sucesso: true, titulo: tarefa.titulo, result });
        } catch (error) {
          resultados.push({ sucesso: false, titulo: tarefa.titulo, erro: error.message });
        }
      }

      return NextResponse.json({ resultados, total: tarefas.length });
    }

    if (action === 'reset') {
      if (sessaoId && sessoes[sessaoId]) {
        delete sessoes[sessaoId];
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Notion AI API] Erro:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
