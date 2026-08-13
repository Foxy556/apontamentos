import { NextResponse } from 'next/server';
import '@/lib/ssl';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_URL = 'https://api.notion.com/v1';

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

/**
 * List pages from Notion database
 */
async function listPages() {
  if (!NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID não está configurado. Verifique o arquivo .env.local');
  }
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY não está configurado. Verifique o arquivo .env.local');
  }

  const response = await fetch(`${NOTION_API_URL}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
      page_size: 50,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao consultar Notion');
  }

  const data = await response.json();

  return data.results.map(page => ({
    id: page.id,
    title: page.properties.Registro?.title?.[0]?.text?.content || 'Sem título',
    details: page.properties.Detalhes?.rich_text?.[0]?.text?.content || '',
    status: page.properties.Status?.select?.name || 'Pendente',
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  }));
}

/**
 * Create a new page in Notion
 */
async function createPage({ title, details, status = 'Pendente' }) {
  const response = await fetch(`${NOTION_API_URL}/pages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Registro": {
          title: [{ text: { content: title } }]
        },
        "Detalhes": {
          rich_text: [{ text: { content: details } }]
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

  const data = await response.json();

  return {
    id: data.id,
    title,
    details,
    status,
    createdTime: data.created_time,
  };
}

/**
 * Update a page status
 */
async function updatePageStatus(pageId, status) {
  const response = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      properties: {
        "Status": {
          select: { name: status }
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao atualizar página no Notion');
  }

  const data = await response.json();

  return {
    id: data.id,
    status,
  };
}

// GET handler - List pages
export async function GET() {
  try {
    const pages = await listPages();
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('[Notion API] Erro ao listar páginas:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST handler - Create page
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, details, status } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    const page = await createPage({ title, details, status });
    return NextResponse.json({ page });
  } catch (error) {
    console.error('[Notion API] Erro ao criar página:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH handler - Update page status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { pageId, status } = body;

    if (!pageId || !status) {
      return NextResponse.json(
        { error: 'pageId e status são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await updatePageStatus(pageId, status);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Notion API] Erro ao atualizar página:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
