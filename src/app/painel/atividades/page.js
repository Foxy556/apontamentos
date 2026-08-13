'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRIORITIES = [
  { value: 'baixa', label: 'Baixa', color: '#94A3B8' },
  { value: 'media', label: 'Média', color: '#F59E0B' },
  { value: 'alta', label: 'Alta', color: '#EF4444' },
];

const STATUS_MAP = {
  pendente: { label: 'Pendente', bg: 'bg-gray-100 text-gray-700' },
  em_andamento: { label: 'Em Andamento', bg: 'bg-blue-50 text-blue-700' },
  concluido: { label: 'Concluído', bg: 'bg-green-50 text-green-700' },
};

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  // End on Friday (not Sunday)
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { start: monday, end: friday };
}

function getWeekDays(start) {
  const days = [];
  for (let i = 0; i < 5; i++) { // Only Mon-Fri
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export default function PainelAtividades() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: formatDateISO(new Date()),
    prioridade: 'media',
  });

  // Verify auth
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/painel');
        if (!res.ok) {
          router.replace('/painel/login');
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch {
        router.replace('/painel/login');
        return;
      }
      setChecking(false);
    }
    verifyAuth();
  }, [router]);

  // Load activities from API
  const loadActivities = async () => {
    setLoading(true);
    try {
      const { start, end } = getWeekRange(currentDate);
      const res = await fetch(`/api/activities?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await res.json();
      if (!data.error) {
        setAtividades(data.activities || []);
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking) {
      loadActivities();
    }
  }, [checking, currentDate]);

  const { start, end } = getWeekRange(currentDate);
  const weekDays = getWeekDays(start);

  const byDay = weekDays.map(day => ({
    day,
    atividades: atividades.filter(a => isSameDay(new Date(a.data), day)),
  }));

  const total = atividades.length;
  const concluidas = atividades.filter(a => a.status === 'concluido').length;
  const emAndamento = atividades.filter(a => a.status === 'em_andamento').length;
  const pendentes = atividades.filter(a => a.status === 'pendente').length;

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const canEdit = user?.role === 'admin' || user?.role === 'tecnico';

  // Handle create activity
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Atividade criada!' });
        setFormData({
          titulo: '',
          descricao: '',
          data: formatDateISO(new Date()),
          prioridade: 'media',
        });
        setShowForm(false);
        loadActivities();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao criar: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch('/api/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      loadActivities();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Excluir esta atividade?')) return;

    try {
      await fetch(`/api/activities?id=${id}`, { method: 'DELETE' });
      loadActivities();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/painel" className="text-sm text-gray-500 hover:text-gray-700">
                ← Voltar
              </Link>
              <span className="text-xl font-bold text-gray-800">Atividades Semanais</span>
              {user && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {user.username} ({user.role})
                </span>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                {showForm ? 'Cancelar' : '+ Nova Atividade'}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Message */}
          {message && (
            <div className={`mb-4 px-4 py-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
              <button onClick={() => setMessage(null)} className="ml-2 font-bold">×</button>
            </div>
          )}

          {/* New Activity Form */}
          {showForm && canEdit && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Nova Atividade</h3>
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Título *</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Atualizar firmware dos Mini PCs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Detalhes da atividade..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Prioridade</label>
                    <select
                      value={formData.prioridade}
                      onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !formData.titulo.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Salvando...' : 'Criar Atividade'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Total</div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Pendentes</div>
              <div className="text-2xl font-bold text-gray-500">{pendentes}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Em Andamento</div>
              <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Concluídas</div>
              <div className="text-2xl font-bold text-green-600">{concluidas}</div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateWeek(-1)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                ← Anterior
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {formatDate(start)} — {formatDate(end)}
                </span>
                <button
                  onClick={goToToday}
                  className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  Hoje
                </button>
              </div>
              <button
                onClick={() => navigateWeek(1)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Próxima →
              </button>
            </div>
          </div>

          {/* Week View (Mon-Fri only) */}
          {loading ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : (
            <div className="space-y-4">
              {byDay.map(({ day, atividades: dayAtividades }) => (
                <div key={day.toISOString()} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                      </span>
                      {isSameDay(day, new Date()) && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          Hoje
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {dayAtividades.length} atividade(s)
                    </span>
                  </div>

                  {dayAtividades.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                      Nenhuma atividade para este dia
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Atividade
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                            Prioridade
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                            Criado por
                          </th>
                          {canEdit && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dayAtividades.map(atividade => {
                          const priority = PRIORITIES.find(p => p.value === atividade.prioridade);
                          const status = STATUS_MAP[atividade.status] || STATUS_MAP.pendente;
                          const canEditItem = user?.role === 'admin' || atividade.criadaPor === user?.username;

                          return (
                            <tr key={atividade.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div
                                  className="w-1 h-8 rounded-full"
                                  style={{ background: priority?.color || '#94A3B8' }}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{atividade.titulo}</div>
                                {atividade.descricao && (
                                  <div className="text-xs text-gray-500 mt-0.5">{atividade.descricao}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium" style={{ color: priority?.color }}>
                                  {priority?.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {canEditItem ? (
                                  <select
                                    value={atividade.status}
                                    onChange={(e) => handleStatusChange(atividade.id, e.target.value)}
                                    className="px-2 py-1 border border-gray-200 rounded text-xs bg-white cursor-pointer"
                                  >
                                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                                      <option key={key} value={key}>{val.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg}`}>
                                    {status.label}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">
                                {atividade.criadaPor || '—'}
                              </td>
                              {canEdit && (
                                <td className="px-4 py-3">
                                  {canEditItem && (
                                    <button
                                      onClick={() => handleDelete(atividade.id)}
                                      className="text-red-400 hover:text-red-600 text-xs"
                                    >
                                      Excluir
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
