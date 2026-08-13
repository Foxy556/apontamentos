import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'activities.json');

// Read activities from file
function readActivities() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Activities] Erro ao ler atividades:', error.message);
    return [];
  }
}

// Write activities to file
function writeActivities(activities) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Activities] Erro ao salvar atividades:', error.message);
    return false;
  }
}

// Verify JWT and get user info
async function getUser(request) {
  try {
    const cookie = request.cookies.get('public_session');
    if (!cookie?.value) return null;

    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(cookie.value, jwtSecret);
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

// GET - List activities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let activities = readActivities();

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      activities = activities.filter(a => {
        const aDate = new Date(a.data);
        return aDate >= start && aDate <= end;
      });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create activity
export async function POST(request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Only admin and tecnico can create activities
    if (user.role !== 'admin' && user.role !== 'tecnico') {
      return NextResponse.json({ error: 'Sem permissão para criar atividades' }, { status: 403 });
    }

    const body = await request.json();
    const { titulo, descricao, data, prioridade, status } = body;

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 });
    }

    const activities = readActivities();

    const newActivity = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      descricao: descricao?.trim() || '',
      data,
      prioridade: prioridade || 'media',
      status: status || 'pendente',
      criadaEm: new Date().toISOString(),
      criadaPor: user.username,
    };

    activities.push(newActivity);

    if (!writeActivities(activities)) {
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
    }

    return NextResponse.json({ activity: newActivity });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update activity
export async function PUT(request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, titulo, descricao, data, prioridade, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const activities = readActivities();
    const index = activities.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 });
    }

    // Only admin can edit all, tecnico can only edit their own
    if (user.role !== 'admin' && activities[index].criadaPor !== user.username) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    // Update fields
    if (titulo !== undefined) activities[index].titulo = titulo.trim();
    if (descricao !== undefined) activities[index].descricao = descricao.trim();
    if (data !== undefined) activities[index].data = data;
    if (prioridade !== undefined) activities[index].prioridade = prioridade;
    if (status !== undefined) activities[index].status = status;
    activities[index].editadaEm = new Date().toISOString();
    activities[index].editadaPor = user.username;

    if (!writeActivities(activities)) {
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
    }

    return NextResponse.json({ activity: activities[index] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete activity
export async function DELETE(request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const activities = readActivities();
    const index = activities.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 });
    }

    // Only admin can delete all, tecnico can only delete their own
    if (user.role !== 'admin' && activities[index].criadaPor !== user.username) {
      return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 });
    }

    activities.splice(index, 1);

    if (!writeActivities(activities)) {
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
