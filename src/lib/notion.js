import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Função para criar um novo apontamento no Notion
 * Ajustaremos as propriedades (properties) conforme a estrutura final da sua tabela.
 */
export async function createNotionEntry(data) {
  // Ignorando aviso de certificado na rede para requisições HTTPS do Node nativo
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        "Registro": {
          title: [
            { text: { content: data.title || 'Novo Apontamento (via App)' } }
          ]
        },
        "Detalhes": {
          rich_text: [
            { text: { content: data.details || 'Sem detalhes fornecidos.' } }
          ]
        },
        "Status": {
          select: {
            name: data.status || "Pendente" // "Pendente" ou "Concluído"
          }
        },
        // O campo "Tipo" e "Atividade" poderão ser adicionados aqui
      },
    });
    return response;
  } catch (error) {
    console.error('Erro ao salvar no Notion:', error);
    throw error;
  }
}
