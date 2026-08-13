'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '@/components/ui';

// Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// Helpers
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatFullDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getWeekDays(start) {
  const days = [];
  for (let i = 0; i < 7; i++) {
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

const STORAGE_KEY = 'apontamentos-atividades';

const PRIORITIES = [
  { value: 'baixa', label: 'Baixa', color: 'var(--n-400)' },
  { value: 'media', label: 'Média', color: 'var(--warning)' },
  { value: 'alta', label: 'Alta', color: 'var(--error)' },
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente', variant: 'neutral' },
  { value: 'em_andamento', label: 'Em Andamento', variant: 'info' },
  { value: 'concluido', label: 'Concluído', variant: 'success' },
];

export default function AtividadesSemanais() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [atividades, setAtividades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAtividade, setNewAtividade] = useState({
    titulo: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    prioridade: 'media',
    status: 'pendente',
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAtividades(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar atividades:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atividades));
  }, [atividades]);

  const { start, end } = getWeekRange(currentDate);
  const weekDays = getWeekDays(start);

  // Filter activities for current week
  const weekAtividades = atividades.filter(a => {
    const aDate = new Date(a.data);
    return aDate >= start && aDate <= end;
  });

  // Group by day
  const byDay = weekDays.map(day => ({
    day,
    atividades: weekAtividades.filter(a => isSameDay(new Date(a.data), day)),
  }));

  // Stats
  const total = weekAtividades.length;
  const concluidas = weekAtividades.filter(a => a.status === 'concluido').length;
  const emAndamento = weekAtividades.filter(a => a.status === 'em_andamento').length;
  const pendentes = weekAtividades.filter(a => a.status === 'pendente').length;

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddAtividade = () => {
    if (!newAtividade.titulo.trim()) return;

    const atividade = {
      id: Date.now().toString(),
      ...newAtividade,
      criadaEm: new Date().toISOString(),
    };

    setAtividades(prev => [...prev, atividade]);
    setNewAtividade({
      titulo: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      prioridade: 'media',
      status: 'pendente',
    });
    setShowForm(false);
  };

  const handleDeleteAtividade = (id) => {
    setAtividades(prev => prev.filter(a => a.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    setAtividades(prev => prev.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
  };

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge variant={opt?.variant || 'neutral'}>{opt?.label || status}</Badge>;
  };

  const getPrioridadeColor = (prioridade) => {
    const p = PRIORITIES.find(pr => pr.value === prioridade);
    return p?.color || 'var(--n-400)';
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Atividades Semanais</h1>
            <p className="page-subtitle">Gerencie suas atividades da semana</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              <PlusIcon />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-label">Total</div>
            <div className="stat-card-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pendentes</div>
            <div className="stat-card-value" style={{ color: 'var(--n-500)' }}>{pendentes}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Em Andamento</div>
            <div className="stat-card-value" style={{ color: '#0891B2' }}>{emAndamento}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Concluídas</div>
            <div className="stat-card-value" style={{ color: '#16A34A' }}>{concluidas}</div>
          </div>
        </div>

        {/* Week Navigation */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => navigateWeek(-1)}>
              <ChevronLeftIcon />
              Anterior
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CalendarIcon />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--n-800)' }}>
                {formatDate(start)} — {formatDate(end)}
              </span>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </div>

            <Button variant="ghost" onClick={() => navigateWeek(1)}>
              Próxima
              <ChevronRightIcon />
            </Button>
          </div>
        </Card>

        {/* New Activity Form */}
        {showForm && (
          <Card style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Nova Atividade</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newAtividade.titulo}
                    onChange={(e) => setNewAtividade(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Atualizar firmware dos Mini PCs"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Descrição
                  </label>
                  <textarea
                    value={newAtividade.descricao}
                    onChange={(e) => setNewAtividade(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Detalhes da atividade..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Data
                  </label>
                  <input
                    type="date"
                    value={newAtividade.data}
                    onChange={(e) => setNewAtividade(prev => ({ ...prev, data: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Prioridade
                  </label>
                  <select
                    value={newAtividade.prioridade}
                    onChange={(e) => setNewAtividade(prev => ({ ...prev, prioridade: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleAddAtividade} disabled={!newAtividade.titulo.trim()}>
                    <PlusIcon />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Week View */}
        {total === 0 ? (
          <Card>
            <EmptyState
              icon={<CalendarIcon />}
              title="Nenhuma atividade esta semana"
              text="Adicione uma nova atividade para começar"
              action={
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <PlusIcon />
                  Nova Atividade
                </Button>
              }
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byDay.map(({ day, atividades: dayAtividades }) => (
              <Card key={day.toISOString()}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="card-title">
                      {day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                    </h3>
                    {isSameDay(day, new Date()) && (
                      <Badge variant="info">Hoje</Badge>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--n-400)' }}>
                    {dayAtividades.length} atividade(s)
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {dayAtividades.length === 0 ? (
                    <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--n-400)', textAlign: 'center' }}>
                      Nenhuma atividade para este dia
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>Atividade</th>
                          <th style={{ width: 100 }}>Prioridade</th>
                          <th style={{ width: 120 }}>Status</th>
                          <th style={{ width: 80 }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayAtividades.map(atividade => (
                          <tr key={atividade.id}>
                            <td>
                              <div style={{
                                width: 4,
                                height: 32,
                                borderRadius: 2,
                                background: getPrioridadeColor(atividade.prioridade),
                              }} />
                            </td>
                            <td>
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--n-800)' }}>{atividade.titulo}</div>
                                {atividade.descricao && (
                                  <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 2 }}>
                                    {atividade.descricao}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: getPrioridadeColor(atividade.prioridade),
                              }}>
                                {PRIORITIES.find(p => p.value === atividade.prioridade)?.label}
                              </span>
                            </td>
                            <td>
                              <select
                                value={atividade.status}
                                onChange={(e) => handleStatusChange(atividade.id, e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  border: '1px solid var(--n-200)',
                                  fontSize: 12,
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                }}
                              >
                                {STATUS_OPTIONS.map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAtividade(atividade.id)}
                                style={{ color: 'var(--error)' }}
                              >
                                <TrashIcon />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
