import { NextResponse } from 'next/server';

const SITE_URL = process.env.API_URL || 'http://brbrj2402krz:8080';

// Mapa de sinônimos para equipamentos
const ALIAS_MAP = {
  tv: 'TV',
  televisao: 'TV',
  televisão: 'TV',
  'mini pc': 'Minipc',
  minipc: 'Minipc',
  monitor: 'Monitor comum',
  'monitor touch': 'Monitor touch',
  artemis: 'Artemis',
  'artemis light': 'Artemis Light',
  qstop: 'Q-Stop Web',
  qmos: 'QMoS',
  tablet: 'Tablet',
  raspberry: 'Raspberry',
  cms: 'CMS',
  'reuniao digital': 'Reunião Digital',
  'impressora termica': 'Impressora térmica',
  scanners: 'Scanners',
};

/**
 * Normaliza string para busca
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/s$/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca locais disponíveis
 */
async function getLocais() {
  const res = await fetch(`${SITE_URL}/api/locais`, {
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

/**
 * Busca equipamentos de um local
 */
async function getEquipamentos(localId) {
  const res = await fetch(`${SITE_URL}/api/equipamentos/${localId}`, {
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

/**
 * Busca falhas disponíveis
 */
async function getFalhas() {
  const res = await fetch(`${SITE_URL}/api/falhas`, {
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

/**
 * Busca subcategorias de uma falha
 */
async function getSubcategorias(falhaId) {
  const res = await fetch(`${SITE_URL}/api/subcategorias/${falhaId}`, {
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

/**
 * Busca datas disponíveis para um local
 */
async function getDatasDisponiveis(localId) {
  const res = await fetch(`${SITE_URL}/api/datas_disponiveis/${localId}`, {
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

/**
 * Busca ID do equipamento pelo nome (com suporte a sinônimos)
 */
async function resolverEquipamentoId(localId, nomeEquipamento) {
  const equipamentos = await getEquipamentos(localId);

  const keywords = nomeEquipamento
    .split(/\s+/)
    .map(k => normalize(k))
    .filter(k => k.length > 0);

  const isMatch = (equipName) => {
    const equipNorm = normalize(equipName);
    return keywords.some(kw => equipNorm.includes(kw));
  };

  let match = equipamentos.find(e => isMatch(e.nome));

  // Tenta mapa de sinônimos
  if (!match) {
    const inputNorm = normalize(nomeEquipamento);
    const aliasKey = Object.keys(ALIAS_MAP).find(k => inputNorm.includes(k));
    if (aliasKey) {
      const aliasName = ALIAS_MAP[aliasKey];
      match = equipamentos.find(e => normalize(e.nome) === normalize(aliasName));
    }
  }

  if (!match) {
    const lista = equipamentos.map(e => e.nome).join(', ');
    throw new Error(
      `Equipamento "${nomeEquipamento}" não encontrado no Local ID ${localId}.\nDisponíveis: ${lista}`
    );
  }

  return { id: match.id, nome: match.nome, quantidade: match.quantidade };
}

/**
 * Busca dados completos do site (locais, falhas, subcategorias)
 */
async function getDadosCompletos() {
  const [locais, falhas] = await Promise.all([getLocais(), getFalhas()]);

  // Busca subcategorias para cada falha
  const subcategoriasMap = {};
  await Promise.all(
    falhas.map(async (f) => {
      try {
        subcategoriasMap[f.id] = await getSubcategorias(f.id);
      } catch (e) {
        subcategoriasMap[f.id] = [];
      }
    })
  );

  return { locais, falhas, subcategoriasMap };
}

/**
 * Registra um apontamento
 */
async function registrarApontamento(payload) {
  const res = await fetch(`${SITE_URL}/atualizar_apontamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  return res.json();
}

// GET handler - Fetch data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'locais': {
        const locais = await getLocais();
        return NextResponse.json(locais);
      }
      case 'equipamentos': {
        const localId = searchParams.get('localId');
        if (!localId) {
          return NextResponse.json({ error: 'localId é obrigatório' }, { status: 400 });
        }
        const equipamentos = await getEquipamentos(localId);
        return NextResponse.json(equipamentos);
      }
      case 'falhas': {
        const falhas = await getFalhas();
        return NextResponse.json(falhas);
      }
      case 'subcategorias': {
        const falhaId = searchParams.get('falhaId');
        if (!falhaId) {
          return NextResponse.json({ error: 'falhaId é obrigatório' }, { status: 400 });
        }
        const subcategorias = await getSubcategorias(falhaId);
        return NextResponse.json(subcategorias);
      }
      case 'datas': {
        const localId = searchParams.get('localId');
        if (!localId) {
          return NextResponse.json({ error: 'localId é obrigatório' }, { status: 400 });
        }
        const datas = await getDatasDisponiveis(localId);
        return NextResponse.json(datas);
      }
      case 'completo': {
        // Busca todos os dados de uma vez
        const dados = await getDadosCompletos();
        return NextResponse.json(dados);
      }
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST handler - Register apontamento
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      local_id,
      equipamento_nome,
      falha_id,
      subcategoria_id,
      horas_paradas,
      recursos_parados,
      comentario,
      data_ronda,
    } = body;

    // Validate required fields
    if (!local_id || !equipamento_nome || !falha_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Resolve equipment ID
    const equip = await resolverEquipamentoId(local_id, equipamento_nome);

    const payload = {
      id_equipamento: equip.id,
      data_ronda: data_ronda || new Date().toISOString().split('T')[0],
      recursos_parados: Number(recursos_parados) || 1,
      horas_paradas: Number(horas_paradas) || 0.1,
      id_falha: Number(falha_id),
      id_subcategoria: subcategoria_id ? Number(subcategoria_id) : null,
      comentarios: comentario || '',
    };

    const result = await registrarApontamento(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Apontamentos POST] Erro:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
