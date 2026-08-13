import { NextResponse } from 'next/server';
import '@/lib/ssl';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_API_URL = 'https://api.notion.com/v1';

// Database ID for Rotinas Semanais (SPS)
const DAILY_TASKS_DATABASE_ID = '9c58157778f74750a8abb26ebc6d432c';

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

/**
 * Buscar tarefas do banco de dados Notion
 */
async function buscarTarefas() {
  try {
    const response = await fetch(`${NOTION_API_URL}/databases/${DAILY_TASKS_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar tarefas do Notion');
    }

    const data = await response.json();
    
    // Extrair tarefas das páginas do banco de dados
    const tarefas = data.results.map(page => {
      const properties = page.properties;
      
      // Pegar o título (pode ser "Name", "Title", "Nome" ou a primeira propriedade title)
      let titulo = '';
      for (const key of Object.keys(properties)) {
        if (properties[key].type === 'title') {
          titulo = properties[key].title?.[0]?.text?.content || '';
          break;
        }
      }
      
      // Pegar status do checkbox "Ativo"
      let ativo = false;
      for (const key of Object.keys(properties)) {
        if (properties[key].type === 'checkbox' && key.toLowerCase().includes('ativo')) {
          ativo = properties[key].checked || false;
          break;
        }
      }
      
      // Se não encontrou checkbox "Ativo", pegar qualquer checkbox
      if (!ativo) {
        for (const key of Object.keys(properties)) {
          if (properties[key].type === 'checkbox') {
            ativo = properties[key].checked || false;
            break;
          }
        }
      }
      
      // Pegar categoria (select)
      let categoria = '';
      for (const key of Object.keys(properties)) {
        if (properties[key].type === 'select') {
          categoria = properties[key].select?.name || '';
          if (categoria) break;
        }
      }
      
      // Pegar frequência
      let frequencia = '';
      for (const key of Object.keys(properties)) {
        if (properties[key].type === 'select' && key.toLowerCase().includes('frequ')) {
          frequencia = properties[key].select?.name || '';
          break;
        }
      }

      // Pegar status (select "Status")
      let status = '';
      for (const key of Object.keys(properties)) {
        if (properties[key].type === 'select' && key.toLowerCase().includes('status')) {
          status = properties[key].select?.name || '';
          break;
        }
      }
      
      return {
        id: page.id,
        titulo,
        ativo,
        categoria,
        frequencia,
        status,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      };
    });
    
    return tarefas;
  } catch (error) {
    console.error('[Daily Tasks] Erro ao buscar tarefas:', error.message);
    throw error;
  }
}

/**
 * Criar nova tarefa no banco de dados Notion
 */
async function criarTarefa(titulo, opcoes = {}) {
  try {
    // Primeiro, buscar as propriedades do database para saber os nomes corretos
    const dbResponse = await fetch(`${NOTION_API_URL}/databases/${DAILY_TASKS_DATABASE_ID}`, {
      method: 'GET',
      headers,
    });

    if (!dbResponse.ok) {
      const errorData = await dbResponse.json();
      throw new Error(`Erro ao buscar estrutura do banco de dados: ${errorData.message}`);
    }

    const dbData = await dbResponse.json();
    const properties = dbData.properties;

    console.log('[Daily Tasks] Propriedades do banco:', Object.keys(properties).join(', '));
    
    // Construir propriedades dinamicamente baseado na estrutura do database
    const pageProperties = {};

    for (const [key, prop] of Object.entries(properties)) {
      console.log(`[Daily Tasks] Propriedade: ${key}, Tipo: ${prop.type}`);

      if (prop.type === 'title') {
        pageProperties[key] = {
          title: [{ text: { content: titulo } }],
        };
      } else if (prop.type === 'select' && key.toLowerCase().includes('status')) {
        pageProperties[key] = {
          select: { name: opcoes.status || 'A definir' },
        };
      } else if (prop.type === 'checkbox' && key.toLowerCase().includes('ativo')) {
        pageProperties[key] = {
          checked: opcoes.ativo !== undefined ? opcoes.ativo : true,
        };
      } else if (prop.type === 'select' && key.toLowerCase().includes('frequ')) {
        if (opcoes.frequencia) {
          pageProperties[key] = {
            select: { name: opcoes.frequencia },
          };
        }
      } else if (prop.type === 'select' && !key.toLowerCase().includes('status') && !key.toLowerCase().includes('frequ')) {
        // Outro select (categoria)
        if (opcoes.categoria) {
          pageProperties[key] = {
            select: { name: opcoes.categoria },
          };
        }
      }
    }

    console.log('[Daily Tasks] Propriedades a enviar:', JSON.stringify(pageProperties, null, 2));
    
    const requestBody = {
      parent: { database_id: DAILY_TASKS_DATABASE_ID },
      properties: pageProperties,
    };

    console.log('[Daily Tasks] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Daily Tasks] Erro do Notion:', JSON.stringify(errorData, null, 2));
      throw new Error(errorData.message || 'Erro ao criar tarefa no Notion');
    }

    const data = await response.json();
    return {
      id: data.id,
      titulo,
      ...opcoes,
      createdTime: data.created_time,
    };
  } catch (error) {
    console.error('[Daily Tasks] Erro ao criar tarefa:', error.message);
    throw error;
  }
}

/**
 * Atualizar tarefa no Notion
 */
async function atualizarTarefa(pageId, updates) {
  try {
    // Primeiro, buscar as propriedades do database
    const dbResponse = await fetch(`${NOTION_API_URL}/databases/${DAILY_TASKS_DATABASE_ID}`, {
      method: 'GET',
      headers,
    });
    
    if (!dbResponse.ok) {
      throw new Error('Erro ao buscar estrutura do banco de dados');
    }
    
    const dbData = await dbResponse.json();
    const properties = dbData.properties;
    
    // Construir propriedades para atualizar
    const pageProperties = {};
    
    for (const [key, prop] of Object.entries(properties)) {
      if (prop.type === 'checkbox' && key.toLowerCase().includes('ativo') && updates.ativo !== undefined) {
        pageProperties[key] = { checked: updates.ativo };
      } else if (prop.type === 'select' && key.toLowerCase().includes('status') && updates.status) {
        pageProperties[key] = { select: { name: updates.status } };
      } else if (prop.type === 'title' && updates.titulo) {
        pageProperties[key] = {
          title: [{ text: { content: updates.titulo } }],
        };
      }
    }
    
    const response = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        properties: pageProperties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar tarefa');
    }

    return await response.json();
  } catch (error) {
    console.error('[Daily Tasks] Erro ao atualizar tarefa:', error.message);
    throw error;
  }
}

/**
 * Deletar (arquivar) tarefa no Notion
 */
async function deletarTarefa(pageId) {
  try {
    const response = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        archived: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao deletar tarefa');
    }

    return { success: true };
  } catch (error) {
    console.error('[Daily Tasks] Erro ao deletar tarefa:', error.message);
    throw error;
  }
}

// GET handler - Listar tarefas
export async function GET() {
  try {
    const tarefas = await buscarTarefas();
    return NextResponse.json({ tarefas });
  } catch (error) {
    console.error('[Daily Tasks API] Erro ao listar tarefas:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST handler - Adicionar tarefa
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[Daily Tasks API] POST body:', JSON.stringify(body, null, 2));

    const { titulo, ativo, categoria, frequencia, status } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: 'Título da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    const tarefa = await criarTarefa(titulo, { ativo, categoria, frequencia, status });
    return NextResponse.json({ tarefa });
  } catch (error) {
    console.error('[Daily Tasks API] Erro ao criar tarefa:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH handler - Atualizar tarefa
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { pageId, ativo, status, titulo } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId é obrigatório' },
        { status: 400 }
      );
    }

    const result = await atualizarTarefa(pageId, { ativo, status, titulo });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Daily Tasks API] Erro ao atualizar tarefa:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler - Deletar tarefa
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId é obrigatório' },
        { status: 400 }
      );
    }

    const result = await deletarTarefa(pageId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Daily Tasks API] Erro ao deletar tarefa:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
